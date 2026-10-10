/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function reorganizeTaxonomy() {
  console.log("=== INICIANDO REORGANIZACIÓN DE TAXONOMÍA (MÁXIMA POTENCIA) ===");

  try {
    // 1. Crear las Marcas Reales (Brands)
    console.log("Creando marcas oficiales...");
    const brandsData = [
      { name: "Apple", slug: "apple", imageUrl: "/apple-logo.png" },
      { name: "Samsung", slug: "samsung", imageUrl: "/samsung-logo.png" },
      { name: "Amazon", slug: "amazon", imageUrl: "/amazon-logo.png" },
      { name: "Sony", slug: "sony", imageUrl: "/sony-logo.png" },
      { name: "JBL", slug: "jbl", imageUrl: "/jbl-logo.png" },
      { name: "Xiaomi", slug: "xiaomi", imageUrl: "/xiaomi-logo.png" },
      { name: "Google", slug: "google", imageUrl: "/google-logo.png" },
      { name: "Genérico", slug: "generico" }
    ];

    const brandMap = {};
    for (const b of brandsData) {
      const brand = await prisma.brand.upsert({
        where: { slug: b.slug },
        update: {},
        create: b
      });
      brandMap[b.slug] = brand.id;
    }
    console.log("Marcas creadas correctamente.");

    // 2. Crear las Categorías Principales Fijas (Pasillos Reales)
    console.log("Estructurando pasillos de categorías principales...");
    const rootCategories = [
      { name: "Smartphones & Tablets", slug: "smartphones-tablets" },
      { name: "Audio", slug: "audio" },
      { name: "Smart Home & TV", slug: "smart-home-tv" },
      { name: "Wearables", slug: "wearables" },
      { name: "Accesorios", slug: "accesorios" }
    ];

    const catMap = {};
    for (const cat of rootCategories) {
      const dbCat = await prisma.category.upsert({
        where: { slug: cat.slug },
        update: { parentId: null },
        create: { name: cat.name, slug: cat.slug, isActive: true }
      });
      catMap[cat.slug] = dbCat.id;
    }

    // Subcategorías de Accesorios (Cables, Cases, etc.)
    const subCategories = [
      { name: "Cargadores y Cables", slug: "cargadores-y-cables", parentSlug: "accesorios" },
      { name: "Fundas y Cases", slug: "case-covers", parentSlug: "accesorios" },
      { name: "Audífonos In-Ear", slug: "audifonos-in-ear", parentSlug: "audio" },
      { name: "Audífonos Over-Ear", slug: "audifonos-over-ear", parentSlug: "audio" },
      { name: "Parlantes", slug: "parlantes", parentSlug: "audio" },
    ];

    for (const sub of subCategories) {
      const parentId = catMap[sub.parentSlug];
      const dbSub = await prisma.category.upsert({
        where: { slug: sub.slug },
        update: { parentId },
        create: { name: sub.name, slug: sub.slug, parentId, isActive: true }
      });
      catMap[sub.slug] = dbSub.id;
    }
    console.log("Árbol de categorías maestras estructurado.");

    // 3. Mapear productos existentes a la nueva estructura
    console.log("Clasificando productos existentes al nuevo árbol...");
    const products = await prisma.product.findMany({ include: { category: true } });

    let updatedCount = 0;
    for (const product of products) {
      let newCatId = product.categoryId;
      let newBrandId = brandMap["generico"];

      const name = product.name.toLowerCase();
      const catName = product.category?.name.toLowerCase() || "";

      // Asignar MARCA basada en el nombre o categoría antigua
      if (name.includes("apple") || name.includes("iphone") || name.includes("airpods") || name.includes("mac") || catName.includes("apple")) {
        newBrandId = brandMap["apple"];
      } else if (name.includes("samsung") || name.includes("galaxy")) {
        newBrandId = brandMap["samsung"];
      } else if (name.includes("amazon") || name.includes("echo") || name.includes("alexa") || catName.includes("amazon")) {
        newBrandId = brandMap["amazon"];
      } else if (name.includes("sony") || name.includes("playstation")) {
        newBrandId = brandMap["sony"];
      } else if (name.includes("jbl")) {
        newBrandId = brandMap["jbl"];
      } else if (name.includes("xiaomi") || name.includes("redmi") || name.includes("poco")) {
        newBrandId = brandMap["xiaomi"];
      } else if (name.includes("google") || name.includes("pixel") || name.includes("nest")) {
        newBrandId = brandMap["google"];
      }

      // Asignar PASILLO (Categoría real) basado en el producto
      if (name.includes("iphone") || name.includes("galaxy s") || name.includes("smartphone") || name.includes("celular")) {
        newCatId = catMap["smartphones-tablets"];
      } else if (name.includes("ipad") || name.includes("tablet")) {
        newCatId = catMap["smartphones-tablets"];
      } else if (name.includes("airpods") || name.includes("audífono") || name.includes("auricular") || name.includes("headphone") || name.includes("buds") || catName.includes("audífonos")) {
        newCatId = name.includes("max") || name.includes("over-ear") ? catMap["audifonos-over-ear"] : catMap["audifonos-in-ear"];
      } else if (name.includes("echo") || name.includes("alexa") || name.includes("tv") || name.includes("nest")) {
        newCatId = catMap["smart-home-tv"];
      } else if (name.includes("watch") || name.includes("band") || name.includes("smartwatch")) {
        newCatId = catMap["wearables"];
      } else if (name.includes("cargador") || name.includes("cable") || name.includes("usb") || name.includes("power") || catName.includes("cargador")) {
        newCatId = catMap["cargadores-y-cables"];
      } else if (name.includes("case") || name.includes("funda") || name.includes("cover") || catName.includes("case")) {
        newCatId = catMap["case-covers"];
      }

      // Actualizar producto en la DB
      await prisma.product.update({
        where: { id: product.id },
        data: {
          categoryId: newCatId,
          brandId: newBrandId
        }
      });
      updatedCount++;
    }
    console.log(`✅ ${updatedCount} productos reclasificados con éxito.`);

    // 4. Limpieza de categorías "falsas" (Las que eran marcas)
    console.log("Limpiando categorías obsoletas (falsos árboles)...");
    const fakeCategoriesSlugs = ["apple", "amazon", "tecnologia"]; 
    for (const slug of fakeCategoriesSlugs) {
      try {
        const cat = await prisma.category.findUnique({ where: { slug }});
        if (cat) {
          // Verify no products exist before deleting
          const count = await prisma.product.count({ where: { categoryId: cat.id }});
          if (count === 0) {
             await prisma.category.delete({ where: { id: cat.id }});
             console.log(`Categoría falsa eliminada: ${slug}`);
          }
        }
      } catch(e) {}
    }

    console.log("=== REORGANIZACIÓN COMPLETADA ===");
  } catch (error) {
    console.error("Error durante la reorganización:", error);
  } finally {
    await prisma.$disconnect();
  }
}

reorganizeTaxonomy();
