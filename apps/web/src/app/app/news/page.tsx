import NewsCenterClient, { type NewsResponse } from "./NewsCenterClient";
import { getOfficialNews } from "@/lib/news/news-service";

export const dynamic = "force-dynamic";

export default async function AtlasNewsPage() {
  let initialPayload: NewsResponse | null = null;
  try {
    initialPayload = await getOfficialNews();
  } catch {
    // The client retains its existing error/retry path if the initial server load fails.
  }
  return <NewsCenterClient initialPayload={initialPayload} />;
}
