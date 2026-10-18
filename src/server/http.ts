// Small helpers for server route handlers: JSON responses and consistent error
// mapping. Never include secrets in error bodies.
import { AuthError } from "./auth.server";

export function json(data: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "content-type": "application/json; charset=utf-8", ...(init?.headers ?? {}) },
  });
}

export function errorResponse(error: unknown): Response {
  if (error instanceof AuthError) {
    return json({ error: error.message }, { status: error.status });
  }
  // Log server-side, return a generic message to the client.
  console.error("[api] unhandled error:", error);
  return json({ error: "internal error" }, { status: 500 });
}

/** Wrap an async handler with uniform error handling. */
export function handler(fn: (ctx: { request: Request }) => Promise<Response>) {
  return async (ctx: { request: Request }): Promise<Response> => {
    try {
      return await fn(ctx);
    } catch (e) {
      return errorResponse(e);
    }
  };
}
