/**
 * Admin: list all menu items or create new item.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminFromCookie } from "@/lib/auth";
import { z } from "zod";

const createItemSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price_normal: z.number().int().min(0),
  price_full: z.number().int().min(0),
  category: z.enum(["BREAKFAST", "LUNCH", "DINNER"]),
  image: z.string().optional(),
  availability: z.boolean().optional(),
});

export async function GET() {
  const admin = await getAdminFromCookie();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const items = await prisma.menuItem.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
  return NextResponse.json(items);
}

export async function POST(request: NextRequest) {
  const admin = await getAdminFromCookie();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const parsed = createItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const item = await prisma.menuItem.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      priceNormal: parsed.data.price_normal,
      priceFull: parsed.data.price_full,
      category: parsed.data.category,
      image: parsed.data.image ?? null,
      availability: parsed.data.availability ?? true,
    },
  });
  return NextResponse.json(item);
}
