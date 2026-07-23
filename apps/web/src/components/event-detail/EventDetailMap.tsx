"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl, { Map as MapLibreMap, Marker } from "maplibre-gl";

type EventDetailMapProps = {
  readonly longitude: number;
  readonly latitude: number;
  readonly title: string;
};

export function EventDetailMap({ longitude, latitude, title }: EventDetailMapProps) {
  const container = useRef<HTMLDivElement | null>(null);
  const map = useRef<MapLibreMap | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!container.current || map.current) return;
    try {
      const instance = new maplibregl.Map({
        container: container.current,
        style: "https://demotiles.maplibre.org/style.json",
        center: [longitude, latitude],
        zoom: 5,
        minZoom: 1,
      });
      map.current = instance;
      instance.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
      new Marker({ color: "#54c8ff" })
        .setLngLat([longitude, latitude])
        .setPopup(new maplibregl.Popup({ offset: 18 }).setText(title))
        .addTo(instance);
      instance.on("error", () => setError("Interactive map tiles are temporarily unavailable."));
      return () => {
        instance.remove();
        map.current = null;
      };
    } catch {
      queueMicrotask(() => setError("Interactive map could not initialize."));
    }
  }, [latitude, longitude, title]);

  return (
    <div className="event-detail-map-shell">
      <div
        className="event-detail-map"
        ref={container}
        role="img"
        aria-label={`Map showing ${title} at ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`}
      />
      {error && (
        <div className="event-detail-map-fallback" role="status">
          <strong>Map unavailable</strong>
          <span>{error}</span>
          <span>Verified coordinates: {latitude.toFixed(4)}, {longitude.toFixed(4)}</span>
        </div>
      )}
    </div>
  );
}
