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
    <section className="flex min-w-0 flex-col border-t border-border dark:border-border lg:border-l lg:border-t-0">
      <div className="flex h-14 items-center justify-between border-b border-border px-4 dark:border-border sm:px-6">
        <div className="flex items-center gap-2.5 font-mono text-xs font-medium tracking-[1px] text-muted-foreground ">
          <span className="text-primary">02</span>
          <span>{t("livePreview")}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="min-w-10 text-center font-mono text-xs text-muted-foreground ">{Math.round(zoom * 100)}%</span>
          <button
            className="grid size-8 place-items-center rounded-lg border border-border bg-muted/30 text-lg text-muted-foreground hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 dark:border-border dark:bg-card  dark:hover:border-primary/40"
            type="button"
            onClick={onZoomOut}
            disabled={zoom <= 0.8}
            aria-label={t("zoomOut")}
          >
            −
          </button>
          <button
            className="grid size-8 place-items-center rounded-lg border border-border bg-muted/30 text-lg text-muted-foreground hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 dark:border-border dark:bg-card  dark:hover:border-primary/40"
            type="button"
            onClick={onZoomIn}
            disabled={zoom >= 1.2}
            aria-label={t("zoomIn")}
          >
            +
          </button>
        </div>
      </div>
      <div className="flex min-h-[320px] flex-1 justify-center overflow-auto bg-muted/50 p-5 dark:bg-muted/30 dark:[&>article]:bg-card dark:[&>article]:text-foreground dark:[&>article_h1]:text-foreground dark:[&>article_h2]:text-foreground dark:[&>article_h3]:text-foreground sm:min-h-[420px] sm:p-7">
        {html ? (
          <article
            className="w-full max-w-[480px] origin-top self-start bg-background p-7 text-foreground shadow-[0_4px_15px_rgba(27,42,66,.08)] transition-transform sm:p-10 [&_h1]:mb-5 [&_h1]:font-display [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:leading-tight [&_h1]:text-foreground [&_h2]:mb-3 [&_h2]:mt-7 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-foreground [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:font-display [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-foreground [&_h4]:mb-2 [&_h4]:mt-5 [&_h4]:font-display [&_h4]:text-base [&_h4]:font-bold [&_h4]:text-foreground [&_h5]:mb-2 [&_h5]:mt-4 [&_h5]:font-display [&_h5]:font-bold [&_h5]:text-foreground [&_h6]:mb-2 [&_h6]:mt-4 [&_h6]:font-display [&_h6]:text-sm [&_h6]:font-bold [&_h6]:text-foreground [&_p]:mb-4 [&_p]:text-sm [&_p]:leading-7 [&_a]:text-primary [&_blockquote]:my-5 [&_blockquote]:border-l-2 [&_blockquote]:border-primary/40 [&_blockquote]:pl-4 [&_blockquote]:text-sm [&_blockquote]:italic [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:text-sm [&_ul]:leading-7 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:text-sm [&_ol]:leading-7 [&_.contains-task-list]:list-none [&_.contains-task-list]:pl-0 [&_.task-list-item]:list-none [&_.task-list-item]:pl-0 [&_.task-list-item-checkbox]:mr-2 [&_.task-list-item-checkbox]:align-middle [&_table]:my-5 [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-border [&_th]:bg-muted/30 [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_th]:font-semibold [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1 dark:[&_th]:border-border dark:[&_th]:bg-muted dark:[&_td]:border-border [&_code]:rounded [&_code]:bg-primary/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs [&_code]:text-primary [&_pre]:my-5 [&_pre]:overflow-auto [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-border [&_pre]:bg-muted/30 [&_pre]:p-4 [&_pre]:font-mono [&_pre]:leading-6 [&_pre]:text-foreground"
            style={{ transform: `scale(${zoom})` }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <div className="w-full max-w-[480px] self-start">
            <ToolNotice>{t("emptyMarkdown")}</ToolNotice>
          </div>
        )}
      </div>
      <div className="flex min-h-11 items-center justify-between border-t border-border px-4 font-mono text-xs text-muted-foreground dark:border-border  sm:px-6">
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
