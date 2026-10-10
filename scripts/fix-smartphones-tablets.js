/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const NEGATIVE_KEYWORDS = [
  { keyword: 'lector', slug: 'hubs-adaptadores' },
  { keyword: 'adaptador', slug: 'hubs-adaptadores' },
  { keyword: 'hub', slug: 'hubs-adaptadores' },
  { keyword: 'soporte', slug: 'soportes-otros' },
  { keyword: 'tripode', slug: 'soportes-otros' },
  { keyword: 'trípode', slug: 'soportes-otros' },
  { keyword: 'pencil', slug: 'pencils-stylus' },
  { keyword: 'lápiz', slug: 'pencils-stylus' },
  { keyword: 'mica', slug: 'micas-protectores' },
  { keyword: 'protector', slug: 'micas-protectores' },
  { keyword: 'vidrio', slug: 'micas-protectores' },
  { keyword: 'templado', slug: 'micas-protectores' },
  { keyword: 'cable', slug: 'cables' },
  { keyword: 'cargador', slug: 'cargadores-pared' },
  { keyword: 'funda', slug: 'cases-iphone' }, // General case fallback
  { keyword: 'case', slug: 'cases-iphone' },
  { keyword: 'carcasa', slug: 'cases-iphone' },
  { keyword: 'correa', slug: 'correas-wearables' },
  { keyword: 'reductor de distracciones', slug: 'soportes-otros' } // "Brick para iPhone"
];

async function main() {
  console.log("Limpiando Smartphones y Tablets...");

  // 1. Obtener todas las categorías para mapear IDs
  const cats = await prisma.category.findMany();
  const getCatId = (slug) => cats.find(c => c.slug === slug)?.id;

  // 2. Traer productos de smartphones y tablets
  const phonesCat = getCatId('smartphones');
  const tabletsCat = getCatId('tablets-ereaders');

  if (!phonesCat || !tabletsCat) {
    console.log("No se encontraron las categorías principales.");
    return;
  }

  const products = await prisma.product.findMany({
    where: { categoryId: { in: [phonesCat, tabletsCat] } }
  });

  let fixed = 0;

  for (const prod of products) {
    const text = prod.name.toLowerCase();
    let newSlug = null;

    // Buscar si es un accesorio disfrazado de dispositivo
    for (const rule of NEGATIVE_KEYWORDS) {
      if (text.includes(rule.keyword)) {
        newSlug = rule.slug;
        // Refinar si es funda para samsung/ipad
        if (rule.slug === 'cases-iphone') {
           if (text.includes('samsung') || text.includes('galaxy')) newSlug = 'cases-samsung';
           if (text.includes('ipad') || text.includes('mac')) newSlug = 'cases-ipad-mac';
        }
        break;
      }
    }

    if (newSlug) {
      const newCatId = getCatId(newSlug);
      if (newCatId) {
        console.log(`Moviendo "${prod.name}" a ${newSlug}`);
        await prisma.product.update({
          where: { id: prod.id },
          data: { categoryId: newCatId }
        });
        fixed++;
      }
    } else {
      console.log(`✔️ Correcto: ${prod.name}`);
    }
  }

  console.log(`✅ ${fixed} accesorios falsos reasignados a sus categorías correctas.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
