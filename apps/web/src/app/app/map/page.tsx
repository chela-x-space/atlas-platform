import type { Metadata } from "next";
import { GlobalOperationsMap } from "@/components/global-map/GlobalOperationsMap";

export const metadata: Metadata = {
  title: "World Map | ATLAS",
  description: "Verified global operations map using canonical ATLAS events.",
};

export default function WorldMapPage() {
  return <GlobalOperationsMap />;
}
