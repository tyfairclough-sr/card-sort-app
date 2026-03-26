import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_SEED_EMAIL ?? "admin@example.com";
  const password = process.env.ADMIN_SEED_PASSWORD ?? "changeme";
  const hash = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { email },
    create: { email, passwordHash: hash },
    update: { passwordHash: hash },
  });
  console.log(`Seeded admin user: ${email}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
