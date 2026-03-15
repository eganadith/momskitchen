/**
 * Look up order by order number (for "Track my order").
 * Returns order id so client can redirect to /order/[id].
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const orderNumber = request.nextUrl.searchParams.get("order_number")?.trim();
  if (!orderNumber) {
    return NextResponse.json(
      { error: "Order number is required" },
      { status: 400 }
    );
  }
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    select: { id: true, orderNumber: true },
  });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  return NextResponse.json({ id: order.id, orderNumber: order.orderNumber });
}
