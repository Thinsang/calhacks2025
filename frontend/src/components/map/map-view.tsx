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
import { useDebounce } from "@/lib/use-debounce";

const SF_CENTER = { longitude: -122.44, latitude: 37.7749, zoom: 12.5 };
const MIN_ZOOM_FOR_DATA = 12;

interface PopupInfo {
  longitude: number;
  latitude: number;
  name: string;
  avg_busyness: number;
}

export default function MapView() {
  const mapRef = useRef<MapRef | null>(null);
  const { coords } = useAppState();
  const { resolvedTheme } = useTheme();
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || (typeof window !== "undefined" ? localStorage.getItem("mapbox_token") : null);
  
  const [viewState, setViewState] = useState(SF_CENTER);
  const [bounds, setBounds] = useState<LngLatBounds | null>(null);
  const [popupInfo, setPopupInfo] = useState<PopupInfo | null>(null);

  const debouncedBounds = useDebounce(bounds, 500); // Debounce bounds to avoid excessive refetching

  const traffic = useQuery({
    queryKey: ["foot-traffic-bounds", debouncedBounds?.toArray()],
    queryFn: async () => {
      if (!debouncedBounds) return { places: [] };

      const [sw, ne] = debouncedBounds.toArray();
      const qs = new URLSearchParams({
        sw_lat: String(sw[1]),
        sw_lng: String(sw[0]),
        ne_lat: String(ne[1]),
        ne_lng: String(ne[0]),
      });
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8001"}/api/foot-traffic?${qs.toString()}`);
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
    return <div>Mapbox token required</div>; // Simplified from previous version
  }

  return (
    <Map
      {...viewState}
      onMove={evt => setViewState(evt.viewState)}
      onMoveEnd={() => setBounds(mapRef.current?.getBounds() ?? null)}
      mapStyle={mapStyle}
      style={{ width: "100%", height: "100%" }}
      mapboxAccessToken={token}
      ref={mapRef}
      interactiveLayerIds={['traffic-circles']}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="absolute right-2 top-2">
        <MapControls />
      </div>

      {viewState.zoom < MIN_ZOOM_FOR_DATA && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-md bg-background/80 px-4 py-2 text-sm font-semibold shadow-lg backdrop-blur-sm">
            Zoom in to see foot traffic
          </div>
        </div>
      )}

      <Source id="traffic" type="geojson" data={geojson}>
        <Layer
          id="traffic-circles"
          type="circle"
          paint={{
            "circle-radius": [
              "interpolate", ["linear"], ["zoom"],
              MIN_ZOOM_FOR_DATA, ["interpolate", ["linear"], ["get", "avg_busyness"], 0, 3, 100, 10],
              15, ["interpolate", ["linear"], ["get", "avg_busyness"], 0, 5, 100, 20],
            ],
            "circle-color": [
              "step", ["get", "avg_busyness"],
              "#3b82f6", 40,
              "#facc15", 65,
              "#ef4444"
            ],
            "circle-opacity": 0.8,
            "circle-stroke-width": 1,
            "circle-stroke-color": "#ffffff"
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
        >
          <div className="text-xs">
            <div className="font-bold">{popupInfo.name}</div>
            <div>Busyness: {Math.round(popupInfo.avg_busyness)}/100</div>
          </div>
        </Popup>
      )}

      <div className="absolute bottom-4 left-4">
        <MapLegend />
      </div>
    </Map>
  );
}


