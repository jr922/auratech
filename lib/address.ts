/** Misma composición que usa el checkout para Order.shippingAddress */
export function formatAddress(a: {
  addressLine: string;
  city: string;
  province?: string | null;
  state: string;
}) {
  return [a.addressLine, a.city, a.province, a.state].filter(Boolean).join(", ");
}
