// Client for the telemt control-plane API (server-only).
// Reached over a PRIVATE channel (WireGuard/SSH tunnel) — the API binds to
// loopback on the node and must never be publicly exposed.
//
// Endpoints used (telemt >= 3.3):
//   POST   /v1/users                     create user (returns effective view + secret)
//   GET    /v1/users/{username}          read one
//   PATCH  /v1/users/{username}          partial update (expiration, limits, enabled)
//   POST   /v1/users/{username}/rotate-secret
//   DELETE /v1/users/{username}
//   GET    /v1/stats/users/active-ips    anti-sharing telemetry
import { env } from "./env.server";

export interface TelemtLinks {
  classic?: string[];
  secure?: string[];
  tls?: string[];
}

export interface TelemtUserView {
  username?: string;
  secret?: string; // 32 hex (the 16-byte key) — present on POST/rotate, NOT on GET
  expiration_rfc3339?: string | null;
  max_unique_ips?: number | null;
  data_quota_bytes?: number | null;
  enabled?: boolean;
  links?: TelemtLinks;
  // POST /v1/users nests the effective user under `user` and returns `secret` beside it.
  user?: TelemtUserView;
}

export interface CreateUserInput {
  username: string;
  secret?: string; // optional; telemt generates one if omitted
  expirationRfc3339?: string;
  maxUniqueIps?: number;
  dataQuotaBytes?: number;
  maxTcpConns?: number;
  enabled?: boolean;
}

export interface PatchUserInput {
  expirationRfc3339?: string | null;
  maxUniqueIps?: number | null;
  dataQuotaBytes?: number | null;
  enabled?: boolean;
}

export class TelemtError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = "TelemtError";
  }
}

function toWire(input: CreateUserInput | PatchUserInput): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if ("username" in input && input.username) body["username"] = input.username;
  if ("secret" in input && input.secret) body["secret"] = input.secret;
  if (input.expirationRfc3339 !== undefined) body["expiration_rfc3339"] = input.expirationRfc3339;
  if (input.maxUniqueIps !== undefined) body["max_unique_ips"] = input.maxUniqueIps;
  if (input.dataQuotaBytes !== undefined) body["data_quota_bytes"] = input.dataQuotaBytes;
  if ("maxTcpConns" in input && input.maxTcpConns !== undefined) body["max_tcp_conns"] = input.maxTcpConns;
  if (input.enabled !== undefined) body["enabled"] = input.enabled;
  return body;
}

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const base = env.telemtApiUrl().replace(/\/+$/, "");
  const token = env.telemtApiToken();
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (token) headers["authorization"] = `Bearer ${token}`;

  const init: RequestInit = { method, headers };
  if (body !== undefined) init.body = JSON.stringify(body);
  const res = await fetch(`${base}${path}`, init);

  if (!res.ok) {
    let detail = "";
    try {
      detail = await res.text();
    } catch {
      /* ignore */
    }
    throw new TelemtError(`telemt ${method} ${path} -> ${res.status} ${detail}`.trim(), res.status);
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  const parsed: unknown = text ? JSON.parse(text) : undefined;
  // telemt >= 3.5 wraps responses in { ok, data | error, request_id }.
  if (parsed && typeof parsed === "object" && "ok" in (parsed as Record<string, unknown>)) {
    const envelope = parsed as { ok: boolean; data?: unknown; error?: { code?: string; message?: string } };
    if (envelope.ok === false) {
      const code = envelope.error?.code ?? "error";
      const msg = envelope.error?.message ?? "";
      throw new TelemtError(`telemt ${method} ${path}: ${code} ${msg}`.trim(), res.status);
    }
    return (envelope.data ?? envelope) as T;
  }
  return parsed as T;
}

export const telemt = {
  createUser(input: CreateUserInput): Promise<TelemtUserView> {
    return call<TelemtUserView>("POST", "/v1/users", toWire(input));
  },
  getUser(username: string): Promise<TelemtUserView> {
    return call<TelemtUserView>("GET", `/v1/users/${encodeURIComponent(username)}`);
  },
  patchUser(username: string, input: PatchUserInput): Promise<TelemtUserView> {
    return call<TelemtUserView>("PATCH", `/v1/users/${encodeURIComponent(username)}`, toWire(input));
  },
  rotateSecret(username: string): Promise<TelemtUserView> {
    return call<TelemtUserView>("POST", `/v1/users/${encodeURIComponent(username)}/rotate-secret`, {});
  },
  deleteUser(username: string): Promise<void> {
    return call<void>("DELETE", `/v1/users/${encodeURIComponent(username)}`);
  },
  activeIps(): Promise<unknown> {
    return call<unknown>("GET", "/v1/stats/users/active-ips");
  },
};
