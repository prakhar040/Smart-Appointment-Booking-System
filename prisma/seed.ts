import { PrismaClient } from "@prisma/client";
import { providerNames } from "../src/lib/config";

const prisma = new PrismaClient();

async function main() {
  for (const name of providerNames) {
    await prisma.provider.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  await prisma.provider.deleteMany({
    where: { name: { notIn: [...providerNames] }, appointments: { none: {} } },
  });
  console.log(`Seeded ${providerNames.length} providers:`, providerNames.join(", "));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
