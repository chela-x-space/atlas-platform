import type {Metadata} from "next";
import {ReportsCenter} from "@/components/reports/ReportsCenter";
export const metadata:Metadata={title:"Reports Center | ATLAS",description:"Deterministic reports generated from verified canonical ATLAS data."};
export default function ReportsPage(){return <ReportsCenter/>}
