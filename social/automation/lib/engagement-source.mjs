export function socialSource(raw){
  const u=new URL(raw);
  if(u.protocol!=='https:'||u.username||u.password||u.port)throw Error('Podaj publiczny link HTTPS do konkretnej publikacji.');
  const host=u.hostname.toLowerCase().replace(/^www\./,'');
  const instagram=host==='instagram.com'&&/^\/(p|reel)\/[A-Za-z0-9_-]+\/?$/.test(u.pathname);
  const tiktok=host==='tiktok.com'&&/^\/@[A-Za-z0-9_.]+\/(video|photo)\/\d+\/?$/.test(u.pathname);
  if(!instagram&&!tiktok)throw Error('Obsługujemy pełne linki do postów lub rolek Instagram i TikTok.');
  return {platform:instagram?'instagram':'tiktok',url:'https://www.'+host+u.pathname.replace(/\/$/,'')+'/'};
}
export function citedSocialSources(response){
  const sources=[];
  for(const output of response.output||[])for(const item of output.content||[])for(const a of item.annotations||[]){
    if(a.type!=='url_citation')continue;
    try{const s=socialSource(a.url);if(!sources.some(x=>x.url===s.url))sources.push({...s,title:String(a.title||'Publikacja').slice(0,200)});}catch{}
  }
  return sources;
}
