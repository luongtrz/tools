# md2pdf

Một static GitHub Page chuyển Markdown thành bản preview PDF sạch đẹp, với command preview tương thích `wkhtmltopdf`.

## Live collaboration

Nhấn `Share live` để tạo một room và gửi URL có mã phòng cho những người khác. Các client trong cùng room đồng bộ Markdown theo thời gian thực bằng Yjs CRDT và WebRTC; signaling dùng server công khai của y-webrtc, còn dữ liệu tài liệu đi peer-to-peer giữa các trình duyệt.

Room là dạng unlisted: ai có share link đều có thể tham gia. Bản static này không lưu tài liệu trên server; ít nhất một peer cần đang online để truyền nội dung cho người mới vào room.

## Chạy local

Mở `index.html` trực tiếp trong browser, hoặc chạy một static server:

```bash
python3 -m http.server 8000
```

Sau đó truy cập <http://localhost:8000>.

## Lưu ý về GitHub Pages và wkhtmltopdf

GitHub Pages chỉ phục vụ static files nên không thể chạy binary `wkhtmltopdf` trực tiếp trên server. Bản UI này cung cấp:

- Markdown editor và live preview chạy hoàn toàn trên browser.
- Nút `Xuất PDF` dùng print dialog của browser để lưu PDF từ static page.
- Command preview để đưa nội dung qua backend/CLI sử dụng core `wkhtmltopdf` khi cần output đồng nhất:

```bash
wkhtmltopdf --page-size A4 --orientation Portrait input.html output.pdf
```

Đây là lựa chọn phù hợp với phạm vi “chỉ UI” trên GitHub Pages; backend wkhtmltopdf có thể gắn thêm sau mà không cần đổi giao diện.

## Deploy

Repo dùng static root, không cần build step. GitHub Pages có thể deploy từ branch `main`, folder `/ (root)`.
