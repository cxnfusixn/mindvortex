import {dayKey,addDays} from './brand.mjs';
export function warsawHour(now=new Date()){return Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Warsaw',hour:'2-digit',hourCycle:'h23'}).format(now));}
export function reelSlots(config,now=new Date()){
 const today=dayKey(now);let day=today;
 if(config.interval_days){
  const anchor=String(config.anchor_day||'2026-09-11').slice(0,10),elapsed=Math.round((new Date(today+'T12:00:00Z')-new Date(anchor+'T12:00:00Z'))/86400000);
  day=addDays(anchor,Math.max(0,Math.ceil(elapsed/config.interval_days))*config.interval_days);
  if(day===today&&warsawHour(now)>=config.hour)day=addDays(day,config.interval_days);
  return Array.from({length:config.horizon},(_,i)=>addDays(day,config.interval_days*i));
 }
 while(new Date(day+'T12:00:00Z').getUTCDay()!==config.weekday||day===today&&warsawHour(now)>=config.hour)day=addDays(day,1);
 return Array.from({length:config.horizon},(_,i)=>addDays(day,7*i));
}
