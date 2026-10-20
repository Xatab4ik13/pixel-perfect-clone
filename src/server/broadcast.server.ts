// Admin broadcasts (server-only): text and up to 10 photos to every bot user,
// with an "Открыть Лазейку" button. Photos are uploaded once (to the first
// recipient) and then resent by Telegram file_id. Telegram does not allow
// buttons on albums, so an album is followed by a short message with the button.
import { getDb } from "./db.server";
import { users } from "./schema";
import { tgCall, tgCallForm, type TgResult } from "./telegram-transport.server";
import { env } from "./env.server";

export const MAX_PHOTOS = 10;
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
export const MAX_CAPTION = 1024;
export const MAX_TEXT = 4096;

export interface BroadcastJob {
  id: string;
  startedAt: string;
  finishedAt: string | null;
  total: number;
  sent: number;
  failed: number;
  blocked: number;
}

let lastJob: BroadcastJob | null = null;
export const getLastBroadcast = () => lastJob;

export class BroadcastError extends Error {}

function appUrl(): string {
  return (env.publicBaseUrl() || "https://lazeyka.hhr.pro").replace(/\/+$/, "");
}
const button = () => ({ inline_keyboard: [[{ text: "🚀 Открыть Лазейку", web_app: { url: appUrl() } }]] });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function validateBroadcast(text: string, photos: File[]): void {
  if (!text.trim() && photos.length === 0) throw new BroadcastError("Пустое сообщение");
  if (photos.length > MAX_PHOTOS) throw new BroadcastError(`Не больше ${MAX_PHOTOS} фото`);
  for (const p of photos) {
    if (!p.type.startsWith("image/")) throw new BroadcastError(`${p.name}: не картинка`);
    if (p.size > MAX_PHOTO_BYTES) throw new BroadcastError(`${p.name}: больше 10 МБ`);
  }
  const limit = photos.length > 0 ? MAX_CAPTION : MAX_TEXT;
  if (text.length > limit) throw new BroadcastError(`Текст длиннее ${limit} знаков`);
}

/** Start a broadcast in the background; returns immediately. One at a time. */
export async function startBroadcast(text: string, photos: File[]): Promise<BroadcastJob> {
  validateBroadcast(text, photos);
  if (lastJob && !lastJob.finishedAt) throw new BroadcastError("Предыдущая рассылка ещё идёт");
  const rows = await getDb().select({ tg: users.telegramUserId }).from(users);
  const job: BroadcastJob = {
    id: crypto.randomUUID(),
    startedAt: new Date().toISOString(),
    finishedAt: null,
    total: rows.length,
    sent: 0,
    failed: 0,
    blocked: 0,
  };
  lastJob = job;
  const buffers = await Promise.all(photos.map(async (p) => ({ name: p.name, type: p.type, data: await p.arrayBuffer() })));
  void run(job, rows.map((r) => r.tg), text.trim(), buffers).catch((e) => {
    console.error("[broadcast] crashed", e instanceof Error ? e.message : e);
    job.finishedAt = new Date().toISOString();
  });
  return job;
}

type Photo = { name: string; type: string; data: ArrayBuffer };

async function run(job: BroadcastJob, chatIds: number[], text: string, photos: Photo[]): Promise<void> {
  let fileIds: string[] | null = null;

  for (const chatId of chatIds) {
    let res: TgResult;
    let attempt = 0;
    for (;;) {
      res = await sendOne(chatId, text, photos, fileIds).catch((e) => ({
        ok: false, status: 0, description: String(e instanceof Error ? e.message : e), result: null, raw: null,
      }));
      const retry = (res.raw as { parameters?: { retry_after?: number } } | null)?.parameters?.retry_after;
      if (res.status === 429 && retry && attempt < 3) {
        attempt++;
        await sleep((retry + 1) * 1000);
        continue;
      }
      break;
    }
    if (res.ok) {
      job.sent++;
      if (!fileIds && photos.length > 0) fileIds = extractFileIds(res.result);
    } else if (res.status === 403) {
      job.blocked++; // user blocked the bot / never started it
    } else {
      job.failed++;
    }
    await sleep(45); // stay under Telegram's ~30 msg/s broadcast limit
  }
  job.finishedAt = new Date().toISOString();
}

function extractFileIds(result: unknown): string[] | null {
  const msgs = Array.isArray(result) ? result : [result];
  const ids = msgs
    .map((m) => (m as { photo?: Array<{ file_id: string }> })?.photo?.at(-1)?.file_id)
    .filter((x): x is string => Boolean(x));
  return ids.length ? ids : null;
}

async function sendOne(chatId: number, text: string, photos: Photo[], fileIds: string[] | null): Promise<TgResult> {
  if (photos.length === 0) {
    return tgCall("sendMessage", { chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true, reply_markup: button() });
  }

  if (photos.length === 1) {
    if (fileIds) {
      return tgCall("sendPhoto", { chat_id: chatId, photo: fileIds[0], caption: text || undefined, parse_mode: "HTML", reply_markup: button() });
    }
    const form = new FormData();
    form.set("chat_id", String(chatId));
    if (text) form.set("caption", text);
    form.set("parse_mode", "HTML");
    form.set("reply_markup", JSON.stringify(button()));
    form.set("photo", new Blob([photos[0]!.data], { type: photos[0]!.type }), photos[0]!.name);
    return tgCallForm("sendPhoto", form);
  }

  // Album: caption on the first photo, then a short message carrying the button.
  let res: TgResult;
  const media = photos.map((p, i) => ({
    type: "photo",
    media: fileIds ? fileIds[i] : `attach://p${i}`,
    ...(i === 0 && text ? { caption: text, parse_mode: "HTML" } : {}),
  }));
  if (fileIds) {
    res = await tgCall("sendMediaGroup", { chat_id: chatId, media });
  } else {
    const form = new FormData();
    form.set("chat_id", String(chatId));
    form.set("media", JSON.stringify(media));
    photos.forEach((p, i) => form.set(`p${i}`, new Blob([p.data], { type: p.type }), p.name));
    res = await tgCallForm("sendMediaGroup", form);
  }
  if (!res.ok) return res;
  await tgCall("sendMessage", { chat_id: chatId, text: "👇", reply_markup: button() }).catch(() => undefined);
  return res;
}
