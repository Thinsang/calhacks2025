"use client";

import dynamic from "next/dynamic";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const MapView = dynamic(() => import("@/components/map/map-view"), { ssr: false });

export default function HomePage() {
  return (
    <div className="relative h-dvh w-dvw overflow-hidden">
      <main className="absolute inset-0 z-0">
        <MapView />
      </main>

      <header className="pointer-events-none absolute left-0 right-0 top-0 z-50 px-6 pt-6">
        <div className="pointer-events-auto glass-panel mx-auto max-w-7xl rounded-2xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20">
                <svg className="h-6 w-6 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-semibold tracking-tight">Foot Traffic Finder</h1>
                <p className="text-xs text-muted-foreground">San Francisco Live Map</p>
              </div>
            </div>
            <div className="shrink-0">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      
    </div>
  );
}


