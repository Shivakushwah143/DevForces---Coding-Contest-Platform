import { config } from "dotenv";
import { defineConfig } from "prisma/config";
import path from "path";

// Manually load .env file
config({ path: path.resolve(process.cwd(), ".env") });

console.log("Current dir:", process.cwd());
console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);

if (process.env.DATABASE_URL) {
  // Show masked URL for security
  const url = process.env.DATABASE_URL || 'postgresql://neondb_owner:NEW_PASSWORD@ep-shy-lake-ahtwt7oq-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
  const masked = url.replace(/\/\/([^:]+):([^@]+)@/, '//****:****@');
  console.log("DATABASE_URL (masked):", masked);
} else {
  console.log("ERROR: DATABASE_URL not found in .env!");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL || 'postgresql://neondb_owner:NEW_PASSWORD@ep-shy-lake-ahtwt7oq-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  },
});


