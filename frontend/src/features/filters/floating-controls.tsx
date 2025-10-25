"use client";

import { useAppState } from "@/lib/app-state";
import { DatePicker } from "@/features/filters/widgets/date-picker";
import { LocationInput } from "@/features/filters/widgets/location-input";
import { PredictionCard } from "@/features/filters/widgets/prediction-card";
import { motion } from "framer-motion";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

export function FloatingControls() {
  const { locationQuery, setLocationQuery, date, setDate } = useAppState();

  return (
    <motion.div
      initial={{ x: "-110%" }}
      animate={{ x: 0 }}
      transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
      className="pointer-events-auto absolute top-6 left-6 z-10 w-[380px] max-w-[calc(100vw-3rem)] origin-top-left rounded-lg border bg-background/80 p-4 shadow-2xl shadow-primary/10 backdrop-blur-sm"
    >
      <div className="space-y-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Location</label>
          <LocationInput value={locationQuery} onChange={setLocationQuery} />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <DatePicker date={date ?? undefined} setDate={(d) => setDate(d ?? null)} />
            </PopoverContent>
          </Popover>
        </div>

        <PredictionCard date={date ?? undefined} location={locationQuery} />
      </div>
    </motion.div>
  );
}
