# 📘 BLUEPRINT LANDING PAGE & DASHBOARD — `ldp_dashboard.md`

> **Dự án:** CYBERPULSE // Sales & Qty Command Dashboard *(Thiết kế theo bố cục Reference Dark Telemetry)*
> **Nguồn dữ liệu:** `D:\Project_AI\Website\data\Sale_Revenue_Detail.xlsx` (tự động quét toàn bộ file `.xlsx` trong thư mục `data/`)
> **Phạm vi dữ liệu hiện tại:** `01/01/2026 – 20/11/2026` (11 tháng) | `5,443` dòng giao dịch sạch | `31` Sales Site Codes | `5` Region cửa hàng + `3` nhóm `Non-Store`.

---

## 1. Kiến trúc Bố cục 3 Cột (Theo hình ảnh mẫu)

Giao diện được thiết kế theo bố cục **Command Center 3-Column Dark Dashboard**, tối ưu mật độ thông tin điều hành trên một màn hình duy nhất:

```text
+------+--------------------+-----------------------------------------------------------+
| BLUE | LEFT KPI SIDEBAR   | MAIN DARK WORKSPACE CANVAS (#0E1014)                      |
| RAIL | (#191C21)          | [Region][Site][Channel][Toggles]        [2026-01 — 2026-11]|
| (#10 |                    +-----------------------------------------------------------+
| 68DF)| Dashboard  [Reset] | SALES & QTY THEO REPORT DATE (THEO THÁNG)                 |
|      |                    | [Sales+Qty | Region x Month | Sales+GP] [Month|Week|Day]  |
| [##] |  ( 27.7% GM% )     |  ||  ||  ||  ||  ||  ||  ||  ||  ||  ||  ||  (Multi-Bar)  |
| Dash |  [+2.91 Tỷ GP]     |  T01 T02 T03 T04 T05 T06 T07 T08 T09 T10 T11              |
|      |  Sales  [=====]    +-----------------------------+-----------------------------+
| [||] |  COGS   [==== ]    | TOP SALES SITE CODES        | PHÂN BỔ THEO REGION NAME    |
| Mon  |                    | [Top 5 | Top 10 | All 31]   | Total  10.49 Tỷ             |
|      |  Net Export Rate   | 1 (30%) CP02 - BINH DUONG   | [===========================]|
| [H]  |    / 98.x% \       |   Sales [====] Qty [===] GP |  6.05B   1.95B  1.33B  484M |
| Site |  [13,438 units]    | 2 (34%) CP07 - QUAN 7       |  War     HCM2   HCM1   STH  |
|      |                    | 3 (32%) CP01 - 264 NTMK     +-----------------------------+
| [O]  | TB Sales | TB Qty  | 4 (35%) CP08 - GO VAP       | XU HƯỚNG QTY / GM% THEO T   |
| Reg  | ASP      | GP      | 5 (29%) CP46 - THU DUC      |   /\___/\____/‾‾\___/\      |
|      | [Sites]  | [Regs]  |                             |  T01  T03  T05  T07  T09 T11|
| [≡]  | [Xuất]   | [Hoàn]  |                             |                             |
+------+--------------------+-----------------------------+-----------------------------+
```

---

## 2. Hệ thống Màu sắc & Typography (Theo hình mẫu + công nghệ)

| Thành phần | Mã HEX | Vai trò |
| :--- | :--- | :--- |
| **Thanh điều hướng trái** | `#1068DF` / `#1E88F5` | Electric Blue Rail — điều hướng nhanh 6 màn hình (`Dashboard`, `Monthly`, `Site Code`, `Region`, `Channel`, `Data Ledger`) |
| **Sidebar KPI trái** | `#191C21` | Charcoal Panel chứa 2 đồng hồ Gauge + 8 chỉ số tổng quan |
| **Nền chính Workspace** | `#0E1014` / `#15181D` | Obsidian Dark Canvas giúp biểu đồ đa sắc bật nổi sắc nét |
| **Series Biểu đồ đa sắc** | `#12D37A` (Emerald), `#14B8A6` (Teal), `#1D7AFC` (Blue), `#7C3AED` (Violet), `#E53E51` (Crimson), `#F59E0B` (Amber), `#F97316` (Orange), `#38BDF8` (Sky) | Đúng dải màu sinh động của hình mẫu, tối ưu nhận diện từng Region & Metric |
| **Typography** | `Chakra Petch` + `Be Vietnam Pro` + `JetBrains Mono` | Tiêu đề công nghệ, nội dung Tiếng Việt mượt, số liệu thẳng cột (`tabular-nums`) |

---

## 3. Tính năng Tương tác Biểu đồ & Cross-Filtering

1. **Thanh điều hướng Blue Rail (6 View chuyên biệt):**
   - `Dashboard`: Bố cục chuẩn giống hình ảnh mẫu (tổng quan đa biểu đồ trên 1 màn hình).
   - `Monthly Report`: Phóng lớn biểu đồ `Sales & Qty` theo `Month / Week / Day`, hỗ trợ DataZoom & tăng trưởng `MoM %`.
   - `Site Code Report`: Xếp hạng toàn bộ 31 mã `Sales Site Code` dạng `Ranked Bar` / `Treemap` / `Scatter (Sales × Qty)`.
   - `Region Report`: Biểu đồ `Donut` + `Stacked Monthly` cho từng vùng.
   - `Channel & Brand`: Cơ cấu `Warranty / Store / Corp / Phone` & Top nhóm hàng `Subcat 2 / Brand`.
   - `Data Ledger`: Bảng tổng hợp Site Code, Ma trận `Region × Month` và tra cứu `5,443` dòng giao dịch + **Export CSV UTF-8**.
2. **Tương tác trực tiếp trên Dashboard:**
   - **Click vào cột Tháng** ở biểu đồ trên cùng → Cross-filter toàn bộ đồng hồ Gauge, Top 5 Site Codes, Region Modality và biểu đồ xu hướng.
   - **Click vào bất kỳ dòng nào trong Top Sales Site Codes** → Lọc chéo riêng Site Code đó.
   - **Click vào bất kỳ khối màu hoặc ô Region nào** trong mục `Phân bổ theo Region Name` → Lọc chéo toàn bộ theo Region đó.
   - **Bộ lọc nhanh:** Dropdown `Region`, `Site Code`, `Channel`, `Xuất/Hoàn`, khoảng tháng `Từ Tháng — Đến Tháng`, công tắc **Ẩn đơn sỉ T8 (≥100 Qty)** và **Chỉ 5 Region CH**.

---

## 4. Triển khai Cloudflare Pages & Tên miền

- Toàn bộ web tĩnh nằm trong thư mục `public/` (không chứa file Excel gốc).
- Cấu hình sẵn `wrangler.toml`, `public/_headers` và hướng dẫn chi tiết trỏ tên miền chính thức tại [DEPLOY_CLOUDFLARE.md](file:///d:/Project_AI/Website/DEPLOY_CLOUDFLARE.md).
