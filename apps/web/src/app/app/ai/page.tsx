import { getAiRadar } from "@/lib/ai-radar/ai-radar-service";
import { AiRadarExplorer } from "@/components/ai-radar/AiRadarExplorer";
export const dynamic="force-dynamic";
export default async function AiRadarPage(){return <AiRadarExplorer snapshot={await getAiRadar()}/>}
