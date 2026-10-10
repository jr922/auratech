/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Reglas estrictas de limpieza: Si un producto está en la Categoría X, pero su nombre tiene una palabra prohibida, se mueve a la Categoría Y.
const CLEANUP_RULES = [
  // --- FALSOS AUDÍFONOS ---
  {
    fromCategorySlugs: ['audifonos-in-ear', 'audifonos-over-ear', 'parlantes', 'audio'],
    negativeKeywords: ['estacion', 'estación', 'cargador', 'carga', 'powerbank'],
    moveToSlug: 'inalambricos-powerbanks'
  },
  {
    fromCategorySlugs: ['audifonos-in-ear', 'audifonos-over-ear', 'parlantes', 'audio'],
    negativeKeywords: ['funda', 'case', 'carcasa', 'silicona', 'protector', 'estuche'],
    moveToSlug: 'cases-iphone' // Generalmente fundas de airpods van aquí o podemos mandarlo a soportes
  },
  {
    fromCategorySlugs: ['audifonos-in-ear', 'audifonos-over-ear', 'parlantes', 'audio'],
    negativeKeywords: ['cable', 'adaptador'],
    moveToSlug: 'cables'
  },

  // --- FALSOS SMARTWATCHES ---
  {
    fromCategorySlugs: ['smartwatches'],
    negativeKeywords: ['correa', 'banda', 'strap', 'pulsera para', 'nylon', 'acero'],
    moveToSlug: 'correas-wearables'
  },
  {
    fromCategorySlugs: ['smartwatches'],
    negativeKeywords: ['mica', 'protector', 'vidrio', 'templado', 'case', 'funda', 'bumper'],
    moveToSlug: 'micas-protectores'
  },
  {
    fromCategorySlugs: ['smartwatches'],
    negativeKeywords: ['cargador', 'base de carga', 'cable'],
    moveToSlug: 'cables'
  },

  // --- FALSOS CELULARES & TABLETS (Repaso Extremo) ---
  {
    fromCategorySlugs: ['smartphones', 'tablets-ereaders', 'smartphones-tablets'],
    negativeKeywords: ['cargador', 'carga', 'estacion', 'estación'],
    moveToSlug: 'cargadores-pared'
  },
  {
    fromCategorySlugs: ['smartphones', 'tablets-ereaders', 'smartphones-tablets'],
    negativeKeywords: ['powerbank', 'bateria', 'batería', 'magsafe'],
    moveToSlug: 'inalambricos-powerbanks'
  },

  // --- FALSAS LAPTOS / MACBOOKS ---
  {
    fromCategorySlugs: ['laptops-macbooks', 'computo'],
    negativeKeywords: ['funda', 'case', 'carcasa', 'mica', 'protector', 'sleeve'],
    moveToSlug: 'cases-ipad-mac'
  },
  {
    fromCategorySlugs: ['laptops-macbooks', 'computo'],
    negativeKeywords: ['cargador', 'cable', 'adaptador de corriente'],
    moveToSlug: 'cargadores-pared'
  },
  {
    fromCategorySlugs: ['laptops-macbooks', 'computo'],
    negativeKeywords: ['soporte', 'stand', 'base', 'elevador'],
    moveToSlug: 'soportes-otros'
  }
];

async function main() {
  console.log("Iniciando Limpieza Profunda de Taxonomía (Scrubber V2)...");

  const cats = await prisma.category.findMany();
  const getCatId = (slug) => cats.find(c => c.slug === slug)?.id;

  let totalFixed = 0;

  for (const rule of CLEANUP_RULES) {
    const fromIds = rule.fromCategorySlugs.map(getCatId).filter(id => id);
    if (fromIds.length === 0) continue;

    const targetId = getCatId(rule.moveToSlug);
    if (!targetId) continue;

    const products = await prisma.product.findMany({
      where: { categoryId: { in: fromIds } }
    });

    for (const prod of products) {
      const text = prod.name.toLowerCase();
      
      const hasNegativeKeyword = rule.negativeKeywords.some(kw => text.includes(kw.toLowerCase()));

      if (hasNegativeKeyword) {
        // Refinamientos especiales antes de mover
        let finalTargetId = targetId;
        
        // Si es una funda y menciona iPad o Mac, asegurarnos que vaya a cases-ipad-mac
        if (rule.moveToSlug === 'cases-iphone' && (text.includes('ipad') || text.includes('mac'))) {
           finalTargetId = getCatId('cases-ipad-mac') || targetId;
        }

        console.log(`[CORRECCIÓN] "${prod.name}"`);
        console.log(`   -> Movido de: ${rule.fromCategorySlugs.find(s => getCatId(s) === prod.categoryId)}`);
        console.log(`   -> Hacia: ${cats.find(c => c.id === finalTargetId)?.slug}`);
        
        await prisma.product.update({
          where: { id: prod.id },
          data: { categoryId: finalTargetId }
        });
        totalFixed++;
      }
    }
  }

  console.log(`\n✅ LIMPIEZA FINALIZADA: ${totalFixed} productos reubicados exitosamente.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
