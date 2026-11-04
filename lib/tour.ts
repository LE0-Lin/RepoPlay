import { z } from "zod";

export const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80);
export const sourcePath = z.string().min(1).max(300).refine(p =>
  !p.startsWith("/") && !p.includes("\\") && !p.includes(":") &&
  !/[\x00-\x1f]/.test(p) && p.split("/").every(s => s && s !== "." && s !== ".."), "Unsafe source path");
const prose = z.string().trim().min(1).max(2400);
export const referenceSchema = z.object({
  path: sourcePath, startLine: z.number().int().min(1), endLine: z.number().int().min(1),
  quote: z.string().min(1).max(16000)
}).strict().refine(r => r.endLine >= r.startLine && r.endLine - r.startLine < 100, "Invalid line range");
const stateSchema = z.object({ label: z.string().min(1).max(80), value: z.string().min(1).max(1200) }).strict();
const stepSchema = z.object({
  id: slug, title: z.string().min(1).max(100), label: z.string().min(1).max(35),
  explanation: prose, insight: prose, input: stateSchema, output: stateSchema,
  transition: z.string().min(1).max(300), references: z.array(referenceSchema).min(1).max(3),
  branches: z.array(z.object({ id: slug, label: z.string().min(1).max(50), explanation: prose,
    output: stateSchema, reference: referenceSchema }).strict()).min(2).max(3).optional()
}).strict();
export const tourSchema = z.object({
  schemaVersion: z.literal(1), id: slug, title: z.string().min(1).max(120),
  summary: prose, feature: z.string().min(1).max(120), language: z.string().min(1).max(40),
  repository: z.object({ owner: z.string().regex(/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,38})$/),
    name: z.string().regex(/^[a-zA-Z0-9_.-]{1,100}$/).refine(v => v !== "." && v !== ".."),
    commit: z.string().regex(/^[a-f0-9]{40}$/), license: z.string().min(1).max(120) }).strict(),
  provenance: z.object({ kind: z.enum(["pre-generated", "generated", "local-import"]),
    review: z.enum(["source-checked", "unreviewed"]), note: prose }).strict(),
  dataMode: z.literal("illustrative"), steps: z.array(stepSchema).min(5).max(8),
  connections: z.array(z.object({ from: slug, to: slug }).strict()).min(4).max(7)
}).strict().superRefine((t, ctx) => {
  const ids = new Set(t.steps.map(s => s.id));
  if (ids.size !== t.steps.length) ctx.addIssue({ code: "custom", message: "Duplicate step IDs" });
  const edges = new Set(t.connections.map(c => `${c.from}:${c.to}`));
  if (edges.size !== t.connections.length) ctx.addIssue({ code: "custom", message: "Duplicate connections" });
  for (const c of t.connections) if (!ids.has(c.from) || !ids.has(c.to) || c.from === c.to)
    ctx.addIssue({ code: "custom", message: "Connection refers to an unknown or identical step" });
  // v0.1 renders one ordered path. Reject edges the player cannot represent.
  if (t.connections.length !== t.steps.length - 1) ctx.addIssue({ code: "custom", message: "Connections must describe exactly one ordered path" });
  t.steps.slice(1).forEach((s, i) => {
    if (!edges.has(`${t.steps[i].id}:${s.id}`)) ctx.addIssue({ code: "custom", message: "Missing sequential connection" });
  });
  for (const s of t.steps) if (s.branches && new Set(s.branches.map(b => b.id)).size !== s.branches.length)
    ctx.addIssue({ code: "custom", message: "Duplicate branch IDs" });
});
export type Tour = z.infer<typeof tourSchema>;
export type SourceReference = z.infer<typeof referenceSchema>;
export const fileSchema = z.object({ path: sourcePath, text: z.string().max(96000),
  blobSha: z.string().regex(/^[a-f0-9]{40}$/) }).strict();
export const documentSchema = z.object({ tour: tourSchema, files: z.array(fileSchema).min(1).max(20) }).strict()
  .superRefine((d, ctx) => {
    if (new Set(d.files.map(f => f.path)).size !== d.files.length)
      ctx.addIssue({ code: "custom", message: "Duplicate source paths" });
    if (d.files.reduce((n, f) => n + new TextEncoder().encode(f.text).length, 0) > 256000)
      ctx.addIssue({ code: "custom", message: "Source snapshot exceeds 256 KB" });
  });
export type TourDocument = z.infer<typeof documentSchema>;

export function sourceUrl(tour: Tour, ref: SourceReference) {
  const r = tour.repository;
  return `https://github.com/${r.owner}/${r.name}/blob/${r.commit}/${ref.path.split("/").map(encodeURIComponent).join("/")}#L${ref.startLine}-L${ref.endLine}`;
}
export function validateReferences(tour: Tour, files: TourDocument["files"]) {
  const byPath = new Map(files.map(f => [f.path, f.text.replace(/\r\n/g, "\n").split("\n")]));
  const errors: string[] = [];
  for (const step of tour.steps) {
    const refs = [...step.references, ...(step.branches?.map(b => b.reference) ?? [])];
    for (const r of refs) {
      const lines = byPath.get(r.path);
      if (!lines) errors.push(`${step.id}: missing file ${r.path}`);
      else if (r.endLine > lines.length || (r.endLine === lines.length && lines.at(-1) === "")) errors.push(`${step.id}: out-of-range lines in ${r.path}`);
      else if (lines.slice(r.startLine - 1, r.endLine).join("\n") !== r.quote.replace(/\r\n/g, "\n"))
        errors.push(`${step.id}: quote mismatch in ${r.path}`);
    }
  }
  return errors;
}
export function parseDocument(input: unknown): TourDocument {
  const d = documentSchema.parse(input);
  const errors = validateReferences(d.tour, d.files);
  if (errors.length) throw new Error(errors.join("; "));
  return d;
}
