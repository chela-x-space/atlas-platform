import type {Metadata} from "next";import {IntelligenceSearchExplorer} from "@/components/search/IntelligenceSearchExplorer";
export const metadata:Metadata={title:"Intelligence Search & Explorer | ATLAS",description:"Deterministic search across verified canonical ATLAS intelligence."};
export default function SearchPage(){return <IntelligenceSearchExplorer/>}
