import {NextResponse} from "next/server";
import {getNotification} from "@/lib/notifications/notification-service";
export const dynamic="force-dynamic";
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){const {id}=await params;const value=getNotification(id);return value?NextResponse.json(value):NextResponse.json({error:{code:"NOTIFICATION_NOT_FOUND",message:"Notification was not found"}},{status:404})}
