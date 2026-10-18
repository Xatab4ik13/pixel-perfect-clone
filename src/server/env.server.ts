// Centralised, server-only access to environment configuration.
// Never import this from client/route components — it is .server.ts so it stays
// out of the client bundle. Values are read lazily so that a missing variable
// only fails the specific feature that needs it, not the whole process.

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

function optional(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
}

function isTrue(v: string | undefined): boolean {
  return v === "1" || v === "true" || v === "yes";
}

export const env = {
  /** Postgres connection string for our own database. */
  databaseUrl: () => required("DATABASE_URL"),

  /** Telegram bot token — used to verify Mini App initData HMAC. */
  telegramBotToken: () => required("TELEGRAM_BOT_TOKEN"),

  /** Secret used to sign our own session cookies/JWT. */
  sessionSecret: () => required("SESSION_SECRET"),

  /** telemt control-plane API base, reached over the private tunnel (WireGuard). */
  telemtApiUrl: () => optional("TELEMT_API_URL", "http://127.0.0.1:9091"),
  /** Optional bearer token if telemt [server.api] auth is enabled. */
  telemtApiToken: () => optional("TELEMT_API_TOKEN"),
  /**
   * When TELEMT_STUB=1, keys are generated locally instead of calling the node.
   * Lets the full flow run before the telemt tunnel is wired. Links produced in
   * stub mode are NOT provisioned on the proxy until a real node is connected.
   */
  telemtStub: () => isTrue(process.env["TELEMT_STUB"]),

  /** What goes into the link's server= field. For now the single node IP. */
  proxyServerHost: () => optional("PROXY_SERVER_HOST", "72.56.76.88"),
  proxyServerPort: () => Number(optional("PROXY_SERVER_PORT", "443")),
  /** SNI domain baked into issued links (validated PQ-safe, e.g. docs.rs). */
  proxySni: () => optional("PROXY_SNI", "docs.rs"),

  /** Payment provider selection + credentials (СБП / fast payments). */
  paymentProvider: () => optional("PAYMENT_PROVIDER", "sbp"),
  paymentApiUrl: () => optional("PAYMENT_API_URL"),
  paymentMerchantId: () => optional("PAYMENT_MERCHANT_ID"),
  paymentSecret: () => optional("PAYMENT_SECRET"),
  /** Public base URL of this app (for payment return/callback URLs). */
  publicBaseUrl: () => optional("PUBLIC_BASE_URL", ""),

  /** One-time token to bootstrap the first admin via POST /api/admin/bootstrap. */
  adminBootstrapToken: () => optional("ADMIN_BOOTSTRAP_TOKEN"),

  /** Secret token Telegram echoes back on each webhook call (X-Telegram-Bot-Api-Secret-Token). */
  botWebhookSecret: () => optional("BOT_WEBHOOK_SECRET"),
  /** Bot @username (without @) — used by the browser gate to link to the bot. */
  botUsername: () => optional("BOT_USERNAME"),
  /**
   * Base origin for Telegram Bot API calls. Defaults to api.telegram.org, but can
   * point at a local relay (e.g. http://127.0.0.1:8443) when the host cannot reach
   * Telegram directly (api.telegram.org is blocked from RU networks).
   */
  botApiBase: () => optional("BOT_API_BASE", "https://api.telegram.org"),
  /**
   * Local SSH-tunnel endpoint ("host:port", e.g. "127.0.0.1:8443") that forwards
   * to api.telegram.org:443 via the Amsterdam node. When set, outbound Bot API
   * traffic is routed through it (RU host can't reach Telegram directly).
   */
  botApiRelay: () => optional("BOT_API_RELAY", ""),
  /**
   * Master switch for OUTBOUND Telegram calls (sendMessage/setWebhook). When the
   * host has no egress to Telegram, set BOT_EGRESS=0 so calls short-circuit
   * instantly instead of hanging ~15s on a blocked connection.
   */
  botEgressEnabled: () => process.env["BOT_EGRESS"] !== "0",

  /** Allow non-Secure admin cookie for local HTTP testing (COOKIE_INSECURE=1). */
  cookieInsecure: () => isTrue(process.env["COOKIE_INSECURE"]),

  /** Free days credited to the referrer when an invited friend first pays. */
  referralDays: () => {
    const n = Number(process.env["REFERRAL_DAYS"]);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 30;
  },
} as const;
