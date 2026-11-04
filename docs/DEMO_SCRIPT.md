# A 90-second RepoPlay demo

Suggested recording sequence, not a recording or evidence of user adoption. Use the production preview at `http://127.0.0.1:3000`, a desktop window around 1440 × 1000, and the built-in `scan-to-report` guide. No model configuration is needed.

## Before recording

Run `npm run build` and `npm start` from the project directory. Close unrelated tabs and notifications. Keep the full title and the “Illustrative” state label visible. If opening GitHub during the recording, confirm connectivity first; the local guide itself uses its included snapshot.

## Sequence and suggested narration

| Time | Action | Narration |
| --- | --- | --- |
| 0–10 s | Show the homepage and click **Try the interactive demo**. | “RepoPlay helps you understand a codebase, one step at a time. Start with a ready-made feature tour.” |
| 10–25 s | Show the command step, then click **Discover** in the feature path. | “Here we follow AgentConfigScore from a scan command to a report. Each step connects an explanation with the actual source.” |
| 25–40 s | Point to the input/output illustration and source excerpt. Expand the source if offered. | “These states illustrate how the code fits together. They are not a captured execution trace.” |
| 40–55 s | Select **Match**, then **Score**. | “We can jump straight to rule matching and see how the result feeds into scoring.” |
| 55–70 s | Select **Report** and switch the JSON/terminal output choice. | “Compare two output paths, with a source reference for the branch.” |
| 70–80 s | Open the pinned GitHub source, or point to its link if staying offline. | “Every excerpt links to specific lines at a fixed commit.” |
| 80–90 s | Copy the step link; show the visible URL and reopen or refresh it. | “A sample step has a stable URL. Share it on a reachable installation so another reader can start here.” |

Optional second clip: use a narrow window and show **Path → Step → Source** and the last step's **Follow another feature** section. Open the rule guide, then use browser Back to return to the report. Alternatively, import a repository to show the honest generation-not-configured message. The existing samples remain usable.

## Keep the claims accurate

The guides are pre-generated and source-checked by the development agent; independent human review remains pending. Do not present the state diagrams as execution footage or the guides as instantly generated. A localhost link is only reachable on the recording machine. Do not add a Star link until a real RepoPlay repository exists, and do not imply users, Stars, benchmarks or growth outcomes that have not been measured.
