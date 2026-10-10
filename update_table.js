const fs = require('fs');
let content = fs.readFileSync('components/admin/AdminOrdersTable.tsx', 'utf8');

const oldName = `{order.user?.name || "Invitado"}`;
const newName = `{order.user?.name || order.customerName || "Invitado"}`;
content = content.replace(oldName, newName);

const oldEmail = `{order.user?.email}`;
const newEmail = `{order.user?.email || order.customerEmail || "Sin correo"}`;
content = content.replace(oldEmail, newEmail);

fs.writeFileSync('components/admin/AdminOrdersTable.tsx', content);
