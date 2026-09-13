const production = process.env.NODE_ENV === 'production';
export default {
  basePath:'/studio-social', poweredByHeader:false,
  serverExternalPackages:['pg','sharp','fontkit','nodemailer'],
  turbopack:{root:process.cwd()},
  async headers() {
    return [{source:'/:path*',headers:[
      {key:'X-Content-Type-Options',value:'nosniff'},
      {key:'X-Frame-Options',value:'DENY'},
      {key:'Referrer-Policy',value:'same-origin'},
      {key:'X-Robots-Tag',value:'noindex, nofollow'},
      ...(production ? [{key:'Strict-Transport-Security',value:'max-age=31536000'}] : []),
      {key:'Content-Security-Policy',value:`default-src 'self'; script-src 'self' 'unsafe-inline'${production ? '' : " 'unsafe-eval'"}; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.cdninstagram.com https://*.fbcdn.net; font-src 'self'; connect-src 'self'${production ? '' : ' ws:'}; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'`},
    ]}];
  },
};
