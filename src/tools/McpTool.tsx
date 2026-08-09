import { useState } from "react";
import { literal, useI18n } from "@/i18n";
import {
  CopyButton,
  ToolNotice,
  ToolPage,
  ToolPanel,
} from "@/components/ToolUI";
import { toolStyles } from "@/components/toolStyles";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MCP_ENDPOINT =
  import.meta.env.VITE_MCP_URL ||
  "https://toolmd-mcp.22120199.workers.dev/mcp";

type Host = "generic" | "claude" | "cursor" | "vscode";

function buildConfig(host: Host): string {
  const base = {
    mcpServers: {
      toolmd: {
        url: MCP_ENDPOINT,
      },
    },
  };
  switch (host) {
    case "claude":
      return JSON.stringify(base, null, 2);
    case "cursor":
      return JSON.stringify({ ...base, mcpServers: { toolmd: { ...base.mcpServers.toolmd, transport: "http" } } }, null, 2);
    case "vscode":
      return JSON.stringify(
        {
          servers: {
            toolmd: {
              type: "http",
              url: MCP_ENDPOINT,
            },
          },
        },
        null,
        2,
      );
    default:
      return JSON.stringify(base, null, 2);
  }
}

const AGENT_SETUP_PROMPT = `Bạn là agent đang tích hợp toolmd MCP vào workspace hiện tại.

Mục tiêu:
1. Đăng ký MCP server remote bằng Streamable HTTP với URL:
   ${MCP_ENDPOINT}
2. Sau khi kết nối, gọi toolmd_catalog để kiểm tra server và discover tool.

Sau khi kết nối:
- Ưu tiên dùng toolmd MCP cho Markdown, Markdown → PDF, JSON, YAML, CSV, text, regex, Base64, case, URL, JWT, slug, UUID và password.
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
- Prefer toolmd MCP for Markdown, Markdown-to-PDF, JSON, YAML, CSV, text, regex, Base64, case, URL, JWT, slug, UUID and password tasks.
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
    prompt:
      'Dùng toolmd_json_format để format JSON này: {"name":"toolmd","ready":true}',
    promptEn:
      'Use toolmd_json_format to format this JSON: {"name":"toolmd","ready":true}',
  },
  {
    title: "Render Markdown",
    titleVi: "Render Markdown",
    titleEn: "Render Markdown",
    prompt:
      "Dùng toolmd_markdown_render để render Markdown và trả về HTML cùng thống kê: # Project brief",
    promptEn:
      "Use toolmd_markdown_render to render Markdown and return HTML with stats: # Project brief",
  },
  {
    title: "Chuyển đổi dữ liệu",
    titleVi: "Chuyển đổi dữ liệu",
    titleEn: "Convert data",
    prompt:
      "Dùng toolmd_data_convert với format csv-to-json cho dữ liệu: name,status\\nmd2pdf,ready",
    promptEn:
      "Use toolmd_data_convert with csv-to-json for this data: name,status\\nmd2pdf,ready",
  },
  {
    title: "Markdown → PDF",
    titleVi: "Markdown → PDF",
    titleEn: "Markdown → PDF",
    prompt:
      "Dùng toolmd_md2pdf để chuyển Markdown này thành PDF A4: # Báo cáo\\n\\nNội dung cần xuất.",
    promptEn:
      "Use toolmd_md2pdf to convert this Markdown into an A4 PDF: # Report\\n\\nContent to export.",
  },
  {
    title: "So sánh text",
    titleVi: "So sánh text",
    titleEn: "Compare text",
    prompt:
      "Dùng toolmd_text_diff để so sánh bản gốc và bản mới, rồi tóm tắt các dòng thay đổi.",
    promptEn:
      "Use toolmd_text_diff to compare the original and new versions, then summarize changed lines.",
  },
];

const MCP_TOOLS = [
  { name: "toolmd_catalog", sample: {} },
  { name: "toolmd_markdown_render", sample: { markdown: "# Project brief" } },
  { name: "toolmd_md2pdf", sample: { markdown: "# Báo cáo", filename: "report", format: "a4" } },
  { name: "toolmd_markdown_stats", sample: { markdown: "Hello world" } },
  { name: "toolmd_json_format", sample: { json: '{"a":1}', indent: 2 } },
  { name: "toolmd_json_validate", sample: { json: '{"a":1}' } },
  { name: "toolmd_json_diff", sample: { a: '{"a":1}', b: '{"a":2}' } },
  { name: "toolmd_data_convert", sample: { format: "csv-to-json", data: "a,b\n1,2" } },
  { name: "toolmd_markdown_table", sample: { headers: "a,b", rows: 2 } },
  { name: "toolmd_text_diff", sample: { left: "a", right: "b" } },
  { name: "toolmd_regex_test", sample: { pattern: "abc", flags: "gi", value: "abc" } },
  { name: "toolmd_base64", sample: { direction: "encode", value: "toolmd" } },
  { name: "toolmd_case_convert", sample: { value: "Hello World", mode: "kebab" } },
  { name: "toolmd_url_codec", sample: { direction: "encode", value: "toolmd" } },
  { name: "toolmd_jwt_decode", sample: { token: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0b29sbWQifQ.signature" } },
  { name: "toolmd_slug", sample: { value: "Hello World" } },
  { name: "toolmd_uuid", sample: { count: 1 } },
  { name: "toolmd_password", sample: { length: 16 } },
];

type HealthState = "idle" | "checking" | "ok" | "error";

export default function McpTool() {
  const { language, t } = useI18n();
  const agentSetupPrompt =
    language === "vi" ? AGENT_SETUP_PROMPT : AGENT_SETUP_PROMPT_EN;
  const [host, setHost] = useState<Host>("generic");
  const mcpConfig = buildConfig(host);
  const [health, setHealth] = useState<HealthState>("idle");
  const [healthDetail, setHealthDetail] = useState<string>("");

  async function checkHealth(): Promise<void> {
    setHealth("checking");
    setHealthDetail("");
    const start = performance.now();
    try {
      const response = await fetch(MCP_ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "tools/list",
          params: {},
        }),
      });
      const elapsed = Math.round(performance.now() - start);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      await response.text();
      setHealth("ok");
      setHealthDetail(`Reachable · ${elapsed} ms · HTTP ${response.status}`);
    } catch (error) {
      setHealth("error");
      setHealthDetail(
        error instanceof Error
          ? error.message
          : "Unable to reach the MCP endpoint",
      );
    }
  }

  return (
    <ToolPage slug="mcp" eyebrow={t("aiIntegration")}>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,.75fr)]">
        <ToolPanel
          title={t("copyInstruction")}
          description={t("copyInstructionDescription")}
          className="xl:col-span-2"
          actions={
            <CopyButton value={agentSetupPrompt} label={t("copyAgentGuide")} />
          }
        >
          <pre
            className={`${toolStyles.codeOutput} min-h-0 whitespace-pre-wrap text-sm leading-7`}
          >
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
              <label
                className="mb-2 block font-mono text-xs text-muted-foreground"
                htmlFor="mcp-endpoint"
              >
                {t("endpointLabel")}
              </label>
              <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 p-3">
                <code
                  className="min-w-0 flex-1 overflow-x-auto font-mono text-sm text-foreground"
                  id="mcp-endpoint"
                >
                  {MCP_ENDPOINT}
                </code>
                <CopyButton value={MCP_ENDPOINT} label={t("copyEndpoint")} />
              </div>
            </div>
            <div className="flex flex-wrap gap-1 rounded-md bg-muted p-1">
              {(["generic", "claude", "cursor", "vscode"] as Host[]).map(
                (option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setHost(option)}
                    className={cn(
                      "rounded-sm px-3 py-1.5 text-xs font-medium transition-colors",
                      host === option
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {option}
                  </button>
                ),
              )}
            </div>
            <pre className={`${toolStyles.codeOutput} min-h-0 text-xs leading-6`}>
              {mcpConfig}
            </pre>
          </div>
        </ToolPanel>

        <ToolPanel
          title={t("testConnection")}
          description={t("remoteSmokeDescription")}
          actions={
            <Button
              size="sm"
              onClick={() => void checkHealth()}
              busy={health === "checking"}
            >
              {health === "checking" ? t("processing") : "Run health check"}
            </Button>
          }
        >
          <div
            className={cn(
              "rounded-md border p-4 text-sm leading-6",
              health === "ok" &&
                "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200",
              health === "error" &&
                "border-destructive/40 bg-destructive/10 text-destructive",
              health === "idle" &&
                "border-border bg-muted/30 text-muted-foreground",
              health === "checking" &&
                "border-primary/30 bg-primary/10 text-foreground",
            )}
            role="status"
          >
            {health === "idle" && t("remoteMcpNote")}
            {health === "checking" && "Probing endpoint…"}
            {health === "ok" && `OK · ${healthDetail}`}
            {health === "error" && `Failed · ${healthDetail}`}
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-3 xl:grid-cols-1">
            <Info
              label="Transport"
              value="Streamable HTTP"
            />
            <Info label="Tools" value={`${MCP_TOOLS.length} available`} />
            <Info label="Auth" value={t("notRequired")} />
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
              className="flex flex-col justify-between gap-4 rounded-md border border-border bg-muted/30 p-5"
              key={item.title}
            >
              <div>
                <h3 className="font-display text-lg font-semibold text-foreground">
                  {language === "vi"
                    ? item.titleVi || item.title
                    : item.titleEn || item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {language === "vi" ? item.prompt : item.promptEn}
                </p>
              </div>
              <CopyButton
                value={language === "vi" ? item.prompt : item.promptEn}
              />
            </article>
          ))}
        </div>
      </ToolPanel>

      <ToolPanel
        title={t("callableTools")}
        description={t("callableToolsDescription")}
      >
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {MCP_TOOLS.map((tool) => (
            <div
              key={tool.name}
              className="flex min-w-0 items-center justify-between gap-2 rounded-md border border-border bg-background p-3"
            >
              <div className="min-w-0 flex-1 overflow-hidden">
                <code className="block truncate font-mono text-xs text-primary">
                  {tool.name}
                </code>
                <pre className="mt-1 truncate font-mono text-[10px] text-muted-foreground">
                  {JSON.stringify(tool.sample)}
                </pre>
              </div>
              <CopyButton value={tool.name} label="Copy" />
            </div>
          ))}
        </div>
      </ToolPanel>
    </ToolPage>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-card p-3">
      <span className="block font-mono text-xs text-muted-foreground">
        {label}
      </span>
      <strong className="mt-1 block font-display text-base font-semibold text-foreground">
        {value}
      </strong>
    </div>
  );
}
