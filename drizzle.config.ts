import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Load .env.local so DATABASE_URL is available when running db:push / db:generate
config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required (e.g. from .env.local)");
}

export default defineConfig({
  schema: "./shared/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
