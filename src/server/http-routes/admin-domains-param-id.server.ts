import { requireAdmin, recordAudit, AdminAuthError } from "@/server/admin.server";
import { makePrimary, checkStoredDomain, DomainError } from "@/server/domains.server";
import { json } from "@/server/http";

export const handlers = {
  POST: async ({ request, params }: { request: Request; params: { id: string } }) => {
    try {
      const body = (await request.json().catch(() => ({}))) as { action?: string; reason?: string };
      if (body.action === "check") {
        await requireAdmin(request, "operator");
        return json({ ok: true, result: await checkStoredDomain(params.id) });
      }
      if (body.action !== "make_primary") return json({ error: "unknown action" }, { status: 400 });
      const session = await requireAdmin(request, "admin");
      const reason = (body.reason ?? "").trim();
      if (!reason) return json({ error: "reason required" }, { status: 400 });
      const r = await makePrimary(params.id);
      await recordAudit(session.sub, "domain.make_primary", null, reason, { domain: r.domain, reissued: r.reissued });
      return json({ ok: true, ...r });
    } catch (e) {
      if (e instanceof AdminAuthError) return json({ error: e.message }, { status: e.status });
      if (e instanceof DomainError) return json({ error: e.message }, { status: 400 });
      console.error("[admin domain action]", e);
      return json({ error: "internal error" }, { status: 500 });
    }
  },
};
