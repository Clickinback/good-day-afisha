export const LIFECYCLE_POLICY_VERSION="lifecycle-v1";
export const EXPIRATION_GRACE_HOURS=6;
export const TRUSTED_UPDATE_THRESHOLD=.8;
export function isExpired(event:{startsAt:Date;endsAt:Date|null},now=new Date(),graceHours=EXPIRATION_GRACE_HOURS){const boundary=event.endsAt??new Date(event.startsAt.getTime()+graceHours*3_600_000);return boundary<now}
export function canApplyLifecycleUpdate(trustScore:number,distinctSources:number){return trustScore>=TRUSTED_UPDATE_THRESHOLD||distinctSources>=2}
