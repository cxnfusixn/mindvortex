import { contactFormCopy, contactServices } from "../data/contact-form";

type ContactEmail = {
  name: string;
  email: string;
  service: (typeof contactServices)[number];
  message: string;
};

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character]!,
  );

/** A table-based email with inline styles; no remote fonts or images required. */
export function createContactEmail(
  data: ContactEmail,
  receivedAt = new Date(),
) {
  const name = data.name.trim();
  const email = data.email.trim();
  const message = data.message.trim();
  const service =
    contactFormCopy.pl.services[contactServices.indexOf(data.service)] ||
    "Porozmawiajmy";
  const date = new Intl.DateTimeFormat("pl-PL", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Warsaw",
  }).format(receivedAt);
  const subject = `Mind Vortex — nowy projekt / ${service}`;
  const replyHref = escapeHtml(
    `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(`Re: ${service} — Mind Vortex`)}`,
  );
  const label =
    "font-family:'Courier New',monospace;font-size:10px;line-height:16px;letter-spacing:2px;color:#929B95;";
  const text = `MIND VORTEX / NOWY PROJEKT\n${date} (Europe/Warsaw)\n\nOD: ${name}\nE-MAIL: ${email}\nZAKRES: ${service}\n\nWIADOMOŚĆ\n${message}\n\nOdpowiedz bezpośrednio na ten e-mail, aby skontaktować się z ${name}.\n\nMind Vortex / Patryk Pyrka\nhttps://mindvortex.pro`;
  const html = `<!doctype html>
<html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark"><title>${escapeHtml(subject)}</title>
<style>@media only screen and (max-width:480px){.email-pad{padding-left:22px!important;padding-right:22px!important}.email-title{font-size:38px!important;line-height:42px!important}.email-shell{padding:12px 0!important}}</style>
</head><body style="margin:0;padding:0;background-color:#050706;color:#F2F4F3;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;">
<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${escapeHtml(name)} / ${escapeHtml(service)} — nowa wiadomość z formularza Mind Vortex.</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#050706"><tr><td class="email-shell" align="center" style="padding:40px 12px;">
<!--[if mso]><table role="presentation" width="640" cellspacing="0" cellpadding="0" border="0"><tr><td><![endif]-->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#101411" style="max-width:640px;background-color:#101411;border:1px solid #29312B;table-layout:fixed;">
<tr><td height="4" bgcolor="#35F46A" style="height:4px;font-size:0;line-height:0;">&nbsp;</td></tr>
<tr><td class="email-pad" style="padding:32px 40px;border-bottom:1px solid #29312B;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td style="font-family:'Courier New',monospace;font-size:20px;letter-spacing:3px;font-weight:bold;color:#F2F4F3;">MIND <span style="color:#35F46A;">VORTEX</span><br><span style="font-size:9px;letter-spacing:3px;line-height:22px;font-weight:normal;color:#929B95;">PATRYK PYRKA</span></td><td width="32" align="right" valign="top"><table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td width="8" height="8" bgcolor="#129447" style="font-size:0;line-height:0;">&nbsp;</td><td width="5"></td><td width="8" height="8" bgcolor="#35F46A" style="font-size:0;line-height:0;">&nbsp;</td></tr><tr><td height="5" colspan="3"></td></tr><tr><td></td><td></td><td height="8" bgcolor="#35F46A" style="font-size:0;line-height:0;">&nbsp;</td></tr></table></td></tr></table>
</td></tr>
<tr><td class="email-pad" style="padding:36px 40px 28px;">
  <p style="${label}margin:0 0 18px;color:#35F46A;">[01] / NOWA WIADOMOŚĆ</p>
  <h1 class="email-title" style="margin:0;font-family:'Courier New',monospace;font-size:52px;line-height:54px;letter-spacing:-2px;font-weight:bold;color:#F2F4F3;">NOWY<br><span style="color:#35F46A;">PROJEKT_</span></h1>
  <p style="margin:20px 0 0;font-size:14px;line-height:22px;color:#929B95;">Ktoś chce stworzyć coś, co zapada w pamięć.</p>
</td></tr>
<tr><td class="email-pad" style="padding:0 40px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="table-layout:fixed;">
    <tr><td style="padding:20px 0;border-top:1px solid #29312B;"><p style="${label}margin:0 0 7px;">OD</p><p style="margin:0;font-size:20px;line-height:28px;color:#F2F4F3;overflow-wrap:anywhere;word-break:break-word;">${escapeHtml(name)}</p><p style="margin:5px 0 0;font-size:14px;line-height:24px;overflow-wrap:anywhere;word-break:break-word;"><a href="${replyHref}" style="color:#35F46A;text-decoration:underline;">${escapeHtml(email)}</a></p></td></tr>
    <tr><td style="padding:18px 0;border-top:1px solid #29312B;border-bottom:1px solid #29312B;"><p style="${label}margin:0 0 7px;">ZAKRES PROJEKTU</p><p style="margin:0;font-size:16px;line-height:24px;color:#F2F4F3;">${escapeHtml(service)}</p></td></tr>
  </table>
</td></tr>
<tr><td class="email-pad" style="padding:28px 40px 32px;">
  <p style="${label}margin:0 0 14px;">[02] / WIADOMOŚĆ</p>
  <div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:27px;color:#F2F4F3;overflow-wrap:anywhere;word-break:break-word;">${escapeHtml(message).replace(/\r\n|\r|\n/g, "<br>")}</div>
</td></tr>
<tr><td class="email-pad" style="padding:0 40px 36px;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td bgcolor="#35F46A" style="background-color:#35F46A;mso-padding-alt:16px 24px;"><a href="${replyHref}" style="display:inline-block;padding:16px 24px;font-family:'Courier New',monospace;font-size:12px;line-height:18px;font-weight:bold;color:#050706;text-decoration:none;">&gt; odpowiedz_na_projekt &nbsp; ↗</a></td></tr></table>
  <p style="margin:16px 0 0;font-size:12px;line-height:20px;color:#929B95;">Możesz też użyć opcji „Odpowiedz” w swojej poczcie.</p>
</td></tr>
<tr><td class="email-pad" style="padding:22px 40px;border-top:1px solid #29312B;background-color:#050706;">
  <p style="${label}margin:0 0 8px;">${escapeHtml(date)} / EUROPE·WARSAW</p>
  <a href="https://mindvortex.pro" style="font-size:12px;line-height:20px;color:#F2F4F3;text-decoration:none;">mindvortex.pro</a>
  <p style="${label}margin:16px 0 0;font-size:9px;letter-spacing:1px;">BUILD / AUTOMATE / DESIGN / REPEAT <span style="color:#35F46A;">_</span></p>
</td></tr></table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr></table></body></html>`;
  return { subject, text, html };
}
