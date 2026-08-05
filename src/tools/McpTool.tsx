import { literal, useI18n } from "../i18n";
import { CopyButton, ToolPage, ToolPanel } from "../components/ToolUI";
import { toolStyles } from "../components/toolStyles";

const MCP_ENDPOINT = import.meta.env.VITE_MCP_URL || "https://toolmd-mcp.22120199.workers.dev/mcp";

function createMcpConfig(): string {
  return JSON.stringify({
    mcpServers: {
      toolmd: {
        url: MCP_ENDPOINT,
      },
    },
  }, null, 2);
}

const AGENT_SETUP_PROMPT = `Bạn là agent đang tích hợp toolmd MCP vào workspace hiện tại.

Mục tiêu:
1. Đăng ký MCP server remote bằng Streamable HTTP với URL:
   ${MCP_ENDPOINT}
2. Sau khi kết nối, gọi toolmd_catalog để kiểm tra server và discover tool.

Sau khi kết nối:
- Ưu tiên dùng toolmd MCP cho Markdown, Markdown → PDF, JSON, YAML, CSV, text, regex, Base64, case, slug, UUID và password.
- Trả kết quả dựa trên structuredContent của tool.
- Với toolmd_md2pdf, truyền Markdown vào tool và dùng filename, mimeType, bytes, base64 để lưu hoặc chuyển tiếp file PDF.
- Với mỗi yêu cầu, chọn đúng tool, truyền dữ liệu người dùng vào, rồi giải thích ngắn gọn kết quả.
- Không chạy npm install, npm link hoặc toolmd mcp. Đây là MCP remote, không cần môi trường local của workspace.
- Nếu kết nối lỗi, báo lỗi thật và hướng dẫn sửa, không giả vờ rằng MCP đã kết nối.`;

const AGENT_SETUP_PROMPT_EN = `You are an agent integrating toolmd MCP into the current workspace.

Goal:
1. Register the remote MCP server over Streamable HTTP at:
   ${MCP_ENDPOINT}
2. After connecting, call toolmd_catalog to verify the server and discover tools.

After connecting:
- Prefer toolmd MCP for Markdown, Markdown-to-PDF, JSON, YAML, CSV, text, regex, Base64, case, slug, UUID and password tasks.
- Use the tool's structuredContent for the result.
- For toolmd_md2pdf, pass Markdown to the tool and use filename, mimeType, bytes and base64 to save or forward the PDF file.
- For each request, choose the right tool, pass the user's data to it, then briefly explain the result.
- Do not run npm install, npm link or toolmd mcp. This is a remote MCP server and does not require a local workspace environment.
- If connection fails, report the real error and explain how to fix it. Never pretend MCP is connected.`;

const PROMPTS = [
  {
    title: "Format JSON",
    titleVi: "Định dạng JSON",
    titleEn: "Format JSON",
    prompt: 'Dùng toolmd_json_format để format JSON này: {"name":"toolmd","ready":true}',
    promptEn: 'Use toolmd_json_format to format this JSON: {"name":"toolmd","ready":true}',
  },
  {
    title: "Render Markdown",
    titleVi: "Render Markdown",
    titleEn: "Render Markdown",
    prompt: "Dùng toolmd_markdown_render để render Markdown và trả về HTML cùng thống kê: # Project brief",
    promptEn: "Use toolmd_markdown_render to render Markdown and return HTML with stats: # Project brief",
  },
  {
    title: "Chuyển đổi dữ liệu",
    titleVi: "Chuyển đổi dữ liệu",
    titleEn: "Convert data",
    prompt: "Dùng toolmd_data_convert với format csv-to-json cho dữ liệu: name,status\\nmd2pdf,ready",
    promptEn: "Use toolmd_data_convert with csv-to-json for this data: name,status\\nmd2pdf,ready",
  },
  {
    title: "Markdown → PDF",
    titleVi: "Markdown → PDF",
    titleEn: "Markdown → PDF",
    prompt: "Dùng toolmd_md2pdf để chuyển Markdown này thành PDF A4: # Báo cáo\\n\\nNội dung cần xuất.",
    promptEn: "Use toolmd_md2pdf to convert this Markdown into an A4 PDF: # Report\\n\\nContent to export.",
  },
  {
    title: "So sánh text",
    titleVi: "So sánh text",
    titleEn: "Compare text",
    prompt: "Dùng toolmd_text_diff để so sánh bản gốc và bản mới, rồi tóm tắt các dòng thay đổi.",
    promptEn: "Use toolmd_text_diff to compare the original and new versions, then summarize changed lines.",
  },
];

const MCP_TOOLS = [
  "toolmd_catalog",
  "toolmd_markdown_render",
  "toolmd_md2pdf",
  "toolmd_markdown_stats",
  "toolmd_json_format",
  "toolmd_json_validate",
  "toolmd_json_diff",
  "toolmd_data_convert",
  "toolmd_markdown_table",
  "toolmd_text_diff",
  "toolmd_regex_test",
  "toolmd_base64",
  "toolmd_case_convert",
  "toolmd_slug",
  "toolmd_uuid",
  "toolmd_password",
];

export default function McpTool() {
  const { language, t } = useI18n();
  const agentSetupPrompt = language === "vi" ? AGENT_SETUP_PROMPT : AGENT_SETUP_PROMPT_EN;
  const mcpConfig = createMcpConfig();
  return (
    <ToolPage slug="mcp" eyebrow={t("aiIntegration")}>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,.75fr)]">
        <ToolPanel
          title={t("copyInstruction")}
          description={t("copyInstructionDescription")}
          className="xl:col-span-2"
          actions={<CopyButton value={agentSetupPrompt} label={t("copyAgentGuide")} />}
        >
            <pre className={`${toolStyles.codeOutput} min-h-0 whitespace-pre-wrap text-sm leading-7`}>
            {agentSetupPrompt}
          </pre>
        </ToolPanel>
        <ToolPanel
          title={t("connectAiHost")}
          description={t("connectAiHostDescription")}
          actions={<CopyButton value={mcpConfig} label={t("copyConfig")} />}
          >
          <div className="space-y-4">
            <div>
              <label className="mb-2 block font-mono text-xs text-slate-500 dark:text-slate-400" htmlFor="mcp-endpoint">
                {t("endpointLabel")}
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950">
                <code className="min-w-0 flex-1 overflow-x-auto font-mono text-sm text-slate-700 dark:text-slate-200" id="mcp-endpoint">
                  {MCP_ENDPOINT}
                </code>
                <CopyButton value={MCP_ENDPOINT} label={t("copyEndpoint")} />
              </div>
            </div>
            <pre className={`${toolStyles.codeOutput} min-h-0 text-xs leading-6`}>
              {mcpConfig}
            </pre>
          </div>
        </ToolPanel>

        <ToolPanel
          title={t("testConnection")}
          description={t("remoteSmokeDescription")}
        >
          <div className="rounded-xl border border-orange-100 bg-orange-50/60 p-4 text-sm leading-6 text-slate-600 dark:border-orange-900/70 dark:bg-orange-950/30 dark:text-slate-300">
            <strong className="font-semibold text-[#b34835]">{t("note")}</strong>{" "}
            {t("remoteMcpNote")}
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <Info label={literal("Transport", language) || "Transport"} value="Streamable HTTP" />
            <Info label={literal("Tools", language) || "Tools"} value={`16 ${t("available")}`} />
            <Info label={literal("Auth", language) || "Auth"} value={t("notRequired")} />
          </div>
        </ToolPanel>
      </div>

      <ToolPanel
        title={t("tryNow")}
        description={t("tryNowDescription")}
      >
        <div className="grid gap-4 md:grid-cols-2">
          {PROMPTS.map((item) => (
            <article
              className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-950"
              key={item.title}
            >
              <div>
                <h3 className="font-display text-lg font-semibold text-slate-800 dark:text-slate-100">
                  {language === "vi" ? item.titleVi || item.title : item.titleEn || item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  {language === "vi" ? item.prompt : item.promptEn}
                </p>
              </div>
              <CopyButton value={language === "vi" ? item.prompt : item.promptEn} />
            </article>
          ))}
        </div>
      </ToolPanel>

      <ToolPanel
        title={t("callableTools")}
        description={t("callableToolsDescription")}
      >
        <div className="flex flex-wrap gap-2">
          {MCP_TOOLS.map((name) => (
            <code
              className="rounded-lg border border-orange-100 bg-orange-50 px-3 py-2 font-mono text-xs text-[#bd4d32] dark:border-orange-900/70 dark:bg-orange-950/40 dark:text-orange-300"
              key={name}
            >
              {name}
            </code>
          ))}
        </div>
      </ToolPanel>
    </ToolPage>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <span className="block font-mono text-xs text-slate-400 dark:text-slate-500">{label}</span>
      <strong className="mt-1 block font-display text-lg font-semibold text-slate-800 dark:text-slate-100">
        {value}
      </strong>
    </div>
  );
}
