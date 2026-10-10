const fs = require('fs');
const path = './lib/mail.ts';
let code = fs.readFileSync(path, 'utf8');

// Replace top level resend init with inside function or check errors
code = code.replace(
  /const resend = process\.env\.RESEND_API_KEY \? new Resend\(process\.env\.RESEND_API_KEY\) : null;/g,
  `const getResend = () => {
  if (!process.env.RESEND_API_KEY) {
    console.log("⚠️ No se encontró RESEND_API_KEY en las variables de entorno.");
    return null;
  }
  return new Resend(process.env.RESEND_API_KEY);
};`
);

code = code.replace(/if \(\!resend\) return;/g, `const resend = getResend();\n  if (!resend) return;`);

// Fix sendPendingPaymentEmail error handling
code = code.replace(
  /await resend\.emails\.send\(\{([\s\S]*?)\}\);/g,
  `const response = await resend.emails.send({$1});\n    if (response.error) {\n      console.error("Resend API Error details:", response.error);\n    } else {\n      console.log("Correo enviado exitosamente:", response.data?.id);\n    }`
);

fs.writeFileSync(path, code);
console.log("Updated mail.ts");
