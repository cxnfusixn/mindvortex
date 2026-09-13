import { escapeHtml as e } from "./report.mjs";

const safeLink = (value) => {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password ? e(url.href) : null;
  } catch { return null; }
};

// Table layout and inline styles also work when a mail client strips the head.
// No external fonts, images, scripts or tracking pixels.
export function emailHtml(lead) {
  const blocks = String(lead.draft || "").split(/\n\s*\n/).filter(Boolean);
  const content = blocks.map((block) => {
    const report = block.match(/^Tutaj zebrałem uwagi ze zrzutami ekranu: (\S+)$/);
    if (report && safeLink(report[1])) return `<tr><td class="pad" style="padding:8px 36px 28px"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td bgcolor="#35f46a" style="background:#35f46a"><a href="${safeLink(report[1])}" style="display:inline-block;padding:16px 22px;border:1px solid #35f46a;color:#050706;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;text-decoration:none">Zobacz uwagi do strony &rarr;</a></td></tr></table></td></tr>`;
    const text = block.split("\n").map((line) => {
      const link = line.match(/^(Moje realizacje|Instagram|TikTok): (\S+)$/);
      return link && safeLink(link[2]) ? `<a href="${safeLink(link[2])}" style="color:#35f46a;text-decoration:underline;display:inline-block;padding:6px 0">${e(link[1])} &rarr;</a>` : e(line);
    }).join("<br>");
    return `<tr><td class="pad" style="padding:0 36px 22px;color:#f2f4f3;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:26px;overflow-wrap:anywhere">${text}</td></tr>`;
  }).join("");
  return `<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><title>MindVortex — ${e(lead.name)}</title><style>@media(max-width:480px){.pad{padding-left:22px!important;padding-right:22px!important}.outer{padding:12px 0!important}.title{font-size:30px!important;line-height:34px!important}}</style></head>
<body style="margin:0;padding:0;background:#050706;color:#f2f4f3"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#050706"><tr><td align="center" class="outer" style="padding:36px 12px"><table role="presentation" width="600" cellpadding="0" cellspacing="0" bgcolor="#101411" style="width:100%;max-width:600px;background:#101411;border:1px solid #29312b">
<tr><td class="pad" style="padding:30px 36px;border-top:3px solid #35f46a;border-bottom:1px solid #29312b;color:#f2f4f3;font-family:Arial,sans-serif;font-size:20px;font-weight:bold;letter-spacing:-1px">MIND<span style="color:#35f46a">VORTEX</span><br><span style="font-family:Consolas,'Courier New',monospace;font-size:10px;letter-spacing:2px;font-weight:normal;color:#929b95">STRONY / DESIGN / AUTOMATYZACJE</span></td></tr>
<tr><td class="pad" style="padding:32px 36px 28px"><p style="margin:0 0 12px;color:#35f46a;font-family:Consolas,'Courier New',monospace;font-size:11px;letter-spacing:2px">POMYSŁY DLA ${e(String(lead.name).toLocaleUpperCase("pl"))}</p><h1 class="title" style="margin:0;color:#f2f4f3;font-family:Arial,Helvetica,sans-serif;font-size:38px;line-height:42px;letter-spacing:-1px">Drobne zmiany.<br>Łatwiejszy kontakt.</h1></td></tr>
${content}
<tr><td class="pad" style="padding:18px 36px;border-top:1px solid #29312b;color:#929b95;font-family:Consolas,'Courier New',monospace;font-size:11px;line-height:18px">MINDVORTEX &nbsp; / &nbsp; WARSZAWA</td></tr>
</table></td></tr></table></body></html>`;
}
