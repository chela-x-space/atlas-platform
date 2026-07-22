import { NextRequest, NextResponse } from "next/server";

const USGS_FEEDS = {
  "24h":
    "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson",
  "7d":
    "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson",
  "30d":
    "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson",
} as const;

type FeedRange = keyof typeof USGS_FEEDS;

export async function GET(request: NextRequest) {
  const requestedRange =
    request.nextUrl.searchParams.get("range") ?? "24h";

  const range: FeedRange =
    requestedRange in USGS_FEEDS
      ? (requestedRange as FeedRange)
      : "24h";

  try {
    const response = await fetch(USGS_FEEDS[range], {
      next: {
        revalidate: 60,
      },
      headers: {
        Accept: "application/geo+json, application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `USGS returned HTTP ${response.status}`
      );
    }

    const data = await response.json();

    return NextResponse.json(data, {
      headers: {
        "Cache-Control":
          "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("USGS earthquake fetch failed:", error);

    return NextResponse.json(
      {
        type: "FeatureCollection",
        metadata: {
          title: "USGS Earthquakes",
          count: 0,
          status: 503,
        },
        features: [],
      },
      {
        status: 503,
      }
    );
  }
}
