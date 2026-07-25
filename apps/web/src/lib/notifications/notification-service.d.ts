/* eslint-disable @typescript-eslint/no-explicit-any */
export function createWebhookJob(input:{alertId:string;url:string;payload?:Record<string,unknown>}):any;
export function executeJob(id:string):Promise<any>;
export function getNotification(id:string):any;
export function getNotificationSnapshot():any;
export function cancelNotification(id:string):any;
