"use client";

import { useState } from "react";
import Image from "next/image";

export default function BrandImageFallback({ brand, isSidebar = false }: { brand: any, isSidebar?: boolean }) {
  const [hasError, setHasError] = useState(false);

  if (!brand.imageUrl || hasError) {
    if (isSidebar) {
      return <span className="truncate">{brand.name}</span>;
    }
    return (
      <span className="text-xl font-black text-slate-400 hover:text-slate-900 transition-colors px-4 text-center">
        {brand.name}
      </span>
    );
  }

  return (
    <div className={isSidebar ? "relative w-full h-full" : "relative w-24 h-12"}>
      <Image 
        src={brand.imageUrl} 
        alt={brand.name} 
        fill 
        unoptimized={true} 
        onError={() => setHasError(true)}
        className={isSidebar ? "object-contain p-2 mix-blend-multiply transition-transform" : "object-contain"} 
        sizes="100px"
      />
    </div>
  );
}
