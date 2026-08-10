import { localizedTool, useI18n } from "@/i18n";
import { getToolSeoContent } from "@/lib/seoContent";
import { getTool } from "@/toolRegistry";

export default function ToolSeoContent({ slug }: { slug: string }) {
  const { language } = useI18n();
  const tool = getTool(slug);
  if (!tool) return null;

  const content = getToolSeoContent(tool, language);
  const isVi = language === "vi";
  const relatedTools = content.relatedSlugs
    .map((relatedSlug) => getTool(relatedSlug))
    .filter((relatedTool) => relatedTool !== undefined);

  return (
    <section
      className="mt-12 border-t border-border/80 pt-10"
      aria-labelledby="tool-guide-heading"
    >
      <div className="max-w-3xl">
        <h2
          id="tool-guide-heading"
          className="font-display text-2xl font-semibold tracking-tight"
        >
          {isVi ? `Cách dùng ${content.h1}` : `How to use ${content.h1}`}
        </h2>
        <p className="mt-3 text-base leading-7 text-muted-foreground">
          {content.intro}
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div>
          <h3 className="font-display text-lg font-semibold">
            {isVi ? "Các bước thực hiện" : "Steps"}
          </h3>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
            {content.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
        <div>
          <h3 className="font-display text-lg font-semibold">
            {isVi ? "Điểm nổi bật" : "Key features"}
          </h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
            {content.benefits.map((benefit) => (
              <li key={benefit}>{benefit}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-8 max-w-3xl">
        <h3 className="font-display text-lg font-semibold">
          {isVi ? "Lưu ý" : "Good to know"}
        </h3>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {content.limitation}
        </p>
      </div>

      {relatedTools.length > 0 && (
        <nav
          className="mt-8 border-t border-border/60 pt-6"
          aria-label={isVi ? "Công cụ liên quan" : "Related tools"}
        >
          <h3 className="font-display text-lg font-semibold">
            {isVi ? "Công cụ liên quan" : "Related tools"}
          </h3>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {relatedTools.map((relatedTool) => (
              <a
                key={relatedTool.slug}
                href={`/${relatedTool.slug}/`}
                className="text-primary underline-offset-4 hover:underline"
              >
                {localizedTool(relatedTool, language).title}
              </a>
            ))}
          </div>
        </nav>
      )}
    </section>
  );
}
