"use client";

import { useEffect, useState } from "react";
import { AtlasDashboard } from "@/components/dashboard/AtlasDashboard";
import { AtlasMobileOverview } from "./AtlasMobileOverview";

const MOBILE_QUERY = "(max-width: 1179px)";

export function ResponsiveAtlasDashboard() {
  const [mobile,setMobile]=useState<boolean|null>(null);
  useEffect(()=>{
    const media=window.matchMedia(MOBILE_QUERY);
    const forceDesktop=new URLSearchParams(window.location.search).get("desktop")==="1";
    document.documentElement.classList.toggle("atlas-desktop-override",forceDesktop);
    const update=()=>setMobile(media.matches&&!forceDesktop);
    update();media.addEventListener("change",update);
    return()=>{media.removeEventListener("change",update);document.documentElement.classList.remove("atlas-desktop-override");};
  },[]);
  if(mobile===null)return <main className="atlas-mobile-boot" aria-busy="true"><strong>ATLAS</strong><span>Loading service view…</span></main>;
  return mobile?<AtlasMobileOverview/>:<AtlasDashboard/>;
}
