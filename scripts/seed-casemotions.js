/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const newBrands = [
  { name: 'Spigen', slug: 'spigen' },
  { name: 'UAG', slug: 'uag' },
  { name: 'Pitaka', slug: 'pitaka' },
  { name: 'Baseus', slug: 'baseus' },
  { name: 'Satechi', slug: 'satechi' }
];

const newProducts = [
  // SPIGEN CASES
  {
    name: 'Case Spigen Tough Armor para iPhone 15 Pro Max',
    brandSlug: 'spigen', categorySlug: 'case-covers', price: 189.9, originalPrice: 219.9, stock: 15,
    description: 'Protección extrema doble capa con tecnología Air Cushion y kickstand integrado.',
    images: '["/productos/spigen-hybrid-1.webp"]' // reusing placeholders
  },
  {
    name: 'Case Spigen Liquid Air para iPhone 15',
    brandSlug: 'spigen', categorySlug: 'case-covers', price: 119.9, stock: 20,
    description: 'Diseño geométrico mate antideslizante, súper delgado y ligero.',
    images: '["/productos/spigen-hybrid-1.webp"]'
  },
  {
    name: 'Case Spigen Optik Armor para Galaxy S24 Ultra',
    brandSlug: 'spigen', categorySlug: 'case-covers', price: 199.9, originalPrice: 249.9, stock: 8,
    description: 'Protección con tapa deslizable para la cámara, TPU flexible.',
    images: '["/productos/spigen-hybrid-1.webp"]'
  },
  // UAG CASES
  {
    name: 'Case UAG Monarch Kevlar para iPhone 15 Pro Max',
    brandSlug: 'uag', categorySlug: 'case-covers', price: 349.9, stock: 5,
    description: 'Construcción premium de 5 capas con auténtico material Kevlar y fibra de carbono.',
    images: '["/productos/spigen-hybrid-1.webp"]'
  },
  {
    name: 'Case UAG Pathfinder para Galaxy S24 Ultra',
    brandSlug: 'uag', categorySlug: 'case-covers', price: 229.9, originalPrice: 259.9, stock: 12,
    description: 'Carcasa blindada súper resistente con núcleo suave resistente a impactos.',
    images: '["/productos/spigen-hybrid-1.webp"]'
  },
  // PITAKA
  {
    name: 'Case Pitaka MagEZ 4 para iPhone 15 Pro',
    brandSlug: 'pitaka', categorySlug: 'case-covers', price: 399.9, stock: 10,
    description: 'Fibra de aramida 600D ultrafina, compatible con MagSafe con tecnología 3D Grip.',
    images: '["/productos/spigen-hybrid-1.webp"]'
  },
  {
    name: 'Correa Pitaka de Fibra de Carbono para Apple Watch Ultra',
    brandSlug: 'pitaka', categorySlug: 'wearables', price: 459.9, originalPrice: 499.9, stock: 4,
    description: 'Brazalete eslabonado de fibra de carbono 100% auténtica, increíblemente ligero y resistente.',
    images: '["/productos/watch-s9-1.webp"]'
  },
  // SATECHI (HUBS Y CARGADORES)
  {
    name: 'Hub Satechi Tipo-C Multiport V2 M1/M2',
    brandSlug: 'satechi', categorySlug: 'accesorios', price: 429.9, stock: 15,
    description: 'Adaptador USB-C con 4K HDMI, Ethernet, USB-C PD, Lector SD/Micro, y 3 USB 3.0.',
    images: '["/productos/logitech-gpro-1.webp"]'
  },
  {
    name: 'Base de Carga Satechi 3 en 1 Magnética Inalámbrica',
    brandSlug: 'satechi', categorySlug: 'cargadores-y-cables', price: 649.9, originalPrice: 729.9, stock: 6,
    description: 'Carga simultáneamente tu iPhone con MagSafe, Apple Watch y AirPods.',
    images: '["/productos/cargador-apple-40w-1.webp"]'
  },
  // BASEUS
  {
    name: 'Powerbank Baseus Blade 100W 20000mAh',
    brandSlug: 'baseus', categorySlug: 'accesorios', price: 349.9, stock: 25,
    description: 'Batería externa súper delgada para Laptops, con pantalla LED digital y 100W PD.',
    images: '["/productos/cargador-apple-40w-1.webp"]'
  },
  {
    name: 'Cargador Baseus GaN5 Pro 65W 3 Puertos',
    brandSlug: 'baseus', categorySlug: 'cargadores-y-cables', price: 189.9, originalPrice: 229.9, stock: 40,
    description: 'Cargador ultracompacto tecnología GaN, carga rápida simultánea para Mac, iPad y iPhone.',
    images: '["/productos/cargador-apple-40w-1.webp"]'
  },
  {
    name: 'Soporte Magnético Baseus para Auto',
    brandSlug: 'baseus', categorySlug: 'accesorios', price: 69.9, stock: 50,
    description: 'Soporte minimalista para rejilla de ventilación, imanes de neodimio superfuertes.',
    images: '["/productos/logitech-gpro-1.webp"]'
  },
  // MICAS
  {
    name: 'Mica Spigen Glas.tR EZ Fit para iPhone 15 Pro Max',
    brandSlug: 'spigen', categorySlug: 'case-covers', price: 99.9, originalPrice: 119.9, stock: 80,
    description: 'Pack de 2 protectores de cristal templado 9H con bandeja de instalación automática alineada.',
    images: '["/productos/spigen-hybrid-1.webp"]'
  }
];

async function main() {
  console.log("Creando nuevas marcas si no existen...");
  for (const b of newBrands) {
    await prisma.brand.upsert({
      where: { slug: b.slug },
      update: {},
      create: { name: b.name, slug: b.slug, imageUrl: null }
    });
  }

  const allBrands = await prisma.brand.findMany();
  const allCategories = await prisma.category.findMany();

  console.log("Insertando productos Casemotions...");
  let count = 0;
  for (const p of newProducts) {
    const brand = allBrands.find(b => b.slug === p.brandSlug);
    const category = allCategories.find(c => c.slug === p.categorySlug);

    if (!brand || !category) {
      console.warn(`Saltando ${p.name}, falta marca (${p.brandSlug}) o categoria (${p.categorySlug})`);
      continue;
    }

    const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    await prisma.product.upsert({
      where: { slug },
      update: {},
      create: {
        name: p.name,
        slug,
        description: p.description,
        price: p.price,
        originalPrice: p.originalPrice || null,
        stock: p.stock,
        images: p.images,
        brandId: brand.id,
        categoryId: category.id,
        status: 'PUBLISHED'
      }
    });
    count++;
  }

  console.log(`¡Completado! Se insertaron ${count} productos nuevos estilo Casemotions.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
