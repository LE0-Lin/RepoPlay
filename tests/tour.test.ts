import { test } from 'node:test';
import assert from 'node:assert/strict';
import { samples } from '../lib/samples';
import { tourSchema,parseDocument,sourceUrl,validateReferences } from '../lib/tour';
import { verifyBlobHashes } from '../lib/integrity';
import { POST as validateRoute } from '../app/api/tour/validate/route';
import { GET as exportSample,POST as exportLocal } from '../app/api/tour/export/route';

test('all editorial tours have pinned, exact source references and intact Git blobs',()=>{
  assert.equal(samples.length,3);
  for(const d of samples){assert.equal(validateReferences(d.tour,d.files).length,0);verifyBlobHashes(d.files);assert.match(d.tour.repository.commit,/^[a-f0-9]{40}$/);assert.ok(d.tour.steps.length>=5&&d.tour.steps.length<=8);}
  assert.equal(sourceUrl(samples[0].tour,samples[0].tour.steps[0].references[0]),'https://github.com/LE0-Lin/AgentConfigScore/blob/633ccef39a89ba79592d90a68f5410f57bb8bb53/src/agent_config_score/cli.py#L127-L135');
});
test('Tour rejects misleading modes, malformed ranges and broken flow relationships',()=>{
  const mutations=[
    (t:any)=>t.dataMode='runtime-trace',
    (t:any)=>t.repository.commit='main',
    (t:any)=>t.steps[0].references[0].startLine=0,
    (t:any)=>t.steps[0].references[0].endLine=1,
    (t:any)=>t.steps[1].id=t.steps[0].id,
    (t:any)=>t.connections[0].to='unknown',
    (t:any)=>t.connections.pop(),
    (t:any)=>t.connections.push({from:t.steps[0].id,to:t.steps[2].id}),
    (t:any)=>t.connections.push({from:t.steps[6].id,to:t.steps[0].id}),
    (t:any)=>t.steps[0].references[0].path='../secret.ts',
    (t:any)=>t.steps[0].references[0].path='https://example.com/file.ts',
    (t:any)=>t.steps[6].branches[1].id=t.steps[6].branches[0].id,
    (t:any)=>t.hiddenPrompt='private',
  ];
  for(const mutate of mutations){const t=structuredClone(samples[0].tour);mutate(t);assert.equal(tourSchema.safeParse(t).success,false);}
});
test('missing files, out-of-range lines and changed excerpts are rejected',()=>{
  const mutations=[(d:any)=>d.files=[],(d:any)=>d.tour.steps[0].references[0].path='src/missing.py',(d:any)=>{d.tour.steps[0].references[0].startLine=99999;d.tour.steps[0].references[0].endLine=99999;},(d:any)=>d.tour.steps[0].references[0].quote='fabricated code'];
  for(const mutate of mutations){const d=structuredClone(samples[0]);mutate(d);assert.throws(()=>parseDocument(d));}
  const files=structuredClone(samples[0].files);files[0].text+='changed';assert.throws(()=>verifyBlobHashes(files),/integrity/);
});
test('JSON import validates content, strips editorial trust and returns helpful errors',async()=>{
  const make=(data:unknown)=>new Request('http://localhost/api/tour/validate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
  const response=await validateRoute(make(samples[0]));assert.equal(response.status,200);
  const data=await response.json();assert.equal(data.document.tour.provenance.kind,'local-import');assert.equal(data.document.tour.provenance.review,'unreviewed');
  const broken=structuredClone(samples[0]);broken.tour.steps[0].references[0].quote='wrong';const invalid=await validateRoute(make(broken));assert.equal(invalid.status,422);assert.equal((await invalid.json()).code,'INVALID_TOUR');
  const corrupt=structuredClone(samples[0]);corrupt.files[0].text+='\nchanged';assert.equal((await validateRoute(make(corrupt))).status,422);
  assert.equal((await validateRoute(new Request('http://localhost/api/tour/validate',{method:'POST',body:'x'.repeat(1000001)}))).status,413);
  assert.equal((await validateRoute(new Request('http://localhost/api/tour/validate',{method:'POST',body:'{not json'}))).status,400);
});
test('JSON export returns a real validated attachment for samples and local documents',async()=>{
  const response=await exportSample(new Request('http://localhost/api/tour/export?id=scan-to-report'));
  assert.equal(response.status,200);assert.match(response.headers.get('content-disposition')??'',/attachment; filename="scan-to-report.tour.json"/);assert.deepEqual(parseDocument(await response.json()),samples[0]);
  assert.equal((await exportSample(new Request('http://localhost/api/tour/export?id=unknown'))).status,404);
  const make=(d:unknown)=>new Request('http://localhost/api/tour/export',{method:'POST',body:new URLSearchParams({document:JSON.stringify(d)})});
  const local=await exportLocal(make(samples[0]));assert.equal(local.status,200);assert.equal((await local.json()).tour.provenance.review,'unreviewed');
  const invalid=structuredClone(samples[0]);invalid.tour.steps[0].references[0].quote='wrong';assert.equal((await exportLocal(make(invalid))).status,422);
});
