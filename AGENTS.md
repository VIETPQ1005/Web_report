# PHONG VŨ // ACCY BI Command Dashboard — Workspace Rules

## 1. Quy trình Chạy & Đồng bộ Code (Local + GitHub Only)
- **Không deploy ra Netlify:** Tuyệt đối không chạy lệnh deploy lên Netlify hay gọi API đồng bộ Netlify.
- **Chạy Local:** Mọi thay đổi giao diện và dữ liệu được kiểm tra trực tiếp trên máy chủ Local phục vụ từ thư mục `public/` (mặc định tại `http://localhost:8080` bằng `python -m http.server 8080 --directory public` với `BypassSandbox: true`).
- **Đồng bộ GitHub:** Sau khi kiểm tra cú pháp (`node --check public/app.js`), chỉ commit và push trực tiếp lên nhánh `main` của GitHub (`git -c safe.directory=D:/Project_AI/Website push origin main` với `BypassSandbox: true`).
- **Chống Cache trình duyệt:** Khi cập nhật `public/app.js` hoặc `public/styles.css`, luôn tăng mã phiên bản query string (`?v=...`) trong `public/index.html` để trình duyệt tại Local tải ngay code mới.

## 2. Quy tắc Nghiệp vụ & Dữ liệu Ngành hàng (ACCY)
- **Gộp `NH03` vào `NH93` trên tất cả báo cáo:**
  - Do `NH03` chuyển dịch sang `NH93` từ Tháng 03/2026, toàn bộ dữ liệu lịch sử và phát sinh của `NH03` phải luôn được gộp chung và xem như là **`NH93` (`NH93 - Linh kiện sửa chữa`)** trên tất cả các báo cáo, bộ lọc, biểu đồ so sánh năm (2025 vs 2026) và script ETL (`scripts/build_data.py` & `public/app.js`).
  - 3 Ngành hàng hiển thị chính của ACCY là: **`NH11` (Phụ kiện)**, **`NH06` (Thiết bị ngoại vi)**, và **`NH93` (Linh kiện sửa chữa — đã bao gồm `NH03`)**. Chỉ ẩn `NH07` và `NH10`.
- **Báo cáo Target & Tỷ trọng (`Proport %`):**
  - `YTD Sales`, `Proport (%)`, `Vs LY (%)` và `Vs Target (%)` phải luôn được tính toán thực tế từ cột `Sales` của file `Sale_Revenue_Detail.xlsx`, đối chiếu với Kế hoạch Target chuẩn (`NH06`: 15.777 Tr; `NH11`: 132.421 Tr; `NH93`: 17.668 Tr; `Total`: 165.866 Tr VND).
- **Khóa Cache Lịch sử Sales:**
  - Giữ nguyên cơ chế khóa dòng lịch sử (`FROZEN_SALES_END_ROW = 407593` trong `data/.sales_frozen_cache.json.gz`) để tối ưu tốc độ cập nhật dữ liệu mới.

## 3. Quy chuẩn Giao diện & Trải nghiệm (UI/UX)
- **Hỗ trợ `Ctrl + Click` đa lựa chọn (Multi-Select):** Tất cả các bộ lọc (nút `CATEGORY`, `SUBCAT 2`, các bộ lọc riêng của Sales, Inventory, Bad Stock và click lọc chéo trên bảng/biểu đồ) phải luôn hỗ trợ giữ `Ctrl + Click` (hoặc tích chọn `☑`) để chọn nhiều Option cùng lúc.
- **Tương phản 2 chế độ Dark Mode & Light Mode:** Mọi badge, thẻ KPI và bảng Pivot phải đảm bảo độ tương phản rõ nét ở cả Dark Mode và Light Mode (`body.theme-light`).
