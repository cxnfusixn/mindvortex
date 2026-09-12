# Daily publishing implementation

## Verified 2026-09-11

- Meta application: Mind Vortex Social, ID 1650043170021937.
- Instagram application ID: 26583386708025879.
- Account: mindvortex.pro, ID 17841434417163856.
- Instagram Tester invitation accepted; role no longer pending.
- Access token generated and stored in ignored `.env.social.local`.
- Official Instagram API `/me` returns the expected username and user ID.
- Official API `/{account}/content_publishing_limit` returns HTTP 200.
- SSH connection to the existing production VPS works.
- No automated post has been published. Scheduler is not enabled.

## Remaining implementation

1. Configure a durable, project-owned AI credential for deployment.
2. PostgreSQL storage, authenticated admin panel and calendar.
3. Seven-day generation buffer using approved brand facts and reusable font-based templates.
4. Publication state machine: draft, approved, uploading, publishing, verified, needs-attention.
5. Persist container IDs before publication; reconcile uncertain responses before retrying.
6. Verify the published caption and media before marking success.
7. Daily schedule in Europe/Warsaw, pause control and token lifecycle handling.
8. Insights collection and weekly report; preserve missing metrics as unavailable.
9. Tests, deployment and observed pilot publication.

Brand: English studio voice; JetBrains Mono and Geist; black and green;
portfolio interspersed with useful educational material; no fabricated client results.
