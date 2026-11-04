import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {importRepository,parseRepository,isAllowedPath,LIMITS} from '../lib/github';
import {readBounded} from '../lib/bounded';
import {verifyBlobHashes} from '../lib/integrity';
const sha='a'.repeat(40),treeSha='b'.repeat(40);
const blob=(text:string)=>{const bytes=Buffer.from(text);return {sha:createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex'),encoding:'base64',content:bytes.toString('base64'),size:bytes.length};};
function fixture(contents:Record<string,string>,change:Record<string,unknown>={}) {
  const blobs=Object.entries(contents).map(([path,text])=>({path,...blob(text)}));const urls:string[]=[];
  const fetcher=(async(input:RequestInfo|URL,init?:RequestInit)=>{
    const url=String(input);urls.push(url);assert.equal(init?.redirect,'error');
    assert.ok(url.startsWith('https://api.github.com/repos/acme/small'));
    if(url.endsWith('/small'))return Response.json({private:false,size:10,default_branch:'main',description:'fixture',license:{spdx_id:'MIT'},...(change.meta as object)});
    if(url.includes('/branches/'))return Response.json({commit:{sha,commit:{tree:{sha:treeSha}}}});
    if(url.includes('/git/trees/'))return Response.json({truncated:false,tree:blobs.map(b=>({path:b.path,type:'blob',mode:'100644',size:b.size,sha:b.sha})),...(change.tree as object)});
    const found=blobs.find(b=>url.endsWith(b.sha));return Response.json(found?{...found,...(change.blob as object)}:{});
  }) as typeof fetch;
  return {fetcher,urls};
}
test('accepts repository names and GitHub repository URLs only',()=>{
  for(const input of ['acme/small','https://github.com/acme/small','github.com/acme/small/','https://github.com/acme/small.git'])assert.deepEqual(parseRepository(input),{owner:'acme',name:'small'});
  for(const input of ['http://github.com/acme/small','https://example.com/acme/small','https://github.com.evil/acme/small','https://user:pass@github.com/acme/small','https://github.com:123/acme/small','https://github.com/acme/small?ref=main','https://github.com/acme/small/tree/main','../small','acme/..','acme/%2e%2e','acme/small#x'])assert.throws(()=>parseRepository(input));
});
test('path filter skips dependencies, generated assets and credential files',()=>{
  for(const path of ['node_modules/x.ts','vendor/x.py','dist/index.js','.env','.env.local','secrets/key.json','src/credentials.json','key.pem','.npmrc','src/a.min.js','package-lock.json','photo.png','../main.ts'])assert.equal(isAllowedPath(path),false,path);
  for(const path of ['src/main.ts','README.md','package.json','.github/workflows/check.yml'])assert.equal(isAllowedPath(path),true,path);
});
test('bounded import pins the commit, omits binary/sensitive/oversized/symlink content and preserves BOM integrity',async()=>{
  const f=fixture({'src/main.ts':'\ufeffexport const greet = () => "hello";','README.md':'hello','binary.txt':'nul\0data','credentials.json':'secret','oversized.py':'x'.repeat(48001),'sensitive.ts':'const x = "ghp_'+'A'.repeat(30)+'";'});
  const snapshot=await importRepository('acme/small',{fetcher:f.fetcher});assert.equal(snapshot.repository.commit,sha);assert.equal(snapshot.files.length,2);verifyBlobHashes(snapshot.files);
  assert.equal(snapshot.files[0].text.charCodeAt(0),0xfeff);assert.ok(!f.urls.some(u=>u.includes('raw.')));
  const symlink=fixture({'main.ts':'not executed'},{tree:{truncated:false,tree:[{path:'main.ts',type:'blob',mode:'120000',size:12,sha}]}});
  await assert.rejects(()=>importRepository('acme/small',{fetcher:symlink.fetcher}),{code:'NO_SOURCE'});
});
test('file count and total fetched text bytes remain within budgets',async()=>{
  const many=fixture(Object.fromEntries(Array.from({length:30},(_,i)=>[`src/file${String(i).padStart(2,'0')}.ts`,'x'.repeat(23000)])));
  const snapshot=await importRepository('acme/small',{fetcher:many.fetcher});assert.ok(snapshot.files.length<=LIMITS.files);assert.ok(snapshot.totalBytes<=LIMITS.totalBytes);assert.equal(snapshot.files.length,11);
  const count=fixture(Object.fromEntries(Array.from({length:30},(_,i)=>[`src/file${i}.ts`,'hello'])));assert.equal((await importRepository('acme/small',{fetcher:count.fetcher})).files.length,12);
});
test('large repositories, truncated trees, private metadata and corrupted source fail explicitly',async()=>{
  for(const [change,code] of [[{meta:{size:20001}},'REPOSITORY_TOO_LARGE'],[{tree:{truncated:true}},'REPOSITORY_TOO_LARGE'],[{meta:{private:true}},'PUBLIC_ONLY'],[{blob:{sha:'c'.repeat(40)}},'SOURCE_INVALID'],[{blob:{content:Buffer.from('changed').toString('base64')}},'SOURCE_INVALID']] as const){const f=fixture({'src/main.ts':'hello'},change);await assert.rejects(()=>importRepository('acme/small',{fetcher:f.fetcher}),{code});}
  const f=fixture({'src/main.ts':'hello'},{tree:{truncated:false,tree:Array.from({length:2001},(_,i)=>({path:`src/${i}.ts`,type:'blob',mode:'100644',sha,size:5}))}});await assert.rejects(()=>importRepository('acme/small',{fetcher:f.fetcher}),{code:'REPOSITORY_TOO_LARGE'});
});
test('rate limits, not found, empty repo, network timeouts and oversized responses have bounded errors',async()=>{
  for(const [status,headers,code] of [[429,{},'RATE_LIMIT'],[403,{'x-ratelimit-remaining':'0'},'RATE_LIMIT'],[404,{},'NOT_FOUND'],[409,{},'EMPTY_REPOSITORY']] as const){const fetcher=(async()=>new Response('',{status,headers})) as typeof fetch;await assert.rejects(()=>importRepository('acme/small',{fetcher}),{code});}
  const slow=(async(_input:unknown,init?:RequestInit)=>new Promise<Response>((_,reject)=>init?.signal?.addEventListener('abort',()=>reject(new Error('aborted'))))) as typeof fetch;
  // Keep the event loop active while AbortSignal.timeout uses an unref'd timer.
  const timer=setTimeout(()=>{},100);try {await assert.rejects(()=>importRepository('acme/small',{fetcher:slow,timeoutMs:5}),{code:'TIMEOUT'});}finally{clearTimeout(timer);}
  let cancelled=false;
  const stalled=(async()=>new Response(new ReadableStream<Uint8Array>({cancel(){cancelled=true;}}))) as typeof fetch;
  const bodyTimer=setTimeout(()=>{},100);
  try {await assert.rejects(()=>importRepository('acme/small',{fetcher:stalled,timeoutMs:5}),{code:'TIMEOUT'});assert.equal(cancelled,true);} finally {clearTimeout(bodyTimer);}
  const huge=(async()=>new Response('x'.repeat(64001))) as typeof fetch;await assert.rejects(()=>importRepository('acme/small',{fetcher:huge}),{code:'READ_LIMIT'});
  const stream=new ReadableStream({start(c){c.enqueue(new Uint8Array(8));c.close();}});await assert.rejects(()=>readBounded(new Response(stream),4),{code:'READ_LIMIT'});
});
