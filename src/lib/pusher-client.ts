/**
 * Pusher client-side subscription for order tracking page.
 * Use in a client component to subscribe to order-{orderId} channel.
 */

"use client";

import Pusher from "pusher-js";

let pusherClient: Pusher | null = null;

function getPusherClient(): Pusher | null {
  if (typeof window === "undefined") return null;
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? "ap1";
  if (!key) return null;
  if (!pusherClient) {
    pusherClient = new Pusher(key, { cluster });
  }
  return pusherClient;
}

export type OrderStatusPayload = {
  order_status: string;
  updated_at: string;
};

export function subscribeToOrderStatus(
  orderId: string,
  onStatus: (payload: OrderStatusPayload) => void
): () => void {
  const client = getPusherClient();
  if (!client) return () => {};
  const channel = client.subscribe(`order-${orderId}`);
  channel.bind("status-update", onStatus);
  return () => {
    channel.unbind("status-update");
    client.unsubscribe(`order-${orderId}`);
  };
}
