const fs = require('fs');
let content = fs.readFileSync('app/actions/auth.ts', 'utf8');

const oldRegister = `  await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: "USER",
    }
  });`;

const newRegister = `  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: "USER",
    }
  });

  // ESTILO NIKE: Vincular compras pasadas de invitado a este nuevo usuario
  await prisma.order.updateMany({
    where: { 
      customerEmail: email,
      userId: null
    },
    data: {
      userId: newUser.id
    }
  });`;

content = content.replace(oldRegister, newRegister);
fs.writeFileSync('app/actions/auth.ts', content);
