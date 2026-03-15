"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function TrackOrderPage() {
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = orderNumber.trim();
    if (!trimmed) {
      toast.error("Enter your order number");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/orders/lookup?order_number=${encodeURIComponent(trimmed)}`
      );
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 404) toast.error("Order not found. Check the number and try again.");
        else toast.error(data.error ?? "Something went wrong");
        return;
      }
      router.push(`/order/${data.id}`);
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container max-w-md mx-auto px-4 py-8 pb-24">
      <div className="flex flex-col items-center text-center mb-8">
        <div className="rounded-full bg-primary/10 p-4 mb-4">
          <PackageSearch className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-semibold text-foreground">Track my order</h1>
        <p className="text-muted-foreground mt-2">
          Enter your order number to see status and delivery updates.
        </p>
      </div>
      <Card className="border border-border rounded-2xl">
        <CardHeader>
          <h2 className="font-semibold text-foreground">Order number</h2>
          <p className="text-sm text-muted-foreground">
            Find it in your confirmation (e.g. MK-20240315-001)
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="order_number" className="sr-only">
                Order number
              </Label>
              <Input
                id="order_number"
                type="text"
                placeholder="e.g. MK-20240315-001"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                className="font-medium"
                disabled={loading}
                autoFocus
              />
            </div>
            <Button
              type="submit"
              className="w-full rounded-full font-medium"
              size="lg"
              disabled={loading}
            >
              {loading ? "Looking up…" : "Track order"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <p className="text-center text-sm text-muted-foreground mt-6">
        <Link href="/" className="text-primary hover:underline">
          Back to home
        </Link>
      </p>
    </div>
  );
}
