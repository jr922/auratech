import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import TopBar from "@/components/layout/TopBar";
import Header from "@/components/layout/Header";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BottomNav from "@/components/layout/BottomNav";
import FloatingElements from "@/components/layout/FloatingElements";
import { CartSync } from "@/components/CartSync";
import AuthProvider from "@/components/providers/AuthProvider";

// import NewsletterModal from "@/components/layout/NewsletterModal";
import { Toaster } from "sonner";
import { getCachedCategories } from "@/lib/api/categories";
import { GoogleTagManager } from '@next/third-parties/google';


const inter = Inter({ subsets: ["latin"] });

// viewport-fit=cover habilita env(safe-area-inset-*) en iPhone (notch / barra inferior)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0f172a",
};

export const metadata: Metadata = {
  title: "Aura Tech - Tu tienda de tecnología",
  description: "Compra lo mejor en tecnología, smartphones, laptops y más.",
  openGraph: {
    title: "Aura Tech - Tu tienda de tecnología",
    description: "Compra lo mejor en tecnología, smartphones, laptops y más.",
    url: "https://auratech.pe",
    siteName: "Aura Tech",
    locale: "es_PE",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};


export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const allCategories = await getCachedCategories();
  const categories = allCategories.map(c => ({ 
    id: c.id,
    name: c.name, 
    slug: c.slug,
    children: c.children?.map((child: { id: string; name: string; slug: string }) => ({ id: child.id, name: child.name, slug: child.slug })) || []
  }));

  return (
    <html lang="es">
      <GoogleTagManager gtmId="GTM-TXH9M2FW" />
      <body className={inter.className}>
        <AuthProvider>
          <FloatingElements />
          <CartSync />
          <TopBar />
          <Suspense fallback={<div className="h-20 bg-white border-b border-slate-100" />}>
            <Header categories={categories} />
          </Suspense>
          <Navbar />
          <main className="min-h-screen pb-20 md:pb-0">
            {children}
          </main>
          <Footer />
          <BottomNav />
          {/* <NewsletterModal /> */}
          <Toaster position="bottom-right" richColors mobileOffset={{ bottom: 88, left: 12, right: 12 }} />
        </AuthProvider>
      </body>
    </html>
  );
}
