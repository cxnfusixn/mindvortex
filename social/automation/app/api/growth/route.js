import {authorized} from '../../../lib/auth.mjs';
import {init} from '../../../lib/db.mjs';
import {growthData} from '../../../lib/growth-data.mjs';
export const dynamic='force-dynamic';
export async function GET(req){
  if(!await authorized(req))return new Response(null,{status:401});
  await init();
  return Response.json(await growthData(),{headers:{'Cache-Control':'no-store'}});
}
