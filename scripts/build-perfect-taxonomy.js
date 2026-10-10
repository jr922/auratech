/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TAXONOMY = [
  {
    name: 'Audio', slug: 'audio',
    children: [
      { name: 'Audífonos In-Ear', slug: 'audifonos-in-ear', keywords: ['in-ear', 'earbud', 'airpod', 'tws', 'soundcore liberty', 'buds'] },
      { name: 'Audífonos Over-Ear', slug: 'audifonos-over-ear', keywords: ['over-ear', 'diadema', 'headphone', 'headset', 'anc'] },
      { name: 'Parlantes', slug: 'parlantes', keywords: ['parlante', 'speaker', 'altavoz', 'bocina', 'soundlink', 'soundbox'] },
    ]
  },
  {
    name: 'Cargadores y Cables', slug: 'cargadores-y-cables',
    children: [
      { name: 'Cargadores de Pared', slug: 'cargadores-pared', keywords: ['cargador', 'gan', 'wall', 'pd', 'adaptador de corriente'] },
      { name: 'Cables', slug: 'cables', keywords: ['cable', 'lightning', 'usb-c', 'hdmi', 'braided'] },
      { name: 'Inalámbricos & Powerbanks', slug: 'inalambricos-powerbanks', keywords: ['magsafe', 'powerbank', 'batería', 'bateria', 'wireless', 'inalámbrico', 'inalambrico', 'base de carga'] },
    ]
  },
  {
    name: 'Case & Covers', slug: 'case-covers',
    children: [
      { name: 'Para iPhone', slug: 'cases-iphone', keywords: ['iphone'] },
      { name: 'Para Samsung', slug: 'cases-samsung', keywords: ['samsung', 'galaxy', 's24', 's23', 'z fold'] },
      { name: 'Para iPad & Mac', slug: 'cases-ipad-mac', keywords: ['ipad', 'macbook', 'mac', 'folio'] },
    ]
  },
  {
    name: 'Smart Home', slug: 'smart-home-tv',
    children: [
      { name: 'Cámaras & Seguridad', slug: 'camaras-seguridad', keywords: ['cámara', 'camara', 'security', 'vigilancia', 'timbre'] },
      { name: 'Iluminación Smart', slug: 'iluminacion-smart', keywords: ['foco', 'led', 'yeelight', 'bulb', 'luz', 'lámpara'] },
      { name: 'Conectividad', slug: 'conectividad', keywords: ['router', 'mesh', 'repetidor', 'extensor', 'wifi', 'wi-fi'] },
    ]
  },
  {
    name: 'Cómputo', slug: 'computo',
    children: [
      { name: 'Teclados & Ratones', slug: 'teclados-mouse', keywords: ['teclado', 'mouse', 'ratón', 'keyboard'] },
      { name: 'Hubs & Adaptadores', slug: 'hubs-adaptadores', keywords: ['hub', 'adaptador', 'dock', 'rj45', 'multiport'] },
    ]
  },
  {
    name: 'Accesorios & Wearables', slug: 'accesorios-wearables',
    children: [
      { name: 'Smartwatches', slug: 'smartwatches', keywords: ['watch', 'smartwatch', 'band', 'pulsera'] },
      { name: 'Correas', slug: 'correas-wearables', keywords: ['correa', 'strap', 'banda'] },
      { name: 'Micas & Protectores', slug: 'micas-protectores', keywords: ['mica', 'vidrio', 'cristal', 'screen protector', 'templado'] },
      { name: 'Soportes & Otros', slug: 'soportes-otros', keywords: ['soporte', 'stand', 'mount', 'tripod', 'bolso', 'mochila'] }
    ]
  }
];

async function main() {
  console.log("Construyendo Taxonomía Perfecta...");

  // 1. Crear la estructura en BD
  const subcatMap = []; // Para tener todos los subcats a la mano al evaluar productos

  for (const parent of TAXONOMY) {
    const p = await prisma.category.upsert({
      where: { slug: parent.slug },
      update: { name: parent.name, parentId: null },
      create: { name: parent.name, slug: parent.slug, parentId: null }
    });

    for (const child of parent.children) {
      const c = await prisma.category.upsert({
        where: { slug: child.slug },
        update: { name: child.name, parentId: p.id },
        create: { name: child.name, slug: child.slug, parentId: p.id }
      });
      subcatMap.push({ ...child, id: c.id, parentId: p.id });
    }
  }

  // 2. Evaluar productos y asignar subcategoría
  const products = await prisma.product.findMany();
  let updated = 0;

  for (const prod of products) {
    const text = (prod.name + " " + (prod.description || "")).toLowerCase();
    
    let matchedSubcat = null;
    let fallbackSubcat = null; // Si no hay match de palabras clave, asignar a 'Soportes & Otros' o algo genérico

    // Buscar match en todas las subcategorías
    for (const sub of subcatMap) {
      if (sub.keywords.some(kw => text.includes(kw.toLowerCase()))) {
        matchedSubcat = sub;
        break; // Match encontrado
      }
      if (sub.slug === 'soportes-otros') fallbackSubcat = sub;
    }

    const targetSubcat = matchedSubcat || fallbackSubcat;

    if (targetSubcat && prod.categoryId !== targetSubcat.id) {
      await prisma.product.update({
        where: { id: prod.id },
        data: { categoryId: targetSubcat.id }
      });
      updated++;
    }
  }

  console.log(`✅ ${updated} productos asignados a subcategorías específicas.`);

  // 3. Eliminar categorías antiguas huérfanas
  const allCats = await prisma.category.findMany({ include: { _count: { select: { products: true, children: true } } } });
  const validSlugs = [];
  TAXONOMY.forEach(p => {
    validSlugs.push(p.slug);
    p.children.forEach(c => validSlugs.push(c.slug));
  });

  for (const cat of allCats) {
    if (!validSlugs.includes(cat.slug) && cat._count.products === 0 && cat._count.children === 0) {
      await prisma.category.delete({ where: { id: cat.id } });
      console.log(`🗑️ Categoría vieja borrada: ${cat.name}`);
    }
  }

  console.log("🚀 Taxonomía perfecta construida exitosamente.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
