"use client";

import { useCallback, useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  orderStatus: string;
  paymentStatus: string;
  mealType: string;
  createdAt: string;
  location: { name: string };
  deliveryAddress: string | null;
  deliveryLat: number | null;
  deliveryLng: number | null;
  deliveryNote: string | null;
  specialNote: string | null;
  orderItems: Array<{
    quantity: number;
    price: number;
    menuItem: { name: string };
  }>;
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [mealFilter, setMealFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = useCallback(() => {
    const params = new URLSearchParams();
    if (mealFilter !== "all") params.set("meal_type", mealFilter);
    if (statusFilter !== "all") params.set("status", statusFilter);
    fetch(`/api/orders?${params}`)
      .then((r) => r.json())
      .then(setOrders)
      .catch(() => toast.error("Failed to load orders"))
      .finally(() => setLoading(false));
  }, [mealFilter, statusFilter]);

  useEffect(() => {
    setLoading(true);
    fetchOrders();
  }, [fetchOrders]);

  async function updateStatus(orderId: string, order_status: string) {
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_status }),
    });
    if (!res.ok) {
      toast.error("Failed to update status");
      return;
    }
    toast.success("Status updated");
    fetchOrders();
    setSelectedOrder((prev) =>
      prev?.id === orderId ? { ...prev, orderStatus: order_status } : prev
    );
  }

  const total = (order: Order) =>
    order.orderItems.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Orders</h1>
      <div className="flex flex-wrap gap-3">
        <Select value={mealFilter} onValueChange={(v) => v != null && setMealFilter(v)}>
          <SelectTrigger className="w-44 font-semibold h-11">
            <SelectValue placeholder="Meal type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All meals</SelectItem>
            <SelectItem value="BREAKFAST">Breakfast</SelectItem>
            <SelectItem value="LUNCH">Lunch</SelectItem>
            <SelectItem value="DINNER">Dinner</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => v != null && setStatusFilter(v)}>
          <SelectTrigger className="w-44 font-semibold h-11">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="PREPARING">Preparing</SelectItem>
            <SelectItem value="OUT_FOR_DELIVERY">Out for delivery</SelectItem>
            <SelectItem value="DELIVERED">Delivered</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Card className="border border-border rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground font-semibold">
              Loading…
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold text-base">Order</TableHead>
                  <TableHead className="font-bold text-base">Customer</TableHead>
                  <TableHead className="font-bold text-base">Meal</TableHead>
                  <TableHead className="font-bold text-base">Status</TableHead>
                  <TableHead className="font-bold text-base">Payment</TableHead>
                  <TableHead className="font-bold text-base">Total</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow
                    key={order.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <TableCell className="font-medium">
                      {order.orderNumber}
                    </TableCell>
                    <TableCell>
                      {order.customerName}
                      <br />
                      <span className="text-xs text-muted-foreground">
                        {order.phone}
                      </span>
                    </TableCell>
                    <TableCell>{order.mealType}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{order.orderStatus}</Badge>
                    </TableCell>
                    <TableCell>{order.paymentStatus}</TableCell>
                    <TableCell>LKR {total(order)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="font-bold"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrder(order);
                        }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <Dialog
        open={!!selectedOrder}
        onOpenChange={(open) => !open && setSelectedOrder(null)}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">{selectedOrder.orderNumber}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-base font-semibold">
                  <strong className="font-bold">{selectedOrder.customerName}</strong> · {selectedOrder.phone}
                </p>
                <p className="text-base font-semibold">
                  Delivery: {selectedOrder.deliveryAddress ?? selectedOrder.location.name}
                  {selectedOrder.deliveryAddress && selectedOrder.location.name !== "Other" && (
                    <span className="text-muted-foreground font-medium"> ({selectedOrder.location.name})</span>
                  )}
                  {selectedOrder.deliveryNote && ` — ${selectedOrder.deliveryNote}`}
                </p>
                <a
                  href={
                    selectedOrder.deliveryLat != null && selectedOrder.deliveryLng != null
                      ? `https://www.google.com/maps?q=${selectedOrder.deliveryLat},${selectedOrder.deliveryLng}`
                      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedOrder.deliveryAddress ?? selectedOrder.location.name)}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-base font-bold text-primary hover:underline mt-1"
                >
                  <MapPin className="h-5 w-5 shrink-0" />
                  Open location in Maps
                </a>
                {selectedOrder.specialNote && (
                  <p className="text-base font-semibold text-muted-foreground">
                    Note: {selectedOrder.specialNote}
                  </p>
                )}
                <ul className="list-disc list-inside text-base font-semibold space-y-1">
                  {selectedOrder.orderItems.map((oi, i) => (
                    <li key={i}>
                      {oi.menuItem.name} × {oi.quantity} — LKR {oi.price * oi.quantity}
                    </li>
                  ))}
                </ul>
                <p className="text-lg font-bold">
                  Total: LKR {total(selectedOrder)}
                </p>
                <div className="flex flex-wrap gap-2 pt-3">
                  {["PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"].map(
                    (status) => (
                      <Button
                        key={status}
                        size="default"
                        className="font-bold h-11"
                        variant={
                          selectedOrder.orderStatus === status
                            ? "default"
                            : "outline"
                        }
                        onClick={() =>
                          updateStatus(selectedOrder.id, status)
                        }
                      >
                        {status.replace(/_/g, " ")}
                      </Button>
                    )
                  )}
                  {selectedOrder.orderStatus !== "CANCELLED" && (
                    <Button
                      size="default"
                      variant="destructive"
                      className="font-bold h-11"
                      onClick={() =>
                        updateStatus(selectedOrder.id, "CANCELLED")
                      }
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
