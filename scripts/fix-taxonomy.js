/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Nombres exactos de nuestras categorías maestras limpias
const MASTER_CATEGORIES = {
  AUDIO: 'audio',
  CASES: 'case-covers',
  CARGADORES: 'cargadores-y-cables',
  ACCESORIOS: 'accesorios',
  SMARTHOME: 'smart-home-tv',
  WEARABLES: 'wearables',
  COMPUTO: 'computo'
};

function getMasterCategorySlug(product) {
  const text = (product.name + " " + (product.description || "")).toLowerCase();
  
  if (text.match(/case|funda|carcasa|cover|armor/i)) return MASTER_CATEGORIES.CASES;
  if (text.match(/aud[ií]fono|auricular|earbud|headphone|soundcore|anc/i)) return MASTER_CATEGORIES.AUDIO;
  if (text.match(/cargador|cable|powerbank|bater[ií]a|magsafe|gan|lightning|usb-c/i)) return MASTER_CATEGORIES.CARGADORES;
  if (text.match(/router|mesh|tapo|yeelight|foco|c[aá]mara|enchufe|alexa|google/i)) return MASTER_CATEGORIES.SMARTHOME;
  if (text.match(/watch|band|correa|pulsera|smartwatch/i)) return MASTER_CATEGORIES.WEARABLES;
  if (text.match(/teclado|mouse|rat[oó]n|macbook|ipad/i)) return MASTER_CATEGORIES.COMPUTO;
  if (text.match(/mica|protector|vidrio|cristal|hub|adaptador|soporte|stand/i)) return MASTER_CATEGORIES.ACCESORIOS;
  
  // Por defecto si no coincide
  return MASTER_CATEGORIES.ACCESORIOS;
}

// Marcas que vinieron como categorías por error en Casemotions
const BRAND_CATEGORIES = [
  'XIAOMI', 'SOUNDCORE', 'UGREEN', 'TAPO', 'TP-LINK', 
  'USAMS', 'YEELIGHT', 'APPLE', 'SAMSUNG', 'ROCK', 'BASEUS'
];

async function main() {
  console.log("Iniciando purga y reestructuración de la Taxonomía...");

  const allProducts = await prisma.product.findMany({
    include: { category: true, brand: true }
  });

  // 1. Obtener los IDs de nuestras categorías maestras, crearlas si no existen
  const masterIds = {};
  for (const [key, slug] of Object.entries(MASTER_CATEGORIES)) {
    const name = key === 'CASES' ? 'Case & Covers' 
               : key === 'CARGADORES' ? 'Cargadores y Cables'
               : key === 'SMARTHOME' ? 'Smart Home & TV'
               : key === 'COMPUTO' ? 'Cómputo'
               : key.charAt(0) + key.slice(1).toLowerCase(); // Capitalize

    const cat = await prisma.category.upsert({
      where: { slug },
      update: {},
      create: { name, slug }
    });
    masterIds[slug] = cat.id;
  }

  // 2. Reasignar cada producto a la categoría maestra correcta y corregir marcas
  let fixedProducts = 0;
  for (const p of allProducts) {
    const oldCatName = p.category?.name?.toUpperCase() || "";
    
    // Si la categoría vieja era en realidad una marca, asegurarnos de que la marca del producto sea correcta
    let newBrandId = p.brandId;
    if (BRAND_CATEGORIES.some(b => oldCatName.includes(b))) {
      const brandStr = BRAND_CATEGORIES.find(b => oldCatName.includes(b));
      const brandSlug = brandStr.toLowerCase();
      const brand = await prisma.brand.upsert({
        where: { slug: brandSlug },
        update: {},
        create: { name: brandStr.charAt(0) + brandStr.slice(1).toLowerCase(), slug: brandSlug }
      });
      newBrandId = brand.id;
    }

    // Determinar la nueva categoría maestra basada en el nombre/descripción
    const newCatSlug = getMasterCategorySlug(p);
    const newCatId = masterIds[newCatSlug];

    if (p.categoryId !== newCatId || p.brandId !== newBrandId) {
      await prisma.product.update({
        where: { id: p.id },
        data: { 
          categoryId: newCatId,
          brandId: newBrandId
        }
      });
      fixedProducts++;
    }
  }

  console.log(`✅ ${fixedProducts} productos re-enrutados a nuestras categorías maestras.`);

  // 3. Eliminar todas las categorías basura que ya no tienen productos
  const allCategories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } }
  });

  // Conservar siempre las maestras, aunque tengan 0 productos
  const masterSlugs = Object.values(MASTER_CATEGORIES);
  // Conservar también las subcategorías originales (Audífonos In-Ear, Over-Ear, Parlantes)
  const safeSlugs = [...masterSlugs, 'audifonos-in-ear', 'audifonos-over-ear', 'parlantes'];

  let deletedCats = 0;
  for (const cat of allCategories) {
    if (!safeSlugs.includes(cat.slug) && cat._count.products === 0) {
      await prisma.category.delete({ where: { id: cat.id } });
      deletedCats++;
      console.log(`🗑️ Eliminada categoría basura: ${cat.name}`);
    }
  }

  console.log(`✅ Taxonomía purgada. ${deletedCats} categorías basura eliminadas.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
