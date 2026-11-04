import { parseDocument } from "@/lib/tour";
import { verifyBlobHashes } from "@/lib/integrity";
import { readRequestJson } from "@/lib/bounded";
import { ProductError,errorResponse } from "@/lib/errors";
export const runtime='nodejs';
export async function POST(request:Request) {
  try {
    const input=await readRequestJson(request,1000000);
    let document;
    try {document=parseDocument(input);verifyBlobHashes(document.files);} catch {throw new ProductError('INVALID_TOUR','This Tour JSON failed structure, source snapshot integrity or exact source-reference checks. Check the files, excerpts and line ranges.',422);}
    document.tour.provenance={kind:'local-import',review:'unreviewed',note:'Imported from local JSON. References match the included source snapshot; upstream commit provenance and explanations have not been independently verified.'};
    return Response.json({document});
  } catch(error) {return errorResponse(error);}
}
