# Verification — 2026-09-11

Target: https://mindvortex.pro/studio-social, authenticated owner panel.
Actor: studio owner reviewing and scheduling English Instagram content.
Reference: Mind Vortex black/green identity, JetBrains Mono and Geist.
Authority: implement, test and deploy the requested daily publishing tool.

- Next.js production build passes locally and on Ubuntu.
- Six content, scheduling and caption-verification tests pass.
- PostgreSQL integration verifies mutually exclusive worker locks and unique daily slots.
- Unauthenticated API returns 401; authenticated API returns 200.
- Cross-origin mutation returns 403.
- Public, random-name JPEG media endpoint returns 200 and image/jpeg without authentication.
- Browser journeys: populated queue, feed preview, edit dialog open/cancel.
- Desktop 1440px and mobile 390px: no horizontal overflow or JavaScript errors.
- All post images decoded before screenshots; desktop queue and mobile feed/editor visually inspected.
- API pilot publication succeeded: https://www.instagram.com/p/DdJaznGiBFr/
- Published caption including all hashtags was read back and matched; media type IMAGE verified.
- Second publish invocation did not produce another post.
- Seven approved posts scheduled for September 12–18 at 10:00 Europe/Warsaw.
- Dashboard and worker services active and enabled at boot.
- First insights collection returned measured zero counts (new post), rather than unavailable placeholders.
- Existing portfolio health endpoint still returns 200.

Delivery: production release recorded by /opt/mindvortex-social/current.
Pilot mode: publication active; newly generated content requires owner approval.
Full automation toggle exists but is not enabled during the initial editorial pilot.
No claims are made about long-term growth or future successful runs; logs and alerts expose failures.

Not yet observed: first scheduled 10:00 run, weekly email delivery, seven-day token refresh,
full unattended editorial quality over multiple weeks. SMTP authentication checked separately.
Lead attribution, automatic replies and offsite backup automation are outside this implementation.

2026-09-11 template correction: deployed studio-square-v1 with fixed 1080x1080 layout, 78px headings and 44px body. Seven queued posts regenerated and approved. Original pilot DdJaznGiBFr removed through Chrome (8 posts confirmed); replacement https://www.instagram.com/p/DdJdn2qCOr8/ verified through API and Chrome with full caption and five hashtags. Worker and web active; daily 10:00 Warsaw, autopilot false. Seven tests pass, including fixed-size and overflow rejection. Eight-image contact sheet visually inspected. Existing eight original posts retained.

Final 2026-09-11: secure social release /opt/mindvortex-social/releases/20260911133355; main site release 20260911132943. Autopilot true, paused false, 10:00 Warsaw; both services active. Nine imported Instagram records; seven approved future slots. Section registry reserves kierunek-services (15 Sep) and marcin-bak-disciplines (18 Sep); used hero sections recorded. Rendered Marcin section post inspected. OTP endpoint accepts existing password, returns secure HttpOnly SameSite challenge, SMTP accepts code email; owner completing browser OTP remains unobserved. API without session 401; wrong-origin auth POST 403; login redirect 307. Mobile Instagram link wrapping fixed and rendered on PL/EN. External recurring backup destination awaits owner input.
