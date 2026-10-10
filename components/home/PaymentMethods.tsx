import { CreditCard, SmartphoneNfc } from "lucide-react";

// Todos los métodos de pago aceptados por la pasarela Niubiz Web (Perú)
// Coloca todos los archivos .svg dentro de la carpeta: public/logos/
const paymentMethods = [
  // 1. Tarjetas de Crédito y Débito
  { name: "Visa", icon: "/logos/visa.svg" },
  { name: "Mastercard", icon: "/logos/mastercard.svg" },
  { name: "American Express", icon: "/logos/amex.svg" },
  { name: "Diners Club", icon: "/logos/diners.svg" },
  { name: "UnionPay", icon: "/logos/unionpay.svg" },
  { name: "Discover", icon: "/logos/discover.svg" },

  // 2. Billeteras Móviles / Pagos QR
  { name: "Yape", icon: "/logos/yape.svg" },
  { name: "Plin", icon: "/logos/plin.svg" },
  { name: "BIM", icon: "/logos/bim.png" },

  // 3. Billeteras Digitales Globales (Soportadas por Niubiz)
  { name: "Apple Pay", icon: "/logos/apple-pay.svg" },
  { name: "Google Pay", icon: "/logos/google-pay.svg" },

  // 4. Pago en Efectivo y Banca por Internet
  { name: "PagoEfectivo", icon: "/logos/pagoefectivo.svg" },
];

export default function PaymentMethods() {
  return (
    <section className="max-w-7xl mx-auto px-4 w-full py-12">
      <div className="bg-white border border-slate-200 rounded-3xl p-8 md:p-12 flex flex-col items-center text-center shadow-sm">
        
        {/* Cabecera con íconos */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
            <CreditCard className="w-6 h-6 min-w-[24px] min-h-[24px]" />
          </div>
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
            <SmartphoneNfc className="w-6 h-6 min-w-[24px] min-h-[24px]" />
          </div>
        </div>

        <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-4">
          Aceptamos Todos los Métodos de Pago
        </h2>
        <p className="text-slate-600 mb-8 max-w-2xl mx-auto">
          Paga de forma rápida y 100% segura con tus tarjetas favoritas, billeteras móviles o transferencias bancarias a través de <strong>Niubiz</strong>.
        </p>

        {/* Grilla / Listado de todos los logos */}
        <div className="flex flex-wrap justify-center items-center gap-3 md:gap-4 max-w-5xl">
          {paymentMethods.map((method) => (
            <div
              key={method.name}
              className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-center min-w-[90px] h-[52px] shadow-sm hover:border-slate-300 hover:shadow-md transition-all"
              title={method.name}
            >
              <img
                src={method.icon}
                alt={method.name}
                className="max-h-7 max-w-[70px] w-auto h-auto object-contain"
                loading="lazy"
              />
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

