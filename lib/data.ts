export interface Product {
  id: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  originalPrice?: number;
  discountBadge?: string;
  isNew?: boolean;
  images: string[];
  rating?: number;
  reviews?: number;
  variants?: unknown[];
  stock?: number;
}
