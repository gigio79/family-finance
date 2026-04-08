import { defineConfig } from "prisma/config";
import "dotenv/config";

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: 'npx tsx prisma/seed.ts',
  },
  datasource: {
    url: databaseUrl,
  },
});
