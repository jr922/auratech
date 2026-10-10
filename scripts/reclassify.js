/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log("Iniciando purga y re-clasificación...");

  // 1. Obtener todas las categorías para mapear IDs
  const categories = await prisma.category.findMany();
  const getCatId = (slug) => categories.find(c => c.slug === slug)?.id;

  // 2. Crear categoría "Para Xiaomi" si no existe
  let xiaomiCatId = getCatId('cases-xiaomi');
  const caseParentId = categories.find(c => c.slug === 'case-covers')?.id;
  
  if (!xiaomiCatId && caseParentId) {
    const newCat = await prisma.category.create({
      data: { name: 'Para Xiaomi / Otros', slug: 'cases-xiaomi', parentId: caseParentId }
    });
    xiaomiCatId = newCat.id;
    categories.push(newCat);
    console.log("Creada nueva categoría: Para Xiaomi / Otros");
  }

  // 3. Obtener todos los productos
  const products = await prisma.product.findMany();
  console.log(`Analizando ${products.length} productos...`);

  let updatedCount = 0;

  for (const p of products) {
    const name = p.name.toLowerCase();
    let newSlug = null;

    // Lógica de Clasificación Fuerte (Prioridad: Tipo de producto -> Marca de destino)
    
    // CASOS ESPECIALES / ACCESORIOS DE WEARABLES/AUDIO
    if ((name.includes('case') || name.includes('funda') || name.includes('protector')) && 
        (name.includes('airpods') || name.includes('earbuds') || name.includes('airtag') || name.includes('tv stick') || name.includes('control'))) {
      newSlug = 'soportes-otros';
    }
    // CORREAS
    else if (name.includes('correa') || name.includes('pulsera') || name.includes('banda') || name.includes('strap')) {
      newSlug = 'correas-wearables';
    }
    // MICAS / VIDRIOS
    else if (name.includes('mica') || name.includes('vidrio') || name.includes('templado') || name.includes('glass')) {
      newSlug = 'micas-protectores';
    }
    // CASES DE CELULARES/TABLETS
    else if (name.includes('case') || name.includes('funda') || name.includes('protector') || name.includes('bumper') || name.includes('antishock')) {
      if (name.includes('ipad') || name.includes('mac') || name.includes('macbook')) {
        newSlug = 'cases-ipad-mac';
      } else if (name.includes('iphone') || name.includes('apple')) {
        newSlug = 'cases-iphone';
      } else if (name.includes('samsung') || name.includes('galaxy')) {
        newSlug = 'cases-samsung';
      } else if (name.includes('xiaomi') || name.includes('redmi') || name.includes('poco') || name.includes('realme') || name.includes('huawei')) {
        newSlug = 'cases-xiaomi';
      } else {
        newSlug = 'case-covers'; // Genérico
      }
    }
    // CABLES Y CARGADORES
    else if (name.includes('cable') || name.includes('lightning') || name.includes('usb')) {
      newSlug = 'cables';
    }
    else if (name.includes('cargador') || name.includes('adaptador de corriente') || name.includes('wall charger')) {
      if (name.includes('inalambrico') || name.includes('wireless') || name.includes('magsafe')) {
        newSlug = 'inalambricos-powerbanks';
      } else {
        newSlug = 'cargadores-pared';
      }
    }
    // POWERBANKS
    else if (name.includes('powerbank') || name.includes('bateria externa')) {
      newSlug = 'inalambricos-powerbanks';
    }
    // AUDIO
    else if (name.includes('parlante') || name.includes('altavoz') || name.includes('speaker')) {
      newSlug = 'parlantes';
    }
    else if (name.includes('audifono') || name.includes('auricular') || name.includes('earbuds') || name.includes('airpods')) {
      if (name.includes('diadema') || name.includes('over-ear') || name.includes('headphone')) {
        newSlug = 'audifonos-over-ear';
      } else {
        newSlug = 'audifonos-in-ear';
      }
    }
    // OTROS (Smartwatches, etc)
    else if (name.includes('reloj') || name.includes('smartwatch') || name.includes('apple watch')) {
      newSlug = 'smartwatches';
    }
    else if (name.includes('lapiz') || name.includes('pencil') || name.includes('stylus')) {
      newSlug = 'pencils-stylus';
    }

    // Actualizar si encontramos una categoría mejor
    if (newSlug) {
      const targetCatId = getCatId(newSlug);
      if (targetCatId && p.categoryId !== targetCatId) {
        await prisma.product.update({
          where: { id: p.id },
          data: { categoryId: targetCatId }
        });
        updatedCount++;
        // console.log(`Movido: [${newSlug}] -> ${p.name.substring(0, 40)}`);
      }
    }
  }

}
run().catch(console.error).finally(() => prisma.$disconnect());
