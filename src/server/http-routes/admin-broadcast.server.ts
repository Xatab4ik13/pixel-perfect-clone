import { requireAdmin, recordAudit, AdminAuthError } from "@/server/admin.server";
import { startBroadcast, getLastBroadcast, BroadcastError } from "@/server/broadcast.server";
import { json } from "@/server/http";

export const handlers = {
  GET: async ({ request }: { request: Request }) => {
    try {
      await requireAdmin(request, "viewer");
      return json({ job: getLastBroadcast() });
    } catch (e) {
      if (e instanceof AdminAuthError) return json({ error: e.message }, { status: e.status });
      return json({ error: "internal error" }, { status: 500 });
    }
  },
  POST: async ({ request }: { request: Request }) => {
    try {
      const session = await requireAdmin(request, "admin");
      const form = await request.formData();
      const reason = String(form.get("reason") ?? "").trim();
      if (!reason) return json({ error: "reason required" }, { status: 400 });
      const text = String(form.get("text") ?? "");
      const photos = form.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
      const job = await startBroadcast(text, photos);
      await recordAudit(session.sub, "broadcast.start", null, reason, { jobId: job.id, photos: photos.length, total: job.total });
      return json({ ok: true, job });
    } catch (e) {
      if (e instanceof AdminAuthError) return json({ error: e.message }, { status: e.status });
      if (e instanceof BroadcastError) return json({ error: e.message }, { status: 400 });
      console.error("[admin broadcast]", e);
      return json({ error: "internal error" }, { status: 500 });
    }
  },
};
