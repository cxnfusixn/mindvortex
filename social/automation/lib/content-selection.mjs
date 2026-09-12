export function visualHistoryFor(asset,history){
 const images=[];let repeated=false;
 for(const p of history){
  if(p.media_type==='VIDEO'){
   const content=p.reel_content;if(!content)throw Error('Nie można sprawdzić scen obcej rolki. Wybierz treść bez zdjęcia.');
   if(content.project==='none'||content.project!==asset.project)continue;
   const keys=content.sceneKeys;if(!Array.isArray(keys)||!keys.length)throw Error('Brak spisu scen wcześniejszej rolki.');
   const target=asset.sourceKey.replace(/^marcin-bak/,'marcin').replaceAll('-',':');
   if(keys.some(k=>k.toLowerCase().replaceAll('-',':').startsWith(target)))repeated=true;
   continue;
  }
  if(!p.source||p.source===asset.sourceKey)images.push(p);
 }
 return {images,repeated};
}
export function rankEditorialSources(sources,history,preferred){
 const used=new Map();for(const p of history){const url=p.source?.url;if(url)used.set(url,(used.get(url)||0)+1);}
 return sources.map((s,index)=>({...s,index})).sort((a,b)=>(used.get(a.url)||0)-(used.get(b.url)||0)||Number(b.category===preferred)-Number(a.category===preferred)||a.index-b.index);
}
