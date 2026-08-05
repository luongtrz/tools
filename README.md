# toolmd

> Bộ công cụ chạy trực tiếp trên trình duyệt cho Markdown, document, dữ liệu developer và các tiện ích hằng ngày.

**Live site:** [https://toolmd.pages.dev/](https://toolmd.pages.dev/)

Monorepo frontend React + TypeScript với các route dùng chung một React shell. Các route chính gồm `/md2pdf/`, `/md2word/` và `/md2pptx/`; các tool mới có thể thêm dưới cùng domain mà không cần tạo project hosting riêng.

`/md2word/` xuất được cả `.doc` tương thích legacy và `.docx` chuẩn Office Open XML. Bản `.docx` giữ các heading, emphasis, code, link, quote và danh sách cơ bản từ Markdown.

UI dùng Tailwind CSS qua Vite plugin; `src/index.css` chỉ là entrypoint tối thiểu để nạp Tailwind và font theme. Các style giao diện được đặt trực tiếp trong TSX để dễ trace cùng component.

## MCP và CLI cho AI

Toolmd có MCP server chạy qua `stdio`, để các AI host có thể tự discover và gọi các tool xử lý Markdown, JSON, YAML, CSV, text, regex, Base64, case, slug, UUID và password. MCP chạy local, không cần API key và không upload nội dung.

Khởi động MCP server:

```bash
npm install
npm link
```

Ví dụ cấu hình cho MCP client:

```json
{
  "mcpServers": {
    "toolmd": {
      "command": "toolmd",
      "args": ["mcp"]
    }
  }
}
```

Server cung cấp các tool như `toolmd_markdown_render`, `toolmd_json_format`, `toolmd_json_diff`, `toolmd_data_convert`, `toolmd_text_diff`, `toolmd_regex_test`, `toolmd_base64`, `toolmd_case_convert`, `toolmd_slug`, `toolmd_uuid` và `toolmd_password`. Mỗi response có cả text content và structured content để AI đọc tự nhiên hoặc xử lý tiếp bằng code.

### Prompt setup cho agent

Có thể copy nguyên prompt dưới đây và dán vào agent để agent tự setup, test và sử dụng MCP khi cần:

```text
Bạn là agent đang tích hợp toolmd MCP vào workspace hiện tại.

1. Tìm thư mục project toolmd bằng package.json có tên "toolmd".
2. Trong project đó chạy: npm install
3. Đăng ký command local bằng: npm link
4. Kiểm tra command bằng: which toolmd và toolmd
5. Chạy smoke test MCP bằng: TOOLMD_MCP_COMMAND=toolmd npm run mcp:smoke
6. Đăng ký MCP server vào host bằng command toolmd với args ["mcp"].

Sau khi kết nối, gọi toolmd_catalog để discover tool trước. Ưu tiên dùng toolmd MCP cho Markdown, JSON, YAML, CSV, text, regex, Base64, case, slug, UUID và password. Dùng structuredContent để xử lý kết quả, chọn đúng tool cho từng yêu cầu và báo lỗi thật nếu setup hoặc smoke test thất bại. Không dùng npm làm command MCP; command chuẩn là toolmd.
```

Test MCP protocol bằng client thật:

```bash
npm run mcp:smoke
```

Nếu cần chạy không qua MCP, CLI dùng cùng adapter xử lý:

```bash
npm run toolmd -- json-format --text '{"name":"toolmd"}'
npm run toolmd -- markdown-render --file ./document.md
npm run toolmd -- slug --text "Markdown, ready to print!"
```

## Live collaboration

Nhấn `Share live` để tạo một room và gửi URL mời cho những người khác. Các client trong cùng room đồng bộ Markdown theo thời gian thực bằng Yjs CRDT và Hocuspocus WebSocket backend.

Mỗi share link chứa một access key ngẫu nhiên; backend kiểm tra key trước khi cho phép kết nối vào room. Nội dung được lưu dưới dạng binary Yjs trong Durable Object storage, vì vậy room vẫn còn dữ liệu sau khi mọi người rời đi.

Frontend Cloudflare Pages và collaboration backend là hai Cloudflare deployment riêng. Backend dùng Worker + Durable Object: mỗi room là một Durable Object, giữ WebSocket connections và lưu binary Yjs vào storage của Durable Object.

Chạy backend local bằng Wrangler trước, sau đó cấu hình URL WebSocket cho Vite:

```bash
npm run collab:dev
VITE_COLLABORATION_URL=ws://localhost:8787 npm run dev
```

Deploy backend bằng Wrangler, sau đó đặt `VITE_COLLABORATION_URL=wss://<worker-subdomain>.workers.dev` trong environment của Cloudflare Pages và build lại frontend:

```bash
npm run collab:deploy
VITE_COLLABORATION_URL=wss://toolmd-collab.22120199.workers.dev npm run build
```

## Chạy local

```bash
npm install
npm run dev
```

Các lệnh kiểm tra/build:

```bash
npm run typecheck
npm run build
npm run collab:deploy -- --dry-run
```

Sau đó truy cập URL Vite hiển thị trong terminal.

## Lưu ý về static hosting và wkhtmltopdf

Cloudflare Pages chỉ phục vụ static files nên không thể chạy binary `wkhtmltopdf` trực tiếp trên server. Bản UI này cung cấp:

- Markdown editor và live preview chạy hoàn toàn trên browser.
- Nút `Xuất PDF` dùng print dialog của browser để lưu PDF từ static page.
- Command preview để đưa nội dung qua backend/CLI sử dụng core `wkhtmltopdf` khi cần output đồng nhất:

```bash
wkhtmltopdf --page-size A4 --orientation Portrait input.html output.pdf
```

Đây là lựa chọn phù hợp với phạm vi static UI; backend wkhtmltopdf có thể gắn thêm sau mà không cần đổi giao diện React.

## Deploy Cloudflare Pages

Build tạo một bundle route-based; asset dùng path root và Cloudflare `_redirects` đưa mọi tool route về React shell:

```bash
npm run build
npx wrangler pages deploy dist --project-name toolmd
```
