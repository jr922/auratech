/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const VALID_BRANDS = [
  'Apple', 'Samsung', 'Amazon', 'Sony', 'JBL', 'Xiaomi', 'Google', 'Genérico', 
  'Spigen', 'UAG', 'Pitaka', 'Baseus', 'Satechi', 'Soundcore', 'Anker', 'Ugreen', 
  'Soundpeats', 'TP-Link', 'Logitech', 'Rode', 'QCY', 'Ezviz', 'Onn', 'Usams', 
  'Kingston', 'Yeelight', 'Mecool', 'Sandisk', 'Roku', 'Tronsmart', 'Haylou', 
  'Ringke', 'Tapo', 'Belkin', 'DJI'
];

async function main() {
  console.log("Iniciando purga agresiva de marcas y recategorización precisa...");

  const allBrands = await prisma.brand.findMany();
  const validBrandSlugs = VALID_BRANDS.map(b => b.toLowerCase().replace('é', 'e').replace(' ', '-').replace('.', ''));
  
  // 1. Borrar marcas basura
  const genericBrand = await prisma.brand.upsert({
    where: { slug: 'generico' },
    update: {},
    create: { name: 'Genérico', slug: 'generico' }
  });
  
  for (const b of allBrands) {
    if (!validBrandSlugs.includes(b.slug)) {
      console.log(`Borrando marca basura: ${b.name}`);
      // Reasignar productos de esta marca a genérico antes de borrar
      await prisma.product.updateMany({
        where: { brandId: b.id },
        data: { brandId: genericBrand.id }
      });
      await prisma.brand.delete({ where: { id: b.id } });
    }
  }

  // 2. Intentar asignar marca correcta basándonos en el NOMBRE del producto
  const products = await prisma.product.findMany();
  let brandFixes = 0;
  
  for (const p of products) {
    const nameLower = p.name.toLowerCase();
    
    // Si la marca es genérica, buscar en el nombre
    if (p.brandId === genericBrand.id) {
      for (const validBrand of VALID_BRANDS) {
        if (nameLower.includes(validBrand.toLowerCase())) {
          const dbBrand = await prisma.brand.findFirst({ where: { slug: validBrand.toLowerCase() } });
          if (dbBrand) {
            await prisma.product.update({
              where: { id: p.id },
              data: { brandId: dbBrand.id }
            });
            brandFixes++;
            break;
          }
        }
      }
    }
  }
  
  console.log(`✅ ${brandFixes} productos reasignados a sus verdaderas marcas por nombre.`);

  // 3. RECATEGORIZACIÓN EXCLUSIVAMENTE POR NOMBRE (No por descripción)
  const cats = await prisma.category.findMany();
  const getCatId = (slug) => cats.find(c => c.slug === slug)?.id;

  let catFixes = 0;
  for (const p of products) {
    const text = p.name.toLowerCase(); // SOLO EL NOMBRE
    let newCatId = getCatId('soportes-otros');

    if (text.match(/case|funda|carcasa|cover|armor/i)) {
      if (text.match(/iphone/i)) newCatId = getCatId('cases-iphone');
      else if (text.match(/samsung|galaxy|z fold/i)) newCatId = getCatId('cases-samsung');
      else newCatId = getCatId('cases-ipad-mac');
    }
    else if (text.match(/cargador|powerbank|bater[ií]a|magsafe/i)) {
      if (text.match(/pared|gan/i)) newCatId = getCatId('cargadores-pared');
      else if (text.match(/inal[aá]mbrico|magsafe|powerbank|bater/i)) newCatId = getCatId('inalambricos-powerbanks');
      else newCatId = getCatId('cargadores-pared');
    }
    else if (text.match(/cable/i)) {
      newCatId = getCatId('cables');
    }
    else if (text.match(/aud[ií]fono|auricular|earbud|airpod|buds|tws/i)) {
      if (text.match(/diadema|over-ear|max/i)) newCatId = getCatId('audifonos-over-ear');
      else newCatId = getCatId('audifonos-in-ear');
    }
    else if (text.match(/parlante|speaker|bocina/i)) {
      newCatId = getCatId('parlantes');
    }
    else if (text.match(/router|mesh|repetidor|wifi/i)) {
      newCatId = getCatId('conectividad');
    }
    else if (text.match(/c[aá]mara|vigilancia|timbre/i)) {
      newCatId = getCatId('camaras-seguridad');
    }
    else if (text.match(/foco|led|luz|lámpara|bulb/i)) {
      newCatId = getCatId('iluminacion-smart');
    }
    else if (text.match(/watch|smartwatch|band/i)) {
      newCatId = getCatId('smartwatches');
    }
    else if (text.match(/teclado|mouse|rat[oó]n/i)) {
      newCatId = getCatId('teclados-mouse');
    }
    else if (text.match(/hub|adaptador|dock/i)) {
      newCatId = getCatId('hubs-adaptadores');
    }
    else if (text.match(/mica|vidrio|cristal/i)) {
      newCatId = getCatId('micas-protectores');
    }

    if (newCatId && p.categoryId !== newCatId) {
      await prisma.product.update({
        where: { id: p.id },
        data: { categoryId: newCatId }
      });
      catFixes++;
    }
  }

  console.log(`✅ ${catFixes} productos recategorizados estrictamente por nombre.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
