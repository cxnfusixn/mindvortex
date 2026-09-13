# Mind Vortex Social

Private Next.js dashboard at `/studio-social`, separate from the portfolio site.
PostgreSQL persists calendar, publication states, token rotation and worker jobs.
One image post per Warsaw calendar day, 10:00 by default. Posts are generated
seven days ahead with OpenAI structured output, rendered using local fonts and
portfolio screenshots. Default installation is paused and requires approval.

## Commands

`npm ci`, `npm run build`, `npm test`.

Provide `.env.social.local` from the parent repository explicitly when running
Node locally. Never commit it. It contains `SOCIAL_DATABASE_URL`,
`SOCIAL_OPENAI_API_KEY`, `SOCIAL_OPENAI_MODEL`, `INSTAGRAM_ACCESS_TOKEN`,
`INSTAGRAM_USER_ID`, `SOCIAL_ADMIN_PASSWORD`, `SOCIAL_PUBLIC_URL`,
`SOCIAL_MEDIA_DIR`, and `SOCIAL_ALERT_EMAIL`.

Server configuration: `/etc/mindvortex-social.env`, mode 0640, root:mindvortex.
Dashboard login name: `studio`; password is SOCIAL_ADMIN_PASSWORD. HTTP Basic
authentication is used over HTTPS. Browser prompts remember it for the session.
All routes require authentication except random UUID JPEG media URLs fetched
by Meta. Requests changing state must carry the configured same-origin header.

Services: `mindvortex-social`, `mindvortex-social-worker`. Persistent images:
`/var/lib/mindvortex-social/media`. Release: `/opt/mindvortex-social/current`.
The worker reads SMTP configuration from the existing website configuration.
Daily error notifications and Monday reports go only to SOCIAL_ALERT_EMAIL.

## Publication safety

States: draft → approved → uploading → publishing → verifying → verified.
The worker checks the exact expected Instagram username and ID, persists the
container and publication intent, then makes one publish request. An ambiguous
outcome blocks that post; reconciliation searches for an exact caption match
or reads its known media ID. It never blindly republishes. Published captions
are read back and compared including hashtags. Missed dates are not backfilled.
Pausing stops new publishing; an already submitted API request cannot be undone.

Tokens are persisted in the private database and refreshed weekly. Failure
alerts require manual reauthorization in Meta. No secrets appear in the panel.
Back up the PostgreSQL database, private environment file and media directory
with the server's private backup system; backup automation is not included yet.

Unavailable insights are displayed as a dash. Lead attribution and automatic
replies are not implemented. The weekly report contains measured post metrics;
it does not invent attribution to enquiries or sales.

## Industry discussions

In Wzrost → Posty branżowe i komentarze, “Szukaj teraz” queues discovery for
Instagram and TikTok. A separate daily switch is initially off and works
independently of publication pause. The worker checks requests every minute;
advisory locking prevents duplicate runs and interrupted runs can resume.
Settings, status and errors live in `social_discovery`; cited post URLs,
source context, drafts and outcomes live in `social_engagement`.
Search and comment prompts are in `lib/engagement.mjs`. Topics include UX,
websites, branding, AI, CRM and social automation; posts may be Polish or
English, with comments in the source language. Only actual search citations
are accepted. Availability depends on public indexing; zero results is a valid
outcome. The review backlog is limited to 15, with 5 comment drafts per day.
Comments and likes are performed manually in the original platform. Approval
in Studio saves a draft and does not publish an interaction.

## Recovery procedure

Use pause first. Check the worker journal and panel events. For uncertain
publication use “Sprawdź na Instagramie”; if no exact match is found, inspect
the account manually. Do not reset that post to approved without reconciliation.
Generation failure can be retried using “Przygotuj 7 dni”; existing dates are
skipped. Automatic generation is attempted once per day to bound repeat costs.
Do not run the destructive release bootstrap against another app directory.
