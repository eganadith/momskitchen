"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    google?: typeof google;
    initGoogleMaps?: () => void;
  }
}

interface PlaceAutocompleteProps {
  value: string;
  onChange: (address: string) => void;
  onPlaceSelect?: (lat: number, lng: number) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
}

const GOOGLE_MAPS_SCRIPT_ID = "google-maps-places-script";

function loadGoogleMapsScript(apiKey: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.maps?.places) return Promise.resolve();
  const existing = document.getElementById(GOOGLE_MAPS_SCRIPT_ID);
  if (existing) {
    return new Promise((resolve) => {
      if (window.google?.maps?.places) return resolve();
      (window as unknown as { __gmapsResolve?: () => void }).__gmapsResolve = resolve;
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });
}

export function PlaceAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  placeholder = "Search for a place or address…",
  className,
  id,
  disabled,
}: PlaceAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [scriptError, setScriptError] = useState(false);
  const apiKey = typeof window !== "undefined" ? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY : "";

  useEffect(() => {
    if (!apiKey || !inputRef.current) {
      setScriptLoaded(false);
      if (!apiKey) setScriptError(true);
      return;
    }
    let cancelled = false;
    loadGoogleMapsScript(apiKey)
      .then(() => {
        if (cancelled || !inputRef.current || !window.google?.maps?.places) return;
        if (autocompleteRef.current) return;
        const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: ["address", "establishment"],
          fields: ["formatted_address", "geometry"],
        });
        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (place.formatted_address) {
            onChange(place.formatted_address);
          }
          if (place.geometry?.location && onPlaceSelect) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            onPlaceSelect(lat, lng);
          }
        });
        autocompleteRef.current = autocomplete;
        setScriptLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setScriptError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [apiKey, onChange, onPlaceSelect]);

  // Fallback: no API key or script failed — show plain input
  if (!apiKey || scriptError) {
    return (
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn("pl-9", className)}
          id={id}
          disabled={disabled}
        />
      </div>
    );
  }

  return (
    <div className="relative">
      <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={scriptLoaded ? "Search or tap to select on map" : "Loading map…"}
        className={cn("pl-9", className)}
        id={id}
        disabled={disabled}
        autoComplete="off"
      />
    </div>
  );
}
