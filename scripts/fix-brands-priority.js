/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ORDEN DE PRIORIDAD: Si dice "Spigen para iPhone", es Spigen, no Apple.
// Primero marcas de accesorios, luego marcas de electrónicos principales.
const BRAND_PRIORITIES = [
  // Marcas de accesorios (Mayor prioridad)
  'Spigen', 'UAG', 'Pitaka', 'Baseus', 'Satechi', 'Soundcore', 'Anker', 'Ugreen', 
  'Soundpeats', 'Logitech', 'Rode', 'QCY', 'Ezviz', 'Onn', 'Usams', 
  'Kingston', 'Yeelight', 'Mecool', 'Sandisk', 'Roku', 'Tronsmart', 'Haylou', 
  'Ringke', 'Tapo', 'Belkin', 'DJI', 'JBL', 'TP-Link',
  
  // Marcas principales (Menor prioridad, solo si no es un accesorio de terceros)
  'Apple', 'Samsung', 'Amazon', 'Sony', 'Xiaomi', 'Google'
];

async function main() {
  console.log("Corrgiendo Marcas: Asignación por Prioridad de Accesorios...");

  const allBrandsDb = await prisma.brand.findMany();
  const brandMap = {}; // name -> id
  allBrandsDb.forEach(b => brandMap[b.name.toLowerCase()] = b.id);
  const genericId = brandMap['genérico'] || brandMap['generico'];

  const products = await prisma.product.findMany();
  let updatedCount = 0;

  for (const p of products) {
    const nameLower = p.name.toLowerCase();
    let detectedBrandId = genericId;

    // Buscar la marca en el orden de prioridad
    for (const brand of BRAND_PRIORITIES) {
      if (nameLower.includes(brand.toLowerCase())) {
        if (brandMap[brand.toLowerCase()]) {
          detectedBrandId = brandMap[brand.toLowerCase()];
          break; // Stop at first match (highest priority)
        }
      }
    }

    // Casos especiales para Apple (Macbook, iPad, AirPods) si no lo detecta como "Apple"
    if (detectedBrandId === genericId) {
       if (nameLower.includes('iphone') || nameLower.includes('ipad') || nameLower.includes('macbook') || nameLower.includes('airpods') || nameLower.includes('apple watch')) {
          detectedBrandId = brandMap['apple'];
       }
    }

    if (detectedBrandId && detectedBrandId !== p.brandId) {
      await prisma.product.update({
        where: { id: p.id },
        data: { brandId: detectedBrandId }
      });
      updatedCount++;
    }
  }

  console.log(`✅ ${updatedCount} productos reasignados a su marca correcta (Prioridad Accesorios).`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
