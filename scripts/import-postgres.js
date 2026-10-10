/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
  console.log("Importando datos desde db-dump.json a Postgres...");

  if (!fs.existsSync('db-dump.json')) {
    console.error("No se encontró db-dump.json. ¡Ejecuta dump-sqlite.js primero!");
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync('db-dump.json', 'utf-8'));

  // Orden de inserción para respetar las llaves foráneas
  
  if (data.users.length > 0) {
    console.log(`Insertando ${data.users.length} usuarios...`);
    await prisma.user.createMany({ data: data.users, skipDuplicates: true });
  }

  if (data.categories.length > 0) {
    console.log(`Insertando ${data.categories.length} categorías...`);
    await prisma.category.createMany({ data: data.categories, skipDuplicates: true });
  }

  if (data.products.length > 0) {
    console.log(`Insertando ${data.products.length} productos...`);
    await prisma.product.createMany({ data: data.products, skipDuplicates: true });
  }

  if (data.productVariants.length > 0) {
    console.log(`Insertando ${data.productVariants.length} variantes...`);
    await prisma.productVariant.createMany({ data: data.productVariants, skipDuplicates: true });
  }

  if (data.coupons.length > 0) {
    console.log(`Insertando ${data.coupons.length} cupones...`);
    await prisma.coupon.createMany({ data: data.coupons, skipDuplicates: true });
  }

  if (data.warehouses.length > 0) {
    console.log(`Insertando ${data.warehouses.length} almacenes...`);
    await prisma.warehouse.createMany({ data: data.warehouses, skipDuplicates: true });
  }

  if (data.warehouseStocks.length > 0) {
    console.log(`Insertando ${data.warehouseStocks.length} stocks de almacén...`);
    await prisma.warehouseStock.createMany({ data: data.warehouseStocks, skipDuplicates: true });
  }

  console.log("¡Importación completada con éxito!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
