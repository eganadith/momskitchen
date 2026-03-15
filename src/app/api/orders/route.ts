/**
 * Create order (student) or list orders (admin).
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getActiveMealPeriod, periodToCategory } from "@/lib/menu-times";
import { getMenuOverride, getOrderLimit } from "@/lib/config";
import { buildPayHereCheckout } from "@/lib/payhere";
import { getAdminFromCookie } from "@/lib/auth";
import { z } from "zod";

const createOrderSchema = z.object({
  customer_name: z.string().min(1),
  phone: z.string().min(1),
  location_id: z.string().min(1),
  delivery_address: z.string().optional(),
  delivery_lat: z.number().optional(),
  delivery_lng: z.number().optional(),
  delivery_note: z.string().optional(),
  special_note: z.string().optional(),
  payment_method: z.enum(["CARD", "LANKA_QR", "CASH"]),
  items: z.array(
    z.object({
      menu_item_id: z.string(),
      portion: z.enum(["NORMAL", "FULL"]),
      quantity: z.number().int().min(1),
    })
  ),
});

function generateOrderNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `MK-${date}-${random}`;
}

export async function GET(request: NextRequest) {
  const admin = await getAdminFromCookie();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const mealType = searchParams.get("meal_type");
  const status = searchParams.get("status");
  const orderStatus = status as "PENDING" | "PREPARING" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED" | undefined;
  const orders = await prisma.order.findMany({
    where: {
      ...(mealType ? { mealType: mealType as "BREAKFAST" | "LUNCH" | "DINNER" } : {}),
      ...(orderStatus ? { orderStatus } : {}),
    },
    include: {
      location: true,
      orderItems: { include: { menuItem: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(orders);
}

export async function POST(request: NextRequest) {
  try {
    const override = await getMenuOverride();
    const period = getActiveMealPeriod();
    let category = periodToCategory(period);
    if (!override && !category) {
      return NextResponse.json(
        { error: "Orders are currently closed." },
        { status: 400 }
      );
    }
    if (!category) category = "LUNCH";

    const body = await request.json();
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const data = parsed.data;

    const locationExists = await prisma.location.findUnique({
      where: { id: data.location_id },
    });
    if (!locationExists) {
      return NextResponse.json(
        { error: "Invalid delivery location. Please select a location again." },
        { status: 400 }
      );
    }

    const limit = await getOrderLimit(category);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);
    const countToday = await prisma.order.count({
      where: {
        mealType: category,
        createdAt: { gte: todayStart, lt: todayEnd },
        orderStatus: { not: "CANCELLED" },
      },
    });
    if (countToday >= limit) {
      return NextResponse.json(
        { error: `Order limit reached for ${category}. Try again later.` },
        { status: 400 }
      );
    }

    const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: data.items.map((i) => i.menu_item_id) }, availability: true },
  });
  const menuMap = new Map(menuItems.map((m) => [m.id, m]));
  let total = 0;
  const orderItemsData: { menuItemId: string; portion: "NORMAL" | "FULL"; quantity: number; price: number }[] = [];
  for (const item of data.items) {
    const menuItem = menuMap.get(item.menu_item_id);
    if (!menuItem) {
      return NextResponse.json(
        { error: `Invalid or unavailable item: ${item.menu_item_id}` },
        { status: 400 }
      );
    }
    const price = item.portion === "FULL" ? menuItem.priceFull : menuItem.priceNormal;
    const lineTotal = price * item.quantity;
    total += lineTotal;
    orderItemsData.push({
      menuItemId: item.menu_item_id,
      portion: item.portion,
      quantity: item.quantity,
      price,
    });
  }

  const orderNumber = generateOrderNumber();
  const order = await prisma.order.create({
    data: {
      orderNumber,
      customerName: data.customer_name,
      phone: data.phone,
      locationId: data.location_id,
      deliveryAddress: data.delivery_address ?? null,
      deliveryLat: data.delivery_lat ?? null,
      deliveryLng: data.delivery_lng ?? null,
      deliveryNote: data.delivery_note ?? null,
      specialNote: data.special_note ?? null,
      paymentMethod: data.payment_method,
      paymentStatus: "UNPAID",
      orderStatus: "PENDING",
      mealType: category,
      orderItems: {
        create: orderItemsData,
      },
      ...(data.payment_method !== "CASH"
        ? {
            payment: {
              create: { amount: total, status: "UNPAID" },
            },
          }
        : {}),
    },
    include: { orderItems: true, payment: true },
  });

  let payHereRedirectUrl: string | null = null;
  if (data.payment_method !== "CASH" && order.payment) {
    const { url } = buildPayHereCheckout(
      order.id,
      orderNumber,
      total,
      data.customer_name,
      data.phone
    );
    payHereRedirectUrl = url;
  }

  // Optional: WhatsApp notification to admin (env ADMIN_WHATSAPP)
  const whatsappNumber = process.env.ADMIN_WHATSAPP;
  if (whatsappNumber) {
    const text = `New order #${orderNumber} from ${data.customer_name}, ${data.phone}. Total: LKR ${total}`;
    const waUrl = `https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
    try {
      await fetch(waUrl, { method: "GET" });
    } catch {
      // ignore
    }
  }

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.orderNumber,
      total,
      payHereRedirectUrl,
    });
  } catch (e) {
    console.error("Order create error:", e);
    return NextResponse.json(
      { error: "Failed to create order. Please try again." },
      { status: 500 }
    );
  }
}
