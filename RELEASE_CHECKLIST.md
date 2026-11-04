# Release checklist

Local v0.1 is implemented and validated with type checking, 21 focused tests, source checks, a production build, HTTP smoke checks and in-app desktop/mobile observations. Evidence and limits are recorded in [docs/VERIFICATION.md](docs/VERIFICATION.md). The items below remain for a public release.

- [ ] Independently review the three guides with a human reader; check explanations and illustrative assumptions, not only line locations.
- [ ] Choose the public project identity; check name/trademark/domain availability if needed. Review the proposed MIT license and attribution.
- [ ] Create the actual RepoPlay repository when authorized. Set `NEXT_PUBLIC_REPOPLAY_REPOSITORY` only to its real URL.
- [ ] Review files for secrets and retained third-party license notices before publishing.
- [ ] Choose a reachable hosting origin when authorized. Verify copied sample links from a separate device/browser.
- [ ] Before exposing import/generation publicly, add request throttling, cost controls, concurrency limits and provider data-handling disclosure suitable for that host. Loopback local use is the current supported default.
- [ ] If generation is enabled, explicitly authorize one provider trial; inspect output quality, latency, actual usage and malformed-response behavior. No paid call has been made for this delivery.
- [ ] Repeat the short browser smoke test in Chrome/Firefox/Safari and on a physical phone. Current responsive checks use a browser viewport.
- [ ] Validate clipboard writing in a normal browser: the in-app browser did not expose written clipboard contents to its readback tool; the visible exact share URL and deep-link behavior were checked.
- [ ] Run `npm ci`, `npm run typecheck`, `npm test`, `npm run verify:samples`, and `npm run build` on the publishing checkout.
- [ ] Record a short demo using [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md): homepage → scan → discovery → matching → scoring → output branch → pinned GitHub source → copied step link.
- [ ] Ask real developers to try a feature tour and record actual feedback. Treat sharing/Stars as an experiment; publish no fabricated adoption, reviews or performance claims.
