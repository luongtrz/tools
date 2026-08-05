import type { ChangeEvent, KeyboardEvent } from 'react';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const lines = Math.max(1, value.split('\n').length);
  const words = value.trim() ? value.trim().split(/\s+/).length : 0;

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== 'Tab') return;
    event.preventDefault();
    const target = event.currentTarget;
    const start = target.selectionStart;
    const nextValue = `${value.slice(0, start)}  ${value.slice(target.selectionEnd)}`;
    onChange(nextValue);
    requestAnimationFrame(() => target.setSelectionRange(start + 2, start + 2));
  }

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    onChange(event.target.value);
  }

  return (
    <section className="editor-pane">
      <div className="pane-heading"><div className="pane-title"><span className="pane-number">01</span><span>MARKDOWN</span></div><span className="keyboard-hint"><kbd>⌘</kbd><kbd>↵</kbd> Preview</span></div>
      <div className="editor-wrap">
        <div className="line-numbers" aria-hidden="true">{Array.from({ length: lines }, (_, index) => index + 1).join('\n')}</div>
        <textarea value={value} onChange={handleChange} onKeyDown={handleKeyDown} spellCheck={false} aria-label="Markdown input" />
      </div>
      <div className="pane-footer"><span>{words} {words === 1 ? 'word' : 'words'}</span><span>{value.length} characters</span></div>
    </section>
  );
}
