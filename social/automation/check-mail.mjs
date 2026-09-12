import nodemailer from 'nodemailer';
const transport=nodemailer.createTransport({host:process.env.SMTP_HOST,port:Number(process.env.SMTP_PORT||465),secure:process.env.SMTP_PORT!=='587',auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASSWORD}});
await transport.verify();transport.close();console.log('SMTP connection and authentication verified; no email sent.');
