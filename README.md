# mdtool

Monorepo frontend React + TypeScript cho các công cụ chuyển đổi tài liệu. Tool hiện tại là `md2pdf`, được phục vụ tại `https://mdtool.pages.dev/md2pdf/`; các tool sau có thể dùng cùng pattern như `/md2word/` và `/md2pptx/`.

## Live collaboration

Nhấn `Share live` để tạo một room và gửi URL có mã phòng cho những người khác. Các client trong cùng room đồng bộ Markdown theo thời gian thực bằng Yjs CRDT và WebRTC; signaling dùng server công khai của y-webrtc, còn dữ liệu tài liệu đi peer-to-peer giữa các trình duyệt.

Room là dạng unlisted: ai có share link đều có thể tham gia. Bản static này không lưu tài liệu trên server; ít nhất một peer cần đang online để truyền nội dung cho người mới vào room.

## Chạy local

```bash
npm install
npm run dev
```

Các lệnh kiểm tra/build:

```bash
npm run typecheck
npm run build
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

Build mặc định dùng path `md2pdf`, với asset URL bắt đầu bằng `/md2pdf/`:

```bash
npm run build
npx wrangler pages deploy dist --project-name mdtool
```

Khi thêm tool mới, build với path riêng để tái sử dụng cấu trúc URL:

```bash
VITE_TOOL_PATH=md2word npm run build
VITE_TOOL_PATH=md2pptx npm run build
```
