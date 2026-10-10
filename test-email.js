const { Resend } = require('resend');
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY);

async function test() {
  console.log("Testing Resend with key:", process.env.RESEND_API_KEY ? "Key found" : "No key");
  const result = await resend.emails.send({
    from: "Ventas Aura Tech <ventas@auratech.pe>",
    to: "test@example.com",
    subject: "Test",
    html: "<p>Test</p>"
  });
  console.log("Result:", result);
}
test();
