"use client";

import { useQuery } from "@tanstack/react-query";
import { useAppState } from "@/lib/app-state";
import { motion } from "framer-motion";
import { TrendingUpIcon, TrendingDownIcon, MinusIcon, SparklesIcon, LoaderIcon } from "lucide-react";

type PredictResponse = {
  score: number;
  label: "Low" | "Medium" | "High";
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8001"}/api/predict?${qs.toString()}`);
      if (!res.ok) throw new Error("Prediction failed");
      return res.json();
    },
    enabled: Boolean((location || coords) && date)
  });

  const renderContent = () => {
    if (!location || !date) {
      return (
        <div className="overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-muted/30 to-transparent p-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10">
              <SparklesIcon className="h-7 w-7 text-primary" strokeWidth={2} />
            </div>
          </div>
          <p className="text-sm font-medium text-foreground/90">
            Ready to predict traffic
          </p>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Select a location and date above
          </p>
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
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className={`overflow-hidden rounded-2xl border ${style.border} bg-gradient-to-br ${style.gradient}`}
        >
          <div className="p-5">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Predicted Traffic
                </p>
                <div className={`flex items-baseline gap-2 ${style.text}`}>
                  <h3 className="text-3xl font-bold">{query.data.label}</h3>
                  <Icon className="h-5 w-5" strokeWidth={2.5} />
                </div>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${style.bg}`}>
                <Icon className={`h-6 w-6 ${style.text}`} strokeWidth={2.5} />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-current opacity-60"></div>
                <span className="text-xs text-muted-foreground">
                  Confidence Score
                </span>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${style.badge}`}>
                {Math.round(query.data.score)}/100
              </span>
            </div>

            {/* Progress Bar */}
            <div className="mt-3 overflow-hidden rounded-full bg-background/50">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${query.data.score}%` }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                className={`h-1.5 rounded-full ${style.bg}`}
                style={{
                  background: `linear-gradient(90deg, currentColor, transparent)`,
                }}
              />
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


