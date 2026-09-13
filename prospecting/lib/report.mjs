export const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );

export function reportMarkdown(lead) {
  const a = lead.audit;
  const m = (value) =>
    String(value ?? "")
      .replace(/[\\`*_<>\[\]|]/g, "\\$&")
      .replace(/\n/g, " ");
  return `---\ntype: ux-audit\ndate: ${a.generatedAt.slice(0, 10)}\nproduct: ${JSON.stringify(lead.name)}\nplatform: mobile-web, desktop-web\nscreens: ${lead.screens.length}\n---\n\n# UX Audit — ${m(lead.name)}\n\n## Podsumowanie\n${m(a.summary)}\n\n## Cel i metoda\n${m(a.goal)}\n\nNowy klient; mobile web i desktop web. Cztery przebiegi ux-audit i dodatkowa weryfikacja dowodów.\n\n## Przegląd wniosków\n| ID | Ważność | Ekran | Problem | Heurystyka |\n|---|---|---|---|---|\n${a.findings.map((f) => `| ${m(f.id)} | ${f.severity} | ${m(f.screen)} | ${m(f.title)} | ${m(f.heuristic)} |`).join("\n")}\n\n## Ekrany\n${lead.screens
    .map(
      (s) =>
        `### ${m(s.label)} (${s.width}px)\n![Zrzut ekranu](${s.file})\n\n${a.findings
          .filter((f) => f.screen === s.file)
          .map(
            (f) =>
              `#### [S${f.severity}] ${m(f.id)} · ${m(f.title)}\n- Check: ${m(f.check)} · Heurystyka: ${m(f.heuristic)}\n- Dowód: ${m(f.evidence)}\n- Wpływ na cel: ${m(f.impact)}\n- Rekomendacja: ${m(f.recommendation)} · Nakład: ${m(f.effort)}\n`,
          )
          .join("\n")}`,
    )
    .join(
      "\n\n",
    )}\n\nAdnotowane screenshoty są dostępne w [samodzielnym raporcie HTML](report.html).\n\n## Cała ścieżka\n${m(a.journey)}\n\n## Mocne strony\n${a.positives.map((p, i) => `- [P-${i + 1}] ${m(p.description)} (${m(p.screen)}, ${m(p.heuristic)})`).join("\n")}\n\n## Priorytety\n${a.findings.map((f, i) => `${i + 1}. ${m(f.recommendation)} (S${f.severity}, nakład ${f.effort})`).join("\n")}\n\n## Ograniczenia\n${a.limitations.map((l) => `- ${m(l)}`).join("\n")}\n\n## Pokrycie ram oceny\n${a.coverage.map((c) => `- ${m(c.framework)}: ${m(c.findings)}`).join("\n")}\n\n## Źródła\n- Nielsen: https://www.nngroup.com/articles/ten-usability-heuristics/\n- WCAG 2.1: https://www.w3.org/WAI/WCAG21/quickref/\n- Fogg: https://www.behaviormodel.org/\n- Metodyka: ux-audit.md w module prospecting.\n`;
}
export function reportHtml(lead, imageUrl, portfolioUrl) {
  const a = lead.audit,
    e = escapeHtml;
  if (!a) throw Error("Brak raportu.");
  const images = lead.screens
    .map(
      (screen) =>
        `<section><h2>${e(screen.label)} · ${screen.width}px</h2><p>${e(screen.url)} · ${e(screen.capturedAt)}</p><svg role="img" aria-label="Zrzut ekranu z oznaczonymi wnioskami" viewBox="0 0 ${screen.width} ${screen.height}"><image href="${e(imageUrl(screen))}" width="${screen.width}" height="${screen.height}"/>${a.findings
          .filter((f) => f.screen === screen.file)
          .map(
            (f) =>
              `<rect x="${f.box.x * screen.width}" y="${f.box.y * screen.height}" width="${f.box.width * screen.width}" height="${f.box.height * screen.height}" fill="none" stroke="${f.severity >= 3 ? "#fa763c" : "#efc65f"}" stroke-width="3"/><text x="${f.box.x * screen.width + 4}" y="${Math.max(22, f.box.y * screen.height + 22)}" fill="#fff" stroke="#101411" stroke-width="4" paint-order="stroke" font-size="20">${e(f.id)}</text>`,
          )
          .join("")}</svg></section>`,
    )
    .join("");
  return `<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><meta name="referrer" content="no-referrer"><title>${e(lead.name)} — analiza MindVortex</title><style>body{margin:0;background:#080c0a;color:#edf4ee;font:16px/1.65 system-ui,sans-serif}main{max-width:960px;margin:auto;padding:40px 24px}header{border-bottom:1px solid #35453b;padding-bottom:28px}h1{font-size:clamp(28px,5vw,48px);line-height:1.15}h2{font-size:24px}h3{font-size:19px}p,li{color:#c0cec4}a{color:#62f68b;overflow-wrap:anywhere}section{margin:36px 0}article{padding:20px;border:1px solid #35453b;margin:16px 0}svg{display:block;width:100%;max-height:1000px;background:#152019}small{color:#a7baad}strong{color:#fff}.brand{font-size:14px;letter-spacing:.15em;color:#62f68b}@media print{body{background:white;color:black}p,li,small,strong{color:black}article,svg{break-inside:avoid}}</style></head><body><main><header><div class="brand">MIND VORTEX / ANALIZA UX</div><h1>${e(lead.name)}</h1><p>${e(a.summary)}</p><small>Data: ${e(a.generatedAt)} · Pewność: ${e(a.confidence)} · Ocena heurystyczna</small></header><section><h2>Cel i zakres</h2><p>${e(a.goal)}</p><p>Nowy klient · mobile web i desktop web · ${lead.screens.length} ekranów. Metoda ux-audit: ścieżka celu, heurystyki, powtarzalne problemy i ocena całej ścieżki.</p></section><section><h2>Co warto poprawić</h2>${a.findings.length ? a.findings.map((f) => `<article><small>${e(f.id)} · Ważność ${f.severity}/4 · ${e(f.check)} · ${e(f.heuristic)}</small><h3>${e(f.title)}</h3><p><strong>Dowód (${e(f.screen)}):</strong> ${e(f.evidence)}</p><p><strong>Wpływ na cel:</strong> ${e(f.impact)}</p><p><strong>Propozycja:</strong> ${e(f.recommendation)} · Nakład: ${e(f.effort)}</p></article>`).join("") : "<p>Brak wystarczająco udokumentowanych problemów do wskazania zmian.</p>"}</section><section><h2>Co działa dobrze</h2><ul>${a.positives.map((p) => `<li>${e(p.description)} (${e(p.screen)}, ${e(p.heuristic)})</li>`).join("")}</ul></section><section><h2>Cała ścieżka klienta</h2><p>${e(a.journey)}</p></section>${images}<section><h2>Ograniczenia oceny</h2><ul>${a.limitations.map((l) => `<li>${e(l)}</li>`).join("")}</ul></section><section><h2>Zastosowane ramy oceny</h2><ul>${a.coverage.map((c) => `<li>${e(c.framework)}: ${e(c.findings)}</li>`).join("")}</ul><p><a href="https://www.nngroup.com/articles/ten-usability-heuristics/">Heurystyki Nielsena</a> · <a href="https://www.w3.org/WAI/WCAG21/quickref/">WCAG 2.1</a> · <a href="https://www.behaviormodel.org/">Fogg</a></p></section><footer><h2>Porozmawiajmy o usprawnieniach</h2><p>Strony, identyfikacja wizualna, automatyzacja social mediów i dedykowane systemy CRM.</p><a href="${e(portfolioUrl)}" rel="noreferrer">Zobacz portfolio MindVortex →</a><p>Patryk Pyrka · <a href="mailto:patryk.pyrka@mindvortex.pro">patryk.pyrka@mindvortex.pro</a></p></footer></main></body></html>`;
}
