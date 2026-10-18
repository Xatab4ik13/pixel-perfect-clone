import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/schema.ts",
  out: "./vps/drizzle/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});
