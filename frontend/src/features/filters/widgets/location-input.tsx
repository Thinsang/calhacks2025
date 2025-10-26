"use client";

import { useEffect, useState } from "react";
import { useAppState } from "@/lib/app-state";
import { useQuery } from "@tanstack/react-query";
import * as Label from "@radix-ui/react-label";

export function LocationInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { setCoords } = useAppState();
  const [internal, setInternal] = useState(value);

  const geocode = useQuery({
    queryKey: ["geocode", internal],
    queryFn: async () => {
      if (!internal) return null;
      const url = new URL("https://api.mapbox.com/geocoding/v5/mapbox.places/" + encodeURIComponent(internal) + ".json");
      url.searchParams.set("access_token", process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "");
      url.searchParams.set("limit", "1");
      const res = await fetch(url.toString());
      if (!res.ok) return null;
      return res.json();
    },
    enabled: false
  });

  // Debounced geocode as user types
  useEffect(() => {
    const id = setTimeout(async () => {
      if (internal && internal.length > 2) {
        onChange(internal);
        const data = await geocode.refetch();
        const feature = (data.data?.features || [])[0];
        if (feature?.center) {
          const [lng, lat] = feature.center;
          setCoords({ latitude: lat, longitude: lng });
        }
      }
    }, 400);
    return () => clearTimeout(id);
  }, [internal]);

  async function handleBlur() {
    onChange(internal);
    const data = await geocode.refetch();
    const feature = (data.data?.features || [])[0];
    if (feature?.center) {
      const [lng, lat] = feature.center;
      setCoords({ latitude: lat, longitude: lng });
    }
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          id="location-input"
          className="h-11 w-full rounded-xl border border-border/60 bg-background/50 px-3.5 py-2.5 text-sm shadow-soft outline-none backdrop-blur-sm transition-all placeholder:text-muted-foreground/50 hover:border-border hover:bg-background/80 focus:border-primary focus:bg-background/80 focus:shadow-md focus:ring-2 focus:ring-primary/20"
          placeholder="Search address or area..."
          value={internal}
          onChange={(e) => setInternal(e.target.value)}
          onBlur={handleBlur}
        />
        {geocode.isFetching && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10">
              <svg className="h-3 w-3 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


