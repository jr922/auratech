import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const variant = await prisma.productVariant.findFirst({
    where: { name: { contains: "128GB" } }
  });
  if (variant) {
    await prisma.productVariant.update({
      where: { id: variant.id },
      data: { stock: 0 }
    });
    console.log(`Forced stock 0 on variant: ${variant.name} of product ${variant.productId}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
