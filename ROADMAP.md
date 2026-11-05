# From prototype to a useful public beta

Status on 2026-11-04: the existing implementation is saved in the private [LE0-Lin/RepoPlay](https://github.com/LE0-Lin/RepoPlay) progress repository. This preserves a real code history; it is not a public release or proof of product demand.

## What works today

- A responsive player with fixed-source links, step URLs, illustrations and JSON import/export.
- Three curated tours, all from AgentConfigScore at one pinned commit.
- A bounded public GitHub reader, strict Tour/reference validation and an interchangeable server-side model adapter tested with offline fixtures.

The main unproven behavior is still **an unfamiliar small repository → one useful feature tour**. More player polish or more tours from the same repository will not establish that behavior.

## Release gates, in order

1. **Real generation on three unrelated small public repositories.** Configure a project-specific provider and authorize a limited trial budget first. For each repository, choose a concrete feature, pin the commit, generate a 5–8 step path and review whether a reader can follow that feature. Reject invalid references; record actual failures, usage and observed latency. Correct locations alone do not establish explanation quality. If the current entry-point file selection misses the feature, fix that selection before expanding repository size limits.
2. **Independent examples and a readable first experience.** Keep at least two reviewed tours from unrelated projects available without keys. Preserve their licenses. Show one clear end-to-end demo and make generation limits visible. Have an independent reader check the explanations, not just the quotes.
3. **A bounded, reachable public trial.** After explicit hosting authorization, choose a reachable origin, configure server-side secrets and disclose which source is sent to the provider. Add request throttling, concurrency and spend limits before enabling anonymous generation. Verify opening a copied sample link on another device and importing an exported generated tour. JSON export/import remains the sharing mechanism for new tours unless persistence is deliberately added later.
4. **A reproducible release and real feedback.** A fresh checkout must install, typecheck, pass tests/source checks and build with no unresolved known high/critical production dependency advisories. Check a normal browser, native clipboard and a physical phone. Publish the actual repository and demo only when authorized, then observe real developer use. No Star or growth target is guaranteed by shipping.

## Planning estimate

A focused, small-repository public beta is estimated at **3–5 active development days**, conditional on provider access, a limited real-generation trial and hosting authorization. Waiting for configuration/approval is additional. Poor generation quality may extend the estimate; these gates are acceptance criteria, not a promised date. Broad support for large or arbitrary repositories is outside this estimate.

The next implementation priority is gate 1. Do not spend another iteration on decorative player changes before measuring that path.

## Commit history

See the [development log](docs/DEVELOPMENT_LOG.md) for the earlier local-development period and the verified timestamps of the first Git checkpoints.

- `eef7f7b`: first actual Git checkpoint of the existing local prototype, created on 2026-11-04. Earlier local work was not under Git; this checkpoint does not fabricate historical commits.
- `2cd4e23`: patch Next.js and Zod within their existing major versions; audit, 21 tests, type checking, source checks, build and HTTP smoke checks passed afterward.
- Subsequent changes are recorded as new commits on `main`; use the [commit history](https://github.com/LE0-Lin/RepoPlay/commits/main/) to inspect them.

The GitHub repository is private for the current backup stage. Public visibility, public hosting and paid provider usage remain separate decisions.
