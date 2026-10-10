"use client";

import { CheckCircle2, Clock, ChevronRight, Copy, MessageCircle } from "lucide-react";
import { useState } from "react";
import Image from "next/image";

export type OrderReceivedViewProps = {
  orderId: string;
  /** Estado REAL del pedido (leído de la base de datos) */
  status: string;
  paymentMethod: string;
  total: number;
  createdAt: string;
};

export default function OrderReceivedView({ orderId, status, paymentMethod, total, createdAt }: OrderReceivedViewProps) {
  const isCard = paymentMethod === "card";
  const isPaid = status === "PAID" || status === "PREPARING" || status === "SHIPPED" || status === "DELIVERED";

  const shortOrderId = orderId.length > 6 ? orderId.slice(-6).toUpperCase() : orderId;

  const [copied, setCopied] = useState(false);
  const phoneNumber = "992 279 632";
  const wppLink = `https://wa.me/51992279632?text=Hola,%20acabo%20de%20realizar%20el%20pedido%20%23${shortOrderId}.%20Aquí%20envío%20mi%20constancia%20de%20pago.`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(phoneNumber.replace(/\s/g, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white min-h-screen pt-12 pb-24">
      <div className="max-w-3xl mx-auto px-4">
        
        {/* ENCABEZADO */}
        <div className="flex flex-col items-center text-center mb-12">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 animate-bounce-short ${isPaid ? "bg-emerald-100" : "bg-orange-100"}`}>
            {isPaid ? <CheckCircle2 className="w-10 h-10 text-emerald-600" /> : <Clock className="w-10 h-10 text-orange-500" />}
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-4">¡Pedido Recibido!</h1>
          {isPaid ? (
            <p className="text-slate-500 text-lg">Gracias por tu compra. Tu pedido está en estado <span className="font-bold text-emerald-600">PAGADO Y CONFIRMADO</span>.</p>
          ) : (
            <p className="text-slate-500 text-lg">Gracias por tu compra. Tu pedido está en estado <span className="font-bold text-orange-500">PENDIENTE DE PAGO</span>.</p>
          )}
          {isCard && !isPaid && (
            <a href={`/pago/${orderId}`} className="mt-6 inline-flex items-center justify-center bg-blue-600 text-white font-bold px-8 py-4 rounded-xl hover:bg-blue-700 transition">
              Completar pago con tarjeta
            </a>
          )}
        </div>

        {/* RESUMEN DEL PEDIDO */}
        <div className="flex flex-col md:flex-row justify-between bg-slate-50 p-6 rounded-2xl mb-10 text-sm gap-4">
          <div>
            <span className="block text-slate-400 font-bold mb-1">NÚMERO DE PEDIDO</span>
            <span className="font-black text-slate-900 text-lg">#{shortOrderId}</span>
          </div>
          <div>
            <span className="block text-slate-400 font-bold mb-1">FECHA</span>
            <span className="font-black text-slate-900 text-lg">{new Date(createdAt).toLocaleDateString('es-PE')}</span>
          </div>
          <div>
            <span className="block text-slate-400 font-bold mb-1">MÉTODO DE PAGO</span>
            <span className="font-black text-slate-900 text-lg">{isCard ? "Tarjeta de Crédito/Débito" : paymentMethod === "transfer" ? "Transferencia" : "Yape / Plin"}</span>
          </div>
          <div>
            <span className="block text-slate-400 font-bold mb-1">TOTAL</span>
            <span className="font-black text-slate-900 text-lg">S/ {total.toFixed(2)}</span>
          </div>
        </div>

        {/* INSTRUCCIONES DE PAGO YAPE/PLIN */}
        {paymentMethod === "yape" || paymentMethod === "plin" ? (
          !isPaid && (
            <div className="bg-white border-2 border-purple-600 rounded-3xl p-8 shadow-lg shadow-purple-100 text-center relative overflow-hidden mb-10">
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
                    <span className="block text-slate-400 font-bold mb-2">TITULAR: LUIS ENRIQUE</span>
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
          )
        ) : paymentMethod === "transfer" && !isPaid ? (
          <div className="bg-white border-2 border-blue-600 rounded-3xl p-8 shadow-lg shadow-blue-100 text-center relative overflow-hidden mb-10">
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
        ) : null}

        {/* CONTINUAR */}
        <div className="text-center flex flex-col items-center gap-4">
          <a href={`/pedido/${orderId}`} className="inline-flex items-center justify-center bg-slate-900 text-white font-bold px-8 py-4 rounded-xl hover:bg-blue-600 transition w-full md:w-auto">
            Ver Seguimiento de mi Pedido
          </a>
          <a href="/tienda" className="inline-flex items-center font-bold text-slate-500 hover:text-blue-600 transition mt-2">
            Volver a la tienda <ChevronRight className="w-4 h-4 ml-1" />
          </a>
        </div>

      </div>
    </div>
  );
}
