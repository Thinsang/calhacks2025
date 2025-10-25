"use client";

import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

export function DatePicker({
  date,
  setDate
}: {
  date?: Date;
  setDate: (d?: Date) => void;
}) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-xs font-medium mb-2">Date</div>
      <DayPicker
        mode="single"
        selected={date}
        onSelect={setDate}
        weekStartsOn={1}
        captionLayout="dropdown-buttons"
      />
    </div>
  );
}


