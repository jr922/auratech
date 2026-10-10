import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Vaciando base de datos...');
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.claim.deleteMany();
  await prisma.contactMessage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // ─────────────────────────────────────────────
  // USUARIOS
  // ─────────────────────────────────────────────
  console.log('👤 Creando usuarios...');
  await prisma.user.createMany({
    data: [
      { email: 'admin@auratech.com', name: 'Admin', password: await bcrypt.hash('admin123', 10), role: 'ADMIN' },
      { email: 'cliente@test.com', name: 'Cliente de Prueba', password: await bcrypt.hash('cliente123', 10), role: 'USER' },
    ]
  });

  // ─────────────────────────────────────────────
  // CATEGORÍAS
  // ─────────────────────────────────────────────
  console.log('📂 Creando categorías...');
  const apple = await prisma.category.create({ data: { name: 'Apple', slug: 'apple', imageUrl: '/iphone.svg' } });
  const amazon = await prisma.category.create({ data: { name: 'Amazon', slug: 'amazon', imageUrl: null}});
  const audio = await prisma.category.create({ data: { name: 'Audífonos', slug: 'audifonos', imageUrl: null } });
  const cables = await prisma.category.create({ data: { name: 'Cargadores y Cables', slug: 'cargadores-y-cables', imageUrl: null } });
  const cases = await prisma.category.create({ data: { name: 'Case & Covers', slug: 'case-covers', imageUrl: null } });
  const smartHome = await prisma.category.create({ data: { name: 'Smart Home', slug: 'smart-home', imageUrl: null } });
  const wearables = await prisma.category.create({ data: { name: 'Wearables', slug: 'wearables', imageUrl: null } });

  // ─────────────────────────────────────────────
  // PRODUCTOS (20 productos)
  // ─────────────────────────────────────────────
  console.log('📦 Creando productos...');

  //===Amazon===
 await prisma.product.create({
    data: {
      name: 'Adaptador Apple Carga Rápida 40W Dual USB-C',
      slug: 'adaptador-amazon',
      description: 'Carga dos dispositivos al mismo tiempo de forma rápida y segura con el adaptador de corriente dual con puerto USB-C de 40 W de Apple. Su diseño compacto lo hace ideal para llevarlo a cualquier parte.',
      price: 209.90, originalPrice: 299.90, stock: 15,
      images: JSON.stringify(["/productos/cargador-apple-40w-1.webp", "/productos/cargador-apple-40w-2.webp"]),
      categoryId: amazon.id
    }
  });
  


  // === CARGADORES Y CABLES (4) ===
  await prisma.product.create({
    data: {
      name: 'Adaptador Apple Carga Rápida 40W Dual USB-C',
      slug: 'adaptador-apple-carga-rapida-40w',
      description: 'Carga dos dispositivos al mismo tiempo de forma rápida y segura con el adaptador de corriente dual con puerto USB-C de 40 W de Apple. Su diseño compacto lo hace ideal para llevarlo a cualquier parte.',
      price: 209.90, originalPrice: 299.90, stock: 15,
      images: JSON.stringify(["/productos/cargador-apple-40w-1.webp", "/productos/cargador-apple-40w-2.webp"]),
      categoryId: cables.id
    }
  });

  await prisma.product.create({
    data: {
      name: 'Cable Ugreen USB-C a USB-C 100W 2 Metros',
      slug: 'cable-ugreen-usb-c-100w-2m',
      description: 'Cable trenzado ultrarresistente ideal para laptops, tablets y celulares con puerto tipo C. Soporta carga rápida de hasta 100W y transferencia de datos a 480 Mbps.',
      price: 49.90, originalPrice: 69.90, stock: 50,
      images: JSON.stringify(["/productos/cable-ugreen-100w-1.webp", "/productos/cable-ugreen-100w-2.webp"]),
      categoryId: cables.id
    }
  });

  await prisma.product.create({
    data: {
      name: 'Cargador Inalámbrico Belkin BoostCharge Pro 3 en 1',
      slug: 'cargador-belkin-3en1',
      description: 'Carga tu iPhone, Apple Watch y AirPods al mismo tiempo con la estación de carga magnética Belkin BoostCharge Pro. Diseño premium con acabado en aluminio.',
      price: 649.90, originalPrice: 749.90, stock: 8,
      images: JSON.stringify(["/productos/belkin-3en1-1.webp", "/productos/belkin-3en1-2.webp"]),
      categoryId: cables.id
    }
  });

  await prisma.product.create({
    data: {
      name: 'Cable Lightning a USB-C Certificado MFi 1.5m',
      slug: 'cable-lightning-usbc-mfi',
      description: 'Cable certificado MFi de alta calidad para dispositivos Apple. Trenzado de nylon con conectores reforzados para máxima durabilidad.',
      price: 59.90, originalPrice: 79.90, stock: 35,
      images: JSON.stringify(["/productos/cable-mfi-1.webp", "/productos/cable-mfi-2.webp"]),
      categoryId: cables.id
    }
  });

  // === AUDÍFONOS (4) ===
  await prisma.product.create({
    data: {
      name: 'AirPods Pro (2.ª generación) con MagSafe',
      slug: 'airpods-pro-2',
      description: 'Cancelación Activa de Ruido de nivel superior. Audio Espacial personalizado. Resistencia al agua y al sudor IPX4. Hasta 6 horas de reproducción.',
      price: 999.00, originalPrice: 1199.00, stock: 5,
      images: JSON.stringify(["/productos/airpods-pro2-1.webp", "/productos/airpods-pro2-2.webp"]),
      categoryId: audio.id
    }
  });

  await prisma.product.create({
    data: {
      name: 'Audífonos Sony WH-1000XM5 Noise Cancelling',
      slug: 'sony-wh1000xm5',
      description: 'Los audífonos premium de Sony con la mejor cancelación de ruido del mercado. Audio de alta resolución LDAC, 30 horas de batería y diseño ultraligero plegable.',
      price: 1499.90, stock: 10,
      images: JSON.stringify(["/productos/sony-xm5-1.webp", "/productos/sony-xm5-2.webp"]),
      categoryId: audio.id
    }
  });

  await prisma.product.create({
    data: {
      name: 'AirPods Max Silver',
      slug: 'airpods-max-silver',
      description: 'Experiencia auditiva de alta fidelidad con cancelación activa de ruido, Audio Espacial y malla transpirable en la vincha. El audio premium de Apple.',
      price: 2499.00, originalPrice: 2799.00, stock: 3,
      images: JSON.stringify(["/productos/airpods-max-1.webp", "/productos/airpods-max-2.webp"]),
      categoryId: audio.id
    }
  });

  await prisma.product.create({
    data: {
      name: 'Audífonos Logitech G Pro X Wireless Gaming',
      slug: 'logitech-gpro-x-wireless',
      description: 'Audífonos gaming profesionales con tecnología LIGHTSPEED inalámbrica, sonido surround DTS:X 2.0 y micrófono Blue VO!CE. Batería de 20 horas.',
      price: 699.90, originalPrice: 849.90, stock: 12,
      images: JSON.stringify(["/productos/logitech-gpro-1.webp", "/productos/logitech-gpro-2.webp"]),
      categoryId: audio.id
    }
  });

  // === APPLE (4) ===
  await prisma.product.create({
    data: {
      name: 'iPhone 15 Pro Max 256GB Titanio Natural',
      slug: 'iphone-15-pro-max-256',
      description: 'El iPhone más poderoso jamás creado. Chip A17 Pro, cámara de 48 MP con zoom óptico 5x, pantalla Super Retina XDR de 6.7" y diseño de titanio ultraligero.',
      price: 5499.00, originalPrice: 5999.00, stock: 7,
      images: JSON.stringify(["/productos/iphone15-promax-1.webp", "/productos/iphone15-promax-2.webp"]),
      categoryId: apple.id
    }
  });

  await prisma.product.create({
    data: {
      name: 'MacBook Air M3 15" 256GB Medianoche',
      slug: 'macbook-air-m3-15',
      description: 'Increíblemente delgada y ligera. Con el chip M3 para un rendimiento fuera de serie y hasta 18 horas de batería. Pantalla Liquid Retina de 15.3 pulgadas.',
      price: 6999.00, stock: 4,
      images: JSON.stringify(["/productos/macbook-air-m3-1.webp", "/productos/macbook-air-m3-2.webp"]),
      categoryId: apple.id
    }
  });

  await prisma.product.create({
    data: {
      name: 'iPad Pro M4 11" 256GB Wi-Fi',
      slug: 'ipad-pro-m4-11',
      description: 'El iPad más delgado y potente jamás creado. Pantalla Ultra Retina XDR con tecnología tandem OLED, chip M4 y compatibilidad con Apple Pencil Pro.',
      price: 4499.00, originalPrice: 4999.00, stock: 6,
      images: JSON.stringify(["/productos/ipad-pro-m4-1.webp", "/productos/ipad-pro-m4-2.webp"]),
      categoryId: apple.id
    }
  });

  await prisma.product.create({
    data: {
      name: 'Apple Magic Keyboard con Touch ID',
      slug: 'magic-keyboard-touch-id',
      description: 'Teclado inalámbrico elegante con sensor Touch ID integrado para desbloqueo rápido y pagos seguros con Apple Pay. Recargable vía USB-C.',
      price: 649.00, stock: 20,
      images: JSON.stringify(["/productos/magic-keyboard-1.webp", "/productos/magic-keyboard-2.webp"]),
      categoryId: apple.id
    }
  });

  // === CASE & COVERS (3) ===
  await prisma.product.create({
    data: {
      name: 'Funda de Silicona MagSafe para iPhone 15 Pro',
      slug: 'funda-silicona-magsafe-iphone15',
      description: 'Funda de silicona suave al tacto con imanes MagSafe integrados. Protege tu iPhone de arañazos y caídas con estilo.',
      price: 249.90, stock: 25,
      images: JSON.stringify(["/productos/funda-silicona-1.webp", "/productos/funda-silicona-2.webp"]),
      categoryId: cases.id
    }
  });

  await prisma.product.create({
    data: {
      name: 'Case Spigen Ultra Hybrid MagFit iPhone 15',
      slug: 'spigen-ultra-hybrid-magfit',
      description: 'Funda transparente con tecnología anti-amarillamiento, compatible con MagSafe y protección militar contra caídas de hasta 1.2 metros.',
      price: 129.90, originalPrice: 179.90, stock: 30,
      images: JSON.stringify(["/productos/spigen-hybrid-1.webp", "/productos/spigen-hybrid-2.webp"]),
      categoryId: cases.id
    }
  });

  await prisma.product.create({
    data: {
      name: 'Funda Wallet de Cuero MagSafe',
      slug: 'funda-wallet-cuero-magsafe',
      description: 'Billetera magnética de cuero curtido europeo. Sostén hasta 3 tarjetas con seguridad RFID y compatibilidad Find My.',
      price: 299.00, originalPrice: 349.00, stock: 18,
      images: JSON.stringify(["/productos/wallet-cuero-1.webp", "/productos/wallet-cuero-2.webp"]),
      categoryId: cases.id
    }
  });

  // === SMART HOME (2) ===
  await prisma.product.create({
    data: {
      name: 'Amazon Echo Dot (5ta Gen) Parlante Inteligente',
      slug: 'echo-dot-5ta-gen',
      description: 'Parlante inteligente con Alexa. Sonido mejorado con graves más profundos, controla tu hogar inteligente y pide música, noticias y más con solo tu voz.',
      price: 199.90, originalPrice: 249.90, stock: 22,
      images: JSON.stringify(["/productos/echo-dot5-1.webp", "/productos/echo-dot5-2.webp"]),
      categoryId: smartHome.id
    }
  });

  await prisma.product.create({
    data: {
      name: 'Google Nest Hub 2da Generación',
      slug: 'google-nest-hub-2',
      description: 'Pantalla inteligente de 7 pulgadas con Google Assistant. Controla dispositivos compatibles, reproduce videos de YouTube, muestra recetas y monitorea tu sueño.',
      price: 399.90, stock: 14,
      images: JSON.stringify(["/productos/nest-hub-1.webp", "/productos/nest-hub-2.webp"]),
      categoryId: smartHome.id
    }
  });

  // === WEARABLES (3) ===
  await prisma.product.create({
    data: {
      name: 'Apple Watch Series 9 GPS 45mm Medianoche',
      slug: 'apple-watch-series9-45',
      description: 'El Apple Watch más inteligente. Chip S9 SiP, pantalla Retina siempre activa, sensor de oxígeno en sangre y detección de accidentes automovilísticos.',
      price: 2199.00, originalPrice: 2499.00, stock: 9,
      images: JSON.stringify(["/productos/watch-s9-1.webp", "/productos/watch-s9-2.webp"]),
      categoryId: wearables.id
    }
  });

  await prisma.product.create({
    data: {
      name: 'Xiaomi Smart Band 8 Pro',
      slug: 'xiaomi-band-8-pro',
      description: 'Pantalla AMOLED de 1.74", GPS integrado, más de 150 modos deportivos, monitoreo de frecuencia cardíaca 24/7 y hasta 14 días de batería.',
      price: 249.90, originalPrice: 299.90, stock: 40,
      images: JSON.stringify(["/productos/mi-band8-pro-1.webp", "/productos/mi-band8-pro-2.webp"]),
      categoryId: wearables.id
    }
  });

  await prisma.product.create({
    data: {
      name: 'Samsung Galaxy Watch 6 Classic 47mm',
      slug: 'galaxy-watch6-classic-47',
      description: 'Smartwatch premium con bisel giratorio, pantalla Super AMOLED de 1.47", monitoreo avanzado de salud, sensor de temperatura y Wear OS.',
      price: 1799.00, originalPrice: 1999.00, stock: 6,
      images: JSON.stringify(["/productos/galaxy-watch6-1.webp", "/productos/galaxy-watch6-2.webp"]),
      categoryId: wearables.id
    }
  });

  console.log('✅ ¡Base de datos sembrada con éxito! (2 usuarios, 6 categorías, 20 productos)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
