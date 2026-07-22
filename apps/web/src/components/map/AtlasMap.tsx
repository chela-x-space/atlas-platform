"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import maplibregl, {
  GeoJSONSource,
  Map as MapLibreMap,
  MapLayerMouseEvent,
} from "maplibre-gl";
import { EARTHQUAKE_LAYER_IDS, earthquakeLayersVisible } from "@/lib/dashboard-logic.mjs";
import type { AtlasEventPage } from "@/types/atlas-data";


type FeedRange = "24h" | "7d" | "30d";

type AtlasMapProps = {
  activeLayer: string;
  onCoordinateSelect?: (longitude: number, latitude: number) => void;
};

type EarthquakeProperties = {
  mag: number | null;
  place: string | null;
  time: number | null;
  url: string | null;
  alert: string | null;
  tsunami: number | null;
};

type EarthquakeFeature = GeoJSON.Feature<
  GeoJSON.Point,
  EarthquakeProperties
>;

type EarthquakeCollection =
  GeoJSON.FeatureCollection<
    GeoJSON.Point,
    EarthquakeProperties
  >;

const EMPTY_COLLECTION: EarthquakeCollection = {
  type: "FeatureCollection",
  features: [],
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getMagnitudeColor(
  magnitude: number | null
): string {
  if (magnitude === null) {
    return "#7f8c98";
  }

  if (magnitude >= 6) {
    return "#ff3b30";
  }

  if (magnitude >= 4.5) {
    return "#ff8c24";
  }

  if (magnitude >= 2.5) {
    return "#ffd43b";
  }

  return "#41b8ff";
}

function normalizeFeatures(
  collection: EarthquakeCollection
): EarthquakeCollection {
  return {
    ...collection,
    features: collection.features.filter((feature) => {
      if (feature.geometry?.type !== "Point" || !Array.isArray(feature.geometry.coordinates)) return false;
      const [longitude, latitude] = feature.geometry.coordinates;
      return Number.isFinite(longitude) && Number.isFinite(latitude) && longitude >= -180 && longitude <= 180 && latitude >= -90 && latitude <= 90;
    }),
  };
}

export function AtlasMap({
  activeLayer,
  onCoordinateSelect,
}: AtlasMapProps) {
  const containerRef =
    useRef<HTMLDivElement | null>(null);

  const mapRef =
    useRef<MapLibreMap | null>(null);
  const activeLayerRef = useRef(activeLayer);

  const [range, setRange] =
    useState<FeedRange>("24h");

  const [eventCount, setEventCount] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [globeEnabled, setGlobeEnabled] =
    useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  function applyLayerVisibility(map: MapLibreMap, layer: string) {
    const visibility = earthquakeLayersVisible(layer) ? "visible" : "none";
    for (const layerId of EARTHQUAKE_LAYER_IDS) {
      if (map.getLayer(layerId)) map.setLayoutProperty(layerId, "visibility", visibility);
    }
  }

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style:
        "https://demotiles.maplibre.org/style.json",
      center: [15, 18],
      zoom: 1.35,
      minZoom: 0.7,
      maxZoom: 15,
      pitch: 0,
      bearing: 0,
      attributionControl: false,
      maplibreLogo: true,
    });

    map.addControl(
      new maplibregl.NavigationControl({
        showCompass: true,
        showZoom: true,
        visualizePitch: true,
      }),
      "top-right"
    );

    map.addControl(
      new maplibregl.ScaleControl({
        maxWidth: 120,
        unit: "metric",
      }),
      "bottom-right"
    );

    map.addControl(
      new maplibregl.AttributionControl({
        compact: true,
      }),
      "bottom-left"
    );

    map.on("load", () => {
      map.addSource("earthquakes", {
        type: "geojson",
        data: EMPTY_COLLECTION,
        cluster: true,
        clusterMaxZoom: 7,
        clusterRadius: 48,
      });

      map.addLayer({
        id: "earthquake-clusters",
        type: "circle",
        source: "earthquakes",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": [
            "step",
            ["get", "point_count"],
            "#ffc340",
            50,
            "#ff8426",
            200,
            "#ff3b30",
          ],
          "circle-radius": [
            "step",
            ["get", "point_count"],
            15,
            50,
            21,
            200,
            28,
          ],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
          "circle-opacity": 0.88,
        },
      });

      map.addLayer({
        id: "earthquake-cluster-count",
        type: "symbol",
        source: "earthquakes",
        filter: ["has", "point_count"],
        layout: {
          "text-field": [
            "get",
            "point_count_abbreviated",
          ],
          "text-size": 11,
        },
        paint: {
          "text-color": "#ffffff",
        },
      });

      map.addLayer({
        id: "earthquake-points",
        type: "circle",
        source: "earthquakes",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["coalesce", ["get", "mag"], 0],
            0,
            4,
            3,
            7,
            5,
            10,
            7,
            15,
          ],
          "circle-color": [
            "step",
            ["coalesce", ["get", "mag"], 0],
            "#41b8ff",
            2.5,
            "#ffd43b",
            4.5,
            "#ff8c24",
            6,
            "#ff3b30",
          ],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
          "circle-opacity": 0.92,
        },
      });

      map.addLayer({
        id: "earthquake-pulse",
        type: "circle",
        source: "earthquakes",
        filter: [
          "all",
          ["!", ["has", "point_count"]],
          [">=", ["coalesce", ["get", "mag"], 0], 4.5],
        ],
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["coalesce", ["get", "mag"], 0],
            4.5,
            14,
            7,
            30,
          ],
          "circle-color": "rgba(255,59,48,0)",
          "circle-stroke-color": "#ff5148",
          "circle-stroke-width": 2,
          "circle-opacity": 0.35,
        },
      });

      applyLayerVisibility(map, activeLayerRef.current);

      map.on(
        "click",
        "earthquake-clusters",
        async (event: MapLayerMouseEvent) => {
          const feature =
            event.features?.[0];

          if (!feature) {
            return;
          }

          const clusterId =
            feature.properties?.cluster_id;

          const coordinates =
            (feature.geometry as GeoJSON.Point)
              .coordinates as [number, number];

          const source =
            map.getSource(
              "earthquakes"
            ) as GeoJSONSource;

          try {
            const zoom =
              await source.getClusterExpansionZoom(
                clusterId
              );

            map.easeTo({
              center: coordinates,
              zoom,
            });
          } catch (clusterError) {
            console.error(
              "Cluster expansion failed:",
              clusterError
            );
          }
        }
      );

      map.on(
        "click",
        "earthquake-points",
        (event: MapLayerMouseEvent) => {
          const feature =
            event.features?.[0] as
              | EarthquakeFeature
              | undefined;

          if (!feature) {
            return;
          }

          const coordinates =
            feature.geometry.coordinates as [
              number,
              number,
              number?
            ];

          const properties =
            feature.properties;

          const magnitude =
            properties.mag ?? 0;

          const place =
            properties.place ??
            "Unknown location";

          const time =
            properties.time
              ? new Date(
                  properties.time
                ).toLocaleString()
              : "Unknown time";

          const depth =
            coordinates[2] ?? 0;

          const markerColor =
            getMagnitudeColor(
              properties.mag
            );

          const html = `
            <article class="atlas-map-popup">
              <span class="atlas-map-popup-label">
                LIVE EARTHQUAKE
              </span>

              <strong style="color:${markerColor}">
                M ${magnitude.toFixed(1)}
              </strong>

              <h3>${escapeHtml(place)}</h3>

              <p>
                ${escapeHtml(time)}
                <br>
                Depth: ${depth.toFixed(1)} km
                <br>
                Tsunami flag:
                ${properties.tsunami === 1
                  ? "Yes"
                  : "No"}
                <br>Category: earthquake
              </p>
              ${properties.url ? `<a href="${escapeHtml(properties.url)}" target="_blank" rel="noopener noreferrer">USGS source ↗</a>` : ""}
            </article>
          `;

          new maplibregl.Popup({
            closeButton: true,
            closeOnClick: true,
            maxWidth: "290px",
          })
            .setLngLat([
              coordinates[0],
              coordinates[1],
            ])
            .setHTML(html)
            .addTo(map);
        }
      );

      for (const layerId of [
        "earthquake-clusters",
        "earthquake-points",
      ]) {
        map.on("mouseenter", layerId, () => {
          map.getCanvas().style.cursor =
            "pointer";
        });

        map.on("mouseleave", layerId, () => {
          map.getCanvas().style.cursor = "";
        });
      }

      map.on("click", (event) => {
        if (activeLayerRef.current === "Weather") onCoordinateSelect?.(event.lngLat.lng, event.lngLat.lat);
      });
    });

    mapRef.current = map;

    const observer = new ResizeObserver(() => {
      map.resize();
    });

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, [onCoordinateSelect]);

  useEffect(() => {
    let cancelled = false;

    async function loadEarthquakes() {
      setLoading(true);
      setError("");

      try {
        const days=range==="24h"?1:range==="7d"?7:30;
        const after=new Date(Date.now()-days*86_400_000).toISOString();
        const response = await fetch(
          `/api/events?category=earthquake&after=${encodeURIComponent(after)}&limit=500`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            `Earthquake API returned ${response.status}`
          );
        }

        const page=(await response.json()) as AtlasEventPage;
        const collection=normalizeFeatures({type:"FeatureCollection",features:page.events.filter(event=>event.coordinates).map(event=>({type:"Feature",id:event.id,geometry:{type:"Point",coordinates:[event.coordinates!.longitude,event.coordinates!.latitude,event.coordinates!.depthKilometers??0]},properties:{mag:typeof event.metadata.magnitude==="number"?event.metadata.magnitude:null,place:event.region??event.title,time:Date.parse(event.occurredAt),url:event.sourceUrl,alert:typeof event.metadata.alert==="string"?event.metadata.alert:null,tsunami:event.metadata.tsunami===true?1:0}}))});

        if (cancelled) {
          return;
        }

        setEventCount(
          collection.features.length
        );

        const map = mapRef.current;

        if (!map) {
          return;
        }

        const updateSource = () => {
          const source =
            map.getSource(
              "earthquakes"
            ) as GeoJSONSource | undefined;

          source?.setData(collection);
        };

        if (map.isStyleLoaded()) {
          updateSource();
        } else {
          map.once("load", updateSource);
        }
      } catch (loadError) {
        if (cancelled) {
          return;
        }

        console.error(loadError);
        setEventCount(0);
        setError(
          "ไม่สามารถโหลดข้อมูลแผ่นดินไหวจาก USGS ได้"
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadEarthquakes();

    const refreshInterval =
      window.setInterval(
        loadEarthquakes,
        60_000
      );

    return () => {
      cancelled = true;
      window.clearInterval(refreshInterval);
    };
  }, [range, reloadToken]);

  useEffect(() => {
    activeLayerRef.current = activeLayer;
    const map = mapRef.current;

    if (
      !map ||
      !map.getLayer("earthquake-points")
    ) {
      return;
    }

    applyLayerVisibility(map, activeLayer);
  }, [activeLayer]);

  function toggleGlobe() {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    const nextState = !globeEnabled;

    map.setProjection({
      type: nextState
        ? "globe"
        : "mercator",
    });

    map.easeTo({
      zoom: nextState ? 1.15 : 1.35,
      pitch: nextState ? 12 : 0,
      bearing: 0,
      duration: 700,
    });

    setGlobeEnabled(nextState);
  }

  function resetView() {
    mapRef.current?.easeTo({
      center: [15, 18],
      zoom: globeEnabled ? 1.15 : 1.35,
      pitch: globeEnabled ? 12 : 0,
      bearing: 0,
      duration: 700,
    });
  }

  return (
    <section className="atlas-live-map">
      <div className="atlas-map-statusbar" aria-live="polite">
        <div>
          <span className="atlas-map-live">
            LIVE
          </span>

          <strong>
            {loading
              ? "Loading USGS data..."
              : `${eventCount.toLocaleString()} real earthquakes`}
          </strong>
        </div>

        <div className="atlas-map-range">
          {(
            [
              ["24h", "24H"],
              ["7d", "7D"],
              ["30d", "30D"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={
                range === value
                  ? "active"
                  : ""
              }
              onClick={() => setRange(value)}
              aria-pressed={range === value}
              aria-label={`Show earthquakes from the last ${label}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="atlas-map-shell">
        <div
          ref={containerRef}
          className="atlas-map-container"
        />

        <div className="atlas-map-custom-controls">
          <button
            type="button"
            className={
              globeEnabled ? "active" : ""
            }
            onClick={toggleGlobe}
            aria-pressed={globeEnabled}
            aria-label={`Switch to ${globeEnabled ? "Mercator" : "globe"} projection`}
          >
            Globe
          </button>

          <button
            type="button"
            onClick={() =>
              mapRef.current?.zoomIn()
            }
            aria-label="Zoom in"
          >
            +
          </button>

          <button
            type="button"
            onClick={() =>
              mapRef.current?.zoomOut()
            }
            aria-label="Zoom out"
          >
            −
          </button>

          <button
            type="button"
            aria-label="Reset compass to north"
            onClick={() => mapRef.current?.easeTo({ bearing: 0, pitch: 0 })}
          >
            Compass
          </button>

          <button
            type="button"
            onClick={resetView}
            aria-label="Reset map view"
          >
            Reset
          </button>
        </div>

        {error ? (
          <div className="atlas-map-error" role="alert" aria-live="assertive">
            {error} <button type="button" onClick={() => setReloadToken((value) => value + 1)}>Retry</button>
          </div>
        ) : null}

        {!loading && !error && eventCount === 0 ? (
          <div className="atlas-map-empty" role="status">No earthquakes were reported for this range.</div>
        ) : null}

        <div className="atlas-map-source-note">
          MapLibre • USGS GeoJSON • WGS84 • fetched via ATLAS
        </div>
      </div>
    </section>
  );
}
