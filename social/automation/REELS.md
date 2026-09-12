# Approved studio Reel template

`studio-demo-v1` preserves the approved FLC v5 visuals: 1080×1920, 30 fps,
10 seconds, website loading intro (1.8 seconds), three unique scenes
(2.4/2.4/1.6 seconds), studio CTA (1.8 seconds), green 35° wipes.
The default soundtrack is original stereo `moody-ambient-v1` (no external music).
Fonts, layout, timings and palette live in `lib/reel-template.mjs` and the versioned renderer.

Inspect: `node reel-cli.mjs template`.
Render: `node reel-cli.mjs render manifest.json`.
Manifest fields: `outputDir`, `heroImage`, `websiteVideo`, `sceneKeys`.
The website video must be the branded 1080×1920, 30 fps, 6.4-second sequence;
the still must match its opening frame. Three distinct section/asset keys are
required. Inspect actual visuals too: unique keys alone cannot detect reused imagery.
The renderer adds the intro, transitions, CTA and ambient and writes a provenance manifest.
Set `FFMPEG_PATH` to a local executable or install ffmpeg on the render host.

Capture each section once, with no neighboring sections in the frame. Follow
the registered layout in `reel-template.mjs`; use the website's actual motion.
For FLC, the final scene is the original fluttering wing logo, replacing Ferrari.
Do not use a newly drawn substitute logo.

Production scheduling lives in `social_reel_settings` and `social_reels`.
The worker publishes Fridays at 18:00 Europe/Warsaw and prepares three weekly
slots. The approved FLC v6 is the first portfolio Reel. Subsequent educational
Reels use registered official documentation, source verification, semantic
duplicate checks, the same typography/loading/swipes and original ambient.
Sources are checked again before publication; rejected waiting content is
replaced with an audited revision. New portfolio demos require fresh approved
footage instead of replaying FLC. Publishing intent is persisted before the
single Meta publish call; uncertain results require reconciliation.
The Posty and Rolki dashboard tabs show their separate queues. The global
pause also pauses Reels; Reels have an additional independent pause control.
