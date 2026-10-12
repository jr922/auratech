"use client";

import { useEffect, useRef, useState } from "react";
import { Lock, ShieldCheck, AlertTriangle, Loader2 } from "lucide-react";
import { startNiubizPayment, type StartPaymentResult } from "@/app/actions/payment";

type Props = {
  orderId: string;
  total: number;
  error?: string;
};

const ERROR_MESSAGES: Record<string, string> = {
  denied: "Tu banco rechazó la operación. Verifica los datos de tu tarjeta o prueba con otra.",
  gateway: "No pudimos comunicarnos con la pasarela de pago. No se realizó ningún cobro. Inténtalo nuevamente.",
  expired: "El tiempo para pagar este pedido venció. Realiza tu compra nuevamente.",
  invalid: "No pudimos validar el resultado del pago. Si te cobraron, contáctanos con tu número de pedido.",
  processing: "Tu pago ya se está procesando. Revisa el estado de tu pedido en unos segundos.",
  timeout: "El tiempo para completar el pago terminó. Puedes intentarlo nuevamente.",
};

/**
 * Carga el formulario seguro de Niubiz. Los datos de la tarjeta se capturan dentro
 * del formulario hospedado por Niubiz: nunca pasan por nuestro servidor.
 */
export default function NiubizPayment({ orderId, total, error }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "failed">("idle");
  const [message, setMessage] = useState<string | undefined>(error ? ERROR_MESSAGES[error] ?? ERROR_MESSAGES.gateway : undefined);
  const [startedFor, setStartedFor] = useState(1);

  useEffect(() => {
    if (startedFor === 0) return;
    let cancelled = false;
    setState("loading");

    (async () => {
      const res: StartPaymentResult = await startNiubizPayment(orderId);
      if (cancelled) return;
      if (!res.success) {
        setState("failed");
        setMessage(res.error);
        return;
      }

      const form = formRef.current;
      if (!form) return;
      form.innerHTML = "";
      form.action = res.actionUrl;

      const script = document.createElement("script");
      script.src = res.scriptUrl;
      script.setAttribute("data-sessiontoken", res.sessionToken);
      script.setAttribute("data-channel", "web");
      script.setAttribute("data-merchantid", res.merchantId);
      script.setAttribute("data-purchasenumber", res.purchaseNumber);
      script.setAttribute("data-amount", String(res.amount));
      script.setAttribute("data-expirationminutes", "10");
      script.setAttribute("data-timeouturl", `/pago/${orderId}?error=timeout`);
      script.setAttribute("data-merchantname", "Aura Tech");
      script.setAttribute("data-buttonsize", "LARGE");
      script.setAttribute("data-buttoncolor", "#2563EB");
      script.setAttribute("data-text", "Pagar de forma segura");
      script.async = true;
      form.appendChild(script);
      setState("ready");
    })();

    return () => {
      cancelled = true;
    };
  }, [startedFor, orderId]);

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-8 shadow-sm border border-slate-100 max-w-xl w-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <Lock className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Pago con tarjeta</h1>
          <p className="text-sm text-slate-500">Pedido #{orderId.slice(-6).toUpperCase()}</p>
        </div>
      </div>

      <div className="bg-slate-50 rounded-2xl p-5 flex items-center justify-between mb-6">
        <span className="font-bold text-slate-600">Total a pagar</span>
        <span className="text-3xl font-black text-slate-900">S/ {total.toFixed(2)}</span>
      </div>

      {message && (
        <div role="alert" className="flex gap-3 bg-red-50 text-red-700 p-4 rounded-xl text-sm font-medium mb-6">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {state === "loading" && (
        <div className="w-full bg-blue-50 text-blue-600 font-bold text-lg rounded-2xl h-14 flex items-center justify-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin" />
          Conectando con Niubiz...
        </div>
      )}
      {state === "failed" && (
        <button
          type="button"
          onClick={() => setStartedFor((n) => n + 1)}
          className="w-full bg-blue-600 text-white font-black text-lg rounded-2xl h-14 flex items-center justify-center gap-3 hover:bg-blue-700 transition"
        >
          <Lock className="w-5 h-5" /> Reintentar conexión
        </button>
      )}

      {/* Niubiz inyecta aquí su botón/modal de pago */}
      <form ref={formRef} method="POST" className="flex justify-center" />

      <p className="flex items-center justify-center gap-2 text-xs text-slate-400 mt-6">
        <ShieldCheck className="w-4 h-4" />
        Pago procesado por Niubiz. Tus datos de tarjeta no se almacenan en nuestros servidores.
      </p>
    </div>
  );
}
