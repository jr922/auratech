const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.coupon.upsert({
    where: { code: 'AURA-ENVIO' },
    update: {},
    create: {
      code: 'AURA-ENVIO',
      discountType: 'FREE_SHIPPING',
      discountValue: 0
    }
  });
  console.log('Coupon created');
}
main().finally(() => prisma.$disconnect());
