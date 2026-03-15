import Link from "next/link";
import Image from "next/image";

export const dynamic = "force-dynamic";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { getActiveMealPeriod } from "@/lib/menu-times";
import { getMenuOverride } from "@/lib/config";
import { TimeBanner } from "@/components/menu/TimeBanner";
import { MenuCard } from "@/components/menu/MenuCard";

async function getMenuData() {
  const override = await getMenuOverride();
  try {
    const period = getActiveMealPeriod();
    if (!override && !period) return { open: false, items: [] };
    const category = period ? period.toUpperCase() as "BREAKFAST" | "LUNCH" | "DINNER" : null;
    const categories = override && !category
      ? (["BREAKFAST", "LUNCH", "DINNER"] as const)
      : category ? [category] : [];
    const items = categories.length
      ? await prisma.menuItem.findMany({
          where: { availability: true, category: { in: [...categories] } },
          orderBy: { name: "asc" },
        })
      : [];
    return { open: true, items };
  } catch {
    return { open: override, items: [] };
  }
}

export default async function HomePage() {
  const { open, items } = await getMenuData();

  return (
    <div className="container px-4 py-8 pb-24 max-w-[980px] mx-auto">
      <section className="flex flex-col items-center text-center py-8 md:py-14">
        <div className="relative w-full max-w-2xl mx-auto rounded-2xl overflow-hidden mb-8">
          <Image
            src="/mom-kitchen.jpeg"
            alt="Mama's Kitchen delivery on campus"
            width={800}
            height={500}
            className="w-full h-auto object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 800px"
          />
        </div>
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground">
          Mama&apos;s Kitchen
        </h1>
        <p className="text-muted-foreground mt-3 text-[19px] md:text-xl max-w-lg leading-snug">
          Campus food delivery — order your meal in a tap.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-3 mt-8">
          {open ? (
            <Link href="/menu">
              <Button size="lg" className="text-[17px] font-medium px-8 min-h-[44px] rounded-full bg-primary hover:bg-primary/90">
                Order now
              </Button>
            </Link>
          ) : null}
          <Link href="/track" className="text-primary font-medium hover:underline text-[15px]">
            Track my order
          </Link>
        </div>
      </section>

      {!open ? (
        <TimeBanner />
      ) : (
        <section className="mt-12">
          <h2 className="text-2xl font-semibold mb-6 text-foreground">Today&apos;s menu</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.slice(0, 6).map((item) => (
              <MenuCard key={item.id} item={item} />
            ))}
          </div>
          {items.length > 6 && (
            <div className="mt-8 text-center">
              <Link href="/menu">
                <Button variant="outline" className="rounded-full font-medium">
                  View full menu
                </Button>
              </Link>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
