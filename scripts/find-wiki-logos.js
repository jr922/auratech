/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */

const https = require('https');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const brandsToFind = [
  'uag', 'pitaka', 'anker', 'ugreen', 'soundpeats', 'tp-link', 'qcy', 'ezviz', 
  'onn', 'kingston', 'yeelight', 'mecool', 'sandisk', 'roku', 'tronsmart', 
  'haylou', 'ringke', 'tapo', 'satechi', 'spigen', 'google', 'baseus', 'usams'
];

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 AuraTechBot/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve(null); }
      });
    }).on('error', reject);
  });
}

async function findWikimediaLogo(brandName) {
  // Search for the file in commons
  const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(brandName + ' logo type:bitmap|drawing')}&utf8=&format=json`;
  const searchRes = await fetchJson(searchUrl);
  
  if (searchRes && searchRes.query && searchRes.query.search && searchRes.query.search.length > 0) {
    // Find the first SVG file
    const svgFile = searchRes.query.search.find(r => r.title.toLowerCase().includes('.svg') || r.title.toLowerCase().includes('logo'));
    if (svgFile) {
      const fileName = encodeURIComponent(svgFile.title.replace('File:', ''));
      // Get imageinfo for the file
      const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${fileName}&prop=imageinfo&iiprop=url&format=json`;
      const infoRes = await fetchJson(infoUrl);
      if (infoRes && infoRes.query && infoRes.query.pages) {
        const pages = infoRes.query.pages;
        const pageId = Object.keys(pages)[0];
        if (pages[pageId].imageinfo && pages[pageId].imageinfo.length > 0) {
          return pages[pageId].imageinfo[0].url;
        }
      }
    }
  }
  return null;
}

async function run() {
  console.log("Buscando logos en Wikimedia Commons...");
  let found = 0;
  for (const slug of brandsToFind) {
    console.log(`Buscando: ${slug}...`);
    let url = await findWikimediaLogo(slug);
    
    // Si no encuentra SVG, intentar solo con el nombre
    if (!url) {
       url = await findWikimediaLogo(slug.replace('-', ' '));
    }

    if (url) {
      console.log(`✅ Encontrado para ${slug}: ${url}`);
      await prisma.brand.update({
        where: { slug },
        data: { imageUrl: url }
      });
      found++;
    } else {
      console.log(`❌ No encontrado para ${slug}`);
    }
    // Rate limit prevention
    await new Promise(r => setTimeout(r, 500));
  }
  console.log(`\n¡Búsqueda terminada! Se inyectaron ${found} logos nuevos.`);
}

run().catch(console.error).finally(() => prisma.$disconnect());
