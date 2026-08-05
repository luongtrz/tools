import type { ChangeEvent, KeyboardEvent } from "react";
import { useI18n } from "../i18n";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function MarkdownEditor({
  value,
  onChange,
}: MarkdownEditorProps) {
  const { t } = useI18n();
  const lines = Math.max(1, value.split("\n").length);
  const words = value.trim() ? value.trim().split(/\s+/).length : 0;

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Tab") return;
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
    <section className="flex min-w-0 flex-col">
      <div className="flex h-14 items-center justify-between border-b border-slate-100 px-4 dark:border-slate-800 sm:px-6">
        <div className="flex items-center gap-2.5 font-mono text-xs font-medium tracking-[1px] text-slate-500 dark:text-slate-400">
          <span className="text-[#f2633d]">01</span>
          <span>{t("markdownPane")}</span>
        </div>
        <span className="hidden font-mono text-xs text-slate-400 dark:text-slate-500 sm:inline">
          <kbd className="mr-1 inline-grid min-w-5 place-items-center rounded border border-slate-200 bg-slate-100 px-1 py-0.5 text-[10px] dark:border-slate-700 dark:bg-slate-800">⌘</kbd>
          <kbd className="mr-1 inline-grid min-w-5 place-items-center rounded border border-slate-200 bg-slate-100 px-1 py-0.5 text-[10px] dark:border-slate-700 dark:bg-slate-800">↵</kbd> {t("previewPane")}
        </span>
      </div>
      <div className="flex min-h-[420px] flex-1 bg-[#fbfcfd] dark:bg-slate-950">
        <div className="w-12 shrink-0 border-r border-slate-100 px-3 pt-6 text-right font-mono text-sm leading-7 text-slate-300 select-none dark:border-slate-800 dark:text-slate-700" aria-hidden="true">
          {Array.from({ length: lines }, (_, index) => index + 1).join("\n")}
        </div>
        <textarea
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          aria-label={t("markdownInput")}
          className="min-h-[420px] w-full resize-none border-0 bg-transparent px-4 py-6 font-mono text-[15px] leading-7 text-slate-700 outline-none selection:bg-orange-100 dark:text-slate-200 dark:selection:bg-orange-950/60 sm:px-6"
        />
      </div>
      <div className="flex min-h-11 items-center justify-between border-t border-slate-100 px-4 font-mono text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500 sm:px-6">
        <span>
          {words} {words === 1 ? t("word") : t("words")}
        </span>
        <span>{value.length} {t("characters")}</span>
      </div>
    </section>
  );
}
