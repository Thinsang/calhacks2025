"use client";

import { useQuery } from "@tanstack/react-query";
import { useAppState } from "@/lib/app-state";

type PredictResponse = {
  score: number;
  label: "Low" | "Medium" | "High";
};

export function PredictionCard({
  date,
  location
}: {
  date?: Date;
  location: string;
}) {
  const { coords } = useAppState();
  const query = useQuery<PredictResponse>({
    queryKey: ["predict", location, coords?.latitude, coords?.longitude, date?.toISOString().slice(0, 10)],
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (location) qs.set("place_query", location);
      if (date) qs.set("date_iso", date.toISOString());
      if (coords) {
        qs.set("latitude", String(coords.latitude));
        qs.set("longitude", String(coords.longitude));
      }
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8001"}/api/predict?${qs.toString()}`);
      if (!res.ok) throw new Error("Prediction failed");
      return res.json();
    },
    enabled: Boolean((location || coords) && date)
  });

  return (
    <div className="rounded-md border p-3">
      <div className="text-xs font-medium mb-2">Prediction</div>
      {!location || !date ? (
        <p className="text-sm text-muted-foreground">Select a location and date to see prediction.</p>
      ) : query.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : query.isError ? (
        <p className="text-sm text-destructive">Error loading prediction.</p>
      ) : query.data ? (
        <div>
          <div className="text-2xl font-semibold">{query.data.label}</div>
          <div className="text-xs text-muted-foreground">Score: {Math.round(query.data.score)}</div>
        </div>
      ) : null}
    </div>
  );
}


