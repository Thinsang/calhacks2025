"use client";

import { useEffect, useRef, useState } from "react";
import { useAppState } from "@/lib/app-state";
import { useQuery } from "@tanstack/react-query";
import * as Label from "@radix-ui/react-label";

export function LocationInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { setCoords } = useAppState();
  const [internal, setInternal] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState<number>(-1);
  const listRef = useRef<HTMLDivElement | null>(null);

  // SF bounding box: minLon,minLat,maxLon,maxLat
  const SF_BBOX = [-122.58, 37.70, -122.35, 37.84] as const;

  const geocode = useQuery({
    queryKey: ["geocode", internal],
    queryFn: async () => {
      if (!internal) return null;
      const url = new URL("https://api.mapbox.com/geocoding/v5/mapbox.places/" + encodeURIComponent(internal) + ".json");
      url.searchParams.set("access_token", process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "");
      url.searchParams.set("limit", "1");
      url.searchParams.set("bbox", `${SF_BBOX[0]},${SF_BBOX[1]},${SF_BBOX[2]},${SF_BBOX[3]}`);
      const res = await fetch(url.toString());
      if (!res.ok) return null;
      return res.json();
    },
    enabled: false
  });

  // Autocomplete suggestions within San Francisco only
  const suggest = useQuery({
    queryKey: ["mbx-suggest", internal],
    queryFn: async () => {
      if (!internal || internal.length < 3) return [] as any[];
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
      if (!token) return [] as any[];
      const url = new URL("https://api.mapbox.com/geocoding/v5/mapbox.places/" + encodeURIComponent(internal) + ".json");
      url.searchParams.set("access_token", token);
      url.searchParams.set("autocomplete", "true");
      url.searchParams.set("limit", "5");
      url.searchParams.set("types", "address");
      url.searchParams.set("bbox", `${SF_BBOX[0]},${SF_BBOX[1]},${SF_BBOX[2]},${SF_BBOX[3]}`);
      const res = await fetch(url.toString());
      if (!res.ok) return [] as any[];
      const json = await res.json();
      const features = (json?.features ?? []) as any[];
      // Build concise street labels and dedupe
      const seen = new Set<string>();
      const items = [] as any[];
      for (const f of features) {
        const num = f.address || f.properties?.address || "";
        const street = f.text || f.properties?.street || "";
        const label = `${num ? String(num).trim() + " " : ""}${street}`.trim();
        if (!label || seen.has(label)) continue;
        seen.add(label);
        items.push({ ...f, __label: label });
      }
      return items;
    },
    enabled: internal.length > 2
  });

  // Debounced geocode as user types
  useEffect(() => {
    const id = setTimeout(async () => {
      if (internal && internal.length > 2) {
        onChange(internal);
        setIsOpen(true);
        setActiveIdx(-1);
        suggest.refetch();
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
    setIsOpen(false);
  }

  function selectFeature(feature: any) {
    if (!feature) return;
    const [lng, lat] = feature.center || [];
    const num = feature.address || feature.properties?.address || "";
    const street = feature.text || feature.properties?.street || "";
    const label = feature.__label || `${num ? String(num).trim() + " " : ""}${street}`.trim();
    setInternal(label);
    onChange(label);
    if (lng && lat) setCoords({ latitude: lat, longitude: lng });
    setIsOpen(false);
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          id="location-input"
          className="h-10 w-full rounded-xl border border-border/60 bg-background/50 px-3.5 py-2 text-sm shadow-soft outline-none backdrop-blur-sm transition-all placeholder:text-muted-foreground/50 hover:border-border hover:bg-background/80 focus:border-primary focus:bg-background/80 focus:shadow-md focus:ring-2 focus:ring-primary/20"
          placeholder="Search San Francisco address or place..."
          value={internal}
          onChange={(e) => setInternal(e.target.value)}
          onBlur={handleBlur}
          onFocus={() => internal.length > 2 && setIsOpen(true)}
          onKeyDown={(e) => {
            if (!isOpen) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              const next = Math.min((activeIdx < 0 ? -1 : activeIdx) + 1, (suggest.data?.length || 0) - 1);
              setActiveIdx(next);
              listRef.current?.querySelectorAll<HTMLButtonElement>("button")[next]?.scrollIntoView({ block: "nearest" });
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              const next = Math.max((activeIdx < 0 ? 0 : activeIdx) - 1, 0);
              setActiveIdx(next);
              listRef.current?.querySelectorAll<HTMLButtonElement>("button")[next]?.scrollIntoView({ block: "nearest" });
            } else if (e.key === "Enter") {
              if (activeIdx >= 0 && suggest.data && suggest.data[activeIdx]) {
                e.preventDefault();
                selectFeature(suggest.data[activeIdx]);
              }
            } else if (e.key === "Escape") {
              setIsOpen(false);
            }
          }}
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
        {isOpen && (suggest.data?.length || 0) > 0 && (
          <div ref={listRef} className="absolute left-0 right-0 z-50 mt-2 max-h-72 overflow-auto rounded-2xl border border-border/20 glass-light p-2 shadow-elevated backdrop-blur-md">
            {suggest.data!.map((f: any, idx: number) => (
              <button
                key={f.id || f.place_name || idx}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectFeature(f)}
                className={`flex w-full items-start gap-2 rounded-xl px-3.5 py-2.5 text-left transition-colors hover:bg-background/60 ${idx === activeIdx ? "bg-background/60" : ""}`}
              >
                <span className="mt-0.5 h-2 w-2 rounded-full bg-primary/70" />
                <span className="text-sm leading-snug font-medium">{f.__label || f.text}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


