/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const NEW_TAXONOMY = [
  {
    name: 'Smartphones & Tablets', slug: 'smartphones-tablets',
    children: [
      { name: 'Smartphones', slug: 'smartphones', keywords: ['iphone', 'galaxy', 'smartphone', 'celular'] },
      { name: 'Tablets & E-Readers', slug: 'tablets-ereaders', keywords: ['ipad', 'tablet', 'kindle', 'pizarra'] },
    ]
  },
  {
    name: 'Cómputo', slug: 'computo',
    children: [
      { name: 'Laptops & MacBooks', slug: 'laptops-macbooks', keywords: ['macbook', 'laptop'] }
    ]
  },
  {
    name: 'Smart Home', slug: 'smart-home-tv',
    children: [
      { name: 'Streaming & TV', slug: 'streaming-tv', keywords: ['fire tv', 'roku', 'chromecast', 'mecool', 'onn', 'tv stick', 'echo show', 'apple tv'] },
      { name: 'Hogar & Salud', slug: 'hogar-salud', keywords: ['hervidora', 'kettle', 'aspirador', 'balanza', 'secadora', 'afeitador', 'grooming', 'wax', 'enzimas', 'magnesio', 'mist'] }
    ]
  },
  {
    name: 'Accesorios & Wearables', slug: 'accesorios-wearables',
    children: [
      { name: 'Almacenamiento', slug: 'almacenamiento', keywords: ['ssd', 'microsd', 'sdxc', 'disco', 'tarjeta'] },
      { name: 'Pencils & Stylus', slug: 'pencils-stylus', keywords: ['pencil', 'puntero', 'laser'] }
    ]
  }
];

async function main() {
  console.log("Creando categorías faltantes y arreglando Soportes & Otros...");

  // 1. Crear / Obtener categorías padre
  const subcats = [];
  for (const parent of NEW_TAXONOMY) {
    const p = await prisma.category.upsert({
      where: { slug: parent.slug },
      update: {},
      create: { name: parent.name, slug: parent.slug, parentId: null }
    });

    for (const child of parent.children) {
      const c = await prisma.category.upsert({
        where: { slug: child.slug },
        update: { name: child.name, parentId: p.id },
        create: { name: child.name, slug: child.slug, parentId: p.id }
      });
      subcats.push({ ...child, id: c.id });
    }
  }

  // 2. Obtener SOLO productos en "Soportes & Otros"
  const soportesCat = await prisma.category.findFirst({ where: { slug: 'soportes-otros' } });
  const products = await prisma.product.findMany({ where: { categoryId: soportesCat.id } });

  let reassigned = 0;

  for (const prod of products) {
    const text = prod.name.toLowerCase();
    
    // Buscar en subcats nuevas
    let matchedId = null;
    for (const sub of subcats) {
      if (sub.keywords.some(kw => text.includes(kw.toLowerCase()))) {
        matchedId = sub.id;
        break;
      }
    }

    // Si encontramos una mejor categoría, la actualizamos
    if (matchedId) {
      await prisma.product.update({
        where: { id: prod.id },
        data: { categoryId: matchedId }
      });
      reassigned++;
    } else {
      // Otros arreglos específicos
      if (text.includes('soporte') || text.includes('tripode')) {
         // Se queda en soportes
      }
    }
  }

  console.log(`✅ ${reassigned} productos sacados de 'Soportes & Otros' a sus categorías correctas.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
