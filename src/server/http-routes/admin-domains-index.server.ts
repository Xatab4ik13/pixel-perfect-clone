import { requireAdmin, recordAudit, AdminAuthError } from "@/server/admin.server";
import { listDomains, addDomain, DomainError } from "@/server/domains.server";
import { json } from "@/server/http";

function fail(e: unknown): Response {
  if (e instanceof AdminAuthError) return json({ error: e.message }, { status: e.status });
  if (e instanceof DomainError) return json({ error: e.message }, { status: 400 });
  console.error("[admin domains]", e);
  return json({ error: "internal error" }, { status: 500 });
}

export const handlers = {
  GET: async ({ request }: { request: Request }) => {
    try {
      await requireAdmin(request, "viewer");
      return json(await listDomains());
    } catch (e) {
      return fail(e);
    }
  },
  POST: async ({ request }: { request: Request }) => {
    try {
      const session = await requireAdmin(request, "admin");
      const body = (await request.json().catch(() => ({}))) as { domain?: string; reason?: string };
      const reason = (body.reason ?? "").trim();
      if (!reason) return json({ error: "reason required" }, { status: 400 });
      const r = await addDomain(body.domain ?? "");
      await recordAudit(session.sub, "domain.add", null, reason, { domain: r.domain });
      return json({ ok: true, ...r });
    } catch (e) {
      return fail(e);
    }
  },
};
