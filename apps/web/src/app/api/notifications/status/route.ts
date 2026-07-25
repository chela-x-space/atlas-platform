import {NextResponse} from "next/server";
import {getNotificationSnapshot} from "@/lib/notifications/notification-service";
export const dynamic="force-dynamic";
export async function GET(){const snapshot=getNotificationSnapshot();return NextResponse.json({runtime:"ready",version:"atlas-notification-runtime-v1.7",queue:"fifo",adapterRegistry:["webhook"],statuses:snapshot.statuses,queued:snapshot.jobs.length,attempts:snapshot.attempts,generatedAt:snapshot.generatedAt})}
