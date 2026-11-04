export function CodeLine({ text }: { text: string }) {
  const tokens = text.split(/(#[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b(?:def|class|return|if|else|elif|for|in|from|import|try|except|not|and|or|None|True|False|with|as|continue|raise)\b|\b\d+\b)/g);
  return <>{tokens.map((t, i) => {
    const cls = t.startsWith('#') ? 'syntax-comment' : /^['"]/.test(t) ? 'syntax-string' : /^\d+$/.test(t) ? 'syntax-number' : /^(def|class|return|if|else|elif|for|in|from|import|try|except|not|and|or|None|True|False|with|as|continue|raise)$/.test(t) ? 'syntax-keyword' : '';
    return <span key={i} className={cls}>{t}</span>;
  })}</>;
}
