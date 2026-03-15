import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { startOfDay, endOfDay, subDays } from "date-fns";

async function getDashboardStats() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const ordersToday = await prisma.order.findMany({
    where: {
      createdAt: { gte: todayStart, lte: todayEnd },
      orderStatus: { not: "CANCELLED" },
    },
    include: { orderItems: true },
  });
  const revenueToday = ordersToday
    .filter((o) => o.paymentStatus === "PAID")
    .reduce((sum, o) => {
      return sum + o.orderItems.reduce((s, i) => s + i.price * i.quantity, 0);
    }, 0);
  const breakfast = ordersToday.filter((o) => o.mealType === "BREAKFAST").length;
  const lunch = ordersToday.filter((o) => o.mealType === "LUNCH").length;
  const dinner = ordersToday.filter((o) => o.mealType === "DINNER").length;

  const last7 = await Promise.all(
    [0, 1, 2, 3, 4, 5, 6].map((d) => {
      const day = subDays(now, d);
      const start = startOfDay(day);
      const end = endOfDay(day);
      return prisma.order
        .count({
          where: {
            createdAt: { gte: start, lte: end },
            orderStatus: { not: "CANCELLED" },
            paymentStatus: "PAID",
          },
        })
        .then((orders) => ({
          date: day.toISOString().slice(0, 10),
          orders,
        }));
    })
  );
  const orderCountsByDay = last7.reverse();

  return {
    totalOrdersToday: ordersToday.length,
    revenueToday,
    breakfast,
    lunch,
    dinner,
    orderCountsByDay,
  };
}

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-border rounded-2xl">
          <CardHeader className="pb-2">
            <span className="text-base font-semibold text-muted-foreground">
              Orders today
            </span>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{stats.totalOrdersToday}</p>
          </CardContent>
        </Card>
        <Card className="border border-border rounded-2xl">
          <CardHeader className="pb-2">
            <span className="text-base font-semibold text-muted-foreground">
              Revenue today
            </span>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">LKR {stats.revenueToday}</p>
          </CardContent>
        </Card>
        <Card className="border border-border rounded-2xl">
          <CardHeader className="pb-2">
            <span className="text-base font-semibold text-muted-foreground">
              Breakfast / Lunch / Dinner
            </span>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">
              {stats.breakfast} / {stats.lunch} / {stats.dinner}
            </p>
          </CardContent>
        </Card>
      </div>
      <Card className="border border-border rounded-2xl">
        <CardHeader>
          <h2 className="text-xl font-bold text-foreground">Daily sales (last 7 days)</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.orderCountsByDay.map((day) => (
              <div
                key={day.date}
                className="flex justify-between text-base font-semibold"
              >
                <span>{day.date}</span>
                <span>{day.orders} orders</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
