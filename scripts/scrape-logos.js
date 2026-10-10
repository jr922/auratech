/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */

const https = require('https');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function scrapeBrands() {
  console.log("Fetching Casemotions Home to find brand slider...");
  try {
    const html = await fetchUrl('https://casemotions.pe/');
    
    // Buscar URLs de imágenes que tengan 'logo' o estén en el carrusel de marcas
    const regex = /<img[^>]+src=["'](https:\/\/casemotions\.pe\/wp-content\/uploads\/[^"']+logo[^"']+)["'][^>]*alt=["']([^"']+)["']/gi;
    let match;
    const foundLogos = {};
    
    while ((match = regex.exec(html)) !== null) {
      let src = match[1];
      let alt = match[2];
      // Limpiar alt ("Logo Apple" -> "Apple")
      let cleanName = alt.replace(/logo/ig, '').trim().toLowerCase();
      if (cleanName) {
        foundLogos[cleanName] = src;
      }
    }
    
    console.log("Logos encontrados con regex:", foundLogos);

    // Mapeo manual seguro de Casemotions
    const casemotionsLogos = {
      'apple': 'https://casemotions.pe/wp-content/uploads/2022/10/Apple-logo.png',
      'samsung': 'https://casemotions.pe/wp-content/uploads/2022/10/Samsung-logo.png',
      'baseus': 'https://casemotions.pe/wp-content/uploads/2022/10/Baseus-logo.png',
      'jbl': 'https://casemotions.pe/wp-content/uploads/2022/10/JBL-logo.png',
      'sony': 'https://casemotions.pe/wp-content/uploads/2022/10/Sony-logo.png',
      'xiaomi': 'https://casemotions.pe/wp-content/uploads/2022/10/Xiaomi-logo.png',
      'usams': 'https://casemotions.pe/wp-content/uploads/2022/10/Usams-logo.png',
      'satechi': 'https://casemotions.pe/wp-content/uploads/2022/10/Satechi-logo.png',
      'spigen': 'https://casemotions.pe/wp-content/uploads/2022/10/Spigen-logo.png',
      'logitech': 'https://casemotions.pe/wp-content/uploads/2022/10/Logitech-logo.png',
      'amazon': 'https://casemotions.pe/wp-content/uploads/2022/10/Amazon-logo.png'
    };

    // Combinar encontrados con manuales
    const finalLogos = { ...casemotionsLogos };
    
    for (const [key, src] of Object.entries(foundLogos)) {
       // Buscar si key está incluido en alguna marca de la BD
       const dbBrand = await prisma.brand.findFirst({ where: { slug: { contains: key } } });
       if (dbBrand) {
         finalLogos[dbBrand.slug] = src;
       }
    }

    let updated = 0;
    for (const [slug, url] of Object.entries(finalLogos)) {
      const b = await prisma.brand.findFirst({ where: { slug } });
      if (b) {
        await prisma.brand.update({
          where: { slug },
          data: { imageUrl: url }
        });
        updated++;
        console.log(`✅ Logo actualizado para: ${slug}`);
      }
    }
    
    console.log(`\n¡Éxito! ${updated} logos inyectados directamente desde Casemotions.`);
    
  } catch (error) {
    console.error("Error fetching", error);
  }
}

scrapeBrands().finally(() => prisma.$disconnect());
