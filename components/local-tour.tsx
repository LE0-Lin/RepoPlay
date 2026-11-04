"use client";
import { useEffect,useState } from "react";
import Link from "next/link";
import type { TourDocument } from "@/lib/tour";
import { restoreLocalTour, TourBrowserError } from "@/lib/browser-tour";
import { TourPlayer } from "./tour-player";
export function LocalTour() {
  const [doc,setDoc]=useState<TourDocument|null>(null); const [error,setError]=useState("");
  useEffect(()=>{try {setDoc(restoreLocalTour());}catch(e){setError(e instanceof TourBrowserError?e.message:'Could not restore this local tour. Import its JSON again from the homepage.');}},[]);
  if (error) return <main className="empty-state"><h1>Open a local tour.</h1><p role="alert">{error}</p><Link className="button primary" href="/">Back to RepoPlay</Link></main>;
  if (!doc) return <main className="empty-state" role="status">Opening your local tour…</main>;
  return <TourPlayer document={doc} local/>;
}
