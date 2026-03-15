/**
 * Update order status (admin). Triggers Pusher for realtime tracking.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminFromCookie } from "@/lib/auth";
import { triggerOrderStatusUpdate } from "@/lib/pusher-server";

const ALLOWED_STATUSES = [
  "PENDING",
  "PREPARING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
] as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminFromCookie();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await request.json();
  const { order_status } = body as { order_status?: string };
  if (!order_status || !ALLOWED_STATUSES.includes(order_status as (typeof ALLOWED_STATUSES)[number])) {
    return NextResponse.json(
      { error: "Invalid order_status" },
      { status: 400 }
    );
  }
  const order = await prisma.order.update({
    where: { id },
    data: { orderStatus: order_status as (typeof ALLOWED_STATUSES)[number] },
  });
  triggerOrderStatusUpdate(order.id, {
    order_status: order.orderStatus,
    updated_at: order.updatedAt.toISOString(),
  });
  return NextResponse.json(order);
}
