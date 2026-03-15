"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LiveOrderStatus } from "@/components/order/LiveOrderStatus";
import type { OrderResponse } from "@/types";

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = useCallback(() => {
    fetch(`/api/orders/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then(setOrder)
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  if (loading) {
    return (
      <div className="container px-4 py-8">
        <div className="h-8 w-48 animate-pulse rounded bg-muted mb-4" />
        <div className="h-32 animate-pulse rounded bg-muted" />
      </div>
    );
  }
  if (!order) {
    return (
      <div className="container px-4 py-8 text-center">
        <p className="text-muted-foreground">Order not found.</p>
        <Button variant="link" onClick={() => router.push("/")}>
          Back to home
        </Button>
      </div>
    );
  }

  const orderTotal = order.orderItems.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0
  );

  return (
    <div className="container max-w-lg mx-auto px-4 py-6 pb-24">
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">Order</p>
        <h1 className="text-2xl font-bold">{order.orderNumber}</h1>
      </div>
      <Card className="mb-6">
        <CardHeader>
          <h2 className="font-semibold">Status</h2>
        </CardHeader>
        <CardContent>
          <LiveOrderStatus orderId={order.id} initialStatus={order.orderStatus} />
        </CardContent>
      </Card>
      <Card className="mb-6">
        <CardHeader>
          <h2 className="font-semibold">Summary</h2>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>
            <span className="text-muted-foreground">Delivery to:</span>{" "}
            {order.location.name}
          </p>
          {order.deliveryNote && (
            <p>
              <span className="text-muted-foreground">Note:</span>{" "}
              {order.deliveryNote}
            </p>
          )}
          <ul className="border-t pt-2 mt-2 space-y-1">
            {order.orderItems.map((oi) => (
              <li key={oi.id} className="flex justify-between text-sm">
                <span>
                  {oi.menuItem.name} × {oi.quantity} ({oi.portion})
                </span>
                <span>LKR {oi.price * oi.quantity}</span>
              </li>
            ))}
          </ul>
          <p className="font-semibold flex justify-between pt-2">
            Total <span>LKR {orderTotal}</span>
          </p>
        </CardContent>
      </Card>
      <Link href="/menu">
        <Button variant="outline" className="w-full">
          Order again
        </Button>
      </Link>
    </div>
  );
}
