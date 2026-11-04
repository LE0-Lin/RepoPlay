import { notFound } from "next/navigation";
import { getSample, samples } from "@/lib/samples";
import { TourPlayer } from "@/components/tour-player";
export function generateStaticParams() { return samples.map(s => ({ id: s.tour.id })); }
export async function generateMetadata({ params }: { params: Promise<{id:string}> }) { const s = getSample((await params).id); return { title: s?.tour.title ?? "Tour not found" }; }
export default async function TourPage({ params, searchParams }: { params: Promise<{id:string}>; searchParams: Promise<{step?:string}> }) {
  const sample = getSample((await params).id); if (!sample) notFound();
  const suggestions=samples.filter(s=>s.tour.id!==sample.tour.id).map(({tour})=>({id:tour.id,title:tour.title,summary:tour.summary}));
  return <TourPlayer key={sample.tour.id} document={sample} initialStep={(await searchParams).step} suggestions={suggestions}/>;
}
