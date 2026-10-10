import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const products = await prisma.product.findMany({ include: { category: true } });
  let count = 0;
  
  for (const p of products) {
    // Si ya tiene variantes, saltar
    const existing = await prisma.productVariant.findFirst({ where: { productId: p.id } });
    if (existing) continue;

    if (p.category.slug === 'smartphones' || p.name.toLowerCase().includes('iphone') || p.name.toLowerCase().includes('samsung')) {
      // Crear variantes de capacidad y color
      await prisma.productVariant.create({
        data: {
          productId: p.id,
          name: "128GB - Negro Místico",
          price: p.price,
          stock: Math.floor(Math.random() * 10) + 1,
          attributes: JSON.stringify({ color: "Negro", capacity: "128GB" })
        }
      });
      await prisma.productVariant.create({
        data: {
          productId: p.id,
          name: "256GB - Blanco Hielo",
          price: p.price + 300,
          stock: Math.floor(Math.random() * 5) + 1,
          attributes: JSON.stringify({ color: "Blanco", capacity: "256GB" })
        }
      });
      count += 2;
    } else if (p.category.slug === 'smartwatches' || p.category.slug === 'audifonos') {
      // Variantes de color solamente
      await prisma.productVariant.create({
        data: {
          productId: p.id,
          name: "Color Negro",
          price: p.price,
          stock: Math.floor(Math.random() * 15) + 1,
          attributes: JSON.stringify({ color: "Negro" })
        }
      });
      await prisma.productVariant.create({
        data: {
          productId: p.id,
          name: "Color Plata",
          price: p.price + 50, // un poco más caro
          stock: Math.floor(Math.random() * 10),
          attributes: JSON.stringify({ color: "Plata" })
        }
      });
      count += 2;
    } else {
      // Default variant para mantener consistencia
      await prisma.productVariant.create({
        data: {
          productId: p.id,
          name: "Estándar",
          price: p.price,
          stock: p.stock > 0 ? p.stock : 10,
          attributes: JSON.stringify({})
        }
      });
      count += 1;
    }
  }
  console.log(`Se crearon ${count} variantes de productos.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
