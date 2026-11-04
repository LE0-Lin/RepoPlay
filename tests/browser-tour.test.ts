import { test } from 'node:test';
import assert from 'node:assert/strict';
import { saveLocalTour, restoreLocalTour, TourBrowserError } from '../lib/browser-tour';
import { samples } from '../lib/samples';

function memoryStorage(initial?: string) {
  let value = initial ?? null;
  return { getItem: () => value, setItem: (_key: string, next: string) => { value=next; } };
}

test('saved tours restore their source and lose editorial trust without mutating the original', () => {
  const storage=memoryStorage();
  saveLocalTour(samples[0], () => storage);
  const restored=restoreLocalTour(() => storage);
  assert.deepEqual(restored.files,samples[0].files);
  assert.deepEqual(restored.tour.steps,samples[0].tour.steps);
  assert.equal(restored.tour.provenance.kind,'local-import');
  assert.equal(restored.tour.provenance.review,'unreviewed');
  assert.equal(samples[0].tour.provenance.kind,'pre-generated');
  assert.equal(samples[0].tour.provenance.review,'source-checked');
});

test('empty, corrupt, oversized and source-mismatched storage return recoverable messages without parser details', () => {
  assert.throws(() => restoreLocalTour(() => memoryStorage()), { code:'NO_LOCAL_TOUR' });
  const bad=structuredClone(samples[0]);bad.tour.steps[0].references[0].quote='private-parser-detail';
  for (const text of ['{"private-parser-detail":', JSON.stringify(bad), 'private-parser-detail'.repeat(60000)]) {
    assert.throws(() => restoreLocalTour(() => memoryStorage(text)), error => {
      assert.ok(error instanceof TourBrowserError);
      assert.equal(error.code,'INVALID_TOUR');
      assert.match(error.message,/Import its JSON again/);
      assert.ok(!error.message.includes('private-parser-detail'));
      return true;
    });
  }
  const storage=memoryStorage('previous-document');
  assert.throws(() => saveLocalTour(bad, () => storage), { code:'INVALID_TOUR' });
  assert.equal(storage.getItem(),'previous-document');
});

test('blocked storage access and failed writes provide storage guidance', () => {
  const blocked=() => {throw new DOMException('internal browser detail','SecurityError');};
  assert.throws(() => restoreLocalTour(blocked), { code:'STORAGE_UNAVAILABLE' });
  assert.throws(() => saveLocalTour(samples[0],blocked), { code:'STORAGE_UNAVAILABLE' });
  const storage={getItem:()=>null,setItem:()=>{throw new DOMException('internal quota detail','QuotaExceededError');}};
  assert.throws(() => saveLocalTour(samples[0],()=>storage), error=>{
    assert.ok(error instanceof TourBrowserError);assert.match(error.message,/Allow site storage/);assert.ok(!error.message.includes('internal quota detail'));return true;
  });
});
