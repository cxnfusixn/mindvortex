import test from "node:test";
import assert from "node:assert/strict";
import { emailHtml } from "../lib/email.mjs";
test("branded email preserves the draft, escapes text and links only safe URLs", () => {
  const html = emailHtml({name: '<img src=x onerror=alert(1)>', draft: 'Dzień dobry,\n\n<script>alert(1)</script>\n\nTutaj zebrałem uwagi ze zrzutami ekranu: https://example.com/report?a=1&b=2\n\nInstagram: https://www.instagram.com/mindvortex.pro/\nTikTok: javascript:alert(1)'});
  assert.match(html, /#35f46a/);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script|<img|href="javascript:/);
  assert.doesNotMatch(html, /Zobacz uwagi do strony/);
  assert.match(html, /Instagram/);
});
