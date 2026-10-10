/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
  console.log("Exportando base de datos SQLite a JSON...");

  const data = {
    users: await prisma.user.findMany(),
    categories: await prisma.category.findMany(),
    products: await prisma.product.findMany(),
    productVariants: await prisma.productVariant.findMany(),
    coupons: await prisma.coupon.findMany(),
    warehouses: await prisma.warehouse.findMany(),
    warehouseStocks: await prisma.warehouseStock.findMany(),
  };

  fs.writeFileSync('db-dump.json', JSON.stringify(data, null, 2));
  console.log("¡Exportación completada! Datos guardados en db-dump.json");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
