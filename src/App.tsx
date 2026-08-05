import { lazy, Suspense, useEffect, type ReactElement } from "react";
import { getTool } from "./toolRegistry";
import { localizedTool, useI18n } from "./i18n";
import ToolHome from "./tools/ToolHome";

const Md2PdfTool = lazy(() => import("./tools/Md2PdfTool"));
const Md2WordTool = lazy(async () => ({
  default: (await import("./tools/DocumentTools")).Md2WordTool,
}));
const Md2PptxTool = lazy(async () => ({
  default: (await import("./tools/DocumentTools")).Md2PptxTool,
}));
const MergePdfTool = lazy(async () => ({
  default: (await import("./tools/DocumentTools")).MergePdfTool,
}));
const SplitPdfTool = lazy(async () => ({
  default: (await import("./tools/DocumentTools")).SplitPdfTool,
}));
const CompressPdfTool = lazy(async () => ({
  default: (await import("./tools/DocumentTools")).CompressPdfTool,
}));
const MarkdownEditorTool = lazy(async () => ({
  default: (await import("./tools/MarkdownTools")).MarkdownEditorTool,
}));
const MarkdownTableGeneratorTool = lazy(async () => ({
  default: (await import("./tools/MarkdownTools")).MarkdownTableGeneratorTool,
}));
const MarkdownTableFormatterTool = lazy(async () => ({
  default: (await import("./tools/MarkdownTools")).MarkdownTableFormatterTool,
}));
const MarkdownWordCounterTool = lazy(async () => ({
  default: (await import("./tools/MarkdownTools")).MarkdownWordCounterTool,
}));
const HtmlToMarkdownTool = lazy(async () => ({
  default: (await import("./tools/MarkdownTools")).HtmlToMarkdownTool,
}));
const JwtDecoderTool = lazy(async () => ({
  default: (await import("./tools/SecurityTools")).JwtDecoderTool,
}));
const JsonFormatterTool = lazy(async () => {
  const { JsonTool } = await import("./tools/DataTools");
  return { default: () => <JsonTool mode="format" /> };
});
const JsonValidatorTool = lazy(async () => {
  const { JsonTool } = await import("./tools/DataTools");
  return { default: () => <JsonTool mode="validate" /> };
});
const JsonDiffTool = lazy(async () => {
  const { JsonTool } = await import("./tools/DataTools");
  return { default: () => <JsonTool mode="diff" /> };
});
const YamlJsonTool = lazy(async () => ({
  default: (await import("./tools/DataTools")).YamlJsonTool,
}));
const CsvJsonTool = lazy(async () => ({
  default: (await import("./tools/DataTools")).CsvJsonTool,
}));
const TextDiffTool = lazy(async () => ({
  default: (await import("./tools/TextTools")).TextDiffTool,
}));
const RegexTesterTool = lazy(async () => ({
  default: (await import("./tools/TextTools")).RegexTesterTool,
}));
const Base64Tool = lazy(async () => ({
  default: (await import("./tools/TextTools")).Base64Tool,
}));
const CaseConverterTool = lazy(async () => ({
  default: (await import("./tools/TextTools")).CaseConverterTool,
}));
const SlugGeneratorTool = lazy(async () => ({
  default: (await import("./tools/TextTools")).SlugGeneratorTool,
}));
const UrlCodecTool = lazy(async () => ({
  default: (await import("./tools/SecurityTools")).UrlCodecTool,
}));
const QrGeneratorTool = lazy(async () => ({
  default: (await import("./tools/QuickTools")).QrGeneratorTool,
}));
const UuidGeneratorTool = lazy(async () => ({
  default: (await import("./tools/QuickTools")).UuidGeneratorTool,
}));
const PasswordGeneratorTool = lazy(async () => ({
  default: (await import("./tools/QuickTools")).PasswordGeneratorTool,
}));
const ColorPickerTool = lazy(async () => ({
  default: (await import("./tools/QuickTools")).ColorPickerTool,
}));
const McpTool = lazy(() => import("./tools/McpTool"));

const routeComponents: Record<string, () => ReactElement> = {
  md2pdf: () => <Md2PdfTool />,
  md2word: () => <Md2WordTool />,
  md2pptx: () => <Md2PptxTool />,
  "merge-pdf": () => <MergePdfTool />,
  "split-pdf": () => <SplitPdfTool />,
  "compress-pdf": () => <CompressPdfTool />,
  "markdown-editor": () => <MarkdownEditorTool />,
  "markdown-table-generator": () => <MarkdownTableGeneratorTool />,
  "markdown-table-formatter": () => <MarkdownTableFormatterTool />,
  "markdown-word-counter": () => <MarkdownWordCounterTool />,
  "html-to-markdown": () => <HtmlToMarkdownTool />,
  "jwt-decoder": () => <JwtDecoderTool />,
  "json-formatter": () => <JsonFormatterTool />,
  "json-validator": () => <JsonValidatorTool />,
  "json-diff": () => <JsonDiffTool />,
  "yaml-json": () => <YamlJsonTool />,
  "csv-json": () => <CsvJsonTool />,
  "text-diff": () => <TextDiffTool />,
  "regex-tester": () => <RegexTesterTool />,
  base64: () => <Base64Tool />,
  "case-converter": () => <CaseConverterTool />,
  "slug-generator": () => <SlugGeneratorTool />,
  "url-codec": () => <UrlCodecTool />,
  "qr-generator": () => <QrGeneratorTool />,
  "uuid-generator": () => <UuidGeneratorTool />,
  "password-generator": () => <PasswordGeneratorTool />,
  "color-picker": () => <ColorPickerTool />,
  mcp: () => <McpTool />,
};

export default function App() {
  const { language } = useI18n();
  const slug = window.location.pathname.split("/").filter(Boolean)[0] || "";
  const tool = getTool(slug);
  const render = routeComponents[slug];
  useEffect(() => {
    document.title = tool
      ? `${localizedTool(tool, language).title} — toolmd`
      : "toolmd — focused browser tools";
  }, [language, slug, tool]);
  if (!render || !tool) return <ToolHome />;
  return (
    <Suspense fallback={<LoadingFallback />}>
      {render()}
    </Suspense>
  );
}

function LoadingFallback() {
  const { t } = useI18n();
  return <div className="grid min-h-screen place-items-center bg-slate-50 font-mono text-sm text-slate-500 dark:bg-[#0f1724] dark:text-slate-400">{t("loading")}</div>;
}
