import type {Metadata} from "next";
import {WatchlistsCenter} from "@/components/watchlists/WatchlistsCenter";
export const metadata:Metadata={title:"Watchlists & Intelligence Monitoring | ATLAS",description:"Local deterministic monitoring of verified ATLAS intelligence."};
export default function WatchlistsPage(){return <WatchlistsCenter/>}
