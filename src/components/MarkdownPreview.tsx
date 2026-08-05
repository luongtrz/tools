import { useI18n } from "../i18n";
import { ToolNotice } from "./ToolUI";

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
            className="grid size-8 place-items-center rounded-lg border border-slate-200 bg-slate-50 text-lg text-slate-500 hover:border-orange-200 hover:text-[#f2633d] disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-orange-700"
            type="button"
            onClick={onZoomOut}
            disabled={zoom <= 0.8}
            aria-label={t("zoomOut")}
          >
            −
          </button>
          <button
            className="grid size-8 place-items-center rounded-lg border border-slate-200 bg-slate-50 text-lg text-slate-500 hover:border-orange-200 hover:text-[#f2633d] disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-orange-700"
            type="button"
            onClick={onZoomIn}
            disabled={zoom >= 1.2}
            aria-label={t("zoomIn")}
          >
            +
          </button>
        </div>
      </div>
      <div className="flex min-h-[420px] flex-1 justify-center overflow-auto bg-slate-100 p-5 dark:bg-slate-950 dark:[&>article]:bg-slate-900 dark:[&>article]:text-slate-300 dark:[&>article_h1]:text-slate-100 dark:[&>article_h2]:text-slate-100 dark:[&>article_h3]:text-slate-100 sm:p-7">
        {html ? (
          <article
            className="w-full max-w-[480px] origin-top self-start bg-white p-7 text-slate-600 shadow-[0_4px_15px_rgba(27,42,66,.08)] transition-transform sm:p-10 [&_h1]:mb-5 [&_h1]:font-display [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:leading-tight [&_h1]:text-[#172235] [&_h2]:mb-3 [&_h2]:mt-7 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-[#172235] [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:font-display [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-[#172235] [&_h4]:mb-2 [&_h4]:mt-5 [&_h4]:font-display [&_h4]:text-base [&_h4]:font-bold [&_h4]:text-[#172235] [&_h5]:mb-2 [&_h5]:mt-4 [&_h5]:font-display [&_h5]:font-bold [&_h5]:text-[#172235] [&_h6]:mb-2 [&_h6]:mt-4 [&_h6]:font-display [&_h6]:text-sm [&_h6]:font-bold [&_h6]:text-[#172235] [&_p]:mb-4 [&_p]:text-sm [&_p]:leading-7 [&_a]:text-[#d95132] [&_blockquote]:my-5 [&_blockquote]:border-l-2 [&_blockquote]:border-orange-200 [&_blockquote]:pl-4 [&_blockquote]:text-sm [&_blockquote]:italic [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:text-sm [&_ul]:leading-7 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:text-sm [&_ol]:leading-7 [&_.contains-task-list]:list-none [&_.contains-task-list]:pl-0 [&_.task-list-item]:list-none [&_.task-list-item]:pl-0 [&_.task-list-item-checkbox]:mr-2 [&_.task-list-item-checkbox]:align-middle [&_table]:my-5 [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-slate-200 [&_th]:bg-slate-50 [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_th]:font-semibold [&_td]:border [&_td]:border-slate-200 [&_td]:px-2 [&_td]:py-1 dark:[&_th]:border-slate-700 dark:[&_th]:bg-slate-800 dark:[&_td]:border-slate-700 [&_code]:rounded [&_code]:bg-orange-50 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs [&_code]:text-[#be4e32] [&_pre]:my-5 [&_pre]:overflow-auto [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-slate-200 [&_pre]:bg-[#f4f6f8] [&_pre]:p-4 [&_pre]:font-mono [&_pre]:leading-6 [&_pre]:text-[#263449]"
            style={{ transform: `scale(${zoom})` }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <div className="w-full max-w-[480px] self-start">
            <ToolNotice>{t("emptyMarkdown")}</ToolNotice>
          </div>
        )}
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
