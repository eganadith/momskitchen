"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useCartStore } from "@/store/cart-store";
import type { MenuItemResponse, PortionSize } from "@/types";
import { toast } from "sonner";

export default function MenuItemPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [item, setItem] = useState<MenuItemResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [portion, setPortion] = useState<PortionSize>("NORMAL");
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    fetch(`/api/menu/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then(setItem)
      .catch(() => setItem(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = useCallback(() => {
    if (!item) return;
    addItem({
      menuItemId: item.id,
      name: item.name,
      portion,
      quantity,
      priceNormal: item.priceNormal,
      priceFull: item.priceFull,
    });
    toast.success("Added to cart");
    router.push("/menu");
  }, [item, portion, quantity, addItem, router]);

  if (loading) {
    return (
      <div className="container px-4 py-8">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="mt-4 h-32 animate-pulse rounded bg-muted" />
      </div>
    );
  }
  if (!item) {
    return (
      <div className="container px-4 py-8 text-center">
        <p className="text-muted-foreground">Item not found.</p>
        <Button variant="link" onClick={() => router.push("/menu")}>
          Back to menu
        </Button>
      </div>
    );
  }

  const price = portion === "FULL" ? item.priceFull : item.priceNormal;

  return (
    <div className="container px-4 py-6 pb-24">
      <Card className="overflow-hidden">
        {item.image ? (
          <div className="relative h-48 w-full bg-muted">
            <Image
              src={item.image}
              alt={item.name}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="flex h-32 items-center justify-center bg-muted text-5xl">
            🍛
          </div>
        )}
        <CardContent className="p-6 space-y-6">
          <h1 className="text-2xl font-bold">{item.name}</h1>
          {item.description && (
            <p className="text-muted-foreground">{item.description}</p>
          )}
          <div className="space-y-2">
            <Label>Portion</Label>
            <div className="flex gap-2">
              <Button
                variant={portion === "NORMAL" ? "default" : "outline"}
                onClick={() => setPortion("NORMAL")}
                className="flex-1"
              >
                Normal — LKR {item.priceNormal}
              </Button>
              <Button
                variant={portion === "FULL" ? "default" : "outline"}
                onClick={() => setPortion("FULL")}
                className="flex-1"
              >
                Full — LKR {item.priceFull}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Quantity</Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                -
              </Button>
              <span className="w-8 text-center font-medium">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity((q) => q + 1)}
              >
                +
              </Button>
            </div>
          </div>
          <Button
            className="w-full"
            size="lg"
            onClick={handleAddToCart}
          >
            Add to cart · LKR {price * quantity}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
