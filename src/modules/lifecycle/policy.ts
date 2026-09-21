import { formatInTimeZone,fromZonedTime } from "date-fns-tz";

export const LIFECYCLE_POLICY_VERSION="lifecycle-v2";
export const EXPIRATION_GRACE_HOURS=6;
export const TRUSTED_UPDATE_THRESHOLD=.8;
type ExpirableEvent={startsAt:Date;endsAt:Date|null;timeTbd?:boolean;timezone?:string};
export function expirationBoundary(event:ExpirableEvent,graceHours=EXPIRATION_GRACE_HOURS){
  if(event.endsAt)return event.endsAt;
  if(event.timeTbd&&event.timezone){
    const localDate=formatInTimeZone(event.startsAt,event.timezone,"yyyy-MM-dd");
    return fromZonedTime(`${localDate}T23:59:59.999`,event.timezone);
  }
  return new Date(event.startsAt.getTime()+graceHours*3_600_000);
}
export function isExpired(event:ExpirableEvent,now=new Date(),graceHours=EXPIRATION_GRACE_HOURS){return expirationBoundary(event,graceHours)<now}
export function hasSuspiciousPastYear(event:{startsAt:Date;timezone:string},now=new Date()){
  return Number(formatInTimeZone(event.startsAt,event.timezone,"yyyy"))<Number(formatInTimeZone(now,event.timezone,"yyyy"));
}
export function canApplyLifecycleUpdate(trustScore:number,distinctSources:number){return trustScore>=TRUSTED_UPDATE_THRESHOLD||distinctSources>=2}
