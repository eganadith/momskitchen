/**
 * PayHere payment notification webhook.
 * Verifies X-Signature (HMAC-SHA1) and updates payment + order status.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPayHereWebhook } from "@/lib/payhere";
import { triggerOrderStatusUpdate } from "@/lib/pusher-server";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature") ?? null;
  if (!verifyPayHereWebhook(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  let payload: {
    order_id?: string;
    payment_id?: string;
    status?: string;
    payhere_amount?: string;
  };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const orderId = payload.order_id;
  if (!orderId) {
    return NextResponse.json({ error: "Missing order_id" }, { status: 400 });
  }
  const paymentStatus =
    payload.status === "2" || payload.status === "success" ? "PAID" : "FAILED";
  await prisma.payment.updateMany({
    where: { orderId },
    data: {
      status: paymentStatus,
      ...(payload.payment_id
        ? { payherePaymentId: payload.payment_id }
        : {}),
    },
  });
  await prisma.order.update({
    where: { id: orderId },
    data: { paymentStatus },
  });
  if (paymentStatus === "PAID") {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });
    if (order) {
      triggerOrderStatusUpdate(orderId, {
        order_status: order.orderStatus,
        updated_at: order.updatedAt.toISOString(),
      });
    }
  }
  return NextResponse.json({ received: true });
}
