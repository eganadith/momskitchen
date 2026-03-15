"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PlaceAutocomplete } from "@/components/checkout/PlaceAutocomplete";
import { useCartStore } from "@/store/cart-store";
import { toast } from "sonner";

const checkoutSchema = z.object({
  customer_name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
  location_id: z.string().min(1, "Delivery location is required"),
  delivery_address: z.string().optional(),
  delivery_lat: z.number().optional(),
  delivery_lng: z.number().optional(),
  delivery_note: z.string().optional(),
  special_note: z.string().optional(),
  payment_method: z.enum(["CARD", "LANKA_QR", "CASH"]),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

interface LocationOption {
  id: string;
  name: string;
  slug: string;
}

const QUICK_LOCATIONS = [
  "hostel-a",
  "hostel-b",
  "library",
  "main-gate",
  "lecture-hall",
  "other",
];

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { items, total, clearCart } = useCartStore();
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customer_name: "",
      phone: "",
      location_id: "",
      delivery_address: "",
      delivery_lat: undefined as number | undefined,
      delivery_lng: undefined as number | undefined,
      delivery_note: "",
      special_note: "",
      payment_method: "CASH",
    },
  });

  useEffect(() => {
    fetch("/api/locations")
      .then((r) => r.json())
      .then(setLocations);
  }, []);

  useEffect(() => {
    if (searchParams.get("cancelled") === "1") {
      toast.error("Payment was cancelled.");
    }
  }, [searchParams]);

  const otherLocationId = locations.find((l) => l.slug === "other")?.id;
  const useCustomLocation = !!form.watch("location_id") && form.watch("location_id") === otherLocationId;

  const onSubmit = useCallback(
    async (data: CheckoutForm) => {
      if (items.length === 0) {
        toast.error("Cart is empty.");
        return;
      }
      if (otherLocationId && data.location_id === otherLocationId && !data.delivery_address?.trim()) {
        toast.error("Please enter your exact delivery address for this location.");
        return;
      }
      setSubmitting(true);
      try {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customer_name: data.customer_name,
            phone: data.phone,
            location_id: data.location_id,
            delivery_address: data.delivery_address?.trim() || undefined,
            delivery_lat: data.delivery_lat,
            delivery_lng: data.delivery_lng,
            delivery_note: data.delivery_note || undefined,
            special_note: data.special_note || undefined,
            payment_method: data.payment_method,
            items: items.map((i) => ({
              menu_item_id: i.menuItemId,
              portion: i.portion,
              quantity: i.quantity,
            })),
          }),
        });
        const text = await res.text();
        let json: { error?: string; orderId?: string; payHereRedirectUrl?: string };
        try {
          json = text ? JSON.parse(text) : {};
        } catch {
          toast.error(res.ok ? "Something went wrong" : `Failed to place order (${res.status})`);
          return;
        }
        if (!res.ok) {
          toast.error(json.error ?? "Failed to place order");
          return;
        }
        clearCart();
        if (json.payHereRedirectUrl) {
          window.location.href = json.payHereRedirectUrl;
          return;
        }
        toast.success("Order placed!");
        router.push(`/order/${json.orderId}`);
      } catch (e) {
        toast.error("Something went wrong. Check your connection and try again.");
      } finally {
        setSubmitting(false);
      }
    },
    [items, clearCart, router, otherLocationId]
  );

  if (items.length === 0 && !submitting) {
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
    <div className="container max-w-lg mx-auto px-4 py-8 pb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Checkout</h1>
        <p className="text-base text-muted-foreground mt-2">Complete your order</p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="customer_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Your name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone number</FormLabel>
                <FormControl>
                  <Input type="tel" placeholder="07XXXXXXXX" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="location_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Delivery location</FormLabel>
                <div className="flex flex-wrap gap-2 mb-2">
                  {locations
                    .filter((loc) => QUICK_LOCATIONS.includes(loc.slug))
                    .map((loc) => (
                      <Button
                        key={loc.id}
                        type="button"
                        variant={field.value === loc.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => field.onChange(loc.id)}
                      >
                        {loc.slug === "other" ? "Add my location" : loc.name}
                      </Button>
                    ))}
                </div>
                <FormControl>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                  >
                    <option value="">Select location</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.slug === "other" ? "Add my location" : loc.name}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {useCustomLocation && (
            <FormField
              control={form.control}
              name="delivery_address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Delivery address (search on map)</FormLabel>
                  <FormControl>
                    <PlaceAutocomplete
                      value={field.value}
                      onChange={field.onChange}
                      onPlaceSelect={(lat, lng) => {
                        form.setValue("delivery_lat", lat);
                        form.setValue("delivery_lng", lng);
                      }}
                      placeholder="Type to search address or place…"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <FormField
            control={form.control}
            name="delivery_note"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Delivery instruction (optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Call when you arrive" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="special_note"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Special notes (optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Dietary or other requests" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="payment_method"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment</FormLabel>
                <FormControl>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="payment_method"
                        value="CASH"
                        checked={field.value === "CASH"}
                        onChange={() => field.onChange("CASH")}
                      />
                      Cash on delivery
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="payment_method"
                        value="CARD"
                        checked={field.value === "CARD"}
                        onChange={() => field.onChange("CARD")}
                      />
                      Pay online (Visa / Mastercard)
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="payment_method"
                        value="LANKA_QR"
                        checked={field.value === "LANKA_QR"}
                        onChange={() => field.onChange("LANKA_QR")}
                      />
                      LankaQR
                    </label>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-4">
              <span className="font-semibold">Total</span>
              <span>LKR {total()}</span>
            </CardHeader>
            <CardContent>
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={submitting}
              >
                {submitting ? "Placing order…" : "Place order"}
              </Button>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
}
