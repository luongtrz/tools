import { CopyButton, ToolPage, ToolPanel } from "../components/ToolUI";
import { toolStyles } from "../components/toolStyles";

const MCP_CONFIG = `{
  "mcpServers": {
    "toolmd": {
      "command": "npm",
      "args": [
        "--prefix",
        "/absolute/path/to/tools",
        "run",
        "mcp"
      ]
    }
  }
}`;

const PROMPTS = [
  {
    title: "Format JSON",
    prompt: 'Dùng toolmd_json_format để format JSON này: {"name":"toolmd","ready":true}',
  },
  {
    title: "Render Markdown",
    prompt: "Dùng toolmd_markdown_render để render Markdown và trả về HTML cùng thống kê: # Project brief",
  },
  {
    title: "Chuyển đổi dữ liệu",
    prompt: "Dùng toolmd_data_convert với format csv-to-json cho dữ liệu: name,status\\nmd2pdf,ready",
  },
  {
    title: "So sánh text",
    prompt: "Dùng toolmd_text_diff để so sánh bản gốc và bản mới, rồi tóm tắt các dòng thay đổi.",
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
  return (
    <ToolPage slug="mcp" eyebrow="AI INTEGRATION">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,.75fr)]">
        <ToolPanel
          title="Connect an AI host"
          description="Toolmd MCP chạy local qua stdio. Dán cấu hình này vào MCP client như Claude Desktop, Cursor hoặc host hỗ trợ MCP rồi thay đường dẫn project thật."
          actions={<CopyButton value={MCP_CONFIG} />}
        >
          <pre className={`${toolStyles.codeOutput} min-h-0 text-xs leading-6`}>
            {MCP_CONFIG}
          </pre>
          <div className="mt-5 rounded-xl border border-orange-100 bg-orange-50/60 p-4 text-sm leading-6 text-slate-600">
            <strong className="font-semibold text-[#b34835]">Lưu ý:</strong>{" "}
            trình duyệt không thể tự spawn process stdio. Việc kết nối phải do
            AI host chạy MCP server, còn trang này là nơi hướng dẫn và tạo
            prompt test.
          </div>
        </ToolPanel>

        <ToolPanel
          title="Test từ terminal"
          description="Smoke test dùng MCP client thật, kiểm tra discovery và gọi nhiều tool."
          actions={<CopyButton value="npm run mcp:smoke" />}
        >
          <pre className={`${toolStyles.codeOutput} min-h-0 text-sm leading-7`}>
            npm run mcp:smoke
          </pre>
          <div className="mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <Info label="Transport" value="stdio" />
            <Info label="Tools" value="15 available" />
            <Info label="Auth" value="Not required" />
          </div>
        </ToolPanel>
      </div>

      <ToolPanel
        title="Prompt mẫu để thử ngay"
        description="Sau khi host đã kết nối MCP server, gửi một trong các prompt dưới đây cho AI."
      >
        <div className="grid gap-4 md:grid-cols-2">
          {PROMPTS.map((item) => (
            <article
              className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-5"
              key={item.title}
            >
              <div>
                <h3 className="font-display text-lg font-semibold text-slate-800">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {item.prompt}
                </p>
              </div>
              <CopyButton value={item.prompt} />
            </article>
          ))}
        </div>
      </ToolPanel>

      <ToolPanel
        title="Tool AI có thể gọi"
        description="Các tool trả về JSON có cấu trúc để AI có thể đọc, tóm tắt hoặc chuyển tiếp sang bước tiếp theo."
      >
        <div className="flex flex-wrap gap-2">
          {MCP_TOOLS.map((name) => (
            <code
              className="rounded-lg border border-orange-100 bg-orange-50 px-3 py-2 font-mono text-xs text-[#bd4d32]"
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
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <span className="block font-mono text-xs text-slate-400">{label}</span>
      <strong className="mt-1 block font-display text-lg font-semibold text-slate-800">
        {value}
      </strong>
    </div>
  );
}
