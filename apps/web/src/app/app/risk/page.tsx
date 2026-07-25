import type {Metadata} from "next";
import {RiskOperationsCenter} from "@/components/risk/RiskOperationsCenter";
export const metadata:Metadata={title:"Global Risk | ATLAS",description:"Deterministic operational risk classifications over verified ATLAS events."};
export default function RiskPage(){return <RiskOperationsCenter/>}
