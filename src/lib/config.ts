/**
 * System config helpers (menu override, order limits).
 * Returns safe defaults when the database is unreachable (e.g. invalid DATABASE_URL).
 */

import { prisma } from "@/lib/db";

// Set to true to temporarily disable time-based menu (always show menu)
const TIME_BASED_MENU_DISABLED = true;

export async function getMenuOverride(): Promise<boolean> {
  if (TIME_BASED_MENU_DISABLED) return true;
  try {
    const row = await prisma.systemConfig.findUnique({
      where: { key: "menu_override" },
    });
    return row?.value === "true";
  } catch {
    return false;
  }
}

export async function getOrderLimit(
  mealType: "BREAKFAST" | "LUNCH" | "DINNER"
): Promise<number> {
  try {
    const key = `${mealType.toLowerCase()}_order_limit`;
    const row = await prisma.systemConfig.findUnique({ where: { key } });
    const val = row?.value ? parseInt(row.value, 10) : 100;
    return isNaN(val) ? 100 : val;
  } catch {
    return 100;
  }
}

export async function setMenuOverride(override: boolean): Promise<void> {
  await prisma.systemConfig.upsert({
    where: { key: "menu_override" },
    update: { value: override ? "true" : "false" },
    create: { key: "menu_override", value: override ? "true" : "false" },
  });
}

export async function setOrderLimit(
  mealType: "BREAKFAST" | "LUNCH" | "DINNER",
  limit: number
): Promise<void> {
  const key = `${mealType.toLowerCase()}_order_limit`;
  await prisma.systemConfig.upsert({
    where: { key },
    update: { value: String(limit) },
    create: { key, value: String(limit) },
  });
}
