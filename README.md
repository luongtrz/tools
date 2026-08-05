# toolmd

> Bộ công cụ chạy trực tiếp trên trình duyệt cho Markdown, document, dữ liệu developer và các tiện ích hằng ngày.

**Live site:** [https://toolmd.pages.dev/](https://toolmd.pages.dev/)

Monorepo frontend React + TypeScript với các route dùng chung một React shell. Các route chính gồm `/md2pdf/`, `/md2word/` và `/md2pptx/`; các tool mới có thể thêm dưới cùng domain mà không cần tạo project hosting riêng.

UI dùng Tailwind CSS qua Vite plugin. CSS thuần chỉ còn giữ cho workspace `md2pdf` legacy vì phần editor/print có nhiều chi tiết đặc thù.

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
