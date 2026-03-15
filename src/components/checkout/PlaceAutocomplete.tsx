"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { nominatimSearch, type NominatimSearchResult } from "@/lib/nominatim";

interface PlaceAutocompleteProps {
  value: string;
  onChange: (address: string) => void;
  onPlaceSelect?: (lat: number, lng: number) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
}

const DEBOUNCE_MS = 500;

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
  const [suggestions, setSuggestions] = useState<NominatimSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback((query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    nominatimSearch(query, 5)
      .then((results) => {
        setSuggestions(results);
        setOpen(results.length > 0);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      onChange(v);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => runSearch(v), DEBOUNCE_MS);
    },
    [onChange, runSearch]
  );

  const select = useCallback(
    (item: NominatimSearchResult) => {
      onChange(item.display_name);
      if (onPlaceSelect) {
        onPlaceSelect(parseFloat(item.lat), parseFloat(item.lon));
      }
      setSuggestions([]);
      setOpen(false);
    },
    [onChange, onPlaceSelect]
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="relative">
      <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onFocus={() => value && suggestions.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        placeholder={placeholder}
        className={cn("pl-9", className)}
        id={id}
        disabled={disabled}
        autoComplete="off"
      />
      {loading && (
        <p className="text-xs text-muted-foreground mt-1">Searching…</p>
      )}
      {open && suggestions.length > 0 && (
        <ul
          className="absolute z-20 w-full mt-1 rounded-lg border border-border bg-card shadow-lg overflow-hidden max-h-48 overflow-y-auto"
          style={{ top: "100%" }}
        >
          {suggestions.map((item, i) => (
            <li key={i}>
              <button
                type="button"
                className="w-full px-3 py-2.5 text-left text-sm hover:bg-muted focus:bg-muted focus:outline-none"
                onMouseDown={(e) => {
                  e.preventDefault();
                  select(item);
                }}
              >
                {item.display_name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
