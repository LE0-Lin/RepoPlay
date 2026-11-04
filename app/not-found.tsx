import Link from "next/link";
export default function NotFound() { return <main className="empty-state"><div className="eyebrow">TOUR NOT FOUND</div><h1>This path ends here.</h1><p>Choose a source-checked guide from the tour library.</p><Link className="button primary" href="/#tours">Explore tours →</Link></main>; }
