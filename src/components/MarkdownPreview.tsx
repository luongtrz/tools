import { useI18n } from "../i18n";

interface MarkdownPreviewProps {
  html: string;
  zoom: number;
  pageCount: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export default function MarkdownPreview({
  html,
  zoom,
  pageCount,
  onZoomIn,
  onZoomOut,
}: MarkdownPreviewProps) {
  const { t } = useI18n();
  return (
    <section className="flex min-w-0 flex-col border-t border-slate-200 dark:border-slate-800 lg:border-l lg:border-t-0">
      <div className="flex h-14 items-center justify-between border-b border-slate-100 px-4 dark:border-slate-800 sm:px-6">
        <div className="flex items-center gap-2.5 font-mono text-xs font-medium tracking-[1px] text-slate-500 dark:text-slate-400">
          <span className="text-[#f2633d]">02</span>
          <span>{t("livePreview")}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="min-w-10 text-center font-mono text-xs text-slate-400 dark:text-slate-500">{Math.round(zoom * 100)}%</span>
          <button
            className="grid size-8 place-items-center rounded-lg border border-slate-200 bg-slate-50 text-lg text-slate-500 hover:border-orange-200 hover:text-[#f2633d] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-orange-700"
            type="button"
            onClick={onZoomOut}
            aria-label={t("zoomOut")}
          >
            −
          </button>
          <button
            className="grid size-8 place-items-center rounded-lg border border-slate-200 bg-slate-50 text-lg text-slate-500 hover:border-orange-200 hover:text-[#f2633d] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-orange-700"
            type="button"
            onClick={onZoomIn}
            aria-label={t("zoomIn")}
          >
            +
          </button>
        </div>
      </div>
      <div className="flex min-h-[420px] flex-1 justify-center overflow-auto bg-slate-100 p-5 dark:bg-slate-950 dark:[&>article]:bg-slate-900 dark:[&>article]:text-slate-300 dark:[&>article_h1]:text-slate-100 dark:[&>article_h2]:text-slate-100 dark:[&>article_h3]:text-slate-100 sm:p-7">
        <article
          className="w-full max-w-[480px] self-start bg-white p-7 text-slate-600 shadow-[0_4px_15px_rgba(27,42,66,.08)] transition-transform sm:p-10 [&_h1]:mb-5 [&_h1]:font-display [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:leading-tight [&_h1]:text-[#172235] [&_h2]:mb-3 [&_h2]:mt-7 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-[#172235] [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:font-display [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-[#172235] [&_p]:mb-4 [&_p]:text-sm [&_p]:leading-7 [&_a]:text-[#d95132] [&_blockquote]:my-5 [&_blockquote]:border-l-2 [&_blockquote]:border-orange-200 [&_blockquote]:pl-4 [&_blockquote]:text-sm [&_blockquote]:italic [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:text-sm [&_ul]:leading-7 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:text-sm [&_ol]:leading-7 [&_code]:rounded [&_code]:bg-orange-50 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs [&_code]:text-[#be4e32] [&_pre]:my-5 [&_pre]:overflow-auto [&_pre]:rounded-lg [&_pre]:bg-[#172235] [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-xs [&_pre]:leading-6 [&_pre]:text-slate-100"
          style={{ transform: `scale(${zoom})` }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
      <div className="flex min-h-11 items-center justify-between border-t border-slate-100 px-4 font-mono text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500 sm:px-6">
          <span>
          <span className="mr-1.5 inline-block size-2 rounded-full bg-emerald-400 align-[1px]" /> {t("realtimeUpdate")}
        </span>
        <span>
          {pageCount} {pageCount === 1 ? t("page") : t("pages")}
        </span>
      </div>
    </section>
  );
}
