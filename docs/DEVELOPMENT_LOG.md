# Development log

Written on 2026-11-05. Dates below distinguish local development from actual Git commits. The October section is a retrospective summary based on the project conversation and existing documentation; it is not a set of recoverable Git snapshots.

## 2026-10-07 to 2026-10-13 — local prototype work

- Built the Next.js/TypeScript application, strict Tour format and exact source-reference checks.
- Added three pre-generated guides from AgentConfigScore at commit `633ccef39a89ba79592d90a68f5410f57bb8bb53`, preserving its MIT notice.
- Implemented the responsive feature-path player, step URLs, pinned source links and JSON import/export.
- Added bounded public GitHub reading and an interchangeable model adapter verified with offline fixtures. No paid model generation was run.
- Checked the local UI, captured real screenshots and added verification, recording and Chinese walkthrough documentation. Independent human review remained pending.

Evidence retained in this repository: [verification record](VERIFICATION.md), [screenshots](screenshots/), [Chinese walkthrough](../START_HERE.zh-CN.md), and the code included in the first checkpoint.

RepoPlay was not under Git during this local-development period. The current files cannot establish every intermediate version or exactly when each edit occurred. No October commit objects were created or backdated.

## 2026-11-04 — Git tracking and private remote started

The user authorized a GitHub progress repository. The three real commits below have matching author and committer dates on 2026-11-04; times are Asia/Shanghai (UTC+08:00). Local commit metadata was cross-checked against GitHub's commit API on 2026-11-05.

| Time | Commit | Recorded change |
| --- | --- | --- |
| 23:38:49 | [`eef7f7b`](https://github.com/LE0-Lin/RepoPlay/commit/eef7f7bc6feea5add51ef2206d8ff8ac70dbfef7) | First actual Git snapshot of the existing local prototype. |
| 23:47:17 | [`2cd4e23`](https://github.com/LE0-Lin/RepoPlay/commit/2cd4e238336f44ea989e8b6e98240ae3d8520dc9) | Patched Next.js to 16.4.5 and Zod to 4.6.7; subsequent tests, build and audit results are in the verification record. |
| 23:49:17 | [`b519df1`](https://github.com/LE0-Lin/RepoPlay/commit/b519df19d8cf0fbce8667dd12d20b7430833098d) | Clarified prototype status, the private checkpoint and public-beta acceptance gates. |

The separate [LE0-Lin/RepoPlay](https://github.com/LE0-Lin/RepoPlay) repository was private when created. Its `main` branch was checked against the local head after pushing. AgentConfigScore remained the source example in its own directory.

## 2026-11-05 — retrospective documentation

- Added this log to describe earlier local work without assigning old dates to new commit objects.
- Preserved the existing commit history. Subsequent code and documentation changes are recorded as new commits when they occur.

## 2026-11-09 — early source preview

- Authorized publishing the existing repository as an early source preview. Public hosting and paid model use remain outside this change.
- Updated the README and walkthrough for visitors who can clone the project, preserving explicit limits on examples, editorial review and model generation.
- Reinstalled locked dependencies and repeated type checking, 21 tests, three sample checks, build, production audit and local HTTP verification. Reviewed reachable history for credential signatures and rechecked pinned upstream snapshots and license text. Results and limitations are in the [verification record](VERIFICATION.md).

## About older commit dates

Existing local Git commits can be pushed later while retaining their stored metadata. If old commits or snapshots were never created or saved, the current working tree does not reconstruct that history. Git timestamps can be edited, so a date by itself is not evidence of an earlier code version. GitHub also distinguishes author dates from committer dates; see the [official timestamp reference](https://docs.github.com/en/account-and-profile/reference/profile-contributions-reference#how-github-uses-the-git-author-date-and-commit-date).
