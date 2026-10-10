import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const products = await prisma.product.findMany();
  for (const product of products) {
    // Generar 1 a 3 reseñas por producto
    const numReviews = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < numReviews; i++) {
      await prisma.review.create({
        data: {
          productId: product.id,
          rating: Math.floor(Math.random() * 2) + 4, // 4 o 5
          comment: ['Excelente producto', 'Muy buena calidad, lo recomiendo', 'Cumple con mis expectativas', 'Llegó rápido y en buen estado', 'Me encantó!'][Math.floor(Math.random() * 5)],
          authorName: ['Juan Pérez', 'María Gómez', 'Carlos López', 'Ana Torres', 'Luis Silva'][Math.floor(Math.random() * 5)]
        }
      });
    }
  }
  console.log("Reviews creadas!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
