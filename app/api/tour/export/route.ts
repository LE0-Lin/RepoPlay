import { getSample } from "@/lib/samples";
import { parseDocument,type TourDocument } from "@/lib/tour";
import { verifyBlobHashes } from "@/lib/integrity";
import { readRequestBytes } from "@/lib/bounded";
import { ProductError,errorResponse } from "@/lib/errors";
export const runtime='nodejs';
function attachment(document:TourDocument) {
  return new Response(JSON.stringify(document,null,2),{headers:{
    'Content-Type':'application/json; charset=utf-8',
    'Content-Disposition':`attachment; filename="${document.tour.id}.tour.json"`,
    'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'
  }});
}
export async function GET(request:Request) {
  const sample=getSample(new URL(request.url).searchParams.get('id')??'');
  if (!sample) return errorResponse(new ProductError('NOT_FOUND','This sample tour could not be found.',404));
  return attachment(sample);
}
export async function POST(request:Request) {
  try {
    const bytes=await readRequestBytes(request,3000000);
    let text:string;
    try {text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);} catch {throw new ProductError('INVALID_TOUR','Provide a UTF-8 Tour JSON document.',422);}
    const form=new URLSearchParams(text);
    const raw=form.get('document');
    if (!raw || raw.length>1000000 || form.getAll('document').length!==1 || [...form.keys()].some(k=>k!=='document')) throw new ProductError('INVALID_TOUR','Provide one Tour JSON document.',422);
    let document:TourDocument;
    try {document=parseDocument(JSON.parse(raw));verifyBlobHashes(document.files);} catch {throw new ProductError('INVALID_TOUR','This Tour failed source or structure checks and could not be exported.',422);}
    document.tour.provenance={kind:'local-import',review:'unreviewed',note:'Exported from a local browser document. References match the included snapshot; upstream provenance and explanations require review.'};
    return attachment(document);
  } catch(error) {return errorResponse(error);}
}
