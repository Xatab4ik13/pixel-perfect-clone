import crypto from "node:crypto";
import fs from "node:fs";

const env = fs.readFileSync("/opt/lazeyka/app/.env", "utf8");
const token = env.match(/^TELEGRAM_BOT_TOKEN=(.*)$/m)[1].trim();

const user = {
  id: 777000111,
  first_name: "Иван",
  last_name: "Тестовый",
  username: "ivan_test",
  language_code: "ru",
  is_premium: true,
};
const params = {
  auth_date: String(Math.floor(Date.now() / 1000)),
  query_id: "AAtest123",
  user: JSON.stringify(user),
};
const dcs = Object.keys(params)
  .sort()
  .map((k) => `${k}=${params[k]}`)
  .join("\n");
const secret = crypto.createHmac("sha256", "WebAppData").update(token).digest();
const hash = crypto.createHmac("sha256", secret).update(dcs).digest("hex");
const qs = new URLSearchParams({ ...params, hash }).toString();

async function call(path, init = {}) {
  const r = await fetch(`http://127.0.0.1:3000${path}`, {
    ...init,
    headers: { authorization: `tma ${qs}`, ...(init.headers || {}) },
  });
  const t = await r.text();
  console.log(`${init.method || "GET"} ${path} -> ${r.status}\n${t}\n`);
  return { status: r.status, body: t };
}

console.log("== /api/me (profile upsert from Telegram initData) ==");
await call("/api/me");
console.log("== /api/me/link (proxy link) ==");
await call("/api/me/link");
