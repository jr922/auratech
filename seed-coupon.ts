import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  await prisma.coupon.upsert({
    where: { code: 'AURA20' },
    update: {},
    create: {
      code: 'AURA20',
      discountType: 'PERCENTAGE',
      discountValue: 20
    }
  });
  console.log("Cupon AURA20 creado!");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
