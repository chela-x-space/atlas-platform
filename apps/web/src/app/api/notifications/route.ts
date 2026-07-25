import {NextResponse} from "next/server";
import {getNotificationSnapshot} from "@/lib/notifications/notification-service";
export const dynamic="force-dynamic";
export async function GET(){return NextResponse.json(getNotificationSnapshot(),{headers:{"Cache-Control":"no-store"}})}
