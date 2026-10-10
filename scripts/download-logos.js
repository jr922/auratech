/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const logosToDownload = {
  'apple': 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg',
  'samsung': 'https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg',
  'amazon': 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
  'sony': 'https://upload.wikimedia.org/wikipedia/commons/c/ca/Sony_logo.svg',
  'jbl': 'https://upload.wikimedia.org/wikipedia/commons/1/18/JBL_logo.svg',
  'xiaomi': 'https://upload.wikimedia.org/wikipedia/commons/2/29/Xiaomi_logo.svg',
  'logitech': 'https://upload.wikimedia.org/wikipedia/commons/1/17/Logitech_logo.svg',
  'spigen': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Spigen_Inc._logo.png/640px-Spigen_Inc._logo.png',
  'google': 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg',
  'tp-link': 'https://upload.wikimedia.org/wikipedia/commons/1/1a/TP-Link_logo_2016.svg',
  'anker': 'https://upload.wikimedia.org/wikipedia/commons/9/90/Anker_logo.svg',
  'kingston': 'https://upload.wikimedia.org/wikipedia/commons/6/62/Kingston_Technology_logo.svg',
  'sandisk': 'https://upload.wikimedia.org/wikipedia/commons/9/9a/SanDisk_logo.svg',
  'roku': 'https://upload.wikimedia.org/wikipedia/commons/a/ad/Roku_logo.svg'
};

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, { headers: { 'User-Agent': 'AuraTechBot/1.0 (luis@auratech.com)' } }, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close(resolve);
        });
      } else {
        file.close();
        fs.unlink(dest, () => {}); // Delete empty file
        resolve(false);
      }
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      resolve(false);
    });
  });
}

async function run() {
  const brandsDir = path.join(process.cwd(), 'public', 'brands');
  console.log("Descargando logos a public/brands...");
  
  for (const [slug, url] of Object.entries(logosToDownload)) {
    const ext = url.split('.').pop().split('?')[0].includes('svg') ? 'svg' : 'png';
    const fileName = `${slug}.${ext}`;
    const destPath = path.join(brandsDir, fileName);
    
    console.log(`Descargando ${slug}...`);
    const success = await downloadFile(url, destPath);
    
    if (success !== false) {
      await prisma.brand.updateMany({
        where: { slug },
        data: { imageUrl: `/brands/${fileName}` }
      });
      console.log(`✅ Guardado y linkeado: /brands/${fileName}`);
    } else {
      console.log(`❌ Falló la descarga de: ${url}`);
    }
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
