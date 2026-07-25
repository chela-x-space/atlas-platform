import {NextResponse} from "next/server";
import {cancelNotification} from "@/lib/notifications/notification-service";
export const dynamic="force-dynamic";
export async function PATCH(_request:Request,{params}:{params:Promise<{id:string}>}){const {id}=await params;const value=cancelNotification(id);return value?NextResponse.json({job:value}):NextResponse.json({error:{code:"NOTIFICATION_NOT_CANCELLABLE",message:"Notification cannot be cancelled"}},{status:404})}
