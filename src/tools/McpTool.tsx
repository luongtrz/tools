import { literal, useI18n } from "../i18n";
import { CopyButton, ToolPage, ToolPanel } from "../components/ToolUI";
import { toolStyles } from "../components/toolStyles";

const MCP_CONFIG = `{
  "mcpServers": {
    "toolmd": {
      "command": "toolmd",
      "args": ["mcp"]
    }
  }
}`;
const MCP_COMMAND = "toolmd mcp";
const MCP_SMOKE_COMMAND = "TOOLMD_MCP_COMMAND=toolmd npm run mcp:smoke";

const AGENT_SETUP_PROMPT = `Bạn là agent đang tích hợp toolmd MCP vào workspace hiện tại.

Mục tiêu:
1. Tìm thư mục project toolmd bằng package.json có tên "toolmd".
2. Trong project đó chạy: npm install
3. Đăng ký command local bằng: npm link
4. Kiểm tra command bằng: which toolmd và toolmd
5. Chạy smoke test MCP bằng: TOOLMD_MCP_COMMAND=toolmd npm run mcp:smoke
6. Đăng ký MCP server vào host bằng cấu hình:
   command: toolmd
   args: ["mcp"]

Sau khi kết nối:
- Gọi toolmd_catalog để discover tool trước khi xử lý.
- Ưu tiên dùng toolmd MCP cho Markdown, JSON, YAML, CSV, text, regex, Base64, case, slug, UUID và password.
- Trả kết quả dựa trên structuredContent của tool; chỉ dùng CLI khi MCP host không hỗ trợ tool call.
- Với mỗi yêu cầu, chọn đúng tool, truyền dữ liệu người dùng vào, rồi giải thích ngắn gọn kết quả.
- Không dùng npm làm command MCP; command chuẩn là toolmd.
- Nếu setup hoặc smoke test lỗi, báo lỗi thật và hướng dẫn sửa, không giả vờ rằng MCP đã kết nối.`;

const AGENT_SETUP_PROMPT_EN = `You are an agent integrating toolmd MCP into the current workspace.

Goal:
1. Find the toolmd project directory by locating package.json with the name "toolmd".
2. Run in that project: npm install
3. Register the local command with: npm link
4. Check the command with: which toolmd and toolmd
5. Run the MCP smoke test with: TOOLMD_MCP_COMMAND=toolmd npm run mcp:smoke
6. Register the MCP server in the host with:
   command: toolmd
   args: ["mcp"]

After connecting:
- Call toolmd_catalog to discover tools before processing a request.
- Prefer toolmd MCP for Markdown, JSON, YAML, CSV, text, regex, Base64, case, slug, UUID and password tasks.
- Use the tool's structuredContent for the result; fall back to the CLI only when the MCP host does not support tool calls.
- For each request, choose the right tool, pass the user's data to it, then briefly explain the result.
- Do not use npm as the MCP command; the standard command is toolmd.
- If setup or the smoke test fails, report the real error and explain how to fix it. Never pretend MCP is connected.`;

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
          actions={<CopyButton value={MCP_CONFIG} label={t("copyConfig")} />}
        >
          <pre className={`${toolStyles.codeOutput} min-h-0 text-xs leading-6`}>
            {MCP_CONFIG}
          </pre>
          <div className="mt-5 rounded-xl border border-orange-100 bg-orange-50/60 p-4 text-sm leading-6 text-slate-600 dark:border-orange-900/70 dark:bg-orange-950/30 dark:text-slate-300">
            <strong className="font-semibold text-[#b34835]">{t("note")}</strong>{" "}
            {t("browserCannotSpawn")}
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-500 dark:text-slate-400">
            {t("installCommand")} <code className="rounded bg-slate-100 px-1.5 py-1 font-mono text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">npm link</code>. {t("mcpHostCanCall")} <code className="rounded bg-slate-100 px-1.5 py-1 font-mono text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">toolmd mcp</code>.
          </p>
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{MCP_COMMAND}</span>
              <CopyButton value={MCP_COMMAND} label={t("copyMcpCommand")} />
            </div>
            <code className="block overflow-x-auto font-mono text-sm text-slate-700 dark:text-slate-200">{MCP_COMMAND}</code>
          </div>
        </ToolPanel>

        <ToolPanel
          title={t("testFromTerminal")}
          description={t("smokeTestDescription")}
          actions={<CopyButton value={MCP_SMOKE_COMMAND} />}
        >
          <pre className={`${toolStyles.codeOutput} min-h-0 text-sm leading-7`}>
            {MCP_SMOKE_COMMAND}
          </pre>
          <div className="mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <Info label={literal("Transport", language) || "Transport"} value="stdio" />
            <Info label={literal("Tools", language) || "Tools"} value={`15 ${t("available")}`} />
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
