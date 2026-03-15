"use client";

import { useCallback, useEffect, useState } from "react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  priceNormal: number;
  priceFull: number;
  category: string;
  image: string | null;
  availability: boolean;
};

export default function AdminMenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<{
    name: string;
    description: string;
    price_normal: number;
    price_full: number;
    category: "BREAKFAST" | "LUNCH" | "DINNER";
    availability: boolean;
  }>({
    name: "",
    description: "",
    price_normal: 0,
    price_full: 0,
    category: "LUNCH",
    availability: true,
  });

  const fetchItems = useCallback(() => {
    fetch("/api/admin/menu")
      .then((r) => r.json())
      .then(setItems)
      .catch(() => toast.error("Failed to load menu"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  async function handleCreate() {
    const res = await fetch("/api/admin/menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        description: form.description || undefined,
        price_normal: form.price_normal,
        price_full: form.price_full,
        category: form.category,
        availability: form.availability,
      }),
    });
    if (!res.ok) {
      const j = await res.json();
      toast.error(j.error ?? "Failed to create");
      return;
    }
    toast.success("Item created");
    setCreateOpen(false);
    setForm({
      name: "",
      description: "",
      price_normal: 0,
      price_full: 0,
      category: "LUNCH",
      availability: true,
    });
    fetchItems();
  }

  async function handleUpdate() {
    if (!editing) return;
    const res = await fetch(`/api/admin/menu/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        description: form.description || null,
        price_normal: form.price_normal,
        price_full: form.price_full,
        category: form.category,
        availability: form.availability,
      }),
    });
    if (!res.ok) {
      toast.error("Failed to update");
      return;
    }
    toast.success("Updated");
    setEditing(null);
    fetchItems();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this item?")) return;
    const res = await fetch(`/api/admin/menu/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Failed to delete");
      return;
    }
    toast.success("Deleted");
    setEditing(null);
    fetchItems();
  }

  async function toggleAvailability(item: MenuItem) {
    const res = await fetch(`/api/admin/menu/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ availability: !item.availability }),
    });
    if (!res.ok) return;
    fetchItems();
  }

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name,
        description: editing.description ?? "",
        price_normal: editing.priceNormal,
        price_full: editing.priceFull,
        category: editing.category as "BREAKFAST" | "LUNCH" | "DINNER",
        availability: editing.availability,
      });
    }
  }, [editing]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Menu</h1>
        <Button onClick={() => setCreateOpen(true)} className="font-bold h-11 rounded-full px-6">Add item</Button>
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
                  <TableHead className="font-bold text-base">Name</TableHead>
                  <TableHead className="font-bold text-base">Category</TableHead>
                  <TableHead className="font-bold text-base">Normal / Full (LKR)</TableHead>
                  <TableHead className="font-bold text-base">Availability</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>
                      {item.priceNormal} / {item.priceFull}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={item.availability ? "default" : "secondary"}
                      >
                        {item.availability ? "Yes" : "No"}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-2"
                        onClick={() => toggleAvailability(item)}
                      >
                        Toggle
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditing(item)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => handleDelete(item.id)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New menu item</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Item name"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Optional"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Price Normal (LKR)</Label>
                <Input
                  type="number"
                  value={form.price_normal || ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      price_normal: parseInt(e.target.value, 10) || 0,
                    }))
                  }
                />
              </div>
              <div>
                <Label>Price Full (LKR)</Label>
                <Input
                  type="number"
                  value={form.price_full || ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      price_full: parseInt(e.target.value, 10) || 0,
                    }))
                  }
                />
              </div>
            </div>
            <div>
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) =>
                  v && setForm((f) => ({ ...f, category: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BREAKFAST">Breakfast</SelectItem>
                  <SelectItem value="LUNCH">Lunch</SelectItem>
                  <SelectItem value="DINNER">Dinner</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit: {editing?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Price Normal (LKR)</Label>
                <Input
                  type="number"
                  value={form.price_normal || ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      price_normal: parseInt(e.target.value, 10) || 0,
                    }))
                  }
                />
              </div>
              <div>
                <Label>Price Full (LKR)</Label>
                <Input
                  type="number"
                  value={form.price_full || ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      price_full: parseInt(e.target.value, 10) || 0,
                    }))
                  }
                />
              </div>
            </div>
            <div>
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) =>
                  v && setForm((f) => ({ ...f, category: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BREAKFAST">Breakfast</SelectItem>
                  <SelectItem value="LUNCH">Lunch</SelectItem>
                  <SelectItem value="DINNER">Dinner</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="avail"
                checked={form.availability}
                onChange={(e) =>
                  setForm((f) => ({ ...f, availability: e.target.checked }))
                }
              />
              <Label htmlFor="avail">Available</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
