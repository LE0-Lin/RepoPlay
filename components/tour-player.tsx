"use client";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { sourceUrl, type Tour, type TourDocument } from "@/lib/tour";
import { Icon } from "./icons";
import { CodeLine } from "./code";
const sections = [["path", "Path"], ["story", "Step"], ["code", "Source"]] as const;
type Section = typeof sections[number][0];

export function TourPlayer({ document, initialStep = "", local = false, suggestions = [] }: { document: TourDocument; initialStep?: string; local?: boolean; suggestions?: Pick<Tour, 'id' | 'title' | 'summary'>[] }) {
  const { tour } = document;
  const findStep = (id: string) => Math.max(0, tour.steps.findIndex(s => s.id === id));
  const [index, setIndex] = useState(findStep(initialStep));
  const [tab, setTab] = useState<Section>("story");
  const [mobile, setMobile] = useState(false);
  const codeScroll = useRef<HTMLDivElement>(null);
  const focusStep = useRef(false);
  const [refIndex, setRefIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [branch, setBranch] = useState(0);
  const [toast, setToast] = useState("");
  const [manualLink, setManualLink] = useState("");
  const current = tour.steps[index];
  const reference = current.references[refIndex] ?? current.references[0];
  const lines = reference.quote.split("\n");
  const output = current.branches?.[branch]?.output ?? current.output;
  useEffect(() => {
    const query = window.matchMedia("(max-width: 760px)");
    const update = () => setMobile(query.matches);
    update(); query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  useEffect(() => { if (codeScroll.current) { codeScroll.current.scrollLeft = 0; codeScroll.current.scrollTop = 0; } }, [index, refIndex]);
  useEffect(() => {
    if (!focusStep.current || !mobile || tab !== "story") return;
    focusStep.current = false;
    const panel = window.document.getElementById('panel-story');
    panel?.focus({ preventScroll: true });
    panel?.scrollIntoView({ block:'start', behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth' });
  }, [index, mobile, tab]);
  useEffect(() => {
    const restore = () => { setIndex(findStep(new URLSearchParams(location.search).get("step") ?? "")); setRefIndex(0); setExpanded(false); setBranch(0); setTab("story"); setManualLink(""); };
    restore(); window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
    // The tour is immutable for the lifetime of this player.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tour.id]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(""), 3500); return () => clearTimeout(timer); }, [toast]);
  function go(next: number) {
    const n = Math.max(0, Math.min(tour.steps.length - 1, next));
    focusStep.current = mobile;
    setIndex(n); setRefIndex(0); setExpanded(false); setBranch(0); setTab("story");
    const url = new URL(location.href); url.searchParams.set("step", tour.steps[n].id);
    history.pushState(null, "", url); setManualLink("");
  }
  function tabKey(event: KeyboardEvent<HTMLButtonElement>, id: Section) {
    const position = sections.findIndex(([section]) => section === id);
    const next = event.key === "ArrowRight" ? (position + 1) % sections.length : event.key === "ArrowLeft" ? (position + sections.length - 1) % sections.length : event.key === "Home" ? 0 : event.key === "End" ? sections.length - 1 : -1;
    if (next < 0) return;
    event.preventDefault(); const section = sections[next][0]; setTab(section);
    window.document.getElementById(`tab-${section}`)?.focus();
  }
  const panelAttributes = (id: Section) => mobile ? { role: "tabpanel" as const, "aria-labelledby": `tab-${id}`, tabIndex: 0 } : {};
  async function copy(step: boolean) {
    const url = new URL(location.href); url.search = ""; if (step) url.searchParams.set("step", current.id);
    setManualLink(url.toString());
    try { await navigator.clipboard.writeText(url.toString()); setToast(step ? "Step link copied" : "Tour link copied"); }
    catch { setManualLink(url.toString()); setToast("Select and copy the link below"); }
  }
  function download() {
    // A real attachment response also works in embedded browsers that restrict blob URLs.
    if (!local) { const a=window.document.createElement('a'); a.href=`/api/tour/export?id=${encodeURIComponent(tour.id)}`; a.download=`${tour.id}.tour.json`; window.document.body.appendChild(a); a.click(); a.remove(); return; }
    const form=window.document.createElement('form'); form.method='POST'; form.action='/api/tour/export';
    const field=window.document.createElement('input'); field.type='hidden';field.name='document';field.value=JSON.stringify(document);
    form.appendChild(field);window.document.body.appendChild(form);form.submit();form.remove();
  }
  return <main className="tour-page">
    <div className="tour-breadcrumb"><Link href="/#tours">Tour library</Link><span>/</span><span>{tour.repository.owner} / {tour.repository.name}</span></div>
    <section className="tour-heading"><div><div className="eyebrow"><span className="status-dot"/>{local ? "LOCAL TOUR · THIS BROWSER TAB" : "PRE-GENERATED · SOURCE-CHECKED"}</div><h1>{tour.title}</h1><p>{tour.summary}</p></div><div className="tour-actions">{!local && <><button className="button quiet" onClick={() => copy(false)}><Icon name="link"/>Copy tour link</button><button className="button quiet" onClick={() => copy(true)}><Icon name="link"/>Copy step link</button></>}<button className="button quiet" onClick={download} title="Export tour and source snapshot"><Icon name="download"/>Export JSON</button></div></section>
    {local && <div className="notice">This tour is stored in this browser tab. Export its JSON for someone else to import. Source locations match the included snapshot; upstream provenance and explanations need review.</div>}
    {manualLink && <div className="share-result"><span>Share this link</span><input className="manual-link" aria-label="Share link" value={manualLink} readOnly onFocus={e=>e.target.select()}/><button aria-label="Close share link" onClick={()=>setManualLink("")}>×</button></div>}
    <div className="workspace-meta"><span><Icon name="terminal" size={15}/><code>{tour.feature}</code></span><a href={`https://github.com/${tour.repository.owner}/${tour.repository.name}/commit/${tour.repository.commit}`} target="_blank" rel="noreferrer">Pinned at <code>{tour.repository.commit.slice(0,7)}</code><Icon name="external" size={13}/></a></div>
    <div className="mobile-tabs" role="tablist" aria-label="Tour sections">{sections.map(([id,label])=><button key={id} id={`tab-${id}`} role="tab" aria-selected={tab===id} aria-controls={`panel-${id}`} tabIndex={tab===id?0:-1} onClick={()=>setTab(id)} onKeyDown={event=>tabKey(event,id)}>{label}</button>)}</div>
    <div className={`tour-workspace view-${tab}`}>
      <aside className="path-panel" id="panel-path" aria-label={mobile?undefined:"Feature path"} {...panelAttributes("path")}><div className="panel-label">FEATURE PATH <span>{tour.steps.length} steps</span></div><ol className="path-list">{tour.steps.map((s,i)=><li key={s.id} className={`${i===index?'current':''} ${i<index?'visited':''}`} data-step={s.id}><button onClick={()=>go(i)} aria-current={i===index?"step":undefined}><span className="step-node">{i<index?<Icon name="check" size={14}/>:String(i+1).padStart(2,"0")}</span><span><strong>{s.label}</strong><small>{s.title}</small></span>{i===index && <span className="active-marker"/>}</button>{i<tour.steps.length-1 && <span className="path-edge" data-connection={`${s.id}:${tour.steps[i+1].id}`} aria-hidden="true"/>}</li>)}</ol><div className="path-note"><span className="status-dot"/>One feature. Real source.<br/><span>Explore at your own pace.</span></div></aside>
      <section className="story-panel" id="panel-story" aria-label={mobile?undefined:"Current step"} {...panelAttributes("story")}><div className="panel-label">WHAT HAPPENS <span className="step-count">{String(index+1).padStart(2,"0")} / {String(tour.steps.length).padStart(2,"0")}</span></div><div key={current.id} className="step-content"><div className="step-kicker">STEP {String(index+1).padStart(2,"0")} <span>→ {current.label}</span></div><h2>{current.title}</h2><p className="explanation">{current.explanation}</p>
        <div className="state-heading"><Icon name="code" size={15}/><span>STATE & DATA FLOW</span><span className="illustrative-tag">Illustrative</span></div>
        <div className="state-flow"><div className="state-block input-state"><span className="state-type">IN</span><div><span>{current.input.label}</span><pre>{current.input.value}</pre></div></div><div className="flow-handoff" aria-hidden="true"><span/>↓<small>{current.label}</small></div><div className="state-block output-state"><span className="state-type">OUT</span><div><span>{output.label}</span><pre>{output.value}</pre></div></div></div>
        {current.branches && <div className="branch-control"><span>Compare output paths</span><div>{current.branches.map((b,i)=><button key={b.id} aria-pressed={i===branch} onClick={()=>setBranch(i)}>{b.label}</button>)}</div><p>{current.branches[branch].explanation}</p><a target="_blank" rel="noreferrer" href={sourceUrl(tour,current.branches[branch].reference)}>Branch source <Icon name="external" size={12}/></a></div>}
        <div className="insight"><span>THE DETAIL THAT MATTERS</span><p>{current.insight}</p></div><div className="transition-note"><Icon name="arrow" size={16}/><p>{current.transition}</p></div>
      </div></section>
      <section className="code-panel" id="panel-code" aria-label={mobile?undefined:"Source code"} {...panelAttributes("code")}><div className="panel-label">SOURCE <span><span className="status-dot"/>{local?'Snapshot matched':'Reference checked'}</span></div><div className="code-file"><Icon name="file" size={16}/><span title={reference.path}>{reference.path.split('/').at(-1)}</span><span className="language">{tour.language}</span></div><div className="code-location">{reference.path}<br/><span>Lines {reference.startLine}–{reference.endLine} · {tour.repository.commit.slice(0,7)}</span></div>
        {current.references.length>1 && <div className="source-tabs" aria-label="Source references">{current.references.map((r,i)=><button key={i} aria-pressed={refIndex===i} onClick={()=>{setRefIndex(i);setExpanded(false);}}>{r.path.split('/').at(-1)} <span>L{r.startLine}</span></button>)}</div>}
        <div className="code-scroll" ref={codeScroll} tabIndex={0} aria-label="Scrollable code excerpt"><pre className="source-code">{lines.slice(0,expanded?undefined:9).map((line,i)=><div className="code-line" key={`${current.id}-${refIndex}-${i}`}><span className="line-number">{reference.startLine+i}</span><code><CodeLine text={line}/></code></div>)}</pre></div>
        {lines.length>9 && <button className="expand-source" aria-expanded={expanded} onClick={()=>setExpanded(!expanded)}><Icon name="code" size={15}/>{expanded?'Collapse source':`Expand source · ${lines.length} lines`}<span>{expanded?'−':'+'}</span></button>}
        <a className="github-source" href={sourceUrl(tour,reference)} target="_blank" rel="noreferrer"><Icon name="github" size={17}/>Open pinned source on GitHub<Icon name="external" size={14}/></a>
        <div className="source-note">{local ? 'This excerpt matches the included source snapshot. Upstream provenance has not been independently verified.' : 'This excerpt matches the pinned source snapshot. Source locations support the guide; they do not prove every explanation correct.'}</div>
      </section>
    </div>
    <div className="player-controls"><button className="button quiet" disabled={index===0} onClick={()=>go(index-1)}><Icon name="back"/>Previous</button><div className="progress-track" aria-label={`Step ${index+1} of ${tour.steps.length}`}>{tour.steps.map((s,i)=><button key={s.id} aria-label={`Go to step ${i+1}: ${s.label}`} className={i<=index?'filled':''} onClick={()=>go(i)}/>)}</div><button className="button primary" disabled={index===tour.steps.length-1} onClick={()=>go(index+1)}>Next step<Icon name="arrow"/></button></div>
    {index===tour.steps.length-1 && <section className="tour-ending" aria-labelledby="tour-ending-title"><div className="ending-heading"><div><div className="eyebrow">END OF THIS PATH</div><h2 id="tour-ending-title">Follow another feature.</h2></div><Link href="/#tours">Browse tour library <Icon name="arrow" size={16}/></Link></div>{suggestions.length>0 && <div className="ending-list">{suggestions.map(s=><Link key={s.id} href={`/tour/${s.id}`}><div><h3>{s.title}</h3><p>{s.summary}</p></div><Icon name="arrow" size={19}/></Link>)}</div>}</section>}
    <footer className="tour-footer"><p>{tour.provenance.note}</p><div><a href={`https://github.com/${tour.repository.owner}/${tour.repository.name}`} target="_blank" rel="noreferrer">Source repository <Icon name="external" size={12}/></a><span>{tour.repository.license}</span>{!local && <a href="/notices/AgentConfigScore-LICENSE.txt" target="_blank" rel="noreferrer">License notice</a>}</div><span>State examples are schematic. No execution trace was recorded.</span></footer>
    <div className={`toast ${toast?'visible':''}`} role="status">{toast && <><Icon name="check" size={16}/>{toast}</>}</div>
  </main>;
}
