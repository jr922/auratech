import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function PreguntasFrecuentesPage() {
  return (
    <div className="bg-slate-50 min-h-[70vh] py-8 md:py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-3 md:mb-4 text-center">Preguntas Frecuentes</h1>
        <p className="text-slate-500 text-center mb-12">Encuentra respuestas rápidas a las dudas más comunes de nuestros clientes.</p>
        
        <div className="bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-slate-100">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-left font-bold text-slate-800">¿Cuánto tiempo demora el envío?</AccordionTrigger>
              <AccordionContent className="text-slate-600 leading-relaxed">
                Nuestros envíos en Lima Metropolitana (zonas de cobertura express) toman un máximo de 24 horas hábiles. Para envíos a provincia a través de Olva Courier o Shalom, el tiempo estimado es de 2 a 4 días hábiles dependiendo del destino.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-2">
              <AccordionTrigger className="text-left font-bold text-slate-800">¿Cuáles son los métodos de pago?</AccordionTrigger>
              <AccordionContent className="text-slate-600 leading-relaxed">
                Aceptamos múltiples métodos de pago 100% seguros: Transferencias bancarias (BCP, BBVA, Interbank), Yape, Plin y todas las tarjetas de crédito o débito (Visa, Mastercard, American Express) mediante nuestra pasarela de pagos encriptada.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-3">
              <AccordionTrigger className="text-left font-bold text-slate-800">¿Tienen tienda física?</AccordionTrigger>
              <AccordionContent className="text-slate-600 leading-relaxed">
                Sí, contamos con un punto de retiro y exhibición física ubicado en Av. Garcilaso de la Vega 1358 - Plaza Tec, Lima. Puedes realizar tu compra online y elegir la opción de &quot;Retiro en Tienda&quot; sin costo adicional.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-4">
              <AccordionTrigger className="text-left font-bold text-slate-800">¿Hacen cambios y devoluciones?</AccordionTrigger>
              <AccordionContent className="text-slate-600 leading-relaxed">
                ¡Claro que sí! Tienes hasta 7 días calendario desde que recibes el producto para solicitar un cambio o devolución, siempre y cuando el producto se encuentre en su empaque original sellado y sin señales de uso. En caso de fallas de fábrica, aplica la garantía específica de cada marca.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  );
}
