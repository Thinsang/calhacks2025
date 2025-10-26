"use client";

import { useAppState } from "@/lib/app-state";
import { DatePicker } from "@/features/filters/widgets/date-picker";
import { LocationInput } from "@/features/filters/widgets/location-input";
import { PredictionCard } from "@/features/filters/widgets/prediction-card";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CalendarIcon, MapPinIcon, ChevronDownIcon } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

export function FloatingControls() {
  const { locationQuery, setLocationQuery, date, setDate } = useAppState();
  const [isCalendarOpen] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.5, 
        ease: [0.16, 1, 0.3, 1],
        delay: 0.1
      }}
      className="pointer-events-auto w-[420px] max-w-[calc(100vw-3rem)] sm:w-[500px] h-[60vh] min-h-[520px] max-h-[700px] overflow-hidden"
    >
      <div className="glass-panel flex h-full flex-col rounded-2xl p-4 shadow-elevated">
        {/* Header Section (match Traffic Levels style) */}
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
            <CalendarIcon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Traffic Prediction</h2>
            <p className="text-xs text-muted-foreground">Plan your optimal location</p>
          </div>
        </div>

        {/* Controls Section */}
        <div className="flex-1 space-y-4 overflow-y-auto pr-1">
          {/* Location Input */}
          <motion.div 
            className="space-y-1.5 rounded-xl border border-border/40 bg-background/30 p-2.5 backdrop-blur transition-colors"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/80">
              <MapPinIcon className="h-3.5 w-3.5 text-primary" strokeWidth={2.5} />
              Location
            </label>
            <LocationInput value={locationQuery} onChange={setLocationQuery} />
          </motion.div>

          {/* Date Picker */}
          <motion.div 
            className="space-y-2 rounded-xl border border-border/40 bg-background/30 p-3 backdrop-blur transition-colors"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/80">
              <CalendarIcon className="h-3.5 w-3.5 text-primary" strokeWidth={2.5} />
              Date
            </label>
            <Button
              variant={"outline"}
              className="hover-lift group relative h-10 w-full justify-between overflow-hidden rounded-xl border-border/40 bg-background/60 text-left text-sm font-medium shadow-soft transition-all hover:border-primary/40 hover:bg-background/80 hover:shadow-md"
            >
              <span className="flex items-center gap-2.5">
                {date ? (
                  <>
                    <span className="font-semibold">{format(date, "EEE, MMM d")}</span>
                    <span className="text-xs text-muted-foreground/60">•</span>
                    <span className="text-sm text-muted-foreground">{format(date, "yyyy")}</span>
                  </>
                ) : (
                  <span className="text-muted-foreground">Select a date</span>
                )}
              </span>
              <ChevronDownIcon className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isCalendarOpen ? 'rotate-180' : ''}`} />
            </Button>
            
            <AnimatePresence>
              {isCalendarOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: "auto", marginTop: 8 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="glass-light rounded-2xl p-4">
                    <DatePicker
                      date={date ?? undefined}
                      setDate={(d) => {
                        setDate(d ?? null);
                      }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Divider */}
          <div className="relative py-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/30"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="rounded-full border border-border/20 bg-background/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 shadow-soft backdrop-blur-sm">Result</span>
            </div>
          </div>

          {/* Prediction Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <PredictionCard date={date ?? undefined} location={locationQuery} />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
