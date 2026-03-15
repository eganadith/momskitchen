/**
 * Time-based menu visibility for Mama's Kitchen.
 * Breakfast 6–8, Lunch 11–14, Dinner 17–20 (Sri Lanka time).
 */

import { getHours, getMinutes } from "date-fns";
import { toZonedTime } from "date-fns-tz";

const TIMEZONE = "Asia/Colombo";

export type MealPeriod = "breakfast" | "lunch" | "dinner" | null;

// Time windows in local Sri Lanka time (24h)
const BREAKFAST_START = 6; // 6:00 AM
const BREAKFAST_END = 8; // 8:00 AM
const LUNCH_START = 11; // 11:00 AM
const LUNCH_END = 14; // 2:00 PM
const DINNER_START = 17; // 5:00 PM
const DINNER_END = 20; // 8:00 PM

function getSriLankaNow(): Date {
  try {
    return toZonedTime(new Date(), TIMEZONE);
  } catch {
    return new Date();
  }
}

/**
 * Returns the current active meal period based on time windows.
 */
export function getActiveMealPeriod(): MealPeriod {
  const now = getSriLankaNow();
  const h = getHours(now);
  const m = getMinutes(now);
  const totalMinutes = h * 60 + m;

  const breakfastStart = BREAKFAST_START * 60;
  const breakfastEnd = BREAKFAST_END * 60;
  const lunchStart = LUNCH_START * 60;
  const lunchEnd = LUNCH_END * 60;
  const dinnerStart = DINNER_START * 60;
  const dinnerEnd = DINNER_END * 60;

  if (totalMinutes >= breakfastStart && totalMinutes < breakfastEnd)
    return "breakfast";
  if (totalMinutes >= lunchStart && totalMinutes < lunchEnd) return "lunch";
  if (totalMinutes >= dinnerStart && totalMinutes < dinnerEnd) return "dinner";
  return null;
}

/**
 * Returns true if ordering is open (within any meal window).
 */
export function isOrderingOpen(): boolean {
  return getActiveMealPeriod() !== null;
}

/**
 * Map MealPeriod to Prisma MealCategory enum.
 */
export function periodToCategory(
  period: MealPeriod
): "BREAKFAST" | "LUNCH" | "DINNER" | null {
  if (!period) return null;
  return period.toUpperCase() as "BREAKFAST" | "LUNCH" | "DINNER";
}
