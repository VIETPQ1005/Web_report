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

### Cách 1: Bấm nút **↻ Update Data** ngay trên Website (Tự động đọc thư mục gốc — Không cần kéo thả file)

1. **Thiết lập 1 lần duy nhất (trên Chrome / Edge):**
   - Mở **`https://web-report-47sq.netlify.app/`** → bấm nút **↻ Update Data** ở góc trên bên phải (hoặc nút **⚙** ngay bên cạnh).
   - Bấm **`📁 Liên kết thư mục gốc & Cập nhật ngay`** → chọn thư mục **`D:\Project_AI\Website\data`**.
   - Trình duyệt sẽ ghi nhớ liên kết thư mục này vĩnh viễn trong IndexedDB.
2. **Từ những lần sau (1-click tự động hoàn toàn):**
   - Bạn chỉ cần chép/lưu file Excel mới (`Sale_Revenue_Detail.xlsx`, `Inventory_Details.xlsx`, ...) vào `D:\Project_AI\Website\data\`.
   - Mở web → bấm đúng 1 nút **↻ Update Data** → Web tự động quét toàn bộ file `.xlsx` trong thư mục gốc (bỏ qua file tạm `~$*`), tự nhận diện **Sales** & **Tồn Kho**, lọc bỏ PII và đẩy thẳng lên **Netlify Cloud Live** trong ~2 giây!
   - Người xem ở máy khác / điện thoại bấm **↻ Update Data** (hoặc **🔄 Tải mới từ Web**) sẽ kéo ngay số liệu mới nhất về màn hình.

> **Bảo mật tùy chọn (Khuyên dùng khi bật Public Web):**
> Để tránh người lạ tự ý đồng bộ đè dữ liệu lên web công khai, vào **Netlify Dashboard → Project configuration → Environment variables → Add a variable**:
> - **Key:** `UPDATE_DATA_KEY`
> - **Value:** mật khẩu/mã PIN bạn chọn (ví dụ `Sales2026!`)
> - **Scopes:** bật **Functions** → **Trigger deploy** để áp dụng.

### Cách 2: Chạy nhanh 1-click trên máy tính (`UPDATE_DATA.bat`)

Nhấp đúp [UPDATE_DATA.bat](file:///d:/Project_AI/Website/UPDATE_DATA.bat) trong `D:\Project_AI\Website\`: tự động đọc `data\*.xlsx`, đẩy thẳng lên `https://web-report-47sq.netlify.app/api/report-data` (có hiệu lực sau 2 giây) và đồng bộ luôn bản gốc lên GitHub!
