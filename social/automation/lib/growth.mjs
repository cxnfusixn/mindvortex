// Editorial experiments extend the existing brand, schedule and deduplication rules.
export const growthPolicy = Object.freeze({
  version:'growth-v1', baselineDays:30, planningDays:21, reviewDays:7,
  minimumViews:100, minimumExamples:5, engagementDailyLimit:5,
  hooks:[
    {id:'observation',label:'Obserwacja',instruction:'Open with a specific, relatable observation that makes the reader curious.'},
    {id:'question',label:'Pytanie',instruction:'Open with a short, concrete question the audience can recognise from everyday life.'},
    {id:'contrast',label:'Porównanie',instruction:'Open with a concrete before/after or two-option contrast, without inventing results.'},
  ],
});
export const growthWritingRules=' Focus on ONE useful idea and a human benefit. Deliver the hook immediately, without a greeting or generic introduction. End with ONE natural invitation to save, share, discuss a specific experience, or enquire when relevant. No engagement bait, empty questions, artificial urgency or promises of reach. Use topic-specific hashtags, never unrelated trending tags. Each scene or graphic point must advance the idea. Keep existing typography and layout limits.';
export function experimentFor(day){
  const index=Math.floor(Date.parse(day+'T12:00:00Z')/86400000);
  return {...growthPolicy.hooks[((index%3)+3)%3],version:growthPolicy.version};
}
export function perThousand(value,views){return Number.isFinite(value)&&value>=0&&Number.isFinite(views)&&views>0?value/views*1000:null;}
export function median(values){const v=values.filter(Number.isFinite).sort((a,b)=>a-b);return v.length?v.length%2?v[(v.length-1)/2]:(v[v.length/2-1]+v[v.length/2])/2:null;}
export function growthSummary(rows,platform,now=new Date()){
  const cutoff=new Date(now.getTime()-growthPolicy.baselineDays*86400000).toISOString().slice(0,10);
  const recent=rows.filter(p=>p.platform===platform&&p.day>=cutoff&&p.day<=now.toISOString().slice(0,10));
  const ranked=recent.map(p=>({...p,sharesPer1000:perThousand(p.metrics?.shares,p.metrics?.views),commentsPer1000:perThousand(p.metrics?.comments,p.metrics?.views)}));
  const measured=ranked.filter(p=>Number.isFinite(p.metrics?.views));
  return {count:recent.length,measured:measured.length,medianViews:median(measured.map(p=>p.metrics.views)),
    ranked:ranked.sort((a,b)=>(b.metrics?.views??-1)-(a.metrics?.views??-1)),
    eligible:ranked.filter(p=>p.metrics?.views>=growthPolicy.minimumViews&&p.sharesPer1000!==null),
    note:'Bieżące liczniki publikacji z ostatnich 30 dni. To punkt odniesienia, nie przyrost w tym okresie ani dowód skuteczności formatu.'};
}
