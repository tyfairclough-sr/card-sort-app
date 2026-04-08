import { PrismaClient } from "@prisma/client";

/** Dotenv does not expand `DATABASE_URL=$POSTGRES_URL`; resolve that indirection at runtime. */
function resolveDatabaseUrl(): string | undefined {
  const raw = process.env.DATABASE_URL;
  if (raw === undefined) return undefined;
  const trimmed = raw.trim();
  const m = trimmed.match(/^\$([A-Za-z_][A-Za-z0-9_]*)$/);
  if (m) return process.env[m[1]]?.trim();
  return trimmed;
}

const resolvedDbUrl = resolveDatabaseUrl();
const validPostgresPrefix = Boolean(
  resolvedDbUrl?.startsWith("postgresql://") || resolvedDbUrl?.startsWith("postgres://"),
);

if (resolvedDbUrl && !validPostgresPrefix) {
  const looksLikeSqlite = resolvedDbUrl.startsWith("file:");
  throw new Error(
    looksLikeSqlite
      ? "DATABASE_URL points at SQLite (`file:`) but prisma/schema.prisma uses PostgreSQL. Set DATABASE_URL and DIRECT_URL to Postgres URLs — see .env.example and docker-compose.yml."
      : "DATABASE_URL must start with postgresql:// or postgres://. See .env.example.",
  );
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(resolvedDbUrl
      ? {
          datasources: {
            db: { url: resolvedDbUrl },
          },
        }
      : {}),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
