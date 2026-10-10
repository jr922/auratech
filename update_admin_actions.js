const fs = require('fs');
let content = fs.readFileSync('app/actions/admin-orders.ts', 'utf8');

const oldSendEmail = `sendOrderShippedEmail(order, order.user?.email || "anon", order.user?.name || "Cliente", courier, trackingNumber).catch(console.error);`;
const newSendEmail = `sendOrderShippedEmail(order, order.user?.email || order.customerEmail || "anon", order.user?.name || order.customerName || "Cliente", courier, trackingNumber).catch(console.error);`;

content = content.replace(oldSendEmail, newSendEmail);

const oldUpdateEmail = `          ...(newStatus === "PAID" && !order.paidAt ? { paidAt: new Date() } : {})
        },
      });

      await tx.orderHistory.create({
        data: {
          orderId,
          status: newStatus,
          notes: \`Estado cambiado a \${newStatus} manualmente.\`,
          createdBy: adminId,
        },
      });
    });

    if (newStatus === "PAID" && !order.paidAt) {
      sendPaymentConfirmedEmail(order, order.user?.email || "anon", order.user?.name || "Cliente").catch(console.error);
    }`;

const newUpdateEmail = `          ...(newStatus === "PAID" && !order.paidAt ? { paidAt: new Date() } : {})
        },
      });

      await tx.orderHistory.create({
        data: {
          orderId,
          status: newStatus,
          notes: \`Estado cambiado a \${newStatus} manualmente.\`,
          createdBy: adminId,
        },
      });
    });

    if (newStatus === "PAID" && !order.paidAt) {
      sendPaymentConfirmedEmail(order, order.user?.email || order.customerEmail || "anon", order.user?.name || order.customerName || "Cliente").catch(console.error);
    }`;

content = content.replace(oldUpdateEmail, newUpdateEmail);

fs.writeFileSync('app/actions/admin-orders.ts', content);
