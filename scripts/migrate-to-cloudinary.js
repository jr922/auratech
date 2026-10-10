/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const cloudinary = require('cloudinary').v2;

const prisma = new PrismaClient();

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function main() {
  if (!process.env.CLOUDINARY_API_KEY) {
    console.error("❌ ERROR: Faltan las credenciales de Cloudinary en el archivo .env");
    process.exit(1);
  }

  console.log("Iniciando migración masiva de imágenes a Cloudinary...");
  const products = await prisma.product.findMany();
  let updatedProductsCount = 0;
  let totalImagesUploaded = 0;

  for (const product of products) {
    try {
      const images = JSON.parse(product.images);
      
      // Filtramos si ya están en cloudinary para no subirlas dos veces
      const needsUpload = images.some(img => img.includes('casemotions.pe') || !img.includes('cloudinary.com'));
      
      if (!needsUpload) continue;

      const newImages = [];
      
      for (const imgUrl of images) {
        if (imgUrl.includes('cloudinary.com') || imgUrl.startsWith('/')) {
          newImages.push(imgUrl);
          continue;
        }

        console.log(`Subiendo a Cloudinary: ${imgUrl}`);
        // Cloudinary permite subir directamente desde una URL pública
        const uploadResponse = await cloudinary.uploader.upload(imgUrl, {
          folder: 'aura_tech_catalog',
          timeout: 60000 // 60 segundos por imagen pesada
        });
        
        newImages.push(uploadResponse.secure_url);
        totalImagesUploaded++;
      }

      // Actualizar la base de datos con las nuevas URLs de Cloudinary
      await prisma.product.update({
        where: { id: product.id },
        data: { images: JSON.stringify(newImages) }
      });
      
      updatedProductsCount++;
      console.log(`✅ Producto actualizado: ${product.name}`);

    } catch (error) {
      console.error(`⚠️ Error al procesar producto ${product.name}:`, error.message);
    }
  }

  console.log("-----------------------------------------");
  console.log(`🚀 ¡MIGRACIÓN COMPLETADA!`);
  console.log(`📦 Productos actualizados: ${updatedProductsCount}`);
  console.log(`🖼️ Imágenes resguardadas en tu nube: ${totalImagesUploaded}`);
  console.log("-----------------------------------------");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
