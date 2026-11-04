# Verification record

Initial delivery: 2026-10-07. Follow-up delivery review: 2026-10-09.

Initial environment: Windows PowerShell, Node.js 24.11.1, npm 11.6.2, Next.js 16.4.0, React 19.3.0. The initial local delivery made no paid model calls, executed no imported repository code and performed no deployment or remote writes. GitHub writes were subsequently authorized on 2026-11-04, as recorded below.

## Automated checks

- `npm run typecheck`: passed after correcting a test configuration type.
- `npm test`: 21 focused tests passed. Tests exercise schema/flow integrity, exact references, blob hashes, validated attachment exports, request limits, host validation, file exclusion, size/time budgets, corrupt upstream data and offline adapter responses. Additional cases confirm stalled-stream cancellation (including an unresponsive cancel acknowledgment), client abort, declared/streamed byte limits, malformed UTF-8 rejection and recoverable local-storage errors.
- `npm run verify:samples`: all three Tour files passed exact excerpt and pinned blob checks at commit `633ccef39a89ba79592d90a68f5410f57bb8bb53`.
- `npm run build`: optimized production compilation, TypeScript and page generation passed.
- `node scripts/verify-local.mjs`: production server returned the homepage and the end of all three sample tours; valid JSON imported as local/unreviewed and sample export returned an attachment; a missing guide returned 404, and invalid repository URL and incorrect source excerpt were rejected. Its guard prevents model-enabled execution.

## Browser observations

Verified in the Codex in-app browser, including a 1440 × 1000 desktop viewport and a 390 × 844 mobile viewport:

- Homepage entered the ready-made main tour; real preview and three library entries were visible.
- Next, direct path-node selection and progress selection changed the explanation, source and highlighted node together. Previous and Next have endpoint disabling.
- Source expansion revealed the full selected range; reference tabs and constructed GitHub URLs referred to pinned paths/lines.
- JSON/terminal branch choice changed the schematic output and linked the appropriate conditional branch.
- Copied step action exposed the exact `?step=report` URL and a success status. Direct `?step=score` navigation and refresh restored the requested step.
- Mobile Path/Step/Source switching worked; selecting a path node returned to the selected step. The source panel had internal horizontal scrolling without page overflow.
- A real `LE0-Lin/AgentConfigScore` import returned pinned commit `1d7acc8…`, 12 text files and approximately 68 KB actually read. It accurately stated that generation was not configured and created no tour.
- An arbitrary external URL produced the standard GitHub input error.
- Invalid Tour JSON with an altered excerpt was rejected visibly. Valid JSON entered `/local`, displayed the local provenance warning, omitted public copy-link actions and survived refresh in the same tab.
- Export downloaded a real `scan-to-report.tour.json` attachment; the saved file contained the seven-step Tour and all four source files. An initial Blob-download event was unavailable in the embedded browser, so export now uses a validated HTTP attachment response.
- Real screenshots saved to `docs/screenshots/`; these are captures of the actual app, not rendered mockups.

## Follow-up fixes and verification

- Mobile tabs now expose one keyboard entry point, Left/Right wrapping, Home/End navigation and corresponding labeled panels. Keyboard activation, focus, selected-tab attributes and panel visibility were observed at 390 × 844.
- Previous and progress navigation from Source return to the selected Step. Path selection focuses the visible Step panel, confirmed through the accessibility tree and active DOM element. Browser Back restores the URL step and Step tab. Both mobile and desktop had no page-wide horizontal overflow in the checked views.
- Desktop panels retain their ordinary labels and do not expose mobile tabpanel roles. Homepage → demo → Discover still synchronizes the highlighted node, explanation and exact `scanner.py#L452-L472` pinned source link.
- A background-browser check showed animation-frame-dependent focus did not run reliably. Focus now happens in a React effect after the panel is visible, and the final production build was rechecked.
- Tour connections now require exactly the sequential handoffs displayed by the v0.1 player. Additional jump/cycle edges are rejected; structural schema exports were regenerated.
- JSON/import and local export body reads share a five-second deadline and cancel stalled readers. GitHub and model response body reads use the operation's abort signal. These boundaries were verified with offline streams; no provider call was made.
- Final optimized build, three sample checks and production HTTP smoke checks passed after the fixes. `docs/screenshots/tour-desktop.jpg` was refreshed from the running production app. A suggested recording sequence is in `docs/DEMO_SCRIPT.md`; no video recording is claimed.

## Visitor recovery and tour continuation

- Each sample's last step now shows two other feature guides and a tour-library link. Desktop and 390 × 844 mobile layouts were observed without page-wide horizontal overflow. Actual continuation captures are saved as `tour-ending.jpg` and `mobile-ending.jpg`.
- Following the seven-step scan tour into the five-step rule tour started at `01 / 05`, with the correct title and pinned source. Browser Back restored `?step=report`, `07 / 07` and the continuation section. Keying the player by Tour ID prevents old step, branch and reference state from leaking between guides.
- Uploading malformed JSON showed a readable error and a built-in-tour recovery link. Selecting valid JSON immediately afterward entered `/local` successfully; its copy-link actions were absent, and its provenance was local/unreviewed.
- Selecting the local Score step and refreshing preserved `/local?step=score`, the source and the unreviewed note.
- Offline storage fixtures covered denied access, quota failures, missing/corrupt/oversized saved content and source mismatches. User-facing errors exclude raw parser/schema details. Restoring a browser copy revalidates it and does not inherit editorial trust. Actual browser storage permissions were not changed to simulate failures.
- The production preview process was no longer running when work resumed on 2026-10-09. It was restarted from the existing build; a fresh request to the Report step returned HTTP 200 with its end-of-path and library navigation present. No unnecessary rebuild or model call was made for that restart.

## GitHub checkpoint and dependency refresh — 2026-11-04

- The user authorized creating a GitHub progress repository and pushing the current code. The CLI account was verified as `LE0-Lin`; [LE0-Lin/RepoPlay](https://github.com/LE0-Lin/RepoPlay) was created as **private**. The initial remote `main` SHA matched local commit `eef7f7bc6feea5add51ef2206d8ff8ac70dbfef7`.
- The first checkpoint preserves the existing prototype. Earlier local work had no Git history; no historical commits were manufactured. `2cd4e23` separately records the dependency patches.
- Before pushing, staged paths were checked to exclude runtime/build files, local environment files and private-key file types. A signature scan found no matching credential strings, and the two retained AgentConfigScore license notices matched. This bounded scan is not a guarantee that all sensitive material can be detected.
- A fresh baseline build was blocked by a known Next.js advisory. `npm audit --omit=dev --json` identified Next.js as critical and Zod as high. Published affected/patched ranges were also checked through GitHub's advisory API: [Next.js advisory](https://github.com/advisories/GHSA-2464-fhr4-w9xw), [Zod advisory](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5).
- Patched within the existing major versions: **Next.js 16.4.0 → 16.4.5**, **Zod 4.6.5 → 4.6.7**. The lockfile was updated. Application behavior was not changed.
- After those changes, `npm run typecheck`, all **21** tests, `npm run verify:samples`, `npm run build` and `node scripts/verify-local.mjs` passed. `npm audit --omit=dev --audit-level=high` returned **0 vulnerabilities** at the time of checking. This reports known registry advisories, not an overall security certification.
- No paid model/provider trial, public hosting, promotional message, purchase or imported-code execution was performed. No new browser/physical-device verification was performed for this dependency-only change; previous browser observations remain historical evidence.

## Remaining verification limits

- The in-app clipboard readback returned an empty value despite the UI write resolving. Clipboard contents were not independently confirmed. The exact URL is exposed in a share field for manual copying, and deep-link navigation was verified. Test native clipboard behavior in a normal browser before release.
- Only the Codex in-app browser was available through the browser tool; Chrome/Firefox were not connected. No physical phone or cross-browser compatibility matrix was tested. Reduced-motion behavior is implemented in CSS; OS preference emulation was not separately exercised.
- No real provider generation was invoked. Adapter request/response handling was verified offline; actual provider compatibility, explanation quality, costs and latency remain untested.
- Source locations and snapshots were checked by the development agent. Independent human editorial review remains outstanding. No user testing, adoption or growth result is asserted.
