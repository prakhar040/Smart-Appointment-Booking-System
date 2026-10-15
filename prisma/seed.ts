import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PROVIDERS = ["Dr. Asha Verma", "Dr. Rohan Mehta"];

async function main() {
  for (const name of PROVIDERS) {
    await prisma.provider.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log("Seeded providers:", PROVIDERS.join(", "));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());