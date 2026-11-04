"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { saveLocalTour, TourBrowserError } from "@/lib/browser-tour";
import { Icon } from "./icons";
async function readResponse(response: Response) {
  let data;
  try { data = await response.json(); }
  catch { throw new TourBrowserError('RESPONSE_UNREADABLE', 'The server returned an unreadable response. Please try again.'); }
  if (!response.ok) throw new TourBrowserError('REQUEST_FAILED', typeof data?.message === 'string' && data.message.length <= 500 ? data.message : 'This request could not be completed. Please try again.');
  return data;
}
export function RepositoryForm({ configured }: { configured: boolean }) {
  const [input, setInput] = useState(""); const [busy,setBusy] = useState(false); const [message,setMessage] = useState("");
  const [feedback,setFeedback] = useState<'notice'|'error'>('notice');
  const [snapshot,setSnapshot] = useState<{repository:{owner:string;name:string;commit:string};files:{path:string}[];totalBytes:number;omitted:number}|null>(null);
  const fileInput = useRef<HTMLInputElement>(null); const router = useRouter();
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMessage(""); setSnapshot(null);
    try {
      const response = await fetch('/api/import', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({repository:input})});
      const data = await readResponse(response);
      setSnapshot(data.snapshot);
      if (data.document) { saveLocalTour(data.document); router.push('/local'); }
      else {setFeedback('notice'); setMessage(data.message);}
    } catch (error) { setFeedback('error'); setMessage(error instanceof TourBrowserError ? error.message : 'Could not reach RepoPlay. Check that the local server is running and try again.'); }
    finally {setBusy(false);}
  }
  async function importFile(file?: File) {
    if (!file) return;
    setBusy(true); setMessage(""); setSnapshot(null);
    try {
      if (file.size>1000000) throw new TourBrowserError('TOUR_TOO_LARGE','Tour JSON must be smaller than 1 MB.');
      let json;
      try {json=JSON.parse(await file.text());} catch {throw new TourBrowserError('INVALID_JSON','This file is not valid JSON. Choose a Tour JSON exported by RepoPlay and try again.');}
      const response=await fetch('/api/tour/validate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(json)});
      const data=await readResponse(response);
      saveLocalTour(data.document); router.push('/local');
    } catch(error) {setFeedback('error'); setMessage(error instanceof TourBrowserError?error.message:'Could not import this Tour JSON. Check that the local server is running and try again.');} finally {setBusy(false); if (fileInput.current) fileInput.current.value='';}
  }
  return <div className="repository-entry"><form onSubmit={submit} aria-busy={busy}><label htmlFor="repository" className="sr-only">GitHub repository URL or owner/repo</label><Icon name="github" size={21}/><input id="repository" value={input} disabled={busy} onChange={e=>{setInput(e.target.value);setMessage('');setSnapshot(null);}} placeholder="github.com/owner/repository" required maxLength={200} autoComplete="off" spellCheck={false}/><button type="submit" className="button primary" disabled={busy}>{busy?'Working…':'Explore repo'}<Icon name="arrow" size={17}/></button></form><div className="entry-caption"><span>Public repositories only.{!configured && ' New tour generation is not configured.'}</span><button onClick={()=>fileInput.current?.click()} disabled={busy}>Import Tour JSON <Icon name="file" size={13}/></button><input ref={fileInput} type="file" accept=".json,application/json" hidden onChange={e=>importFile(e.target.files?.[0])}/></div>
    {message && <div className={`import-message ${feedback==='error'?'import-error':''}`} role={feedback==='error'?'alert':'status'}>{message}{snapshot && <div className="snapshot-summary"><strong>{snapshot.repository.owner}/{snapshot.repository.name}</strong><span>Commit {snapshot.repository.commit.slice(0,7)} · {snapshot.files.length} text files · {Math.ceil(snapshot.totalBytes/1024)} KB read · {snapshot.omitted} entries omitted</span><details><summary>Included files</summary><ul>{snapshot.files.map(f=><li key={f.path}><code>{f.path}</code></li>)}</ul></details></div>}<Link className="import-recovery" href="/tour/scan-to-report">Try the built-in tour <Icon name="arrow" size={14}/></Link></div>}
  </div>;
}
