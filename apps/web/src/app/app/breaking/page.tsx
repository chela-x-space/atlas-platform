import {BreakingNewsCenter} from "@/components/breaking/BreakingNewsCenter";
import {getBreakingSnapshot} from "@/lib/breaking/breaking-service";
export const dynamic="force-dynamic";
export default async function BreakingPage(){return <BreakingNewsCenter snapshot={await getBreakingSnapshot()}/>}
