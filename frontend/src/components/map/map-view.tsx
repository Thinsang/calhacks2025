"use client";

import Map, { Layer, Source, Popup } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useMemo, useRef, useState } from "react";
import type { MapRef, LngLatBounds, MapLayerMouseEvent } from "react-map-gl";
import { useAppState } from "@/lib/app-state";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { MapControls } from "./map-controls";
import { MapLegend } from "./map-legend";
import { FloatingControls } from "@/features/filters/floating-controls";
import { useDebounce } from "@/lib/use-debounce";

const SF_CENTER = { longitude: -122.44, latitude: 37.7749, zoom: 12.5 };
const MIN_ZOOM_FOR_DATA = 12;
// Rough San Francisco city bounds (SW and NE corners)
const SF_BOUNDS: [[number, number], [number, number]] = [
  [-122.58, 37.70], // SW (lng, lat)
  [-122.35, 37.84]  // NE (lng, lat)
];

interface PopupInfo {
  longitude: number;
  latitude: number;
  name: string;
  avg_busyness: number;
}

export default function MapView() {
  const mapRef = useRef<MapRef | null>(null);
  const { coords, heatmapDay, heatmapHour } = useAppState();
  const { resolvedTheme } = useTheme();
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || (typeof window !== "undefined" ? localStorage.getItem("mapbox_token") : null);
  
  const [viewState, setViewState] = useState(SF_CENTER);
  const [bounds, setBounds] = useState<LngLatBounds | null>(null);
  const [popupInfo, setPopupInfo] = useState<PopupInfo | null>(null);

  const debouncedBounds = useDebounce(bounds, 500); // Debounce bounds to avoid excessive refetching

  const traffic = useQuery({
    queryKey: ["foot-traffic-bounds", debouncedBounds?.toArray(), heatmapDay, heatmapHour],
    queryFn: async () => {
      if (!debouncedBounds) return { places: [] };

      const [sw, ne] = debouncedBounds.toArray();
      const qs = new URLSearchParams({
        sw_lat: String(sw[1]),
        sw_lng: String(sw[0]),
        ne_lat: String(ne[1]),
        ne_lng: String(ne[0]),
        dow: String(heatmapDay),
        hour: String(heatmapHour)
      });
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000"}/api/foot-traffic?${qs.toString()}`);
      if (!res.ok) return { places: [] };
      const json = await res.json();
      return json.data || { places: [] };
    },
    enabled: !!debouncedBounds && viewState.zoom >= MIN_ZOOM_FOR_DATA,
    staleTime: 60 * 1000, // 1 minute
  });

  const geojson = useMemo(() => {
    const places = traffic.data?.places || [];
    const features = places.map((place: any) => ({
      type: "Feature",
      properties: {
        name: place.name,
        avg_busyness: place.avg_busyness,
      },
      geometry: {
        type: "Point",
        coordinates: [place.coordinates.lng, place.coordinates.lat],
      },
    }));
    return { type: "FeatureCollection", features };
  }, [traffic.data]);

  useEffect(() => {
    if (coords && mapRef.current) {
      mapRef.current.flyTo({ center: [coords.longitude, coords.latitude], zoom: 15, duration: 2000 });
    }
  }, [coords]);

  const handleMouseEnter = (e: MapLayerMouseEvent) => {
    if (e.features && e.features.length > 0) {
      const feature = e.features[0];
      const coordinates = feature.geometry.type === 'Point' ? feature.geometry.coordinates : [0, 0];
      setPopupInfo({
        longitude: coordinates[0],
        latitude: coordinates[1],
        name: feature.properties?.name,
        avg_busyness: feature.properties?.avg_busyness,
      });
      mapRef.current?.getCanvas().style.setProperty("cursor", "pointer");
    }
  };

  const handleMouseLeave = () => {
    setPopupInfo(null);
    mapRef.current?.getCanvas().style.setProperty("cursor", "");
  };

  const mapStyle = resolvedTheme === "light" ? "mapbox://styles/mapbox/light-v11" : "mapbox://styles/mapbox/dark-v11";

  if (!token) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background">
        <div className="glass-panel rounded-2xl p-8 text-center shadow-elevated">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
              <svg className="h-8 w-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <h3 className="mb-2 text-lg font-semibold">Mapbox Token Missing</h3>
          <p className="text-sm text-muted-foreground">Please set NEXT_PUBLIC_MAPBOX_TOKEN in .env.local</p>
        </div>
      </div>
    );
  }

  return (
    <Map
      {...viewState}
      onMove={evt => setViewState(evt.viewState)}
      onMoveEnd={() => setBounds(mapRef.current?.getBounds() ?? null)}
      onLoad={() => setBounds(mapRef.current?.getBounds() ?? null)}
      mapStyle={mapStyle}
      style={{ width: "100%", height: "100%" }}
      mapboxAccessToken={token}
      ref={mapRef}
      maxBounds={SF_BOUNDS}
      minZoom={11}
      renderWorldCopies={false}
      dragRotate={false}
      interactiveLayerIds={["traffic-points"]}
      onMouseMove={(e) => {
        const f = e.features?.[0] as any;
        if (!f) {
          setPopupInfo(null);
          mapRef.current?.getCanvas().style.setProperty("cursor", "");
          return;
        }
        const coords = f.geometry?.coordinates || [0, 0];
        setPopupInfo({
          longitude: coords[0],
          latitude: coords[1],
          name: f.properties?.name,
          avg_busyness: f.properties?.avg_busyness,
        });
        mapRef.current?.getCanvas().style.setProperty("cursor", "pointer");
      }}
    >
      <div className="absolute right-2 top-2">
        <MapControls />
      </div>

      {viewState.zoom < MIN_ZOOM_FOR_DATA && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="glass-panel rounded-2xl px-6 py-4 shadow-elevated">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold">Zoom in to view traffic</div>
                <div className="text-xs text-muted-foreground">Get closer to see detailed data</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Source id="traffic" type="geojson" data={geojson}>
        <Layer
          id="traffic-heatmap"
          type="heatmap"
          paint={{
            // Weight points by avg_busyness (0-100 -> 0-1)
            "heatmap-weight": [
              "interpolate", ["linear"], ["get", "avg_busyness"],
              0, 0,
              100, 1
            ],
            // Increase intensity with zoom so points blend into hotspots
            "heatmap-intensity": [
              "interpolate", ["linear"], ["zoom"],
              11, 0.7,
              13, 1.2,
              15, 1.8
            ],
            // Continuous gradient: transparent -> blue -> red
            "heatmap-color": [
              "interpolate", ["linear"], ["heatmap-density"],
              0.0, "rgba(0, 0, 0, 0)",
              0.5, "rgba(59, 130, 246, 1)",   // blue
              1.0, "rgba(239, 68, 68, 1)"     // red
            ],
            // Larger radius with zoom so clusters blend smoothly
            "heatmap-radius": [
              "interpolate", ["linear"], ["zoom"],
              11, 20,
              13, 35,
              15, 50
            ],
            // Translucent layer to keep streets/labels readable
            "heatmap-opacity": 0.6
          }}
        />
        <Layer
          id="traffic-points"
          type="circle"
          paint={{
            "circle-radius": [
              "interpolate", ["linear"], ["zoom"],
              12, 4,
              16, 10
            ],
            "circle-color": [
              "interpolate", ["linear"], ["get", "avg_busyness"],
              0, "#60A5FA",
              40, "#F59E0B",
              65, "#EF4444"
            ],
            "circle-opacity": 0
          }}
        />
      </Source>

      {popupInfo && (
        <Popup
          longitude={popupInfo.longitude}
          latitude={popupInfo.latitude}
          closeButton={false}
          closeOnClick={false}
          anchor="bottom"
          offset={20}
          className="map-popup"
        >
          <div className="glass-heavy min-w-[200px] overflow-hidden rounded-2xl border border-border/40 p-4 shadow-elevated">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold leading-tight">{popupInfo.name}</div>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border/40 bg-background/30 p-3">
              <div>
                <div className="text-xs text-muted-foreground">Traffic Level</div>
                <div className="mt-0.5 text-lg font-bold">{Math.round(popupInfo.avg_busyness)}</div>
              </div>
              <div className="flex items-center gap-1">
                <div 
                  className={`h-2 w-2 rounded-full ${
                    popupInfo.avg_busyness < 40 ? 'bg-blue-500' :
                    popupInfo.avg_busyness < 65 ? 'bg-yellow-400' :
                    'bg-red-500'
                  }`}
                />
                <span className="text-xs font-medium text-muted-foreground">/100</span>
              </div>
            </div>
          </div>
        </Popup>
      )}

      <div className="absolute bottom-4 left-4">
        <MapLegend />
      </div>

      <div className="absolute bottom-4 right-4">
        <FloatingControls />
      </div>
    </Map>
  );
}


