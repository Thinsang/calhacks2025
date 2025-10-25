"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { setYear, setMonth, format } from "date-fns";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const [view, setView] = React.useState<"day" | "month" | "year">("day");

  // Use the month from props, fallback to today
  const [currentDate, setCurrentDate] = React.useState(
    props.month || props.defaultMonth || new Date()
  );

  // When the external month prop changes, update the internal state
  React.useEffect(() => {
    if (props.month) {
      setCurrentDate(props.month);
    }
  }, [props.month]);

  const handleMonthSelect = (month: number) => {
    props.onMonthChange?.(setMonth(currentDate, month));
    setView("day");
  };

  const handleYearSelect = (year: number) => {
    props.onMonthChange?.(setYear(currentDate, year));
    setView("month");
  };

  const renderMonthView = () => (
    <div className="grid grid-cols-3 gap-2 p-3">
      {Array.from({ length: 12 }, (_, i) => (
        <button
          key={i}
          onClick={() => handleMonthSelect(i)}
          className={cn(
            "rounded-xl py-3 text-center text-sm font-medium transition-all hover:bg-accent/50",
            i === currentDate.getMonth() && "bg-primary/10 text-primary"
          )}
        >
          {format(new Date(currentDate.getFullYear(), i), "MMM")}
        </button>
      ))}
    </div>
  );

  const renderYearView = () => {
    const currentYear = currentDate.getFullYear();
    const years = Array.from({ length: 12 }, (_, i) => currentYear - 6 + i);
    return (
      <div className="grid grid-cols-3 gap-2 p-3">
        {years.map((year) => (
          <button
            key={year}
            onClick={() => handleYearSelect(year)}
            className={cn(
              "rounded-xl py-3 text-center text-sm font-medium transition-all hover:bg-accent/50",
              year === currentYear && "bg-primary/10 text-primary"
            )}
          >
            {year}
          </button>
        ))}
      </div>
    );
  };

  const CustomCaption = () => (
    <div className="relative flex h-12 items-center justify-center border-b border-border/40 px-2">
      <button
        className="absolute left-2 flex h-8 w-8 items-center justify-center rounded-lg transition-all hover:bg-accent/50 active:scale-95"
        onClick={() => props.onMonthChange?.(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <div className="flex items-center gap-1.5">
        <button 
          onClick={() => setView("month")} 
          className="rounded-lg px-3 py-1.5 text-sm font-semibold transition-all hover:bg-accent/50"
        >
          {format(currentDate, "MMMM")}
        </button>
        <button 
          onClick={() => setView("year")} 
          className="rounded-lg px-2 py-1.5 text-sm font-semibold transition-all hover:bg-accent/50"
        >
          {format(currentDate, "y")}
        </button>
      </div>
      <button
        className="absolute right-2 flex h-8 w-8 items-center justify-center rounded-lg transition-all hover:bg-accent/50 active:scale-95"
        onClick={() => props.onMonthChange?.(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );


  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border/40 bg-background/80 shadow-soft backdrop-blur-sm",
        className
      )}
    >
      {view === "day" && (
        <DayPicker
          showOutsideDays={showOutsideDays}
          className="p-3"
          classNames={{
            months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
            month: "space-y-3",
            table: "w-full border-collapse space-y-1",
            head_row: "flex gap-1",
            head_cell:
              "text-muted-foreground w-9 font-semibold text-[0.7rem] uppercase tracking-wider",
            row: "flex w-full mt-1 gap-1",
            cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
            day: cn(
              "h-9 w-9 rounded-xl p-0 font-medium transition-all hover:bg-accent/50 active:scale-95 aria-selected:opacity-100"
            ),
            day_selected:
              "bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
            day_today: "border-2 border-primary/30 bg-primary/5 font-bold",
            day_outside: "text-muted-foreground/40 opacity-50",
            day_disabled: "text-muted-foreground opacity-30 line-through",
            ...classNames,
          }}
          components={{
            Caption: CustomCaption,
          }}
          {...props}
        />
      )}
      {view === "month" && renderMonthView()}
      {view === "year" && renderYearView()}
    </div>
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
