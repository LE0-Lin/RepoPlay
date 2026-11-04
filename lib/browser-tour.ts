import { parseDocument, type TourDocument } from './tour';

const key = 'repoplay-local-tour';
type StorageProvider = () => Pick<Storage, 'getItem' | 'setItem'>;
const browserStorage: StorageProvider = () => window.sessionStorage;

export class TourBrowserError extends Error {
  constructor(public code: string, message: string) { super(message); }
}

function localDocument(input: unknown): TourDocument {
  const document = parseDocument(input);
  document.tour.provenance = {
    kind:'local-import', review:'unreviewed',
    note:'Stored in this browser tab. References match the included source snapshot; explanations and upstream provenance require review. State diagrams are illustrative.'
  };
  return document;
}

export function saveLocalTour(input: unknown, storage: StorageProvider = browserStorage) {
  let document: TourDocument;
  try { document = localDocument(input); }
  catch { throw new TourBrowserError('INVALID_TOUR', 'This Tour failed its structure or source-reference checks. Import a valid Tour JSON.'); }
  const text = JSON.stringify(document);
  if (new TextEncoder().encode(text).length > 1000000) throw new TourBrowserError('TOUR_TOO_LARGE', 'Tour JSON must be smaller than 1 MB.');
  try { storage().setItem(key, text); }
  catch { throw new TourBrowserError('STORAGE_UNAVAILABLE', 'This browser could not store the tour. Allow site storage or use another browser, then import again.'); }
}

export function restoreLocalTour(storage: StorageProvider = browserStorage): TourDocument {
  let text: string | null;
  try { text = storage().getItem(key); }
  catch { throw new TourBrowserError('STORAGE_UNAVAILABLE', 'This browser could not open its saved tour. Allow site storage or use another browser, then import again.'); }
  if (!text) throw new TourBrowserError('NO_LOCAL_TOUR', 'No local tour is saved in this browser tab. Import a Tour JSON from the homepage.');
  try {
    if (new TextEncoder().encode(text).length > 1000000) throw new Error('Size limit');
    return localDocument(JSON.parse(text));
  } catch { throw new TourBrowserError('INVALID_TOUR', 'The saved tour could not be restored. Import its JSON again from the homepage.'); }
}
