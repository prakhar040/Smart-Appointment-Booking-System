import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PROVIDERS = [
  "Dr. Asha Verma",
  "Dr. Rohan Mehta",
  "Dr. Nisha Iyer",
  "Dr. Kabir Sethi",
  "Dr. Meera Nair",
  "Dr. Arjun Rao",
];

async function main() {
  for (const name of PROVIDERS) {
    await prisma.provider.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`Seeded ${PROVIDERS.length} providers:`, PROVIDERS.join(", "));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
