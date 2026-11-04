import { createHash } from "node:crypto";
import { z } from "zod";
import { fileSchema, sourcePath, type TourDocument } from "./tour";
import { readBounded } from "./bounded";
import { ProductError } from "./errors";

export const LIMITS = { files: 12, fileBytes: 48000, totalBytes: 256000, treeEntries: 2000, repositoryKB: 20000, timeoutMs: 20000, treeResponseBytes: 1000000 } as const;
const repositoryName = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,99}$/;
const ownerName = /^[A-Za-z0-9][A-Za-z0-9-]{0,38}$/;
export function parseRepository(value: string) {
  const input=value.trim(); let pair: string[];
  if (/^https?:\/\//i.test(input) || input.startsWith('github.com/')) {
    let url: URL; try { url=new URL(input.startsWith('github.com/')?'https://'+input:input); } catch { throw invalidRepo(); }
    if (url.protocol !== 'https:' || url.hostname !== 'github.com' || url.port || url.username || url.password || url.search || url.hash) throw invalidRepo();
    pair=url.pathname.replace(/\/$/,'').slice(1).split('/');
  } else pair=input.replace(/\/$/,'').split('/');
  if (pair.length!==2) throw invalidRepo();
  const [owner,rawName]=pair; const name=rawName.replace(/\.git$/,'');
  if (!ownerName.test(owner) || !repositoryName.test(name) || name.includes('..')) throw invalidRepo();
  return {owner,name};
}
function invalidRepo() { return new ProductError('INVALID_REPOSITORY','Enter owner/repo or a standard https://github.com/owner/repo repository URL.'); }
const excluded = new Set(['node_modules','vendor','.git','.next','dist','build','coverage','target','.venv','venv','__pycache__','generated','.terraform','.aws','.ssh']);
const extensions = new Set(['ts','tsx','js','jsx','mjs','cjs','py','rs','go','java','rb','php','cs','c','h','cpp','swift','kt','md','txt','json','toml','yaml','yml']);
export function isAllowedPath(path: string) {
  if (!sourcePath.safeParse(path).success) return false;
  const parts=path.toLowerCase().split('/'); const name=parts.at(-1)!;
  if (parts.some(p=>excluded.has(p) || /^(?:secrets?|credentials?)$/.test(p))) return false;
  if (/^\.env(?:\.|$)|(?:secret|credential|token)|\.min\.|\.map$|\.lock$|(?:package-lock|pnpm-lock|yarn\.lock)|\.(?:pem|key|p12|pfx|crt)$|^\.(?:npmrc|pypirc|netrc|git-credentials)$/.test(name)) return false;
  return extensions.has(name.split('.').at(-1)!);
}
export function containsSensitiveMaterial(text: string) {
  return /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\bgh[pousr]_[A-Za-z0-9]{20,}\b|\bgithub_pat_[A-Za-z0-9_]{20,}\b|\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b|\bAKIA[A-Z0-9]{16}\b/.test(text);
}
const entrySchema=z.object({path:z.string(),type:z.string(),mode:z.string(),size:z.number().int().nonnegative().optional(),sha:z.string().regex(/^[a-f0-9]{40}$/)});
const treeSchema=z.object({truncated:z.boolean(),tree:z.array(entrySchema)});
const metaSchema=z.object({private:z.literal(false),size:z.number().nonnegative(),default_branch:z.string().min(1).max(250),description:z.string().nullable(),license:z.object({spdx_id:z.string()}).nullable()});
const branchSchema=z.object({commit:z.object({sha:z.string().regex(/^[a-f0-9]{40}$/),commit:z.object({tree:z.object({sha:z.string().regex(/^[a-f0-9]{40}$/)})})})});
const blobSchema=z.object({sha:z.string(),encoding:z.literal('base64'),content:z.string(),size:z.number().int().nonnegative()});
export type RepositorySnapshot = {repository:{owner:string;name:string;commit:string;license:string}; description:string;files:TourDocument['files'];totalBytes:number;omitted:number;tree:string[]};
type Fetcher = typeof fetch;
export async function importRepository(input: string, options: {fetcher?:Fetcher;token?:string;timeoutMs?:number} = {}): Promise<RepositorySnapshot> {
  const {owner,name}=parseRepository(input); const fetcher=options.fetcher??fetch;
  const signal=AbortSignal.timeout(options.timeoutMs??LIMITS.timeoutMs);
  const root=`https://api.github.com/repos/${owner}/${name}`;
  const token=options.token;
  async function json(path:string,max:number) {
    try {
      const response=await fetcher(root+path,{redirect:'error',signal,cache:'no-store',headers:{Accept:'application/vnd.github+json','User-Agent':'RepoPlay-local',...(token?{Authorization:`Bearer ${token}`}:{})}});
      if (response.status===429 || (response.status===403 && response.headers.get('x-ratelimit-remaining')==='0')) throw new ProductError('RATE_LIMIT','GitHub is rate limiting requests. Try later or configure a server-side GitHub token.',429);
      if (response.status===404) throw new ProductError('NOT_FOUND','This public repository could not be found. Check the owner and repository name.',404);
      if (response.status===409) throw new ProductError('EMPTY_REPOSITORY','This repository has no readable commit yet.');
      if (!response.ok) throw new ProductError('GITHUB_UNAVAILABLE','GitHub could not provide this repository. Check that it is public and try again.',502);
      return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(await readBounded(response,max,signal)));
    } catch(error) { if (error instanceof ProductError) throw error; if(signal.aborted) throw new ProductError('TIMEOUT','GitHub reading timed out after the configured time limit. Try a smaller repository.',408); throw new ProductError('GITHUB_UNAVAILABLE','GitHub could not be reached or returned an unsupported response. Please try again.',502); }
  }
  try {
    const meta=metaSchema.safeParse(await json('',64000));
    if (!meta.success) throw new ProductError('PUBLIC_ONLY','Only public GitHub repositories with readable metadata are supported.');
    if (meta.data.size>LIMITS.repositoryKB) throw new ProductError('REPOSITORY_TOO_LARGE','This repository exceeds the 20 MB repository limit. Try a smaller, focused project.',413);
    const branch=branchSchema.parse(await json(`/branches/${encodeURIComponent(meta.data.default_branch)}`,64000));
    const commit=branch.commit.sha;
    const tree=treeSchema.parse(await json(`/git/trees/${branch.commit.commit.tree.sha}?recursive=1`,LIMITS.treeResponseBytes));
    if (tree.truncated || tree.tree.length>LIMITS.treeEntries) throw new ProductError('REPOSITORY_TOO_LARGE','This repository tree is too large for v0.1 (maximum 2,000 entries). Try a smaller project.',413);
    const candidates=tree.tree.filter(e=>e.type==='blob' && (e.mode==='100644'||e.mode==='100755') && e.size!==undefined && e.size<=LIMITS.fileBytes && isAllowedPath(e.path));
    const priority=(path:string)=>/\/(?:main|index|cli|entrypoint)\./.test('/'+path)?0:path.startsWith('src/')?1:/^readme\./i.test(path)?2:3;
    candidates.sort((a,b)=>priority(a.path)-priority(b.path)||a.path.localeCompare(b.path));
    const files:TourDocument['files']=[]; let totalBytes=0; let attempted=0;
    for (const entry of candidates) {
      if (files.length>=LIMITS.files || attempted>=LIMITS.files*2) break;
      if (totalBytes+entry.size!>LIMITS.totalBytes) continue;
      attempted++;
      const blob=blobSchema.parse(await json(`/git/blobs/${entry.sha}`,70000));
      const bytes=Buffer.from(blob.content.replace(/\s/g,''),'base64');
      if (bytes.length>LIMITS.fileBytes || bytes.length!==entry.size || bytes.length!==blob.size || blob.sha!==entry.sha) throw new ProductError('SOURCE_INVALID','GitHub returned an inconsistent source file. No tour was generated.',502);
      totalBytes+=bytes.length;
      if (totalBytes>LIMITS.totalBytes) throw new ProductError('READ_LIMIT','Source reading exceeded the 256 KB budget.',413);
      const hash=createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
      if (hash!==entry.sha) throw new ProductError('SOURCE_INVALID','Source content did not match the pinned Git blob.',502);
      let text:string; try {text=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(bytes);} catch {continue;}
      if (/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(text) || containsSensitiveMaterial(text) || !text.trim()) continue;
      files.push(fileSchema.parse({path:entry.path,text,blobSha:entry.sha}));
    }
    if (!files.length) throw new ProductError('NO_SOURCE','No usable UTF-8 source files were found within the reading limits. Binary, generated and sensitive files are excluded.');
    return {repository:{owner,name,commit,license:meta.data.license?.spdx_id??'License not identified — check upstream before sharing excerpts'},description:meta.data.description??'',files,totalBytes,omitted:tree.tree.length-files.length,tree:tree.tree.map(e=>e.path)};
  } catch(error) {if (error instanceof ProductError) throw error; throw new ProductError('SOURCE_INVALID','GitHub returned an unsupported repository structure. No tour was generated.',502);}
}
