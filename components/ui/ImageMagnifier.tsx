"use client";

import React, { useState, MouseEvent, useRef } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ImageMagnifierProps {
  src: string;
  alt: string;
  className?: string; // Classes for the wrapper
  imageClassName?: string; // Classes for the next/image
  zoomLevel?: number;
}

export default function ImageMagnifier({ src, alt, className, imageClassName, zoomLevel = 2 }: ImageMagnifierProps) {
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    
    // Evitar zoom si es táctil/móvil (donde el hover no tiene mucho sentido o se traba)
    if (window.matchMedia("(hover: none)").matches) return;

    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    
    setPosition({ x, y });
  };

  return (
    <div 
      ref={containerRef}
      className={cn("relative overflow-hidden cursor-crosshair w-full h-full", className)}
      onMouseEnter={() => {
        if (!window.matchMedia("(hover: none)").matches) {
          setIsHovered(true);
        }
      }}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
    >
      {/* Imagen Base (Visible normalmente) */}
      <Image
        src={src}
        alt={alt}
        fill
        className={cn(
          "transition-opacity duration-200",
          imageClassName,
          isHovered ? "opacity-0" : "opacity-100"
        )}
        sizes="(max-width: 768px) 100vw, 50vw"
      />

      {/* Imagen Lupa (Visible en Hover) */}
      {isHovered && (
        <div className="absolute inset-0 z-10 bg-white/95">
          <Image
            src={src}
            alt={`${alt} zoom`}
            fill
            className={cn("transition-transform duration-75 ease-out", imageClassName)}
            style={{
              transformOrigin: `${position.x}% ${position.y}%`,
              transform: `scale(${zoomLevel})`
            }}
          />
        </div>
      )}
    </div>
  );
}
