"use client";

import { NavigationControl } from "react-map-gl";

export function MapControls() {
  return (
    <div className="pointer-events-auto">
      <NavigationControl position="top-right" />
    </div>
  );
}
