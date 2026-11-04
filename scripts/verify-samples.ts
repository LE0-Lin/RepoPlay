import { samples } from "../lib/samples";
import { verifyBlobHashes } from "../lib/integrity";
for (const sample of samples) {
  verifyBlobHashes(sample.files);
  console.log(`Verified ${sample.tour.id}: ${sample.tour.steps.length} steps at ${sample.tour.repository.commit}`);
}
