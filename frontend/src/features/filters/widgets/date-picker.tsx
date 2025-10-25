"use client";
import * as React from "react";
import { Calendar } from "@/components/ui/calendar";

export function DatePicker({
  date,
  setDate,
}: {
  date?: Date;
  setDate: (d?: Date) => void;
}) {
  const [month, setMonth] = React.useState(date ?? new Date());

  return (
    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
      month={month}
      onMonthChange={setMonth}
      fromYear={new Date().getFullYear() - 10}
      toYear={new Date().getFullYear() + 10}
    />
  );
}


