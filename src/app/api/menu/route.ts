/**
 * Time-aware menu: returns current meal items or closed message.
 */

export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  getActiveMealPeriod,
  periodToCategory,
} from "@/lib/menu-times";
import { getMenuOverride } from "@/lib/config";

const CLOSED_MESSAGE =
  "Orders are currently closed. Please check back during meal times.";

export async function GET() {
  const override = await getMenuOverride();
  try {
    const period = getActiveMealPeriod();
    const category = periodToCategory(period);

    if (!override && !period) {
      return NextResponse.json({
        open: false,
        message: CLOSED_MESSAGE,
        period: null,
        items: [],
      });
    }

    const categoriesToShow = override && !category
      ? (["BREAKFAST", "LUNCH", "DINNER"] as const)
      : category
        ? [category]
        : [];

    const items = await prisma.menuItem.findMany({
      where: {
        availability: true,
        ...(categoriesToShow.length
          ? { category: { in: [...categoriesToShow] } }
          : {}),
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      open: true,
      period: period ?? "breakfast",
      items,
    });
  } catch {
    return NextResponse.json({
      open: override,
      message: override ? undefined : CLOSED_MESSAGE,
      period: null,
      items: [],
    });
  }
}
