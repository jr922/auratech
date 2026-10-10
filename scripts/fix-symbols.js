/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */

const { PrismaClient } = require('@prisma/client');
const { decode } = require('html-entities');
const prisma = new PrismaClient();

async function main() {
  console.log("Limpiando símbolos extraños de la base de datos...");
  const products = await prisma.product.findMany();
  let count = 0;

  for (const p of products) {
    const cleanName = decode(p.name);
    const cleanDesc = decode(p.description);

    if (cleanName !== p.name || cleanDesc !== p.description) {
      await prisma.product.update({
        where: { id: p.id },
        data: {
          name: cleanName,
          description: cleanDesc
        }
      });
      count++;
    }
  }

  console.log(`¡Listo! Se corrigieron ${count} productos con símbolos rotos.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
