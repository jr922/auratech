import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const coupon = await prisma.coupon.findUnique({ where: { code: 'AURA20' } });
  console.log(JSON.stringify(coupon, null, 2));
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
