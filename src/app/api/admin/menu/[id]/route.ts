/**
 * Admin: update or delete menu item.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminFromCookie } from "@/lib/auth";
import { z } from "zod";

const updateItemSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  price_normal: z.number().int().min(0).optional(),
  price_full: z.number().int().min(0).optional(),
  category: z.enum(["BREAKFAST", "LUNCH", "DINNER"]).optional(),
  image: z.string().optional().nullable(),
  availability: z.boolean().optional(),
});

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
  const parsed = updateItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;
  const item = await prisma.menuItem.update({
    where: { id },
    data: {
      ...(data.name != null && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.price_normal != null && { priceNormal: data.price_normal }),
      ...(data.price_full != null && { priceFull: data.price_full }),
      ...(data.category != null && { category: data.category }),
      ...(data.image !== undefined && { image: data.image }),
      ...(data.availability !== undefined && { availability: data.availability }),
    },
  });
  return NextResponse.json(item);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminFromCookie();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  await prisma.menuItem.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
