/**
 * Admin: get or update system config (menu override, order limits).
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminFromCookie } from "@/lib/auth";
import {
  getMenuOverride,
  getOrderLimit,
  setMenuOverride,
  setOrderLimit,
} from "@/lib/config";

export async function GET() {
  const admin = await getAdminFromCookie();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const [menuOverride, breakfastLimit, lunchLimit, dinnerLimit] =
    await Promise.all([
      getMenuOverride(),
      getOrderLimit("BREAKFAST"),
      getOrderLimit("LUNCH"),
      getOrderLimit("DINNER"),
    ]);
  return NextResponse.json({
    menu_override: menuOverride,
    breakfast_order_limit: breakfastLimit,
    lunch_order_limit: lunchLimit,
    dinner_order_limit: dinnerLimit,
  });
}

export async function PATCH(request: NextRequest) {
  const admin = await getAdminFromCookie();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  if (typeof body.menu_override === "boolean") {
    await setMenuOverride(body.menu_override);
  }
  if (typeof body.breakfast_order_limit === "number") {
    await setOrderLimit("BREAKFAST", body.breakfast_order_limit);
  }
  if (typeof body.lunch_order_limit === "number") {
    await setOrderLimit("LUNCH", body.lunch_order_limit);
  }
  if (typeof body.dinner_order_limit === "number") {
    await setOrderLimit("DINNER", body.dinner_order_limit);
  }
  return NextResponse.json({ success: true });
}
