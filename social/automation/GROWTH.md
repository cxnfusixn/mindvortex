# Growth in Social Studio

The Growth tab extends the existing system. There is no second publisher, calendar or brand configuration.

## Sources of truth

- Voice, audience, portfolio claims and post kinds: `lib/brand.mjs`.
- Fixed layouts: existing post renderer and `lib/reel-template.mjs`. Educational Reels with growth metadata add a fixed-size hook during the existing intro (`growth-hook-v1`); approved portfolio demos remain unchanged.
- Dates: `lib/reel-schedule.mjs` and the existing settings tables. The dashboard calls the same slot functions as generation. Posts retain their seven-day queue; TikTok Reels retain 21 days; Instagram Reels retain the configured horizon; carousels retain three upcoming slots on the day after an Instagram Reel.
- Text and visual duplication: existing checks remain authoritative, including automatic replacements. Growth does not bypass them.
- Growth-only settings: `lib/growth.mjs`. `growth-data.mjs` reads the existing queues, analytics and brand.

## Editorial feedback

New captions and educational Reels rotate observation, question and contrast hooks. Each generated item records its hook version; historical items are never assigned invented experiment labels. One concrete idea, human benefit and natural CTA are required by the shared prompt extension. Existing font limits, source checks and demo disclosures still apply.

Weekly reports persist a 30-day publication baseline and hook comparisons. Baseline values are current lifetime counters, not 30-day gains. Hook comparisons use the first stored reading 48–72 hours after actual publication, separately for platform and format. An observation needs at least 100 views and a known share count; every hook needs five observations. Missing readings are excluded. No historic measurements are fabricated.

A two-week generation window uses the latest eligible report at its start. A clearly higher median shares-per-1000 count shifts roughly two thirds of new slots toward that hook; exploration continues. This is an editorial heuristic, not a controlled causal experiment. Queue contents and published assets are not rewritten. Shared Instagram/TikTok videos retain the Instagram experiment that produced the actual video.

## Engagement assistant

The worker performs at most one successful public-web discovery per Warsaw day, with existing bounded retry handling. Responses API searches request Instagram and TikTok posts; the application admits only these two domains. The existing model does not support the tool's domain-filter parameter, so URL validation is enforced independently of model output. Only individual publication URLs appearing in citation annotations are admitted; profile URLs, arbitrary URLs and model-written uncited links are rejected. Indexed content can be incomplete or old. The owner must open the original source before using a draft. No minimum number of results is fabricated.

Up to five drafts are prepared daily. A backlog of 15 awaiting review stops further discovery. Manual URL + pasted-context intake covers posts absent from search indexes. URL normalization and retained history prevent repeated targets; prior drafts are supplied to generation and exact normalized repeats rejected. The UI supports edited approval, copying, manual-completion confirmation, dismissal and outcome notes. There is deliberately no external comment, like, follow or message endpoint. Approval only changes a local record.

All endpoints use the existing session authentication; mutations use the existing origin check and request size limit. Public sources are untrusted prompt input. Source URLs are never fetched by the application server. Outcomes are owner-reported and never treated as causal reach attribution.

## Operations

Growth and metrics run in a separate five-minute worker loop so long video generation cannot starve them. Existing hourly metrics job keys prevent duplicate work. Instagram watch time is converted from API milliseconds; Buffer watch time is converted only when the metric name explicitly supplies seconds or minutes. Unknown metrics remain null. Completion rate is unavailable and is never inferred from average watch time.

Daily: automatic queue work, then owner context review and useful replies (suggested 10–15 minutes). Weekly: inspect saved review and compare formats. Fortnightly: feedback influences new hook assignments if evidence is sufficient. Monthly: inspect format results and choose collaboration/paid-promotion candidates. Stories, outreach and ads are owner actions; paid campaigns require a separate budget and concrete approval.

Deployment uses the existing release and worker services. Tables are additive (`social_growth_reports`, `social_engagement`); rollback may keep them without affecting the previous release. No production settings or queued media are reset.

Sources checked: https://developers.openai.com/api/docs/guides/tools-web-search and https://developers.buffer.com/reference.html. Watch-time capabilities and units were additionally verified against the connected Instagram and Buffer APIs.
