const fs = require('fs');
let content = fs.readFileSync('components/admin/AdminOrdersTable.tsx', 'utf8');
const oldSearch = `  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(search.toLowerCase()) || 
    (o.user?.email || "").toLowerCase().includes(search.toLowerCase()) ||
    (o.user?.name || "").toLowerCase().includes(search.toLowerCase())
  );`;
const newSearch = `  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(search.toLowerCase()) || 
    (o.user?.email || o.customerEmail || "").toLowerCase().includes(search.toLowerCase()) ||
    (o.user?.name || o.customerName || "").toLowerCase().includes(search.toLowerCase())
  );`;
content = content.replace(oldSearch, newSearch);
fs.writeFileSync('components/admin/AdminOrdersTable.tsx', content);
