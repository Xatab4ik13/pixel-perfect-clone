// Request authentication for the Telegram Mini App (server-only).
//
// The client sends the Telegram initData on every API call via the header
//   Authorization: tma <initData>
// (the scheme recommended by Telegram). We verify it statelessly each request,
// which also makes the API immune to CSRF (custom header, no ambient cookie).
import { eq, sql } from "drizzle-orm";
import { getDb } from "./db.server";
import { users, type User } from "./schema";
import { env } from "./env.server";
import { verifyInitData } from "./telegram.server";
import { attributeReferral } from "./referrals.server";

export class AuthError extends Error {
  constructor(message: string, readonly status = 401) {
    super(message);
    this.name = "AuthError";
  }
}

const STAFF_ROLES = new Set(["viewer", "operator", "admin"]);

function extractInitData(request: Request): string {
  const header = request.headers.get("authorization") ?? "";
  const m = /^tma\s+(.+)$/i.exec(header);
  if (!m) throw new AuthError("missing Telegram authorization");
  return m[1]!;
}

/** Verify the request and upsert the user, returning the DB row. */
export async function requireUser(request: Request): Promise<User> {
  const initData = extractInitData(request);
  const result = verifyInitData(initData, env.telegramBotToken());
  if (!result.ok) throw new AuthError(`auth failed: ${result.error}`);

  const tg = result.user;
  const db = getDb();
  const rows = await db
    .insert(users)
    .values({
      telegramUserId: tg.id,
      username: tg.username ?? null,
      firstName: tg.first_name ?? null,
      lastName: tg.last_name ?? null,
      photoUrl: tg.photo_url ?? null,
      languageCode: tg.language_code ?? null,
      isPremium: tg.is_premium ?? false,
    })
    .onConflictDoUpdate({
      target: users.telegramUserId,
      set: {
        username: tg.username ?? null,
        firstName: tg.first_name ?? null,
        lastName: tg.last_name ?? null,
        photoUrl: tg.photo_url ?? null,
        languageCode: tg.language_code ?? null,
        isPremium: tg.is_premium ?? false,
        updatedAt: sql`now()`,
      },
    })
    .returning();

  const user = rows[0];
  if (!user) throw new AuthError("failed to upsert user", 500);

  // Referral attribution via Mini App start_param (e.g. ?startapp=ref_<code>).
  // Best-effort — never blocks authentication.
  const startParam = result.raw["start_param"];
  if (startParam) await attributeReferral(user.id, startParam);

  return user;
}

/** Require the authenticated user to hold a staff role (viewer/operator/admin). */
export async function requireStaff(request: Request, minRole: "viewer" | "operator" | "admin" = "viewer"): Promise<User> {
  const user = await requireUser(request);
  if (!STAFF_ROLES.has(user.role)) throw new AuthError("forbidden", 403);
  const order = ["viewer", "operator", "admin"];
  if (order.indexOf(user.role) < order.indexOf(minRole)) {
    throw new AuthError("insufficient role", 403);
  }
  return user;
}

export async function findUserById(id: string): Promise<User | undefined> {
  const db = getDb();
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return rows[0];
}
