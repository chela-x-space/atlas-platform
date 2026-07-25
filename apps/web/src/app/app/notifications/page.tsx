import type {Metadata} from "next";
import {NotificationCenter} from "@/components/notifications/NotificationCenter";
export const metadata:Metadata={title:"Notification Runtime | ATLAS",description:"Deterministic delivery queue and webhook runtime."};
export default function NotificationsPage(){return <NotificationCenter/>}
