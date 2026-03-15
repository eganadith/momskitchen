"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type Config = {
  menu_override: boolean;
  breakfast_order_limit: number;
  lunch_order_limit: number;
  dinner_order_limit: number;
};

export default function AdminSettingsPage() {
  const [config, setConfig] = useState<Config>({
    menu_override: false,
    breakfast_order_limit: 100,
    lunch_order_limit: 100,
    dinner_order_limit: 100,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchConfig = useCallback(() => {
    fetch("/api/admin/config")
      .then((r) => r.json())
      .then(setConfig)
      .catch(() => toast.error("Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          menu_override: config.menu_override,
          breakfast_order_limit: config.breakfast_order_limit,
          lunch_order_limit: config.lunch_order_limit,
          dinner_order_limit: config.dinner_order_limit,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground">Loading…</div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Settings</h1>
      <Card className="border border-border rounded-2xl">
        <CardHeader>
          <h2 className="text-xl font-bold text-foreground">Ordering</h2>
          <p className="text-base font-semibold text-muted-foreground">
            Override meal times to keep menu open. Set order limits per meal.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="override"
              checked={config.menu_override}
              onChange={(e) =>
                setConfig((c) => ({ ...c, menu_override: e.target.checked }))
              }
              className="h-5 w-5"
            />
            <Label htmlFor="override" className="text-base font-bold cursor-pointer">Override meal times (keep ordering open)</Label>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label className="text-base font-bold">Breakfast order limit</Label>
              <Input
                type="number"
                className="h-11 font-semibold mt-1"
                value={config.breakfast_order_limit}
                onChange={(e) =>
                  setConfig((c) => ({
                    ...c,
                    breakfast_order_limit: parseInt(e.target.value, 10) || 0,
                  }))
                }
              />
            </div>
            <div>
              <Label className="text-base font-bold">Lunch order limit</Label>
              <Input
                type="number"
                className="h-11 font-semibold mt-1"
                value={config.lunch_order_limit}
                onChange={(e) =>
                  setConfig((c) => ({
                    ...c,
                    lunch_order_limit: parseInt(e.target.value, 10) || 0,
                  }))
                }
              />
            </div>
            <div>
              <Label className="text-base font-bold">Dinner order limit</Label>
              <Input
                type="number"
                className="h-11 font-semibold mt-1"
                value={config.dinner_order_limit}
                onChange={(e) =>
                  setConfig((c) => ({
                    ...c,
                    dinner_order_limit: parseInt(e.target.value, 10) || 0,
                  }))
                }
              />
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} className="h-11 font-bold rounded-full px-6">
            {saving ? "Saving…" : "Save"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
