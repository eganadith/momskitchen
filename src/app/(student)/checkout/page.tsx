"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MapPin, User, CreditCard, MessageCircle } from "lucide-react";
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
import { MapPicker } from "@/components/checkout/MapPicker";
import { useCartStore } from "@/store/cart-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

const CAMPUS_LOCATIONS = ["hostel-a", "hostel-b", "library", "main-gate", "lecture-hall"];

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
  const [mapPickerOpen, setMapPickerOpen] = useState(false);

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
      } catch {
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
    <div className="container max-w-lg mx-auto px-4 py-6 pb-28">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Checkout</h1>
        <p className="text-sm text-muted-foreground mt-1">A few details and you&apos;re done</p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Your details */}
          <Card className="border border-border rounded-2xl overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <span className="font-semibold text-foreground">Your details</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="customer_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground">Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your name" className="h-11" {...field} />
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
                    <FormLabel className="text-muted-foreground">Phone</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="07XXXXXXXX" className="h-11" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Where to deliver */}
          <Card className="border border-border rounded-2xl overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <span className="font-semibold text-foreground">Where to deliver</span>
              </div>
              <p className="text-sm text-muted-foreground font-normal mt-1">
                Pick a campus spot or search your address
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="location_id"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-muted-foreground text-sm">Campus spot</FormLabel>
                    <div className="flex flex-wrap gap-2">
                      {locations
                        .filter((loc) => CAMPUS_LOCATIONS.includes(loc.slug))
                        .map((loc) => (
                          <Button
                            key={loc.id}
                            type="button"
                            variant={field.value === loc.id ? "default" : "outline"}
                            size="sm"
                            className={cn(
                              "min-h-10 rounded-full font-medium",
                              field.value === loc.id && "ring-2 ring-primary/30"
                            )}
                            onClick={() => {
                              field.onChange(loc.id);
                              form.setValue("delivery_address", "");
                            }}
                          >
                            {loc.name}
                          </Button>
                        ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
              </div>
              <FormField
                control={form.control}
                name="delivery_address"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-muted-foreground text-sm">
                      Select your spot on the map
                    </FormLabel>
                    <div className="space-y-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-11 rounded-xl border-2 border-dashed border-primary/40 text-primary hover:bg-primary/5 hover:border-primary"
                        onClick={() => setMapPickerOpen(true)}
                      >
                        <MapPin className="h-4 w-4 mr-2" />
                        Select on map
                      </Button>
                      {field.value && (
                        <div className="rounded-lg bg-muted/50 border border-border p-3 text-sm">
                          <p className="font-medium text-foreground line-clamp-2">{field.value}</p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="mt-2 h-8 text-primary"
                            onClick={() => setMapPickerOpen(true)}
                          >
                            Change location
                          </Button>
                        </div>
                      )}
                    </div>
                    <MapPicker
                      open={mapPickerOpen}
                      onOpenChange={setMapPickerOpen}
                      onSelect={(result) => {
                        field.onChange(result.address);
                        if (otherLocationId) form.setValue("location_id", otherLocationId);
                        form.setValue("delivery_lat", result.lat);
                        form.setValue("delivery_lng", result.lng);
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Or type your address below
                    </p>
                    <FormControl>
                      <PlaceAutocomplete
                        value={field.value ?? ""}
                        onChange={(value) => {
                          field.onChange(value);
                          if (value && otherLocationId) form.setValue("location_id", otherLocationId);
                        }}
                        onPlaceSelect={(lat, lng) => {
                          if (otherLocationId) form.setValue("location_id", otherLocationId);
                          form.setValue("delivery_lat", lat);
                          form.setValue("delivery_lng", lng);
                        }}
                        placeholder="Type address to search…"
                        className="h-11"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Notes (optional) */}
          <Card className="border border-border rounded-2xl overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-muted-foreground" />
                <span className="font-semibold text-foreground">Notes</span>
                <span className="text-xs text-muted-foreground font-normal">optional</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="delivery_note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground text-sm">
                      Delivery instruction
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Call when you arrive" className="h-11" {...field} />
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
                    <FormLabel className="text-muted-foreground text-sm">
                      Special requests
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Dietary or other notes" className="h-11" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Payment */}
          <FormField
            control={form.control}
            name="payment_method"
            render={({ field }) => (
              <Card className="border border-border rounded-2xl overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                    <span className="font-semibold text-foreground">Payment</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { value: "CASH" as const, label: "Cash on delivery" },
                      { value: "CARD" as const, label: "Card (Visa / Mastercard)" },
                      { value: "LANKA_QR" as const, label: "LankaQR" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => field.onChange(opt.value)}
                        className={cn(
                          "flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-colors min-h-12",
                          field.value === opt.value
                            ? "border-primary bg-primary/5 text-foreground"
                            : "border-border bg-muted/30 hover:border-muted-foreground/30"
                        )}
                      >
                        <span
                          className={cn(
                            "h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0",
                            field.value === opt.value ? "border-primary bg-primary" : "border-muted-foreground/50"
                          )}
                        >
                          {field.value === opt.value && (
                            <span className="h-2 w-2 rounded-full bg-primary-foreground" />
                          )}
                        </span>
                        <span className="font-medium">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                  <FormMessage />
                </CardContent>
              </Card>
            )}
          />

          {/* Total + Submit */}
          <Card className="border border-border rounded-2xl overflow-hidden sticky bottom-2 shadow-lg">
            <CardContent className="p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <div className="flex justify-between sm:flex-col sm:justify-center gap-1">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="text-xl font-bold text-foreground">LKR {total()}</span>
              </div>
              <Button
                type="submit"
                className="flex-1 sm:flex-none min-h-12 rounded-full font-semibold text-base"
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
