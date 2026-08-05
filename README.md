# toolmd

> Bộ công cụ chạy trực tiếp trên trình duyệt cho Markdown, document, dữ liệu developer và các tiện ích hằng ngày.

**Live site:** [https://toolmd.pages.dev/](https://toolmd.pages.dev/)

Monorepo frontend React + TypeScript với các route dùng chung một React shell. Các route chính gồm `/md2pdf/`, `/md2word/` và `/md2pptx/`; các tool mới có thể thêm dưới cùng domain mà không cần tạo project hosting riêng.

`/md2word/` xuất được cả `.doc` tương thích legacy và `.docx` chuẩn Office Open XML. Bản `.docx` giữ các heading, emphasis, code, link, quote và danh sách cơ bản từ Markdown.

UI dùng Tailwind CSS qua Vite plugin; `src/index.css` chỉ là entrypoint tối thiểu để nạp Tailwind và font theme. Các style giao diện được đặt trực tiếp trong TSX để dễ trace cùng component.

## MCP remote cho AI

Toolmd cung cấp MCP server public dạng Streamable HTTP trên Cloudflare Worker. Agent chỉ cần kết nối tới endpoint; không cần clone project, cài Node.js, chạy `npm install`, `npm link` hay nhập API key trên máy của người dùng.

Endpoint mặc định:

```text
https://toolmd-mcp.22120199.workers.dev/mcp
```

Agent có thể đọc [introduction.md](https://toolmd.pages.dev/introduction.md) để tự nhận biết endpoint, transport và quy trình test.

Cấu hình cho MCP client:

```json
{
  "mcpServers": {
    "toolmd": {
      "url": "https://toolmd-mcp.22120199.workers.dev/mcp"
    }
  }
}
```

Server cung cấp các tool như `toolmd_markdown_render`, `toolmd_md2pdf`, `toolmd_json_format`, `toolmd_json_diff`, `toolmd_data_convert`, `toolmd_text_diff`, `toolmd_regex_test`, `toolmd_base64`, `toolmd_case_convert`, `toolmd_url_codec`, `toolmd_jwt_decode`, `toolmd_slug`, `toolmd_uuid` và `toolmd_password`. `toolmd_md2pdf` render Markdown thành PDF thật qua Cloudflare Browser Run và trả về `filename`, `mimeType`, `bytes` cùng `base64` trong structured content. Mỗi response có cả text content và structured content để AI đọc tự nhiên hoặc xử lý tiếp bằng code.

### Prompt setup cho agent

Có thể copy nguyên prompt dưới đây và dán vào agent để agent tự kết nối, test và sử dụng MCP khi cần:

```text
Bạn là agent đang tích hợp toolmd MCP remote.

1. Đăng ký MCP server bằng Streamable HTTP với URL:
   https://toolmd-mcp.22120199.workers.dev/mcp
2. Sau khi kết nối, gọi toolmd_catalog để kiểm tra server và discover tool.

Ưu tiên dùng toolmd MCP cho Markdown, Markdown → PDF, JSON, YAML, CSV, text, regex, Base64, case, URL, JWT, slug, UUID và password. Với PDF, dùng `toolmd_md2pdf`, sau đó decode trường `base64` thành file theo `filename`. Dùng structuredContent để xử lý kết quả, chọn đúng tool cho từng yêu cầu và báo lỗi thật nếu kết nối thất bại.

Không chạy npm install, npm link hoặc toolmd mcp. Đây là MCP remote, không cần môi trường local của workspace.
```

Nếu Worker dùng account subdomain khác, đặt `VITE_MCP_URL` khi build frontend để thay endpoint hiển thị trong trang MCP.

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
npm run mcp:deploy:dry-run
npm run collab:deploy -- --dry-run
```

Smoke test remote MCP sau khi Worker đã được deploy:

```bash
npm run mcp:smoke:http
```

Sau đó truy cập URL Vite hiển thị trong terminal.

## Lưu ý về static hosting và wkhtmltopdf

Cloudflare Pages chỉ phục vụ static files nên không thể chạy binary `wkhtmltopdf` trực tiếp trên server. Bản UI này cung cấp:

- Markdown editor và live preview chạy hoàn toàn trên browser.
- Nút `Xuất PDF` dùng print dialog của browser để lưu PDF từ static page.
- MCP remote có thêm `toolmd_md2pdf`, dùng Cloudflare Browser Run để tạo PDF server-side:

```bash
# Agent gọi toolmd_md2pdf với markdown, format và landscape;
# response trả về base64 để agent ghi thành filename.
```

Giới hạn input Markdown thực tế của tool PDF là 45 MB; phần HTML sau render được giữ dưới 49 MB để nằm trong trần request 50 MB của Browser Run. Response text chỉ chứa metadata; dữ liệu Base64 chỉ nằm trong `structuredContent` để tránh nhân đôi kích thước response.

## Deploy Cloudflare Pages

Build tạo một bundle route-based; asset dùng path root và Cloudflare `_redirects` đưa mọi tool route về React shell:

```bash
npm run build
npx wrangler pages deploy dist --project-name toolmd
```
