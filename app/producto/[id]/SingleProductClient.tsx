"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, Truck, ShieldCheck, Heart, ShoppingCart, Check, Minus, Plus, Mail, ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "@/components/ui/ProductCard";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import type { Product } from "@/lib/data";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { toast } from "sonner";
import { useUIStore } from "@/store/uiStore";
import { submitReview } from "@/app/actions/reviews";
import { submitRestockRequest } from "@/app/actions/restock";
import ProductBundle from "@/components/shop/ProductBundle";
import { useRecentlyViewedStore } from "@/store/recentlyViewedStore";
import RecentlyViewed from "@/components/shop/RecentlyViewed";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface SingleProductClientProps {
  product: {
    id: string;
    name: string;
    category: string;
    categorySlug?: string;
    price: number;
    originalPrice?: number;
    discount: string | null;
    rating: number;
    reviewsCount: number;
    reviewsData: { id: string; authorName: string; rating: number; comment: string; createdAt: string | number | Date }[];
    description: string;
    colors: { name: string; hex: string }[];
    images: string[];
    stock: number;
    sku: string;
    variantsData: { id: string; name: string; stock: number; price?: number }[];
  };
  relatedProducts: Product[];
}

export default function SingleProductClient({ product, relatedProducts }: SingleProductClientProps) {
  const [activeImage, setActiveImage] = useState(0);
  
  // Bugfix: Select first variant with stock by default to prevent false "Out of Stock" perception
  const initialVariant = product.variantsData?.find(v => v.stock > 0) || product.variantsData?.[0] || null;
  const [selectedVariant, setSelectedVariant] = useState<{ id: string; name: string; stock: number; price?: number } | null>(initialVariant as unknown as { id: string; name: string; stock: number; price?: number });
  
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("descripcion");
  const [isAdded, setIsAdded] = useState(false);
  const [showStickyCart, setShowStickyCart] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      // Mostrar la barra si han scrolleado más allá de cierto punto (ej. 500px)
      setShowStickyCart(window.scrollY > 600);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Trackear la vista del producto
  const addViewedProduct = useRecentlyViewedStore((state) => state.addProduct);
  useEffect(() => {
    addViewedProduct(product as unknown as Product);
  }, [product, addViewedProduct]);

  const { data: session } = useSession();
  const router = useRouter();

  const handleOpenReviewForm = () => {
    if (session?.user) {
      setShowReviewForm(true);
    } else {
      toast.info("Inicia sesión para valorar", { description: "Necesitas una cuenta para dejar tu reseña." });
      router.push(`/mi-cuenta?login=true&returnTo=/producto/${product.id}`);
    }
  };

  // Estados para la Pestaña de Reseñas
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewName, setReviewName] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    if (session?.user?.name) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReviewName(session.user.name);
    }
  }, [session?.user?.name]);

  const addItem = useCartStore((state) => state.addItem);
  const openCart = useUIStore((state) => state.openCart);
  const { addItem: addWishlist, removeItem: removeWishlist, isInWishlist } = useWishlistStore();
  const inWishlist = isInWishlist(product.id);

  const toggleWishlist = () => {
    if (inWishlist) {
      removeWishlist(product.id);
      toast.info('Eliminado de Favoritos');
    } else {
      addWishlist(product as unknown as Product); // Cast for simplicity since types are slightly different
      toast.success('Agregado a Favoritos', {
        description: `${product.name} guardado.`
      });
    }
  };

  const [restockEmail, setRestockEmail] = useState("");
  const [isRestockSubmitting, setIsRestockSubmitting] = useState(false);
  const [restockSuccess, setRestockSuccess] = useState(false);

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRestockSubmitting(true);
    const res = await submitRestockRequest({
      email: restockEmail,
      productId: product.id,
      variantId: selectedVariant?.id
    });
    if (res.success) {
      setRestockSuccess(true);
      toast.success("¡Suscrito!", { description: "Te avisaremos cuando haya stock." });
    } else {
      toast.error("Error", { description: res.error });
    }
    setIsRestockSubmitting(false);
  };

  const currentPrice = selectedVariant?.price ?? product.price;
  const currentStock = selectedVariant?.stock ?? product.stock;

  const handleAddToCart = () => {
    if (currentStock === 0) return;
    addItem({
      id: selectedVariant ? selectedVariant.id : product.id,
      productId: product.id,
      variantId: selectedVariant ? selectedVariant.id : undefined,
      name: selectedVariant ? `${product.name} (${selectedVariant.name})` : product.name,
      price: currentPrice,
      quantity: quantity,
      maxStock: currentStock, // Pasamos el límite al carrito
      image: product.images[0] || '/placeholder.webp'
    });
    
    openCart();
    // Feedback visual
    setIsAdded(true);
    toast.success(`${product.name} se agregó a tu carrito`, {
      description: `Cantidad: ${quantity} unidad(es)`
    });
    
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleBuyNow = () => {
    if (currentStock === 0) return;
    addItem({
      id: selectedVariant ? selectedVariant.id : product.id,
      productId: product.id,
      variantId: selectedVariant ? selectedVariant.id : undefined,
      name: selectedVariant ? `${product.name} (${selectedVariant.name})` : product.name,
      price: currentPrice,
      quantity: quantity,
      maxStock: currentStock,
      image: product.images[0] || '/placeholder.webp'
    });
    router.push("/checkout");
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingReview(true);
    
    const res = await submitReview({
      productId: product.id,
      rating: reviewRating,
      comment: reviewComment,
      authorName: reviewName,
    });

    if (res.success) {
      toast.success('¡Valoración enviada!', { description: 'Gracias por compartir tu opinión.' });
      setReviewName("");
      setReviewComment("");
      setReviewRating(5);
      setShowReviewForm(false);
    } else {
      toast.error('Error', { description: res.error });
    }
    setIsSubmittingReview(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white pb-32">
      
      {/* BREADCRUMBS */}
      <div className="bg-slate-50 border-b border-slate-100 py-4 mb-8">
        <div className="max-w-7xl mx-auto px-4 w-full">
          <p className="text-sm text-slate-500 font-medium flex items-center gap-2">
            {/* ANTIGRAVITY: Reemplazado <a> por <Link> para evitar Full-Page Reload y apuntado a las rutas correctas */}
            <Link href="/" className="hover:text-blue-600 transition">Inicio</Link> 
            <span className="text-slate-300">/</span> 
            <Link href="/tienda" className="hover:text-blue-600 transition">Tienda</Link> 
            <span className="text-slate-300">/</span> 
            <Link href={`/tienda?categoria=${product.categorySlug || encodeURIComponent(product.category.toLowerCase())}`} className="hover:text-blue-600 transition">{product.category}</Link> 
            <span className="text-slate-300">/</span> 
            <span className="text-slate-900 font-bold truncate max-w-[200px] sm:max-w-xs block">{product.name}</span>
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 w-full flex flex-col lg:flex-row gap-12 lg:gap-20">
        
        {/* COLUMNA IZQUIERDA: GALERÍA DE IMÁGENES */}
        <div className="w-full lg:w-1/2 flex flex-col gap-3 sm:gap-4">
          <div className="w-full aspect-square bg-slate-100 rounded-2xl sm:rounded-3xl flex items-center justify-center border border-slate-200 relative overflow-hidden group">
            {product.discount && (
              <span className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10 bg-red-500 text-white text-xs sm:text-sm font-bold px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg">
                {product.discount}
              </span>
            )}
            
            {/* Controles de Foto Anterior / Siguiente en Móvil */}
            {product.images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setActiveImage((prev) => (prev > 0 ? prev - 1 : product.images.length - 1)); 
                  }}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 z-10 w-9 h-9 sm:w-10 sm:h-10 bg-white/80 backdrop-blur-md rounded-full shadow-md flex items-center justify-center text-slate-700 hover:bg-white active:scale-95 transition"
                  aria-label="Foto anterior"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setActiveImage((prev) => (prev < product.images.length - 1 ? prev + 1 : 0)); 
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10 w-9 h-9 sm:w-10 sm:h-10 bg-white/80 backdrop-blur-md rounded-full shadow-md flex items-center justify-center text-slate-700 hover:bg-white active:scale-95 transition"
                  aria-label="Siguiente foto"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                
                {/* Indicador de foto en móvil (ej. 1 / 4) */}
                <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-1 rounded-full z-10 md:hidden pointer-events-none">
                  {activeImage + 1} / {product.images.length}
                </div>
              </>
            )}

            <Image 
              src={product.images[activeImage] || "/placeholder.webp"} 
              alt={product.name} 
              fill
              priority
              className="object-contain p-6 sm:p-8 mix-blend-multiply transition-transform duration-500 hover:scale-105" 
            />
          </div>
          <div className="flex gap-2 sm:gap-4 overflow-x-auto hide-scrollbar pb-2">
            {product.images.map((img, idx) => (
              <button 
                key={idx}
                onClick={() => setActiveImage(idx)}
                className={`relative w-16 h-16 sm:w-24 sm:h-24 shrink-0 rounded-xl sm:rounded-2xl flex items-center justify-center bg-slate-50 border-2 transition-all overflow-hidden ${activeImage === idx ? "border-blue-600 shadow-md" : "border-transparent hover:border-slate-300"}`}
              >
                <Image 
                  src={img} 
                  alt={`Miniatura ${idx + 1}`} 
                  fill 
                  sizes="96px" 
                  className="object-contain p-1.5 sm:p-2 mix-blend-multiply" 
                />
              </button>
            ))}
          </div>
        </div>

        {/* COLUMNA DERECHA: INFO DEL PRODUCTO */}
        <div className="w-full lg:w-1/2 flex flex-col">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight mb-4 mt-2">
            {product.name}
          </h1>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center text-amber-400">
              {[1,2,3,4,5].map((star) => (
                <Star key={star} className={`w-5 h-5 ${star <= Math.floor(product.rating) ? "fill-current" : ""}`} />
              ))}
            </div>
            <a href="#reviews" className="text-sm font-bold text-blue-600 hover:underline">(Ver {product.reviewsCount} reseñas)</a>
          </div>

          <div className="flex items-end gap-4 mb-8 pb-8 border-b border-slate-100">
            <span className="text-slate-500 font-medium">Precio:</span>
            {product.originalPrice && (
              <span className="text-lg font-bold text-slate-400 line-through decoration-slate-300 mb-1 ml-2">
                S/ {product.originalPrice.toFixed(2)}
              </span>
            )}
            <span className="text-4xl font-black text-slate-900 ml-2">S/ {currentPrice.toFixed(2)}</span>
          </div>

          <p className="text-slate-600 text-lg leading-relaxed mb-8">
            {product.description}
          </p>

          {/* Selector de Variantes */}
          {product.variantsData && product.variantsData.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Opción: <span className="text-slate-500 font-medium">{selectedVariant?.name}</span></h3>
              <div className="flex flex-wrap gap-3">
                {product.variantsData.map((variant) => (
                  <button 
                    key={variant.id}
                    onClick={() => {
                      setSelectedVariant(variant);
                      setQuantity(1); // Bugfix: Reset quantity when switching variants to prevent overstock selection
                    }}
                    className={`px-4 py-2 rounded-xl border-2 transition-all font-bold text-sm ${selectedVariant?.id === variant.id ? "border-blue-600 bg-blue-50 text-blue-600" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}
                  >
                    {variant.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Acciones de Compra o Formulario de Restock */}
          {currentStock === 0 ? (
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 mb-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full bg-orange-500 text-white text-[10px] font-bold py-1 uppercase tracking-widest text-center">
                Temporalmente Agotado
              </div>
              <div className="mt-4">
                <h3 className="font-black text-slate-900 mb-2 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-orange-500" />
                  Avísame cuando vuelva a estar disponible
                </h3>
                <p className="text-sm text-slate-600 mb-4">
                  Déjanos tu correo y serás el primero en enterarte cuando este producto regrese a nuestro almacén.
                </p>
                
                {restockSuccess ? (
                  <div className="bg-emerald-100 text-emerald-700 font-bold p-4 rounded-xl flex items-center gap-2">
                    <Check className="w-5 h-5" />
                    ¡Suscripción exitosa! Te contactaremos pronto.
                  </div>
                ) : (
                  <form onSubmit={handleRestockSubmit} className="flex gap-2">
                    <input 
                      type="email" 
                      required
                      placeholder="tu@correo.com"
                      value={restockEmail}
                      onChange={(e) => setRestockEmail(e.target.value)}
                      className="flex-1 border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500"
                    />
                    <button 
                      type="submit"
                      disabled={isRestockSubmitting}
                      className="bg-slate-900 text-white font-bold px-6 py-3 rounded-xl hover:bg-orange-500 transition disabled:opacity-50"
                    >
                      {isRestockSubmitting ? "Enviando..." : "Avisarme"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className={`flex items-center justify-between border rounded-2xl px-2 w-full sm:w-32 h-14 shrink-0 ${currentStock === 0 ? "bg-slate-100 border-slate-200" : "bg-slate-50 border-slate-200"}`}>
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={currentStock === 0}
                    className={`w-10 h-10 flex items-center justify-center rounded-xl transition ${currentStock === 0 ? "text-slate-300 cursor-not-allowed" : "text-slate-500 hover:text-blue-600 hover:bg-slate-200"}`}
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className={`font-bold text-lg ${currentStock === 0 ? "text-slate-400" : "text-slate-900"}`}>{currentStock === 0 ? 0 : quantity}</span>
                  <button 
                    onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                    disabled={currentStock === 0}
                    className={`w-10 h-10 flex items-center justify-center rounded-xl transition ${currentStock === 0 ? "text-slate-300 cursor-not-allowed" : "text-slate-500 hover:text-blue-600 hover:bg-slate-200"}`}
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                <button 
                  onClick={handleAddToCart}
                  disabled={currentStock === 0}
                  className={`flex-1 text-white font-bold text-lg rounded-2xl h-14 flex items-center justify-center gap-3 transition-all uppercase tracking-wide ${currentStock === 0 ? "bg-slate-400 cursor-not-allowed" : isAdded ? "bg-emerald-600 scale-105" : "bg-slate-900 hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-200 active:scale-95"}`}
                >
                  {currentStock === 0 ? 'Agotado' : isAdded ? (
                    <>
                      <Check className="w-6 h-6" /> ¡Añadido!
                    </>
                  ) : 'Añadir al Carrito'}
                </button>
                <button 
                  onClick={toggleWishlist}
                  className={`w-14 h-14 flex items-center justify-center rounded-2xl border-2 transition-all ${inWishlist ? 'border-red-500 text-red-500 bg-red-50' : 'border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200'}`}
                >
                  <Heart className={`w-6 h-6 ${inWishlist ? 'fill-current' : ''}`} />
                </button>
              </div>
              
              {/* Botón de Comprar Ahora (Skip Cart) */}
              <button 
                onClick={handleBuyNow}
                disabled={currentStock === 0}
                className={`w-full text-white font-black text-lg rounded-2xl h-14 flex items-center justify-center gap-3 transition-all uppercase tracking-wide mb-8 shadow-lg ${currentStock === 0 ? "hidden" : "bg-blue-600 hover:bg-blue-700 hover:shadow-blue-200 active:scale-95"}`}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Comprar Ahora
              </button>
            </>
          )}

          {/* Trust Badges */}
          <div className="bg-slate-50 rounded-2xl p-6 flex flex-col gap-4 border border-slate-100 mb-6">
            <div className="flex items-center gap-4 text-slate-700">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              <span className="font-bold text-sm">Retiro en tienda disponible</span>
            </div>
            <div className="flex items-center gap-4 text-slate-700">
              <Truck className="w-6 h-6 text-emerald-600" />
              <span className="font-bold text-sm">Envíos Express en 24 hrs</span>
            </div>
            <div className="flex items-center gap-4 text-slate-700">
              <ShieldCheck className="w-6 h-6 text-orange-600" />
              <span className="font-bold text-sm">Garantía de producto original</span>
            </div>
          </div>

          {/* Metadatos */}
          <div className="text-sm font-medium text-slate-500 space-y-1">
            <p>Categoría: <span className="text-slate-900">{product.category}</span></p>
            <p>SKU: <span className="text-slate-900">{product.sku}</span></p>
          </div>

        </div>
      </div>

      {/* PESTAÑAS (TABS) DE INFORMACIÓN */}
      <div className="max-w-7xl mx-auto px-4 w-full mt-20" id="reviews">
        <div className="flex gap-8 border-b border-slate-200 overflow-x-auto hide-scrollbar">
          <button 
            onClick={() => setActiveTab("descripcion")}
            className={`pb-4 text-lg font-bold transition-all whitespace-nowrap ${activeTab === "descripcion" ? "text-blue-600 border-b-4 border-blue-600" : "text-slate-400 hover:text-slate-700"}`}
          >
            Descripción
          </button>
          <button 
            onClick={() => setActiveTab("informacion")}
            className={`pb-4 text-lg font-bold transition-all whitespace-nowrap ${activeTab === "informacion" ? "text-blue-600 border-b-4 border-blue-600" : "text-slate-400 hover:text-slate-700"}`}
          >
            Información Adicional
          </button>
          <button 
            onClick={() => setActiveTab("valoraciones")}
            className={`pb-4 text-lg font-bold transition-all whitespace-nowrap ${activeTab === "valoraciones" ? "text-blue-600 border-b-4 border-blue-600" : "text-slate-400 hover:text-slate-700"}`}
          >
            Valoraciones ({product.reviewsCount})
          </button>
        </div>
        <div className="py-8 text-slate-600 leading-relaxed max-w-4xl min-h-[200px]">
          {activeTab === "descripcion" && (
            <p>
              {product.description}
            </p>
          )}
          {activeTab === "informacion" && (
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>SKU:</strong> {product.sku}</li>
              <li><strong>Stock:</strong> {product.stock > 0 ? `${product.stock} unidades` : "Agotado"}</li>
              <li><strong>Envío:</strong> A nivel nacional</li>
            </ul>
          )}
          {activeTab === "valoraciones" && (
            <div className="flex flex-col gap-6">
              {showReviewForm ? (
                <form onSubmit={handleReviewSubmit} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 max-w-2xl mx-auto w-full">
                  <h3 className="font-bold text-lg mb-4">Escribir una valoración</h3>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Calificación</label>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map((star) => (
                        <button 
                          key={star} 
                          type="button" 
                          onClick={() => setReviewRating(star)}
                          className="focus:outline-none"
                        >
                          <Star className={`w-6 h-6 ${star <= reviewRating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Tu Nombre</label>
                    <input 
                      type="text" 
                      required
                      value={reviewName}
                      readOnly={!!session?.user?.name}
                      onChange={(e) => setReviewName(e.target.value)}
                      className={`w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-600 ${!!session?.user?.name ? "bg-slate-100 text-slate-500" : ""}`}
                      placeholder="Ej. Juan Pérez"
                    />
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Comentario</label>
                    <textarea 
                      required
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-600 h-24 resize-none"
                      placeholder="¿Qué te pareció el producto?"
                    />
                  </div>

                  <div className="flex gap-4">
                    <button 
                      type="button" 
                      onClick={() => setShowReviewForm(false)}
                      className="px-6 py-3 rounded-xl border border-slate-200 font-bold hover:bg-slate-100 transition"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit" 
                      disabled={isSubmittingReview}
                      className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      {isSubmittingReview ? "Enviando..." : "Enviar valoración"}
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  {product.reviewsData.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-slate-500 mb-4">Aún no hay valoraciones para este producto.</p>
                      <button 
                        onClick={() => handleOpenReviewForm()}
                        className="border border-slate-300 font-bold px-6 py-2 rounded-xl text-slate-700 hover:bg-slate-50 transition"
                      >
                        Sé el primero en valorar
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {product.reviewsData.map((rev) => (
                        <div key={rev.id} className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-bold text-slate-900">{rev.authorName}</span>
                            <div className="flex text-amber-400">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className={`w-4 h-4 ${i < rev.rating ? "fill-amber-400" : "text-slate-300"}`} />
                              ))}
                            </div>
                          </div>
                          <p className="text-slate-600 text-sm">&quot;{rev.comment}&quot;</p>
                          <span className="text-xs text-slate-400 mt-4 block">
                            {new Date(rev.createdAt).toLocaleDateString('es-PE')}
                          </span>
                        </div>
                      ))}
                      <div className="md:col-span-2 text-center mt-4">
                         <button 
                           onClick={() => handleOpenReviewForm()}
                           className="bg-slate-900 text-white font-bold px-8 py-3 rounded-xl hover:bg-blue-600 transition"
                         >
                           Dejar una valoración
                         </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* BUNDLE: COMPRADOS JUNTOS HABITUALMENTE */}
      <div className="max-w-7xl mx-auto px-4 w-full">
        <ProductBundle 
          mainProduct={{
            id: product.id,
            name: product.name,
            price: currentPrice,
            image: product.images[0],
            variantId: selectedVariant?.id,
            stock: currentStock
          }}
          suggestedProducts={relatedProducts}
        />
      </div>

      {/* PRODUCTOS RELACIONADOS */}
      {relatedProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 w-full mt-12 pt-12 border-t border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              También te puede interesar...
            </h2>
          </div>
          
          <Carousel opts={{ align: "start" }} className="w-full relative">
            <CarouselContent className="-ml-4">
              {relatedProducts.map((prod) => (
                <CarouselItem key={prod.id} className="pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4">
                  <ProductCard product={prod} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="hidden md:flex absolute -top-14 right-12 gap-2">
              <CarouselPrevious className="relative left-0 top-0 translate-y-0 w-10 h-10 border-slate-200 bg-white" />
              <CarouselNext className="relative right-0 top-0 translate-y-0 w-10 h-10 border-slate-200 bg-white" />
            </div>
          </Carousel>
        </section>
      )}

      {/* VISTOS RECIENTEMENTE */}
      <RecentlyViewed currentProductId={product.id} />

      {/* STICKY ADD TO CART BAR (MOBILE ONLY) */}
      <div 
        className={`fixed bottom-[64px] sm:bottom-[70px] left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 z-40 transform transition-all duration-300 md:hidden flex items-center justify-between shadow-[0_-4px_16px_rgba(0,0,0,0.08)] ${
          showStickyCart ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex flex-col min-w-0 pr-3">
          <span className="text-xs font-bold text-slate-900 truncate max-w-[170px]">{product.name}</span>
          <span className="text-blue-600 font-black text-sm">S/ {currentPrice.toFixed(2)}</span>
        </div>
        <button 
          onClick={handleAddToCart}
          disabled={currentStock === 0}
          className="bg-blue-600 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-blue-700 active:scale-95 transition shadow-md shadow-blue-200 flex items-center gap-2 text-xs shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAdded ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
          {currentStock === 0 ? "Agotado" : isAdded ? "¡Listo!" : "Comprar"}
        </button>
      </div>

    </div>
  );
}
