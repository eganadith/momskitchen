"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useCartStore } from "@/store/cart-store";
import { PortionSize } from "@/types";

export default function CartPage() {
  const { items, updateQuantity, removeItem, total } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="container px-4 py-12 text-center">
        <p className="text-muted-foreground mb-4">Your cart is empty.</p>
        <Link href="/menu">
          <Button>Browse menu</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container px-4 py-6 pb-24">
      <h1 className="text-2xl font-bold mb-6">Your cart</h1>
      <div className="space-y-4">
        {items.map((item) => (
          <Card key={`${item.menuItemId}-${item.portion}`}>
            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-muted-foreground">
                  {item.portion} · LKR {item.price} each
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    updateQuantity(
                      item.menuItemId,
                      item.portion as PortionSize,
                      item.quantity - 1
                    )
                  }
                >
                  -
                </Button>
                <span className="w-8 text-center">{item.quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    updateQuantity(
                      item.menuItemId,
                      item.portion as PortionSize,
                      item.quantity + 1
                    )
                  }
                >
                  +
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(item.menuItemId, item.portion as PortionSize)}
                >
                  Remove
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <span className="font-semibold">Total</span>
          <span>LKR {total()}</span>
        </CardHeader>
        <CardContent>
          <Link href="/checkout" className="block">
            <Button className="w-full" size="lg">
              Proceed to checkout
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
