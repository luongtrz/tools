# md2pdf

Một static GitHub Page chuyển Markdown thành bản preview PDF sạch đẹp, với command preview tương thích `wkhtmltopdf`.

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
