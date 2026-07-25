import type {Metadata} from "next";import {AlertCenter} from "@/components/alerts/AlertCenter";
export const metadata:Metadata={title:"Alert Center | ATLAS",description:"Deterministic lifecycle management for verified ATLAS alert projections."};
export default function AlertsPage(){return <AlertCenter/>}
