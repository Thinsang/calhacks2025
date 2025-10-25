"use client";

import dynamic from "next/dynamic";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { FloatingControls } from "@/features/filters/floating-controls";

const MapView = dynamic(() => import("@/components/map/map-view"), { ssr: false });

export default function HomePage() {
  return (
    <div className="h-dvh w-dvw">
      <main className="absolute inset-0">
        <MapView />
      </main>

      <header className="pointer-events-none absolute top-0 z-10 flex h-20 w-full items-center justify-center px-4">
        <div className="font-semibold tracking-tight">Foot Traffic Finder</div>
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <ThemeToggle />
        </div>
      </header>

      <FloatingControls />
    </div>
  );
}


