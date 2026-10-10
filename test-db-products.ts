import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const p = await prisma.product.findMany({ take: 2 });
  console.log(p.map(x => x.id));
}
main().catch(console.error).finally(() => prisma.$disconnect());
