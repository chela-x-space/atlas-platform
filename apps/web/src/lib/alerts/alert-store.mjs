const statuses=new Map(),history=new Map();
export function statusFor(id){return statuses.get(id)??"NEW"}
export function transition(id,status,now=new Date().toISOString(),reason="user transition"){const previous=statusFor(id);statuses.set(id,status);const events=history.get(id)??[];events.push({from:previous,to:status,status,at:now,reason});history.set(id,events);return status}
export function auditFor(id){return[...(history.get(id)??[])]}
export function clearAlertStore(){statuses.clear();history.clear()}
