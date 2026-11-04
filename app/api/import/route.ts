import { z } from "zod";
import { importRepository } from "@/lib/github";
import { modelConfiguration, ChatCompletionsAdapter, generateTour } from "@/lib/model";
import { readRequestJson } from "@/lib/bounded";
import { ProductError,errorResponse } from "@/lib/errors";
export const runtime='nodejs';
export async function POST(request:Request) {
  try {
    const input=z.object({repository:z.string().min(1).max(200)}).strict().safeParse(await readRequestJson(request,2048));
    if (!input.success) throw new ProductError('INVALID_INPUT','Provide a GitHub repository URL or owner/repo.');
    const snapshot=await importRepository(input.data.repository,{token:process.env.REPOPLAY_GITHUB_TOKEN});
    const config=modelConfiguration();
    // An actual import, with no fabricated generation or progress stages.
    if (!config) return Response.json({snapshot:{...snapshot,files:snapshot.files.map(f=>({path:f.path})),tree:undefined},document:null,message:'Repository read successfully. New tour generation is not configured on this server. Explore a ready-made tour below, or import an existing Tour JSON.'});
    const document=await generateTour(snapshot,new ChatCompletionsAdapter(config));
    return Response.json({document});
  } catch(error) {return errorResponse(error);}
}
