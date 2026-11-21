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

### Cách 1: Bấm nút **⬆ Update Data** ngay trên Website (Nhanh nhất — 3 giây)

1. Mở website báo cáo trên Netlify → bấm nút **⬆ Update Data** ở góc trên bên phải (hoặc trên thanh menu xanh bên trái).
2. Chọn chế độ:
   - **Thay thế toàn bộ (Replace):** thay toàn bộ báo cáo bằng file Excel mới.
   - **Gộp thêm (Merge):** nối thêm tháng/giao dịch mới vào dữ liệu đang hiển thị.
3. Kéo thả hoặc chọn file `.xlsx` (hỗ trợ nhiều file cùng lúc). Hệ thống tự động lọc bỏ toàn bộ thông tin cá nhân (Zero-PII) ngay trên máy bạn và hiển thị bảng đối soát số liệu (`Total Sales`, `Total Qty`, `GP`, `GM%`, số dòng chênh lệch).
4. Bấm **☁ Cập nhật lên Web (Live)** → Dữ liệu được lưu vào **Netlify Blobs** thông qua Netlify Function (`/api/report-data`), có hiệu lực **ngay lập tức cho mọi người truy cập link web** mà không cần push Git hay deploy lại.

> **Bảo mật tùy chọn (Khuyên dùng khi bật Public Web):**
> Để tránh người lạ trên mạng tự ý tải đè dữ liệu lên web công khai, vào **Netlify Dashboard → Project configuration → Environment variables → Add a variable**:
> - **Key:** `UPDATE_DATA_KEY`
> - **Value:** mật khẩu/mã PIN bạn chọn (ví dụ `MySecret2026!`)
> - **Scopes:** bật **Functions**
> - Sau đó vào **Deploys → Trigger deploy** để áp dụng. Từ lúc đó, khi bấm **Cập nhật lên Web** sẽ yêu cầu nhập đúng mã bảo vệ này.

### Cách 2: Chạy nhanh 1-click từ máy tính (Đồng bộ cả GitHub)

Chép file Excel mới vào `D:\Project_AI\Website\data\` rồi nhấp đúp file **`UPDATE_DATA.bat`** (hoặc chạy lệnh):

```powershell
cd D:\Project_AI\Website
python scripts/build_data.py
git add public/data/
git commit -m "data: update sales revenue report"
git push
```

Netlify sẽ tự động phát hiện commit mới trên GitHub và cập nhật dữ liệu gốc sau ~15 giây!
