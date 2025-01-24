import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create initial categories
  const categories = [
    {
      name: "Skincare",
      description: "Questions about skincare routines, products, and concerns",
    },
    {
      name: "Makeup",
      description: "Questions about makeup techniques, products, and trends",
    },
    {
      name: "Hair Care",
      description: "Questions about hair care, styling, and treatments",
    },
    {
      name: "Wellness",
      description: "Questions about health, wellness, and self-care",
    },
    {
      name: "Beauty Tech",
      description: "Questions about beauty technology and innovations",
    },
  ];

  for (const category of categories) {
    await prisma.krisCategory.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
  }

  console.log("Seed data created successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 