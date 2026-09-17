import { fromZonedTime } from "date-fns-tz";

export function localEventDate(date:string,time:string|null,timezone:string):Date|null{
  const match=/^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if(!match)return null;
  const year=Number(match[1]),month=Number(match[2]),day=Number(match[3]);
  const calendar=new Date(Date.UTC(year,month-1,day));
  if(calendar.getUTCFullYear()!==year||calendar.getUTCMonth()+1!==month||calendar.getUTCDate()!==day)return null;
  const clock=time??"00:00";
  if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(clock))return null;
  const result=fromZonedTime(`${date}T${clock}:00`,timezone);
  return Number.isFinite(result.getTime())?result:null;
}
