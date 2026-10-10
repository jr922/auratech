/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */

const fs = require('fs');
const https = require('https');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const API_URL = 'https://casemotions.pe/wp-json/wc/store/products?per_page=100';
const JSON_FILE = 'casemotions-data.json';

function fetchPage(page) {
  return new Promise((resolve, reject) => {
    const url = `${API_URL}&page=${page}`;
    console.log(`Descargando página ${page}...`);
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve([]); // Falla silenciosa si no es JSON (ej. fin de páginas)
        }
      });
    }).on('error', reject);
  });
}

async function fetchAllProducts() {
  let allProducts = [];
  let page = 1;
  let keepGoing = true;

  while (keepGoing) {
    const products = await fetchPage(page);
    if (!Array.isArray(products) || products.length === 0) {
      keepGoing = false;
    } else {
      allProducts = allProducts.concat(products);
      if (products.length < 100) {
        keepGoing = false; // Última página
      } else {
        page++;
      }
    }
  }
  return allProducts;
}

function slugify(text) {
  if (!text) return '';
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

async function main() {
  console.log(`Iniciando escaneo total (100%) del catálogo de Casemotions...`);
  const productsData = await fetchAllProducts();
  
  // Guardar JSON completo como lo pidió el cliente
  fs.writeFileSync(JSON_FILE, JSON.stringify(productsData, null, 2));
  console.log(`¡JSON guardado exitosamente en ${JSON_FILE}! Contiene ${productsData.length} productos absolutos.`);

  console.log("Iniciando migración a la base de datos de Aura Tech...");

  let successCount = 0;

  for (const item of productsData) {
    if (!item.name) continue;

    // Obtener marca (Casemotions usa taxonomy "brands" o "categories")
    let brandName = "Genérico";
    if (item.brands && item.brands.length > 0) {
      brandName = item.brands[0].name;
    } else if (item.categories && item.categories.length > 0) {
      // Algunas veces la marca está como categoria padre
      brandName = item.categories[0].name;
    }
    const brandSlug = slugify(brandName);

    // Obtener categoría
    let categoryName = "Accesorios";
    if (item.categories && item.categories.length > 0) {
      // Tomar la última categoría que suele ser la más específica
      categoryName = item.categories[item.categories.length - 1].name;
    }
    const categorySlug = slugify(categoryName);

    // Crear o asegurar Marca
    const brand = await prisma.brand.upsert({
      where: { slug: brandSlug },
      update: {},
      create: { name: brandName, slug: brandSlug }
    });

    // Crear o asegurar Categoria
    const category = await prisma.category.upsert({
      where: { slug: categorySlug },
      update: {},
      create: { name: categoryName, slug: categorySlug }
    });

    // Obtener precio (el API lo da en centavos/minor units, ej: 21990 = 219.90)
    let price = 0;
    let originalPrice = null;
    
    if (item.prices) {
      price = parseFloat(item.prices.price) / 100;
      if (item.prices.regular_price && item.prices.regular_price !== item.prices.price) {
        originalPrice = parseFloat(item.prices.regular_price) / 100;
      }
    }

    // Extraer imagenes
    const imageUrls = item.images ? item.images.map(img => img.src) : [];
    
    // Limpiar HTML de la descripción
    let cleanDesc = item.short_description || item.description || "";
    cleanDesc = cleanDesc.replace(/<[^>]*>?/gm, ''); // Quitar etiquetas HTML

    const productSlug = slugify(item.name).substring(0, 80); // Limitar a 80 chars

    await prisma.product.upsert({
      where: { slug: productSlug },
      update: {
        price,
        originalPrice,
        images: JSON.stringify(imageUrls),
        stock: item.is_in_stock ? 15 : 0
      },
      create: {
        name: item.name,
        slug: productSlug,
        description: cleanDesc.substring(0, 500), // Limitar a 500 chars para no romper DB
        price,
        originalPrice,
        stock: item.is_in_stock ? 15 : 0,
        images: JSON.stringify(imageUrls),
        brandId: brand.id,
        categoryId: category.id,
        status: 'PUBLISHED'
      }
    });

    successCount++;
  }

  console.log(`✅ ¡Éxito! Se sincronizaron ${successCount} productos reales de Casemotions con todas sus fotos y descripciones.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
