"use client";

import { useQuery } from "@tanstack/react-query";
import { useAppState } from "@/lib/app-state";
import { motion } from "framer-motion";
import { TrendingUpIcon, TrendingDownIcon, MinusIcon, SparklesIcon, LoaderIcon } from "lucide-react";

type PredictResponse = {
  score: number;
  label: "Low" | "Medium" | "High";
  summary?: string;
};

const trafficStyles = {
  Low: {
    gradient: "from-emerald-500/10 via-emerald-500/5 to-transparent",
    border: "border-emerald-500/30",
    text: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
    icon: TrendingDownIcon,
    badge: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300",
  },
  Medium: {
    gradient: "from-amber-500/10 via-amber-500/5 to-transparent",
    border: "border-amber-500/30",
    text: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
    icon: MinusIcon,
    badge: "bg-amber-500/20 text-amber-700 dark:text-amber-300",
  },
  High: {
    gradient: "from-rose-500/10 via-rose-500/5 to-transparent",
    border: "border-rose-500/30",
    text: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-500/10",
    icon: TrendingUpIcon,
    badge: "bg-rose-500/20 text-rose-700 dark:text-rose-300",
  },
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000"}/api/predict-llm?${qs.toString()}`);
      if (!res.ok) throw new Error("Prediction failed");
      return res.json();
    },
    enabled: Boolean((location || coords) && date)
  });

  const renderContent = () => {
    if (!location || !date) {
      return (
        <div className="overflow-hidden rounded-2xl border border-border/20 glass-light p-9 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
              <SparklesIcon className="h-7 w-7 text-primary" strokeWidth={2} />
            </div>
          </div>
          <p className="text-sm font-semibold">Ready to predict traffic</p>
          <p className="mt-1.5 text-xs text-muted-foreground">Select a location and date above</p>
        </div>
      );
    }

    if (query.isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <LoaderIcon className="mb-3 h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Analyzing traffic patterns...</p>
        </div>
      );
    }

    if (query.isError) {
      return (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
            <span className="text-2xl">⚠️</span>
          </div>
          <p className="text-sm text-destructive">Error loading prediction</p>
          <p className="mt-1 text-xs text-muted-foreground">Please try again</p>
        </div>
      );
    }

    if (query.data) {
      const style = trafficStyles[query.data.label];
      const Icon = style.icon;

      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25 }}
          className={`overflow-hidden rounded-2xl border ${style.border} glass-light`}
        >
          <div className="p-5">
            {/* Header row with spacing to avoid overlap */}
            <div className="mb-3 flex items-center justify-between">
              <div className="min-w-0">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Predicted Traffic</p>
                <div className={`flex items-center gap-2 ${style.text}`}>
                  <Icon className="h-5 w-5" strokeWidth={2.5} />
                  <h3 className="truncate text-lg font-bold">{query.data.label} <span className="text-muted-foreground">({Math.round(query.data.score)}/100)</span></h3>
                </div>
              </div>
            </div>

            {/* AI summary */}
            <div className="rounded-xl bg-background/50 p-3 text-sm leading-relaxed text-foreground/90 max-h-40 overflow-auto">
              {query.data.summary ? (
                <p className="whitespace-pre-wrap">{query.data.summary}</p>
              ) : (
                <p className="text-muted-foreground">Generating summary…</p>
              )}
            </div>
          </div>
        </motion.div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-3">
      {renderContent()}
    </div>
  );
}


