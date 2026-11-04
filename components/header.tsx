import Link from "next/link";
import { Icon } from "./icons";
export function Header() {
  const configured = process.env.NEXT_PUBLIC_REPOPLAY_REPOSITORY;
  const repository = configured && /^https:\/\/github\.com\/[\w-]+\/[\w.-]+\/?$/.test(configured) ? configured : null;
  return <header className="site-header"><Link href="/" className="brand" aria-label="RepoPlay home"><span className="brand-mark"><Icon name="play" size={17}/></span>RepoPlay<span className="version">v0.1</span></Link><nav aria-label="Main navigation"><Link href="/#tours">Tour library</Link>{repository && <a href={repository} target="_blank" rel="noreferrer"><Icon name="star" size={15}/>Star on GitHub</a>}<span className="nav-note">Follow the feature.</span></nav></header>;
}
