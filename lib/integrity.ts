import { createHash } from "node:crypto";
import type { TourDocument } from "./tour";
export function verifyBlobHashes(files: TourDocument["files"]) {
  for (const f of files) {
    const bytes = Buffer.from(f.text, "utf8");
    const hash = createHash("sha1").update(`blob ${bytes.length}\0`).update(bytes).digest("hex");
    if (hash !== f.blobSha) throw new Error(`Source snapshot integrity mismatch: ${f.path}`);
  }
}
