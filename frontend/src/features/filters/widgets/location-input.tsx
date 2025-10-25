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
      <input
        id="location-input"
        className="w-full rounded-md border bg-background px-3 py-2 outline-none ring-0 focus-visible:border-ring"
        placeholder="Search address or area"
        value={internal}
        onChange={(e) => setInternal(e.target.value)}
        onBlur={handleBlur}
      />
    </div>
  );
}


