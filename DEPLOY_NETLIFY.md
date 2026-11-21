# 🚀 Hướng dẫn Triển khai lên Netlify & Trỏ Tên Miền Chính Thức

Dự án đã có sẵn file cấu hình `netlify.toml` (tự động chỉ định thư mục xuất bản `publish = "public"` và header bảo mật).

---

## Cách 1: Kết nối GitHub trên app.netlify.com (Khuyên dùng — Tự động Deploy)

1. Đăng nhập **[https://app.netlify.com/](https://app.netlify.com/)**.
2. Nhấn **Add new project** (hoặc **Add new site**) → **Import an existing project**.
3. Chọn **Deploy with GitHub** → cấp quyền và chọn repository **`VIETPQ1005/Web_report`**.
4. Netlify sẽ **tự động đọc `netlify.toml`** và điền sẵn:
   - **Branch to deploy:** `main`
   - **Build command:** *(để trống)*
   - **Publish directory:** `public`
5. Nhấn **Deploy site** → Chờ ~10–15 giây để nhận link HTTPS dạng `https://<ten-site>.netlify.app`.

---

## Cách 2: Kéo thả nhanh (Manual Deploy)

1. Tại [https://app.netlify.com/](https://app.netlify.com/) → **Add new project** → **Deploy manually**.
2. Kéo thả nguyên thư mục `D:\Project_AI\Website\public` vào khung upload → Web chạy ngay lập tức.

---

## Bước 2: Đổi tên subdomain & Trỏ Tên Miền Chính Thức (Custom Domain)

1. **Đổi subdomain miễn phí (tùy chọn):**
   - Vào **Site configuration** → **Site details** → **Change site name** → đặt tên gọn (ví dụ `cyberpulse-sales-report.netlify.app`).
2. **Gắn tên miền riêng (ví dụ `report.yourdomain.com`):**
   - Vào **Domain management** → **Add a domain** → nhập tên miền của bạn.
   - Tại nhà cung cấp DNS (Cloudflare, Mắt Bão, Nhân Hòa, Namecheap, GoDaddy...):
     - Với **subdomain** (`report.yourdomain.com`): tạo bản ghi **`CNAME`**:
       | Type | Name / Host | Value / Target |
       | :--- | :--- | :--- |
       | `CNAME` | `report` | `<ten-site>.netlify.app` |
     - Với **root domain** (`yourdomain.com`): tạo bản ghi **`A`** trỏ về IP cân bằng tải của Netlify `75.2.60.5` (hoặc dùng Netlify DNS).
3. **Bật HTTPS miễn phí:**
   - Vào **Domain management** → **HTTPS** → nhấn **Verify DNS configuration** → Netlify tự động cấp chứng chỉ SSL **Let's Encrypt** miễn phí.

---

## Bước 3: Quy trình cập nhật dữ liệu báo cáo sau này

Mỗi khi có file Excel mới trong `D:\Project_AI\Website\data\`:

```powershell
cd D:\Project_AI\Website
python scripts/build_data.py
git add public/data/
git commit -m "data: update sales revenue report"
git push
```

Netlify sẽ tự động phát hiện commit mới trên GitHub và cập nhật website sau ~10 giây!
