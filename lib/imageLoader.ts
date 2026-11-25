/**
 * Custom Next.js Image Loader para Aura Tech.
 *
 * - Evita usar `/_next/image` (elimina el error 402 por cuota de Image Optimization en Vercel Hobby).
 * - Optimiza automáticamente las imágenes alojadas en Cloudinary con `f_auto,q_auto,c_limit`
 *   y 3 anchos fijos (400, 800, 1200) para mantener el consumo de transformaciones al mínimo.
 * - Sirve imágenes locales (`/public`) y otros dominios externos directamente sin pasar por Vercel.
 */
function bucketWidth(width: number): number {
  if (width <= 400) return 400;
  if (width <= 800) return 800;
  return 1200;
}

export default function imageLoader({
  src,
  width,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  if (!src) return src;

  const isCloudinary =
    (src.startsWith("https://res.cloudinary.com/") ||
      src.startsWith("http://res.cloudinary.com/")) &&
    src.includes("/image/upload/");

  if (isCloudinary) {
    const secureSrc = src.replace(/^http:\/\//, "https://");
    const uploadMarker = "/image/upload/";
    const markerIndex = secureSrc.indexOf(uploadMarker);
    const prefix = secureSrc.slice(0, markerIndex);
    const rest = secureSrc.slice(markerIndex + uploadMarker.length);

    if (!rest) return secureSrc;

    // Si ya trae transformaciones explícitas antes de la versión/ruta, no duplicar
    const firstSegment = rest.split("/")[0] || "";
    const isVersionSegment = /^v\d+$/.test(firstSegment);
    const alreadyHasTransforms =
      !isVersionSegment && /(?:^|,)(?:f_|q_|w_|h_|c_)/.test(firstSegment);

    if (alreadyHasTransforms) {
      return secureSrc;
    }

    const normalizedWidth = bucketWidth(width);
    return `${prefix}${uploadMarker}f_auto,q_auto,c_limit,w_${normalizedWidth}/${rest}`;
  }

  // Imágenes locales (/iphone.webp, /logos/..., /brands/...) u otros hosts: directas
  return src;
}
