"use client";

import { Copy, MessageCircle } from "lucide-react";
import { useState } from "react";
import Image from "next/image";

type Props = {
  paymentMethod: string;
  isPaid: boolean;
  orderId: string;
};

export default function PendingPaymentInstructions({ paymentMethod, isPaid, orderId }: Props) {
  const [copied, setCopied] = useState(false);
  const phoneNumber = "992 279 632";
  const shortOrderId = orderId.length > 6 ? orderId.slice(-6).toUpperCase() : orderId;
  const wppLink = `https://wa.me/51900273072?text=Hola,%20soy%20el%20pedido%20%23${shortOrderId}.%20Aquí%20envío%20mi%20constancia%20de%20pago.`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText("992279632");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isPaid) return null;

  if (paymentMethod === "yape" || paymentMethod === "plin") {
    return (
      <div className="bg-white border-2 border-purple-600 rounded-3xl p-8 shadow-lg shadow-purple-100 text-center relative overflow-hidden mb-10 w-full max-w-4xl mx-auto">
        <div className="absolute top-0 left-0 w-full bg-purple-600 text-white text-xs font-bold py-1.5 uppercase tracking-widest">
          Acción Requerida para Procesar el Envío
        </div>
        
        <h2 className="text-xl font-black text-slate-900 mt-6 mb-2">Escanea el QR o Transfiere a este número</h2>
        <p className="text-slate-500 mb-8 max-w-md mx-auto">
          Por favor, realiza el pago mediante Yape o Plin al número indicado abajo y envíanos la captura de pantalla por WhatsApp para confirmar tu pedido.
        </p>

        <div className="flex flex-col md:flex-row items-center justify-center gap-12">
          
          {/* QR Yape */}
          <div className="flex flex-col items-center gap-4">
            <div className="w-48 h-48 rounded-2xl border-2 border-slate-200 overflow-hidden bg-white">
              <Image src="/logos/qr-yape.jpg" alt="QR Yape" width={192} height={192} className="object-cover w-full h-full" />
            </div>
            <div className="flex gap-2">
              <span className="bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">Yape</span>
              <span className="bg-cyan-500 text-white text-xs font-bold px-3 py-1 rounded-full">Plin</span>
            </div>
          </div>

          <div className="h-24 w-px bg-slate-200 hidden md:block"></div>

          {/* Número y WhatsApp */}
          <div className="flex flex-col items-center md:items-start gap-6">
            <div>
              <span className="block text-slate-400 font-bold mb-2 text-sm text-center md:text-left">TITULAR: LUIS ENRIQUE</span>
              <div className="flex items-center gap-4">
                <span className="text-4xl font-black text-slate-900 tracking-wider">{phoneNumber}</span>
                <button 
                  onClick={copyToClipboard}
                  className="w-10 h-10 bg-slate-100 hover:bg-purple-100 hover:text-purple-600 rounded-xl flex items-center justify-center text-slate-500 transition-colors relative"
                >
                  <Copy className="w-5 h-5" />
                  {copied && (
                    <span className="absolute -top-8 bg-slate-800 text-white text-xs py-1 px-2 rounded">¡Copiado!</span>
                  )}
                </button>
              </div>
            </div>

            <a 
              href={wppLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-emerald-200 transition-all"
            >
              <MessageCircle className="w-5 h-5" />
              Enviar constancia por WhatsApp
            </a>
          </div>
          
        </div>
      </div>
    );
  }

  if (paymentMethod === "transfer") {
    return (
      <div className="bg-white border-2 border-blue-600 rounded-3xl p-8 shadow-lg shadow-blue-100 text-center relative overflow-hidden mb-10 w-full max-w-4xl mx-auto">
        <div className="absolute top-0 left-0 w-full bg-blue-600 text-white text-xs font-bold py-1.5 uppercase tracking-widest">
          Acción Requerida para Procesar el Envío
        </div>
        
        <h2 className="text-xl font-black text-slate-900 mt-6 mb-2">Realiza tu depósito a nuestras cuentas</h2>
        <p className="text-slate-500 mb-8 max-w-md mx-auto">
          Realiza la transferencia bancaria a cualquiera de nuestras cuentas. Luego envíanos el voucher por WhatsApp para confirmar tu pedido.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left mb-8">
          <div className="bg-slate-50 p-5 rounded-2xl border-2 border-slate-200 hover:border-orange-500 transition-colors">
            <span className="font-bold text-orange-600 block text-xs tracking-widest mb-2">BCP - SOLES</span>
            <span className="font-black text-slate-900 text-lg block mb-1">191-1170135-0-044</span>
            <span className="text-sm text-slate-500 block">CCI: 002-191-111701350044-53</span>
            <span className="text-xs text-slate-400 block mt-2">Titular: Luis Enrique</span>
          </div>
          
          <div className="bg-slate-50 p-5 rounded-2xl border-2 border-slate-200 hover:border-green-500 transition-colors">
            <span className="font-bold text-green-600 block text-xs tracking-widest mb-2">INTERBANK - SOLES</span>
            <span className="font-black text-slate-900 text-lg block mb-1">898-3256756864</span>
            <span className="text-sm text-slate-500 block">CCI: 003-898-013256756864-4</span>
            <span className="text-xs text-slate-400 block mt-2">Titular: Luis Enrique</span>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border-2 border-slate-200 hover:border-blue-500 transition-colors">
            <span className="font-bold text-blue-600 block text-xs tracking-widest mb-2">BBVA - SOLES</span>
            <span className="font-black text-slate-900 text-lg block mb-1">0011-0804-0201011184</span>
            <span className="text-sm text-slate-500 block">CCI: 011-804-000201011184-23</span>
            <span className="text-xs text-slate-400 block mt-2">Titular: Luis Enrique</span>
          </div>
        </div>

        <div className="flex justify-center">
          <a 
            href={wppLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 px-8 rounded-xl shadow-lg shadow-emerald-200 transition-all"
          >
            <MessageCircle className="w-5 h-5" />
            Enviar constancia por WhatsApp
          </a>
        </div>
      </div>
    );
  }

  return null;
}
