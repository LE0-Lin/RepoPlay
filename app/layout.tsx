import type { Metadata } from "next";
import { Header } from "@/components/header";
import "./globals.css";
export const metadata: Metadata = { title: { default: "RepoPlay — Follow the feature", template: "%s · RepoPlay" }, description: "Understand a codebase, one step at a time. Interactive feature tours with real, pinned source code." };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="en" data-scroll-behavior="smooth"><body><a href="#main" className="skip-link">Skip to content</a><Header/><div id="main">{children}</div></body></html>; }
