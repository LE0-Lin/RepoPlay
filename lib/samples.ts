import raw from "@/data/scan-to-report.json";
import rules from "@/data/rule-lookup.json";
import exception from "@/data/auditable-exception.json";
import files from "@/data/sources.json";
import { parseDocument, type TourDocument } from "./tour";

export const samples: TourDocument[] = [raw, rules, exception].map(tour => parseDocument({tour, files}));
export function getSample(id: string) { return samples.find(s => s.tour.id === id); }
