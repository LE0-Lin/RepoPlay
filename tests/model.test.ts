import {test} from 'node:test';
import assert from 'node:assert/strict';
import {samples} from '../lib/samples';
import {generateTour,modelConfiguration,ChatCompletionsAdapter} from '../lib/model';
import type {RepositorySnapshot} from '../lib/github';
const sample=samples[0];
const snapshot:RepositorySnapshot={repository:sample.tour.repository,description:'fixture',files:sample.files,totalBytes:sample.files.reduce((n,f)=>n+Buffer.byteLength(f.text),0),omitted:0,tree:sample.files.map(f=>f.path)};
test('missing model configuration disables generation; configuration is explicit and server-side',()=>{
  assert.equal(modelConfiguration({}),null);assert.equal(modelConfiguration({REPOPLAY_MODEL_NAME:'fixture'}),null);
  assert.throws(()=>modelConfiguration({REPOPLAY_MODEL_ENDPOINT:'http://remote.example/v1/chat/completions',REPOPLAY_MODEL_NAME:'fixture',REPOPLAY_MODEL_API_KEY:'offline-placeholder'}));
});
test('replaceable offline adapter validates output without calling a paid model',async()=>{
  const document=await generateTour(snapshot,{generate:async()=>structuredClone(sample.tour)});assert.equal(document.tour.provenance.kind,'generated');assert.equal(document.tour.provenance.review,'unreviewed');
  for(const mutate of [(t:any)=>t.repository.commit='c'.repeat(40),(t:any)=>t.steps[0].references[0].quote='invented',(t:any)=>t.steps[0].references[0].path='missing.ts',(t:any)=>t.steps[0].references[0].startLine=999999]){const tour=structuredClone(sample.tour);mutate(tour);await assert.rejects(()=>generateTour(snapshot,{generate:async()=>tour}),{code:'MODEL_INVALID'});}
});
test('chat adapter request contract and malformed responses are checked with a fake transport',async()=>{
  let sent:any; const config={endpoint:'https://model.example/v1/chat/completions',name:'fixture',apiKey:'offline-placeholder'};
  const fake=(async(_input:unknown,init?:RequestInit)=>{sent=JSON.parse(init!.body as string);return Response.json({choices:[{message:{content:JSON.stringify(sample.tour)}}]});}) as typeof fetch;
  await generateTour(snapshot,new ChatCompletionsAdapter(config,fake));assert.equal(sent.model,'fixture');assert.equal(sent.response_format.type,'json_object');assert.match(sent.messages[0].content,/untrusted data/);
  const invalid=(async()=>Response.json({choices:[{message:{content:'not json'}}]})) as typeof fetch;await assert.rejects(()=>generateTour(snapshot,new ChatCompletionsAdapter(config,invalid)),{code:'MODEL_INVALID'});
  const limited=(async()=>new Response('',{status:429})) as typeof fetch;await assert.rejects(()=>generateTour(snapshot,new ChatCompletionsAdapter(config,limited)),{code:'MODEL_RATE_LIMIT'});
  await assert.rejects(()=>generateTour(snapshot,{generate:async()=>{throw new Error('transport failed');}}),{code:'MODEL_UNAVAILABLE'});
});
