# 🚀 Hướng dẫn Triển khai Cloudflare Pages & Trỏ Tên Miền Chính Thức

Dự án đã được cấu trúc sẵn chuẩn tĩnh **Zero-Build / Edge-Ready** tại thư mục `public/`, tích hợp sẵn `wrangler.toml` và `public/_headers`.

---

## Bước 1: Cập nhật dữ liệu từ Excel (mỗi khi có file mới)

Chép các file `.xlsx` vào `D:\Project_AI\Website\data\`, sau đó chạy:

```powershell
python D:\Project_AI\Website\scripts\build_data.py
```

Script sẽ tự động đọc toàn bộ file `.xlsx` trong `data/`, loại bỏ dòng `Total` & dữ liệu nhạy cảm (email, MST, tên khách hàng), rồi xuất file `public/data/report_data.json`.

---

## Bước 2: Triển khai lên Cloudflare Pages (chọn 1 trong 3 cách)

### Cách 1: Deploy trực tiếp bằng Wrangler CLI (Nhanh nhất — 30 giây)
```powershell
cd D:\Project_AI\Website
npx wrangler login
npx wrangler pages deploy public --project-name cyberpulse-sales-report
```
Sau khi hoàn tất, Cloudflare cấp ngay link HTTPS dạng:
`https://cyberpulse-sales-report.pages.dev`

### Cách 2: Kéo thả thư mục `public/` (Không cần Git, không cần CLI)
1. Đăng nhập [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages** → **Create** → tab **Pages**.
2. Chọn **Direct Upload** → đặt tên dự án `cyberpulse-sales-report`.
3. Kéo thả toàn bộ thư mục `D:\Project_AI\Website\public` vào và nhấn **Deploy site**.

### Cách 3: Tự động CI/CD qua GitHub (Khuyên dùng cho vận hành lâu dài)
1. Push dự án lên GitHub repository (chú ý thêm `data/` vào `.gitignore` nếu không muốn lưu file Excel gốc lên repo công khai).
2. Vào **Cloudflare Dashboard** → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
3. Chọn repository và cấu hình:
   - **Framework preset:** `None`
   - **Build command:** *(để trống)*
   - **Build output directory:** `public`
4. Nhấn **Save and Deploy**. Mỗi lần bạn chạy `build_data.py` và `git push`, website sẽ tự động cập nhật trong ~15 giây.

---

## Bước 3: Chọn tên miền & Trỏ tên miền chính thức (Custom Domain)

### 3.1 Gợi ý đặt tên miền
- Dùng subdomain nội bộ công ty (khuyên dùng, không tốn phí mua thêm):
  - `report.<domain-cua-ban>.vn` hoặc `bi.<domain-cua-ban>.com`
- Hoặc mua domain mới trực tiếp qua **Cloudflare Registrar** (giá gốc, không phí ẩn):
  - `sales-telemetry.vn`, `cyberpulse-bi.com`, ...

### 3.2 Trỏ tên miền trên Cloudflare Pages
1. Vào dự án `cyberpulse-sales-report` trên Cloudflare Dashboard → chọn tab **Custom domains**.
2. Nhấn **Set up a custom domain** → nhập tên miền muốn dùng (ví dụ: `report.yourdomain.com`).
3. Cấu hình DNS:
   - **Nếu domain đã quản lý DNS tại Cloudflare:** nhấn **Activate domain** — Cloudflare tự tạo bản ghi `CNAME` (`report` → `cyberpulse-sales-report.pages.dev`) và tự cấp chứng chỉ **SSL/TLS HTTPS** sau 1–3 phút.
   - **Nếu domain quản lý tại nhà cung cấp khác (Mắt Bão, Nhân Hòa, Namecheap, GoDaddy...):** vào trang quản trị DNS của nhà cung cấp và thêm bản ghi:
     | Type | Name / Host | Value / Target | Proxy / TTL |
     | :--- | :--- | :--- | :--- |
     | `CNAME` | `report` | `cyberpulse-sales-report.pages.dev` | Auto / 300s |
4. Kiểm tra kết quả: truy cập `https://report.yourdomain.com` để xác nhận khóa xanh HTTPS và dữ liệu tải tức thì qua mạng Edge CDN toàn cầu của Cloudflare.

### 3.3 (Tùy chọn) Bảo vệ báo cáo nội bộ bằng Cloudflare Access (Zero Trust)
Nếu chỉ cho phép nhân sự công ty (ví dụ `@phongvu-mna.vn` hoặc danh sách email chỉ định) xem báo cáo:
- Vào **Cloudflare Zero Trust** → **Access** → **Applications** → **Add an application** → **Self-hosted** → chọn tên miền `report.yourdomain.com` → thêm Policy cho phép theo email/domain (miễn phí đến 50 người dùng).
