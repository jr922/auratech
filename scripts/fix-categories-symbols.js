/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */

const { PrismaClient } = require('@prisma/client');
const { decode } = require('html-entities');
const prisma = new PrismaClient();

async function main() {
  console.log("Limpiando símbolos extraños en Categorías y Marcas...");
  
  // Limpiar Categorias
  const categories = await prisma.category.findMany();
  let countCat = 0;
  for (const cat of categories) {
    const cleanName = decode(cat.name);
    if (cleanName !== cat.name) {
      await prisma.category.update({
        where: { id: cat.id },
        data: { name: cleanName }
      });
      countCat++;
    }
  }

  // Limpiar Marcas
  const brands = await prisma.brand.findMany();
  let countBrand = 0;
  for (const b of brands) {
    const cleanName = decode(b.name);
    if (cleanName !== b.name) {
      await prisma.brand.update({
        where: { id: b.id },
        data: { name: cleanName }
      });
      countBrand++;
    }
  }

  console.log(`¡Listo! Se corrigieron ${countCat} categorías y ${countBrand} marcas.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
