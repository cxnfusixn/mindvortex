import {NextResponse} from 'next/server';
import {authorized} from './lib/auth.mjs';
export async function proxy(req){
 const p=req.nextUrl.pathname.replace(/^\/studio-social(?=\/|$)/,'')||'/';
 if(p==='/login'||p==='/api/auth'||p.startsWith('/_next/static/')||p.startsWith('/fonts/')||/^\/media\/[0-9a-f-]{36}\.(jpg|mp4)$/.test(p))return NextResponse.next();
 if(await authorized(req))return NextResponse.next();
 if(p.startsWith('/api'))return NextResponse.json({error:'Zaloguj się ponownie.'},{status:401});
 return NextResponse.redirect(new URL('/studio-social/login',process.env.SOCIAL_PUBLIC_URL));
}
export const config={matcher:['/:path*']};
