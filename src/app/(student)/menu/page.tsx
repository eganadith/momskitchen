import { TimeBanner } from "@/components/menu/TimeBanner";

export const dynamic = "force-dynamic";
import { MenuCard } from "@/components/menu/MenuCard";
import { getMenuOverride } from "@/lib/config";
import { getActiveMealPeriod, periodToCategory } from "@/lib/menu-times";
import { prisma } from "@/lib/db";

async function getMenu() {
  const override = await getMenuOverride();
  try {
    const period = getActiveMealPeriod();
    const category = periodToCategory(period);
    if (!override && !period) return { open: false as const, items: [] };
    const categories = override && !category
      ? (["BREAKFAST", "LUNCH", "DINNER"] as const)
      : category ? [category] : [];
    const items = categories.length
      ? await prisma.menuItem.findMany({
          where: { availability: true, category: { in: [...categories] } },
          orderBy: { name: "asc" },
        })
      : [];
    return { open: true as const, items };
  } catch {
    return { open: override, items: [] };
  }
}

export default async function MenuPage() {
  const { open, items } = await getMenu();

  return (
    <div className="container px-4 py-8 pb-24 max-w-[980px] mx-auto">
      <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">Today&apos;s Menu</h1>
      <p className="text-muted-foreground text-base mt-2 mb-8">Fresh meals delivered to campus</p>
      {!open ? (
        <TimeBanner />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <MenuCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
