# TikTok and metrics

Account: @mindvortex.pro. Buffer Free is connected using a personal API key
stored only in `/etc/mindvortex-social.env`. Never expose it through the app API.
The original FLC Reel is imported and seeded as already published; do not repost it.

- Instagram Reels: every 2 days, 18:00 Europe/Warsaw; 11 prepared slots.
- TikTok Reels: daily, 18:00 Europe/Warsaw; 21 days prepared.
- Shared days mirror the exact verified Instagram video, including any automatic
  duplicate replacement. Other days use original educational Reels in the same template.
- TikTok photo carousels: every two days, the day after an Instagram Reel, at 18:00; three thematically related existing
  studio posts, with separate source-ID and image checksum tracking.
- Queues are held in our database. Buffer receives each item when it is due,
  using `shareNow` and `automatic`, so future preparation does not consume its
  ten queued-item allowance. Global pause prevents new submissions.
- Persist submission intent before calling Buffer. Uncertain outcomes never
  cause a blind retry. Reconcile against Buffer history and notify on errors.
- Both platform views have Posty, Rolki and Metryki tabs. A platform switch while
  viewing metrics preserves the metrics view and replaces all data and charts.
- Instagram metrics are collected hourly. TikTok metrics are fetched hourly
  from Buffer, whose network ingestion is daily. Missing metrics stay null.
- Hourly historical samples power the line chart; no historical values are invented.
  The donut shows the latest known interaction breakdown, excluding views/reach.

Production validation: Buffer account/channel discovery and first-post metric
read succeeded; an automatic video draft was created and deleted through the API.
The first actual timed Buffer publication is due 2026-09-12 at 18:00 Warsaw.
