const fs = require('fs');

let content = fs.readFileSync('app/actions/checkout.ts', 'utf8');

const oldLogic = `    const session = await getServerSession(authOptions);
    let userId: string;
    // Un invitado que usa el email de una cuenta existente NO puede modificar los datos de esa cuenta
    let canUpdateUserData = true;

    if (session?.user && (session.user as { id?: string }).id) {
      userId = (session.user as { id?: string }).id as string;
    } else {
      const existingUser = await prisma.user.findUnique({ where: { email: data.email.trim().toLowerCase() } });
      if (existingUser) {
        userId = existingUser.id;
        canUpdateUserData = false;
      } else {
        const randomPassword = Math.random().toString(36).slice(-10);
        const hashedPassword = await bcrypt.hash(randomPassword, 10);
        const newUser = await prisma.user.create({
          data: { 
            email: data.email.trim().toLowerCase(), 
            name: data.name, 
            password: hashedPassword, 
            role: "USER" 
          }
        });
        userId = newUser.id;
      }
    }

    // Actualizamos el documento (DNI/RUC). La dirección vive en el modelo Address
    // y se registra al finalizar la compra (ver rememberCheckoutAddress).
    if (canUpdateUserData) {
      await prisma.user.update({
        where: { id: userId },
        data: { document: data.document }
      });
    }`;

const newLogic = `    const session = await getServerSession(authOptions);
    let userId: string | null = null;
    let canUpdateUserData = false;

    if (session?.user && (session.user as { id?: string }).id) {
      userId = (session.user as { id?: string }).id as string;
      canUpdateUserData = true;
    } else {
      // ESTILO NIKE: Si es invitado, verificamos si existe su correo, si existe lo enlazamos,
      // pero si NO existe, NO creamos un usuario. Lo dejamos como userId = null.
      const existingUser = await prisma.user.findUnique({ where: { email: data.email.trim().toLowerCase() } });
      if (existingUser) {
        userId = existingUser.id;
        canUpdateUserData = false; // No actualizar documento de usuario existente desde invitado
      } else {
        userId = null; // Invitado puro, no creamos cuenta
      }
    }

    if (userId && canUpdateUserData) {
      await prisma.user.update({
        where: { id: userId },
        data: { document: data.document }
      });
    }`;

content = content.replace(oldLogic, newLogic);

const oldOrderCreate = `      const newOrder = await tx.order.create({
        data: {
          userId,
          total: finalTotal,`;

const newOrderCreate = `      const newOrder = await tx.order.create({
        data: {
          userId,
          customerEmail: data.email.trim().toLowerCase(),
          customerName: data.name,
          customerPhone: data.phone || null,
          total: finalTotal,`;

content = content.replace(oldOrderCreate, newOrderCreate);

const oldHistoryCreate = `              { 
                status: "PENDING", 
                notes: data.paymentMethod === 'card'
                  ? "Orden generada a través de la web. Pendiente de pago con tarjeta."
                  : "Orden generada a través de la web. Pendiente de confirmación de pago.", 
                createdBy: userId 
              }`;
const newHistoryCreate = `              { 
                status: "PENDING", 
                notes: data.paymentMethod === 'card'
                  ? "Orden generada a través de la web. Pendiente de pago con tarjeta."
                  : "Orden generada a través de la web. Pendiente de confirmación de pago.", 
                createdBy: userId || "GUEST" 
              }`;

content = content.replace(oldHistoryCreate, newHistoryCreate);

const oldRememberCheckoutAddress = `    if (data.addressDetail && session?.user) {
      try {
        await rememberCheckoutAddress(userId, data.addressDetail, data.phone);`;

const newRememberCheckoutAddress = `    if (data.addressDetail && session?.user && userId) {
      try {
        await rememberCheckoutAddress(userId, data.addressDetail, data.phone);`;

content = content.replace(oldRememberCheckoutAddress, newRememberCheckoutAddress);

fs.writeFileSync('app/actions/checkout.ts', content);
