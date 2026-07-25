export const NOTIFICATION_VERSION="atlas-notification-runtime-v1.7" as const;
export const DELIVERY_STATUSES=["PENDING","RUNNING","SUCCESS","FAILED","RETRYING","DEAD_LETTER","CANCELLED"] as const;
export type DeliveryStatus=typeof DELIVERY_STATUSES[number];
export type DeliveryChannel="webhook";
export type DeliveryJob={readonly id:string;readonly alertId:string;readonly channel:DeliveryChannel;readonly target:string;readonly payload:Readonly<Record<string,unknown>>;readonly status:DeliveryStatus;readonly attempts:number;readonly createdAt:string;readonly updatedAt:string;readonly nextAttemptAt:string|null;readonly lastError:string|null;readonly idempotencyKey:string;readonly timeoutMs:number};
export type DeliveryAttempt={readonly id:string;readonly jobId:string;readonly attempt:number;readonly status:DeliveryStatus;readonly startedAt:string;readonly finishedAt:string|null;readonly error:string|null;readonly adapter:string};
