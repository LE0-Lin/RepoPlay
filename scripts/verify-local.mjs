// Run only against an already-started local app; never calls a model.
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
const origin=process.env.REPOPLAY_TEST_URL??'http://127.0.0.1:3000';
if (!['127.0.0.1','localhost','[::1]'].includes(new URL(origin).hostname)) throw new Error('Local verification only');
const home=await (await fetch(origin)).text();assert.ok(home.includes('New tour generation is not configured.'),'Do not run this smoke script with model configuration enabled.');
const post=(path,value)=>fetch(origin+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(value),signal:AbortSignal.timeout(25000)});
const invalid=await post('/api/import',{repository:'https://example.com/a/b'});assert.equal(invalid.status,400);assert.equal((await invalid.json()).code,'INVALID_REPOSITORY');
const tour=JSON.parse(readFileSync('data/scan-to-report.json','utf8'));const files=JSON.parse(readFileSync('data/sources.json','utf8'));const document={tour,files};
const valid=await post('/api/tour/validate',document);assert.equal(valid.status,200);assert.equal((await valid.json()).document.tour.provenance.kind,'local-import');
const exported=await fetch(origin+'/api/tour/export?id=scan-to-report');assert.equal(exported.status,200);assert.match(exported.headers.get('content-disposition')??'',/attachment/);assert.equal((await exported.json()).tour.repository.commit,tour.repository.commit);
const changed=structuredClone(document);changed.tour.steps[0].references[0].quote='invented';const bad=await post('/api/tour/validate',changed);assert.equal(bad.status,422);
for(const id of ['scan-to-report','rule-lookup','auditable-exception']) {
  const sample=JSON.parse(readFileSync(`data/${id}.json`,'utf8'));
  const response=await fetch(`${origin}/tour/${id}?step=${sample.steps.at(-1).id}`);assert.equal(response.status,200);
  const html=await response.text();assert.ok(html.includes('END OF THIS PATH'));assert.ok(html.includes('Browse tour library'));
}
assert.equal((await fetch(`${origin}/tour/missing-guide`)).status,404);
mkdirSync('test-results',{recursive:true});writeFileSync('test-results/valid.tour.json',JSON.stringify(document));writeFileSync('test-results/invalid.tour.json',JSON.stringify(changed));writeFileSync('test-results/malformed.tour.json','{"tour":');
console.log('Local HTTP checks passed: homepage, three tour endings, JSON import/export, missing tour, invalid repository and invalid source rejection.');
