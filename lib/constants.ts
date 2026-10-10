/** Almacén donde se descuenta/repone el stock de las ventas web */
export const MAIN_WAREHOUSE_ID = "ALMACEN_PRINCIPAL";

/** Minutos que se reserva el stock de una orden sin pagar, según el método de pago */
export const ORDER_PAYMENT_TTL_MINUTES = {
  card: 30, // La pasarela debe completarse en la misma sesión
  default: 48 * 60, // Yape / Plin / transferencia: tiempo para enviar el comprobante
} as const;

/** Estados desde los cuales una orden todavía puede cancelarse */
export const CANCELLABLE_STATUSES = ["PENDING", "PAID", "PREPARING"] as const;
