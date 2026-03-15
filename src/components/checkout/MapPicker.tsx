"use client";

import "leaflet/dist/leaflet.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { nominatimReverse } from "@/lib/nominatim";

const DEFAULT_CENTER: [number, number] = [6.9271, 79.8612]; // Colombo, Sri Lanka

export interface MapPickerResult {
  lat: number;
  lng: number;
  address: string;
}

interface MapPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (result: MapPickerResult) => void;
  initialAddress?: string;
  className?: string;
}

export function MapPicker({
  open,
  onOpenChange,
  onSelect,
  className,
}: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState<MapPickerResult | null>(null);
  const [loading, setLoading] = useState(false);

  const initMap = useCallback(() => {
    if (!mapRef.current || mapInstanceRef.current || typeof window === "undefined") return;
    import("leaflet").then((L) => {
      if (!mapRef.current) return;
      const map = L.map(mapRef.current).setView(DEFAULT_CENTER, 14);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      mapInstanceRef.current = map;

      map.on("click", async (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        if (markerRef.current) map.removeLayer(markerRef.current);
        const marker = L.marker([lat, lng], {
          icon: L.icon({
            iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
            iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
            shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            iconSize: [25, 41],
            iconAnchor: [12, 41],
          }),
        }).addTo(map);
        markerRef.current = marker;
        setLoading(true);
        try {
          const address = await nominatimReverse(lat, lng);
          setSelected({ lat, lng, address });
        } catch {
          setSelected({ lat, lng, address: `${lat.toFixed(5)}, ${lng.toFixed(5)}` });
        } finally {
          setLoading(false);
        }
      });
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    setSelected(null);
    setLoading(false);
    setReady(false);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    }
    initMap();
  }, [open, initMap]);

  const handleConfirm = useCallback(() => {
    if (selected) {
      onSelect(selected);
      onOpenChange(false);
      setSelected(null);
    }
  }, [selected, onSelect, onOpenChange]);

  const handleClose = useCallback(() => {
    onOpenChange(false);
    setSelected(null);
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className={cn("max-w-[95vw] w-full sm:max-w-lg p-0 gap-0 overflow-hidden", className)}
        showCloseButton={true}
      >
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5 text-primary" />
            Select location on map
          </DialogTitle>
          <p className="text-sm text-muted-foreground font-normal">
            Tap on the map to drop a pin. Uses OpenStreetMap (Nominatim) — free, no API key.
          </p>
        </DialogHeader>
        <div className="px-4 pb-4">
          <div className="relative w-full h-[280px] rounded-xl border border-border overflow-hidden bg-muted [&_.leaflet-container]:z-0">
            <div ref={mapRef} className="w-full h-full min-h-[280px]" />
            {!ready && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/90 rounded-xl">
                <span className="text-sm text-muted-foreground">Loading map…</span>
              </div>
            )}
          </div>
          {loading && (
            <p className="text-xs text-muted-foreground mt-2">Getting address…</p>
          )}
          {selected && !loading && (
            <div className="mt-3 space-y-3">
              <p className="text-sm font-medium text-foreground line-clamp-2">
                {selected.address}
              </p>
              <Button
                type="button"
                className="w-full rounded-full"
                onClick={handleConfirm}
              >
                Use this location
              </Button>
            </div>
          )}
          {ready && !selected && !loading && (
            <p className="text-xs text-muted-foreground mt-2">
              Tap anywhere on the map to set your delivery point
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
