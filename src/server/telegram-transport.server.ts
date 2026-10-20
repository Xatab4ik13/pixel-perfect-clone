// Telegram Bot API transport (server-only).
//
// api.telegram.org is unreachable from the RU host, so outbound calls are routed
// through an SSH tunnel to the Amsterdam node:
//   127.0.0.1:<relay> --(ssh -L)--> api.telegram.org:443
// We open a raw TCP socket to the local relay but perform the TLS handshake with
// SNI/cert validation for api.telegram.org (end-to-end TLS through the tunnel).
import https from "node:https";
import tls from "node:tls";
import { env } from "./env.server";

export interface TgResult {
  ok: boolean;
  status: number;
  description?: string;
  result: unknown;
  raw: unknown;
}

let cachedAgent: { relay: string; agent: https.Agent } | null = null;

function relayAgent(relay: string): https.Agent {
  if (cachedAgent && cachedAgent.relay === relay) return cachedAgent.agent;
  const idx = relay.lastIndexOf(":");
  const host = relay.slice(0, idx);
  const port = Number(relay.slice(idx + 1));
  const agent = new https.Agent({ keepAlive: true, maxSockets: 4 });
  // Mirror https.Agent.createConnection but connect TCP to the relay while
  // keeping TLS servername = api.telegram.org.
  (agent as unknown as {
    createConnection: (opts: unknown, cb: (() => void) | undefined) => tls.TLSSocket;
  }).createConnection = (_opts, cb) =>
    tls.connect({ host, port, servername: "api.telegram.org" }, cb as (() => void) | undefined);
  cachedAgent = { relay, agent };
  return agent;
}

export function tgCall(method: string, body: Record<string, unknown>): Promise<TgResult> {
  return tgSend(method, "application/json", Buffer.from(JSON.stringify(body)), 9000);
}

/** Multipart upload (e.g. sendMediaGroup with attached photos). Body comes from a Web FormData. */
export async function tgCallForm(method: string, form: FormData): Promise<TgResult> {
  const r = new Response(form);
  const buf = Buffer.from(await r.arrayBuffer());
  return tgSend(method, r.headers.get("content-type") ?? "multipart/form-data", buf, 60000);
}

function tgSend(method: string, contentType: string, payload: Buffer, timeoutMs: number): Promise<TgResult> {
  if (!env.botEgressEnabled()) {
    return Promise.reject(new Error("telegram egress disabled (BOT_EGRESS=0)"));
  }
  const token = env.telegramBotToken();
  const relay = env.botApiRelay();

  const options: https.RequestOptions = {
    host: "api.telegram.org",
    servername: "api.telegram.org",
    port: 443,
    method: "POST",
    path: `/bot${token}/${method}`,
    headers: {
      "content-type": contentType,
      "content-length": payload.length,
    },
    timeout: timeoutMs,
  };
  if (relay) options.agent = relayAgent(relay);

  return new Promise<TgResult>((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";
      res.setEncoding("utf8");
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        let parsed: { ok?: boolean; description?: string; result?: unknown } = {};
        try {
          parsed = JSON.parse(data) as typeof parsed;
        } catch {
          /* non-JSON error page */
        }
        const out: TgResult = {
          ok: Boolean(parsed.ok),
          status: res.statusCode ?? 0,
          result: parsed.result,
          raw: parsed,
        };
        if (typeof parsed.description === "string") out.description = parsed.description;
        resolve(out);
      });
    });
    req.on("error", reject);
    req.on("timeout", () => req.destroy(new Error("telegram request timeout")));
    req.write(payload);
    req.end();
  });
}
