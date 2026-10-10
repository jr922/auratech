import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const coupon = await prisma.coupon.findUnique({ where: { code: 'AURA20' }});
  console.log("Found coupon:", coupon);
}
main().catch(console.error).finally(() => prisma.$disconnect());
