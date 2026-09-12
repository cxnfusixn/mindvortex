import fs from 'node:fs/promises';
import path from 'node:path';
export async function GET(req,{params}){
 const {file}=await params;if(!/^[0-9a-f-]{36}\.(jpg|mp4)$/.test(file))return new Response(null,{status:404});
 try{
  const bytes=await fs.readFile(path.join(process.env.SOCIAL_MEDIA_DIR||path.resolve('media'),file));
  const headers={'Content-Type':file.endsWith('.mp4')?'video/mp4':'image/jpeg','Cache-Control':'public, max-age=86400','X-Content-Type-Options':'nosniff','Accept-Ranges':'bytes'};
  const range=req.headers.get('range');
  if(range){const m=/^bytes=(\d+)-(\d*)$/.exec(range);if(!m)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${bytes.length}`}});const start=Number(m[1]),end=m[2]?Math.min(Number(m[2]),bytes.length-1):bytes.length-1;if(start>end||start>=bytes.length)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${bytes.length}`}});return new Response(bytes.subarray(start,end+1),{status:206,headers:{...headers,'Content-Length':String(end-start+1),'Content-Range':`bytes ${start}-${end}/${bytes.length}`}});}
  return new Response(bytes,{headers:{...headers,'Content-Length':String(bytes.length)}});
 }catch{return new Response(null,{status:404});}
}
export async function HEAD(req,ctx){const response=await GET(req,ctx);return new Response(null,{status:response.status,headers:response.headers});}
