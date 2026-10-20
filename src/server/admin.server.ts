// Admin panel backend (server-only): email+password auth with scrypt hashing,
// an HMAC-signed session cookie, staff RBAC, user management and economics.
import { randomBytes, scrypt, timingSafeEqual, createHmac } from "node:crypto";
import { promisify } from "node:util";
import { desc, eq, ilike, or, sql } from "drizzle-orm";
import { getDb } from "./db.server";
import { adminUsers, users, subscriptions, payments, auditEvents, type AdminUser } from "./schema";
import { env } from "./env.server";

const scryptAsync = promisify(scrypt);
const SESSION_COOKIE = "admin_session";
const SESSION_TTL_SEC = 12 * 60 * 60; // 12h
const ROLE_ORDER = ["viewer", "operator", "admin"] as const;
type Role = (typeof ROLE_ORDER)[number];

export class AdminAuthError extends Error {
  constructor(message: string, readonly status = 401) {
    super(message);
    this.name = "AdminAuthError";
  }
}

// ── Password hashing ─────────────────────────────────────────────────────────
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const salt = Buffer.from(parts[1]!, "hex");
  const expected = Buffer.from(parts[2]!, "hex");
  const derived = (await scryptAsync(password, salt, expected.length)) as Buffer;
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}

// ── Session cookie (HMAC-signed, stateless) ──────────────────────────────────
interface SessionPayload {
  sub: string; // admin id
  role: Role;
  exp: number; // unix seconds
}

function signSession(payload: SessionPayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const mac = createHmac("sha256", env.sessionSecret()).update(data).digest("base64url");
  return `${data}.${mac}`;
}

function verifySession(token: string): SessionPayload | null {
  const dot = token.lastIndexOf(".");
  if (dot < 0) return null;
  const data = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  const expected = createHmac("sha256", env.sessionSecret()).update(data).digest("base64url");
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString()) as SessionPayload;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

// Secure is required in production; omit it only for local HTTP testing
// (COOKIE_INSECURE=1) so the cookie is still delivered over http://localhost.
const SECURE = env.cookieInsecure() ? "" : " Secure;";

export function sessionCookie(token: string): string {
  return `${SESSION_COOKIE}=${token}; HttpOnly;${SECURE} SameSite=Lax; Path=/; Max-Age=${SESSION_TTL_SEC}`;
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; HttpOnly;${SECURE} SameSite=Lax; Path=/; Max-Age=0`;
}

function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return null;
}

// ── Auth flows ───────────────────────────────────────────────────────────────
export async function login(email: string, password: string): Promise<{ token: string; admin: AdminUser }> {
  const db = getDb();
  const rows = await db.select().from(adminUsers).where(eq(adminUsers.email, email.toLowerCase())).limit(1);
  const admin = rows[0];
  if (!admin || !(await verifyPassword(password, admin.passwordHash))) {
    throw new AdminAuthError("invalid email or password");
  }
  await db.update(adminUsers).set({ lastLoginAt: sql`now()` }).where(eq(adminUsers.id, admin.id));
  const token = signSession({
    sub: admin.id,
    role: (admin.role as Role) ?? "viewer",
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SEC,
  });
  return { token, admin };
}

export async function requireAdmin(request: Request, minRole: Role = "viewer"): Promise<SessionPayload> {
  const token = readCookie(request, SESSION_COOKIE);
  if (!token) throw new AdminAuthError("not authenticated");
  const session = verifySession(token);
  if (!session) throw new AdminAuthError("session expired");
  if (ROLE_ORDER.indexOf(session.role) < ROLE_ORDER.indexOf(minRole)) {
    throw new AdminAuthError("insufficient role", 403);
  }
  return session;
}

/** Create the first admin via bootstrap token (only when the table is empty). */
export async function bootstrapAdmin(email: string, password: string, token: string): Promise<AdminUser> {
  const expected = env.adminBootstrapToken();
  if (!expected) throw new AdminAuthError("bootstrap disabled", 403);
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw new AdminAuthError("bad bootstrap token", 403);

  const db = getDb();
  const existing = await db.select({ id: adminUsers.id }).from(adminUsers).limit(1);
  if (existing[0]) throw new AdminAuthError("already bootstrapped", 409);
  return createAdmin(email, password, "admin");
}

export async function createAdmin(email: string, password: string, role: Role): Promise<AdminUser> {
  if (password.length < 8) throw new AdminAuthError("password too short", 400);
  const db = getDb();
  const passwordHash = await hashPassword(password);
  const rows = await db
    .insert(adminUsers)
    .values({ email: email.toLowerCase(), passwordHash, role })
    .returning();
  return rows[0]!;
}

// ── Economics / dashboard ────────────────────────────────────────────────────
export interface Economics {
  users: { total: number; activeSubs: number; expiredSubs: number };
  revenue: { totalRub: number; last30dRub: number; paymentsPaid: number };
  byPlan: Array<{ planId: string; count: number; revenueRub: number }>;
}

export async function getEconomics(): Promise<Economics> {
  const db = getDb();
  const [userAgg] = (await db.execute(sql`
    select
      (select count(*) from public.users) as total,
      (select count(*) from public.subscriptions where status = 'active' and current_period_end > now()) as active,
      (select count(*) from public.subscriptions where current_period_end is not null and current_period_end <= now()) as expired
  `)) as unknown as Array<{ total: number; active: number; expired: number }>;

  const [rev] = (await db.execute(sql`
    select
      coalesce(sum(amount_kopecks) filter (where status = 'paid'), 0) as total_kop,
      coalesce(sum(amount_kopecks) filter (where status = 'paid' and paid_at > now() - interval '30 days'), 0) as last30_kop,
      count(*) filter (where status = 'paid') as paid_count
    from public.payments
  `)) as unknown as Array<{ total_kop: number; last30_kop: number; paid_count: number }>;

  const byPlan = (await db.execute(sql`
    select plan_id,
           count(*) filter (where status = 'paid') as count,
           coalesce(sum(amount_kopecks) filter (where status = 'paid'), 0) as revenue_kop
    from public.payments
    group by plan_id
    order by revenue_kop desc
  `)) as unknown as Array<{ plan_id: string; count: number; revenue_kop: number }>;

  return {
    users: {
      total: Number(userAgg?.total ?? 0),
      activeSubs: Number(userAgg?.active ?? 0),
      expiredSubs: Number(userAgg?.expired ?? 0),
    },
    revenue: {
      totalRub: Number(rev?.total_kop ?? 0) / 100,
      last30dRub: Number(rev?.last30_kop ?? 0) / 100,
      paymentsPaid: Number(rev?.paid_count ?? 0),
    },
    byPlan: byPlan.map((r) => ({
      planId: r.plan_id,
      count: Number(r.count),
      revenueRub: Number(r.revenue_kop) / 100,
    })),
  };
}

// ── User management ──────────────────────────────────────────────────────────
export interface AdminUserRow {
  id: string;
  telegramUserId: number;
  username: string | null;
  firstName: string | null;
  status: string;
  planId: string | null;
  currentPeriodEnd: string | null;
  createdAt: string;
}

export async function listUsers(query: string, limit = 50): Promise<AdminUserRow[]> {
  const db = getDb();
  const q = query.trim();
  const whereClause = q
    ? or(
        ilike(users.username, `%${q}%`),
        ilike(users.firstName, `%${q}%`),
        sql`${users.telegramUserId}::text ilike ${`%${q}%`}`,
      )
    : undefined;

  const rows = await db
    .select({
      id: users.id,
      telegramUserId: users.telegramUserId,
      username: users.username,
      firstName: users.firstName,
      createdAt: users.createdAt,
      status: subscriptions.status,
      planId: subscriptions.planId,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
    })
    .from(users)
    .leftJoin(subscriptions, eq(subscriptions.userId, users.id))
    .where(whereClause ?? sql`true`)
    .orderBy(desc(users.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    telegramUserId: r.telegramUserId,
    username: r.username,
    firstName: r.firstName,
    status: r.status ?? "pending",
    planId: r.planId,
    currentPeriodEnd: r.currentPeriodEnd ? r.currentPeriodEnd.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function recordAudit(
  actorAdminId: string,
  action: string,
  targetUserId: string | null,
  reason: string,
  extra?: Record<string, unknown>,
): Promise<void> {
  const db = getDb();
  await db.insert(auditEvents).values({
    actorUserId: null, // admins are separate from product users
    action,
    targetUserId,
    reason,
    meta: { actorAdminId, ...extra },
  });
}

