import type { CSSProperties } from "react";
export function Icon({ name, size = 18, style }: { name: string; size?: number; style?: CSSProperties }) {
  const paths: Record<string, React.ReactNode> = {
    arrow: <path d="M4 12h15m-6-6 6 6-6 6" />,
    back: <path d="m14 6-6 6 6 6" />,
    next: <path d="m10 6 6 6-6 6" />,
    link: <><path d="m10 13 4-4M8 16l-1 1a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0m2 1 1-1a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0" /></>,
    code: <path d="m8 7-5 5 5 5m8-10 5 5-5 5m-3-13-2 16" />,
    external: <path d="M14 3h7v7m0-7L10 14M10 3H4v17h17v-6" />,
    check: <path d="m5 12 4 4L19 6" />,
    file: <path d="M13 3H5v18h14V9l-6-6v6h6M8 13h8m-8 4h6" />,
    download: <path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" />,
    star: <path d="m12 3 3 6 6 1-4.5 4.5 1 6.5-5.5-3-5.5 3 1-6.5L3 10l6-1z" />,
    github: <><path d="M9 20c-4 1-4-2-6-2m12 4v-4c0-1 .4-2 1-2 4-.5 5-2 5-5 0-2-1-3-2-4 0-1 0-2-.5-3-2 0-3 1-4 1-2-.5-4-.5-6 0-1 0-2-1-4-1-.5 1-.5 2-.5 3-1 1-2 2-2 4 0 3 1 4.5 5 5 .6 0 1 1 1 2v4" /></>,
    play: <path d="m8 5 11 7-11 7z" />,
    terminal: <path d="m4 6 6 6-6 6m8 0h8" />
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden="true">{paths[name] ?? paths.code}</svg>;
}
