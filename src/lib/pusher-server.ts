/**
 * Pusher server-side trigger for realtime order status updates.
 * Call after updating order status in API routes.
 */

import Pusher from "pusher";

const pusher =
  process.env.PUSHER_APP_ID && process.env.PUSHER_SECRET
    ? new Pusher({
        appId: process.env.PUSHER_APP_ID,
        key: process.env.PUSHER_KEY!,
        secret: process.env.PUSHER_SECRET!,
        cluster: process.env.PUSHER_CLUSTER ?? "ap1",
        useTLS: true,
      })
    : null;

export type OrderStatusPayload = {
  order_status: string;
  updated_at: string;
};

export function triggerOrderStatusUpdate(
  orderId: string,
  payload: OrderStatusPayload
): void {
  if (!pusher) return;
  pusher
    .trigger(`order-${orderId}`, "status-update", payload)
    .catch((err) => console.error("Pusher trigger error:", err));
}
