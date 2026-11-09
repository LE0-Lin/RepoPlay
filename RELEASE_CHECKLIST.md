# Release checklist

The early source preview has a working local player and pre-generated examples. Its original checks and subsequent verification are recorded in [docs/VERIFICATION.md](docs/VERIFICATION.md). A hosted public beta still needs the end-to-end generation and unfamiliar-repository acceptance gates in [ROADMAP.md](ROADMAP.md).

- [ ] Independently review the three guides with a human reader; check explanations and illustrative assumptions, not only line locations.
- [ ] Choose the public project identity; check name/trademark/domain availability if needed. Review the proposed MIT license and attribution.
- [x] Save the current code to the separate private [LE0-Lin/RepoPlay](https://github.com/LE0-Lin/RepoPlay) repository with real commits (authorized 2026-11-04).
- [ ] Pass real generation/review on three unrelated small repositories; provide at least two independently reviewed examples outside AgentConfigScore.
- [x] Patch the advisories found on 2026-11-04 (Next.js 16.4.5, Zod 4.6.7); recheck on 2026-11-09 returned 0 production vulnerabilities and build passed. Recheck advisories before the hosted beta.
- [x] Approve public source visibility (2026-11-09) and label the README as an early preview with explicit limits. The real repository URL is `https://github.com/LE0-Lin/RepoPlay`; the optional in-app link remains configurable.
- [x] Review tracked files and reachable Git history for credential signatures and excluded paths (4 existing commits / 71 unique blobs on 2026-11-09). No matches found. Re-fetch all four source snapshots and the MIT notice from the pinned upstream commit; exact matches confirmed. This bounded review is not a guarantee that every secret can be detected.
- [x] Reinstall from the lockfile with `npm ci --ignore-scripts`; pass type checking, 21 tests, three sample checks, production build and local HTTP smoke checks on 2026-11-09. See the verification record for scope.
- [ ] Choose a reachable hosting origin when authorized. Verify copied sample links from a separate device/browser.
- [ ] Before exposing import/generation publicly, add request throttling, cost controls, concurrency limits and provider data-handling disclosure suitable for that host. Loopback local use is the current supported default.
- [ ] If generation is enabled, explicitly authorize one provider trial; inspect output quality, latency, actual usage and malformed-response behavior. No paid call has been made for this delivery.
- [ ] Repeat the short browser smoke test in Chrome/Firefox/Safari and on a physical phone. Current responsive checks use a browser viewport.
- [ ] Validate clipboard writing in a normal browser: the in-app browser did not expose written clipboard contents to its readback tool; the visible exact share URL and deep-link behavior were checked.
- [ ] Repeat fresh-checkout installation, type checking, tests, source checks and build for the hosted-beta candidate.
- [ ] Record a short demo using [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md): homepage → scan → discovery → matching → scoring → output branch → pinned GitHub source → copied step link.
- [ ] Ask real developers to try a feature tour and record actual feedback. Treat sharing/Stars as an experiment; publish no fabricated adoption, reviews or performance claims.
