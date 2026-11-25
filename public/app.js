/* ==========================================================================
   CYBERPULSE COMMAND DASHBOARD — Reference-Aligned Interactive BI Engine
   ========================================================================== */

(() => {
  "use strict";

  const COLORS = {
    emerald: "#12D37A",
    teal: "#14B8A6",
    violet: "#7C3AED",
    crimson: "#E53E51",
    blue: "#1D7AFC",
    sky: "#38BDF8",
    amber: "#F59E0B",
    orange: "#F97316",
    cyan: "#00E5FF",
    gridLine: "rgba(255, 255, 255, 0.07)",
    axisLine: "rgba(255, 255, 255, 0.14)",
    axisLabel: "#8492A6",
    textMain: "#E2E8F0",
    textSub: "#CBD5E1",
    textMuted: "#94A3B8",
    pieBorder: "#15181D",
    tooltipBg: "rgba(15, 18, 24, 0.96)",
    tooltipBorder: "rgba(29, 122, 252, 0.55)",
  };

  // Vibrant multi-color palette matching the reference's Dialogue Volume & Modality colors
  const REGION_COLORS = {
    "Non-Store (Warranty)": "#1D7AFC",
    "HCM 2": "#12D37A",
    "HCM 1": "#14B8A6",
    "SOUTHERN": "#7C3AED",
    "264": "#F59E0B",
    "CENTRAL": "#38BDF8",
    "Non-Store (Corp)": "#F97316",
    "Non-Store (Phone)": "#E53E51",
  };

  const FALLBACK_COLORS = [
    "#12D37A", "#14B8A6", "#7C3AED", "#E53E51",
    "#1D7AFC", "#38BDF8", "#F59E0B", "#F97316",
  ];

  // Official Management Target & Actual Baseline Data (Category Level — NH03 merged into NH93)
  const TARGET_BENCHMARK = {
    unit: "Triệu VND",
    categories: {
      "NH06": {
        code: "NH06",
        label: "NH06-Thiết bị ngoại vi",
        ytdSales: 5621.41,
        vsLyPct: -17.7,
        proportPct: 5.01,
        target: 15777,
        vsTargetPct: 35.63,
        lySales: 6830.55,
      },
      "NH11": {
        code: "NH11",
        label: "NH11-Phụ kiện",
        ytdSales: 96120.36,
        vsLyPct: 27.1,
        proportPct: 85.63,
        target: 132421,
        vsTargetPct: 72.59,
        lySales: 75648.55,
      },
      "NH93": {
        code: "NH93",
        label: "NH93-Linh kiện sửa chữa",
        ytdSales: 10506.51,
        vsLyPct: 39.1,
        proportPct: 9.36,
        target: 17668,
        vsTargetPct: 59.47,
        lySales: 7553.22,
      },
    },
    total: {
      code: "TOTAL",
      label: "Total",
      ytdSales: 112248.28,
      vsLyPct: 24.7,
      proportPct: 100,
      target: 165866,
      vsTargetPct: 67.67,
      lySales: 90032.31,
    },
  };

  const PRICE_SEGMENTS = [
    "< 150K", "150K - 300K", "300K - 500K", "500K - 1M",
    "1M - 2M", "2M - 3M", "3M - 5M", "> 5M",
  ];

  const PRICE_SEGMENT_COLORS = [
    "#38BDF8", "#12D37A", "#14B8A6", "#1D7AFC",
    "#F59E0B", "#F97316", "#7C3AED", "#E53E51",
  ];

  function getPriceSegmentIndex(unitPrice) {
    const p = Math.abs(unitPrice || 0);
    if (p < 150000) return 0;
    if (p < 300000) return 1;
    if (p < 500000) return 2;
    if (p < 1000000) return 3;
    if (p < 2000000) return 4;
    if (p < 3000000) return 5;
    if (p < 5000000) return 6;
    return 7;
  }

  // Exact (Subcat2 | Brand) item-type weights from Master Product & Sales by SKU:
  // [[hddQtyRatio, usbQtyRatio, cableQtyRatio, chargerQtyRatio], [hddSalesRatio, usbSalesRatio, cableSalesRatio, chargerSalesRatio]]
  const SUBCAT_BRAND_ITEM_WEIGHTS = {
    "NH11-01-01-Phụ kiện lưu trữ|Sandisk": [[0, 0.460998, 0, 0], [0, 0.399539, 0, 0]],
    "NH11-01-04-Phụ kiện kết nối|Khác": [[0, 0, 0.992932, 0], [0, 0, 0.933839, 0]],
    "NH11-01-01-Phụ kiện lưu trữ|Kingston": [[0, 0.986892, 0, 0], [0, 0.98929, 0, 0]],
    "NH11-01-01-Phụ kiện lưu trữ|Kioxia": [[0, 0.428283, 0, 0], [0, 0.342132, 0, 0]],
    "NH11-01-04-Phụ kiện kết nối|Ugreen": [[0, 0, 0.708882, 0], [0, 0, 0.604351, 0]],
    "NH11-01-04-Phụ kiện kết nối|VegGieg": [[0, 0, 1, 0], [0, 0, 1, 0]],
    "NH11-02-02-Thiết bị sạc, pin|Volwatt": [[0, 0, 0.466249, 0.533751], [0, 0, 0.35351, 0.64649]],
    "NH11-02-02-Thiết bị sạc, pin|Baseus": [[0, 0, 0.486309, 0.28411], [0, 0, 0.213664, 0.30292]],
    "NH11-01-04-Phụ kiện kết nối|Baseus": [[0, 0, 0.00089, 0], [0, 0, 0.00081, 0]],
    "NH11-01-07-Ổ cứng gắn ngoài|Seagate": [[1, 0, 0, 0], [1, 0, 0, 0]],
    "NH11-02-02-Thiết bị sạc, pin|9Fit": [[0, 0, 0.18171, 0.81829], [0, 0, 0.254846, 0.745154]],
    "NH11-01-01-Phụ kiện lưu trữ|Transcend": [[0, 0.050633, 0, 0], [0, 0.033088, 0, 0]],
    "NH11-02-02-Thiết bị sạc, pin|Energizer": [[0, 0, 0, 0.00145], [0, 0, 0, 0.047259]],
    "NH11-01-07-Ổ cứng gắn ngoài|WD": [[1, 0, 0, 0], [1, 0, 0, 0]],
    "NH11-99-02-Ổ cắm|LiOA": [[0, 0, 0, 0.034132], [0, 0, 0, 0.05358]],
    "NH11-01-04-Phụ kiện kết nối|Orico": [[0, 0, 0.3, 0], [0, 0, 0.349486, 0]],
    "NH11-01-07-Ổ cứng gắn ngoài|Sandisk": [[1, 0, 0, 0], [1, 0, 0, 0]],
    "NH11-01-07-Ổ cứng gắn ngoài|Samsung": [[1, 0, 0, 0], [1, 0, 0, 0]],
    "NH11-01-04-Phụ kiện kết nối|HP": [[0, 0, 0.960912, 0], [0, 0, 0.873687, 0]],
    "NH11-02-02-Thiết bị sạc, pin|Pisen": [[0, 0, 0.857418, 0.131342], [0, 0, 0.590332, 0.386578]],
    "NH11-02-02-Thiết bị sạc, pin|Mazer": [[0, 0, 0.593323, 0.29742], [0, 0, 0.286929, 0.587041]],
    "NH11-02-02-Thiết bị sạc, pin|Divoom": [[0, 0, 1, 0], [0, 0, 1, 0]],
    "NH11-01-07-Ổ cứng gắn ngoài|Kioxia": [[1, 0, 0, 0], [1, 0, 0, 0]],
    "NH11-02-02-Thiết bị sạc, pin|Aukey": [[0, 0, 0.184434, 0.168738], [0, 0, 0.063587, 0.171573]],
    "NH11-02-02-Thiết bị sạc, pin|Belkin": [[0, 0, 0.547358, 0.449651], [0, 0, 0.365866, 0.633364]],
    "NH11-01-07-Ổ cứng gắn ngoài|Transcend": [[1, 0, 0, 0], [1, 0, 0, 0]],
    "NH11-02-02-Thiết bị sạc, pin|Targus": [[0, 0, 0, 1], [0, 0, 0, 1]],
    "NH11-02-02-Thiết bị sạc, pin|Mophie": [[0, 0, 0.500157, 0.389745], [0, 0, 0.3134, 0.381817]],
    "NH11-01-04-Phụ kiện kết nối|Kingmaster": [[0, 0, 0.337234, 0], [0, 0, 0.094901, 0]],
    "NH11-01-04-Phụ kiện kết nối|Philips": [[0, 0, 0.04, 0], [0, 0, 0.003183, 0]],
    "NH11-01-04-Phụ kiện kết nối|Unitek": [[0, 0, 0.968466, 0], [0, 0, 0.841788, 0]],
    "NH11-01-07-Ổ cứng gắn ngoài|Kingston": [[1, 0, 0, 0], [1, 0, 0, 0]],
    "NH11-01-07-Ổ cứng gắn ngoài|Adata": [[1, 0, 0, 0], [1, 0, 0, 0]],
    "NH11-01-04-Phụ kiện kết nối|Dtech": [[0, 0, 0.595745, 0], [0, 0, 0.241214, 0]],
    "NH11-01-04-Phụ kiện kết nối|Cliptec": [[0, 0, 1, 0], [0, 0, 1, 0]],
    "NH11-01-04-Phụ kiện kết nối|Belkin": [[0, 0, 0.991351, 0], [0, 0, 0.972581, 0]],
    "NH11-02-02-Thiết bị sạc, pin|Elecom": [[0, 0, 0.5, 0], [0, 0, 0.665924, 0]],
    "NH11-01-04-Phụ kiện kết nối|Elecom": [[0, 0, 1, 0], [0, 0, 1, 0]],
    "NH11-01-04-Phụ kiện kết nối|Mpower": [[0, 0, 0.944444, 0], [0, 0, 0.973319, 0]],
    "NH11-01-04-Phụ kiện kết nối|Soundmax": [[0, 0, 1, 0], [0, 0, 1, 0]],
    "NH11-01-07-Ổ cứng gắn ngoài|Lacie": [[1, 0, 0, 0], [1, 0, 0, 0]],
    "NH11-02-02-Thiết bị sạc, pin|Orico": [[0, 0, 0, 0.2], [0, 0, 0, 0.386635]],
    "NH11-01-07-Ổ cứng gắn ngoài|Crucial": [[1, 0, 0, 0], [1, 0, 0, 0]],
    "NH11-01-07-Ổ cứng gắn ngoài|Lexar": [[1, 0, 0, 0], [1, 0, 0, 0]],
    "NH11-02-02-Thiết bị sạc, pin|Samsung": [[0, 0, 0, 1], [0, 0, 0, 1]],
    "NH11-02-02-Thiết bị sạc, pin|Remax": [[0, 0, 0.965517, 0], [0, 0, 0.991077, 0]],
    "NH11-01-07-Ổ cứng gắn ngoài|Asus": [[1, 0, 0, 0], [1, 0, 0, 0]],
    "NH11-02-04-Phụ kiện dùng cho Apple|Mophie": [[0, 0, 0.048193, 0.066934], [0, 0, 0.033278, 0.03498]],
    "NH11-02-02-Thiết bị sạc, pin|Tezag": [[0, 0, 0, 1], [0, 0, 0, 1]],
    "NH11-02-04-Phụ kiện dùng cho Apple|Divoom": [[0, 0, 0, 1], [0, 0, 0, 1]],
    "NH11-02-02-Thiết bị sạc, pin|Ugreen": [[0, 0, 0, 1], [0, 0, 0, 1]],
    "NH11-02-02-Thiết bị sạc, pin|Aver": [[0, 0, 0, 1], [0, 0, 0, 1]],
  };

  function getRowItemBreakdown(subName, brandName, qty, sales) {
    const key = `${subName}|${brandName}`;
    let w = SUBCAT_BRAND_ITEM_WEIGHTS[key];
    if (!w) {
      const s = String(subName || "").toLowerCase();
      if (s.includes("nh11-01-07") || s.includes("ổ cứng gắn ngoài")) {
        w = [[1, 0, 0, 0], [1, 0, 0, 0]];
      } else {
        return null;
      }
    }
    return {
      hddQty: qty * w[0][0], hddSales: sales * w[1][0],
      usbQty: qty * w[0][1], usbSales: sales * w[1][1],
      cableQty: qty * w[0][2], cableSales: sales * w[1][2],
      chargerQty: qty * w[0][3], chargerSales: sales * w[1][3],
    };
  }

  // Compact row column indexes (Sales)
  const C = {
    DATE: 0,
    MONTH: 1,
    WEEK: 2,
    SITE: 3,
    STORE: 4,
    REGION: 5,
    CHANNEL: 6,
    SUBCAT: 7,
    BRAND: 8,
    ORDER_TYPE: 9,
    SKU: 10,
    QTY: 11,
    SALES: 12,
    COGS: 13,
    GP: 14,
    CAT: 15,
    COUNT: 16,
    IS_BULK: 17,
  };

  // Compact row column indexes (Inventory Details)
  const INV_C = {
    SKU: 0,
    SITE: 1,
    SITE_NAME: 2,
    SUBCAT: 3,
    BRAND: 4,
    BIN_CODE: 5,
    BIN_TYPE: 6,
    BIN_ZONE: 7,
    STATUS: 8,
    LAST_RECV: 9,
    FIRST_RECV: 10,
    AGING: 11,
    QTY: 12,
    VALUE: 13,
    NET_VALUE: 14,
    UNIT_COST: 15,
    LISTED_PRICE: 16,
    MIN_STOCK: 17,
    RANGE: 18,
    AGING_FIRST: 19,
    CAT: 20,
  };

  // Master Product column indexes (Schema v3: CAT at index 2)
  const MP_C = {
    SKU: 0, NAME: 1, CAT: 2, SUBCAT: 3, SUBCAT3: 4, BRAND: 5, LISTING: 6, STATUS: 7,
    RANGE: 8, HAS_SERIAL: 9, PROMO: 10, LISTED_PRICE: 11, SR_PROMO: 12,
    WCOGS: 13, LAST_PUR: 14, LATEST_QUOTE: 15, TEMP_GP: 16, TEMP_GM: 17,
    INV_QTY: 18, INV_VAL: 19, SALES_30D: 20, WARRANTY_MO: 21, WARRANTY_NOTE: 22,
  };

  // SKU Level (7D/30D/90D/180D) column indexes
  const SKU_C = {
    SKU: 0, NAME: 1, SUBCAT: 2, BRAND: 3, STATUS: 4, RANGE: 5,
    S7D: 6, S30D: 7, S90D: 8, S180D: 9, GM: 10, SDAYS: 11,
    INV_QTY: 12, INV_VAL: 13, UNIT_COST: 14, LISTED_PRICE: 15, CAT: 16,
  };

  // Branch Level (SKU x Site 7D/30D/90D/180D) column indexes
  const BR_C = {
    SKU: 0, SITE: 1, SITE_NAME: 2, S7D: 3, S30D: 4, S90D: 5, S180D: 6,
    SDAYS: 7, INV_QTY: 8, INV_VAL: 9, UNIT_COST: 10,
  };

  // Serial Details + Bad Stock joined column indexes
  const SN_C = {
    SN: 0, SKU: 1, SKU_NAME: 2, SITE: 3, SUBCAT: 4, BRAND: 5, SUPPLIER: 6,
    LOC: 7, BIN_TYPE: 8, BIN_ZONE: 9, IMPORT_TYPE: 10, STATUS: 11, RANGE: 12,
    FIRST_DATE: 13, LAST_DATE: 14, DAYS_FIRST: 15, DAYS_LAST: 16,
    INV_VAL: 17, NET_VAL: 18, PP_VAL: 19, IN_BAD_FILE: 20,
    AGING_COMP: 21, AGING_SITE: 22, SDAY_COMP: 23, SDAY_SITE: 24,
    BAD_COMP: 25, BAD_SITE: 26, CAT: 27,
  };

  // Serial Cube pre-aggregated column indexes (invSerialCube.rows)
  const SC_C = {
    CAT: 0, SUBCAT: 1, SITE: 2, BIN_TYPE: 3, BIN_ZONE: 4, BRAND: 5,
    STATUS: 6, RANGE: 7, IN_BAD_FILE: 8, BAD_COMP: 9, BAD_SITE: 10,
    AGING_COMP_B: 11, AGING_SITE_B: 12, COUNT: 13, VAL: 14,
  };

  const BIN_TYPE_COLORS = {
    "Hàng bán mới tại kho": "#12D37A",
    "Hàng hư hỏng": "#E53E51",
    "Hàng bảo hành": "#1D7AFC",
    "Đang vận hành trong kho": "#F59E0B",
    "Hàng nhập": "#38BDF8",
    "Hàng khác": "#7C3AED",
    "Hàng chờ xử lý": "#F97316",
  };

  const BAD_STOCK_ORDER = [
    "Tồn thông thường",
    "Tồn bán chậm",
    "Tồn lâu",
    "Tồn xấu",
    "Tồn rất xấu",
  ];

  const BAD_STOCK_COLORS = {
    "Tồn thông thường": "#12D37A",
    "Tồn bán chậm": "#38BDF8",
    "Tồn lâu": "#F59E0B",
    "Tồn xấu": "#F97316",
    "Tồn rất xấu": "#E53E51",
  };

  const STATUS_COLORS = {
    "Normal": "#12D37A",
    "Discontinued": "#F59E0B",
    "Market Shortage": "#7C3AED",
    "EOL": "#E53E51",
  };

  // Exact 6 Aging Buckets requested: 30, 60, 90, 180, 365, >365 (+ unknown)
  const AGING_BUCKETS = [
    { key: "0-30", label: "≤ 30 ngày", color: "#12D37A", test: (d) => d >= 0 && d <= 30 },
    { key: "31-60", label: "31–60 ngày", color: "#14B8A6", test: (d) => d >= 31 && d <= 60 },
    { key: "61-90", label: "61–90 ngày", color: "#38BDF8", test: (d) => d >= 61 && d <= 90 },
    { key: "91-180", label: "91–180 ngày", color: "#1D7AFC", test: (d) => d >= 91 && d <= 180 },
    { key: "181-365", label: "181–365 ngày", color: "#F59E0B", test: (d) => d >= 181 && d <= 365 },
    { key: "365+", label: "> 365 ngày", color: "#E53E51", test: (d) => d > 365 },
    { key: "unknown", label: "Chưa rõ ngày", color: "#64748B", test: (d) => d < 0 },
  ];

  const state = {
    raw: null,
    dataSourceMode: "default",    // cloud | local | default
    cloudAvailable: false,
    cloudAuthRequired: false,
    cloudUpdatedAt: "",
    monthsAll: [],
    activeView: "dashboard",
    theme: localStorage.getItem("cyberpulse_theme") === "light" ? "light" : "dark",
    // Tier 1 Global Master Filter (applies to ALL Tabs & Left Sidebar)
    globalCat: "",
    globalSubcat: "",
    targetDataSource: "filtered", // filtered | benchmark (both computed from actual Sale_Revenue_Detail)
    targetExpandedCats: new Set(),
    shardsLoaded: false,
    shardsLoading: false,
    // Inventory sub-state
    inv: {
      site: "",
      binType: "",
      binZone: "",
      subcat: "",
      brand: "",
      status: "",
      range: "",
      badStock: "",
      agingBucket: "",
      sellableOnly: false,
      damagedOnly: false,
      badScope: "company",        // company | site
      badFilter: "classified",    // classified | all
      badMetric: "value",         // value | qty
      agingBasis: "first",        // first | last
      agingMetric: "both",        // both | value | qty
      statusDim: "status_inv",    // status_inv | range_inv | status_master
      statusMetric: "value",      // value | qty
      siteMode: "stacked",        // stacked | total
      siteMetric: "value",        // value | qty
      binDim: "binType",          // binType | binZone
      binMetric: "value",         // value | qty
      catDim: "subcat",           // subcat | brand
      catMetric: "value",         // value | qty
      tableTab: "raw",            // raw | serials | velocity | sites | master
      tableSearch: "",
      tableSortCol: "value",
      tableSortDir: "desc",
      tablePage: 1,
      tablePageSize: 50,
      lastExport: { headers: [], rows: [], filename: "inventory_report.csv" },
    },
    // SKU / Serial 360 Lookup state + O(1) indexes
    lookup: {
      selectedSku: "",
      selectedSerial: "",
      serialPage: 1,
      binPage: 1,
      pageSize: 20,
      expandedSites: new Set(),
      idxMaster: new Map(),
      idxSkuVel: new Map(),
      idxBranches: new Map(),
      idxBins: new Map(),
      idxSerialsBySku: new Map(),
      idxSerialBySn: new Map(),
      idxSalesBySku: new Map(),
      idxPriceBySku: new Map(),
      lastExport: { headers: [], rows: [], filename: "sku_profile.csv" },
    },
    // Bad Stock Report sub-state (SKU Tồn xấu / Tồn rất xấu -> Pivot Site & Serial)
    badstock: {
      badType: "",                  // "" means default: Tồn rất xấu + Tồn xấu
      scope: "company",             // company | site | either
      site: "",
      status: "",
      range: "",
      binType: "",
      binZone: "",
      brand: "",
      search: "",
      sortCol: "qty",               // qty | val | agingComp | firstDate | s7d | s30d | s90d | s180d | sku
      sortDir: "desc",
      page: 1,
      pageSize: 25,
      expandedSkus: new Set(),
      lastExport: { headers: [], rows: [], filename: "bad_stock_sku_serial_pivot.csv" },
    },
    // Multi-Competitor Price Compare (Phong Vũ vs TGDD, CellphoneS, ... — Subcat 2 Ổ cứng gắn ngoài)
    priceCompare: {
      loaded: false,
      loading: false,
      data: null,
      mode: "matrix",           // matrix | unmatched
      compFilter: "all",        // all | both | tgdd | cps
      status: "all",            // all | pv_higher | pv_win
      brand: "",
      driveType: "",
      capacity: "",
      search: "",
      sortCol: "diffVsBestVnd",
      sortDir: "desc",
      lastExport: { headers: [], rows: [], filename: "so_sanh_gia_ocgn.csv" },
    },
    // Filters
    region: "",
    site: "",
    channel: "",
    monthFrom: "",
    monthTo: "",
    orderType: "",
    clickedMonth: "",
    excludeBulk: false,
    storeRegionsOnly: false,
    // Dashboard view controls
    heroMode: "sales_qty",        // sales_qty | region_grouped | sales_gp
    heroGranularity: "month",     // month | week | day
    rankLimit: 5,                 // 5 | 10 | 31
    rankSort: "sales",            // sales | qty | gm
    regionMetric: "sales",        // sales | qty | gp
    trendMetric: "qty",           // qty | gm | sales
    yearlyCompareMetric: "sales", // sales | qty | gp
    // Deep views controls
    deepGranularity: "month",
    deepMode: "sales_qty",
    monthlyDailyMonth: "",        // YYYY-MM or all_days
    monthlyDailyMetric: "sales_qty", // sales_qty | sales | qty
    siteChartView: "bar",         // bar | treemap | scatter
    siteChartSort: "sales",       // sales | qty | gm
    channelDim: "segment",        // segment | brand_segment | channel | site
    driverDim: "subcat",          // subcat | brand
    storage: {
      open: false,
      group: "all",               // all | OCGN | SSD | HDD | PK_LUU_TRU | USB | Thẻ nhớ
      metric: "sales",            // sales | qty
      brandMetric: "sales",       // sales | qty
      tableMetric: "sales",       // sales | qty
      tableShareBasis: "col",     // col | row | total
      cap: "",
      brand: "",
      priceBand: "",
      storageMapCache: null,
      lastExport: { headers: [], rows: [], filename: "storage_ocgn_pk_report.csv" },
      matrixExport: { headers: [], rows: [], filename: "storage_matrix_capacity_brand.csv" },
    },
    // Table controls
    tableTab: "sites",            // sites | matrix | raw
    tableSearch: "",
    tableSortCol: "sales",
    tableSortDir: "desc",
    tablePage: 1,
    tablePageSize: 50,
    lastTableExport: { headers: [], rows: [], filename: "export.csv" },
  };

  const charts = {
    gaugeRing: null,
    gaugeSemi: null,
    hero: null,
    trend: null,
    deepMonthly: null,
    deepSite: null,
    deepRegionPie: null,
    deepRegionStack: null,
    deepChannel: null,
    deepDriver: null,
    storageCap: null,
    storageBrand: null,
    storagePrice: null,
    invBadStock: null,
    invStatusRange: null,
    invSite: null,
    invBin: null,
    invAging: null,
    invCat: null,
    lookupVelocity: null,
    targetProgress: null,
    yearlyCompare: null,
    monthlyDaily: null,
  };

  // --- FORMATTERS ---
  const fmtInt = (n) => Math.round(n || 0).toLocaleString("vi-VN");
  const fmtVndFull = (n) => `${Math.round(n || 0).toLocaleString("vi-VN")} ₫`;

  function fmtCompactVnd(val) {
    const abs = Math.abs(val || 0);
    const sign = val < 0 ? "-" : "";
    if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(2)} Tỷ`;
    if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(1)} Tr`;
    if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(0)} K`;
    return `${sign}${Math.round(abs)}`;
  }

  function fmtAxisVnd(val) {
    const abs = Math.abs(val || 0);
    const sign = val < 0 ? "-" : "";
    if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(1)}B`;
    if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(0)}M`;
    if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(0)}K`;
    return `${sign}${val}`;
  }

  function fmtPct(v, d = 1) {
    return isFinite(v) ? `${v.toFixed(d)}%` : "0.0%";
  }

  function esc(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function shortRegionLabel(name) {
    return name
      .replace("Non-Store (Warranty)", "Warranty")
      .replace("Non-Store (Corp)", "Corp")
      .replace("Non-Store (Phone)", "Phone");
  }

  // --- LOCAL INDEXEDDB CACHE (FALLBACK + SAVED SOURCE DIRECTORY HANDLE) ---
  const IDB_NAME = "cyberpulse_sales_db";
  const IDB_STORE = "datasets";
  const IDB_KEY = "latest_v4_nh93_merged";
  const IDB_DIR_KEY = "source_dir_handle";

  function openLocalDb() {
    return new Promise((resolve, reject) => {
      if (typeof indexedDB === "undefined") {
        reject(new Error("IndexedDB unavailable"));
        return;
      }
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function idbGetKey(key) {
    try {
      const db = await openLocalDb();
      return await new Promise((resolve) => {
        const tx = db.transaction(IDB_STORE, "readonly");
        const req = tx.objectStore(IDB_STORE).get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  async function idbSetKey(key, value) {
    try {
      const db = await openLocalDb();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(IDB_STORE, "readwrite");
        tx.objectStore(IDB_STORE).put(value, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      return true;
    } catch {
      return false;
    }
  }

  async function idbDeleteKey(key) {
    try {
      const db = await openLocalDb();
      await new Promise((resolve) => {
        const tx = db.transaction(IDB_STORE, "readwrite");
        tx.objectStore(IDB_STORE).delete(key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    } catch {
      // ignore
    }
  }

  const idbGetLatest = () => idbGetKey(IDB_KEY);
  const idbSetLatest = (payload) => idbSetKey(IDB_KEY, payload);
  const idbClearLatest = () => idbDeleteKey(IDB_KEY);
  const idbGetSourceDir = () => idbGetKey(IDB_DIR_KEY);
  const idbSetSourceDir = (handle) => idbSetKey(IDB_DIR_KEY, handle);
  const idbClearSourceDir = () => idbDeleteKey(IDB_DIR_KEY);

  function isValidDataset(json) {
    return Boolean(
      json &&
      ((Array.isArray(json.rows) && json.rows.length > 0) ||
       (Array.isArray(json.salesCube) && json.salesCube.length > 0))
    );
  }

  function syncSectionCategories(sec) {
    if (!sec || !sec.lookups) return;
    const lk = sec.lookups;
    if (Array.isArray(lk.cats) && lk.cats.length > 0) {
      lk.categories = lk.cats;
    } else if (Array.isArray(lk.categories) && lk.categories.length > 0) {
      lk.cats = lk.categories;
    }
  }

  function normalizePayloadOnLoad(payload) {
    if (!payload || typeof payload !== "object") return payload;
    if (!payload.lookups) payload.lookups = {};
    const lk = payload.lookups;
    if (!Array.isArray(lk.skus) || lk.skus.length === 0) lk.skus = ["Tổng hợp theo Nhóm/Site"];

    // Sync categories <-> cats across all sections BEFORE fallback taxonomy generation
    syncSectionCategories(payload);
    syncSectionCategories(payload.inventory);
    syncSectionCategories(payload.invSerialCube);
    syncSectionCategories(payload.invSerials);
    syncSectionCategories(payload.masterSummary);
    syncSectionCategories(payload.masterProducts);

    // Merge NH03 into NH93 (NH03 transitioned to NH93 in March 2026 — unify across all reports)
    if (Array.isArray(lk.categories)) {
      const idx03 = lk.categories.indexOf("NH03");
      let idx93 = lk.categories.indexOf("NH93");
      if (idx03 !== -1) {
        if (idx93 === -1) {
          lk.categories[idx03] = "NH93";
          idx93 = idx03;
        } else {
          if (Array.isArray(payload.salesCube)) {
            payload.salesCube.forEach((r) => { if (r[4] === idx03) r[4] = idx93; });
          }
          if (Array.isArray(payload.rows)) {
            payload.rows.forEach((r) => { if (r.length > C.CAT && r[C.CAT] === idx03) r[C.CAT] = idx93; });
          }
          if (Array.isArray(payload.salesDaily)) {
            payload.salesDaily.forEach((d) => {
              if (d.length === 8) { if (d[1] === idx03) d[1] = idx93; }
              else if (d.length > 8) { if (d[3] === idx03) d[3] = idx93; }
            });
          }
        }
      }
      lk.cats = lk.categories;
    }

    if (payload.taxonomy && Array.isArray(payload.taxonomy.categories)) {
      const nh03Tax = payload.taxonomy.categories.find((c) => c.code === "NH03");
      if (nh03Tax) {
        let nh93Tax = payload.taxonomy.categories.find((c) => c.code === "NH93");
        if (!nh93Tax) {
          nh03Tax.code = "NH93";
          nh03Tax.label = "Linh kiện sửa chữa";
        } else {
          nh93Tax.subcats = Array.from(new Set([...(nh93Tax.subcats || []), ...(nh03Tax.subcats || [])])).sort();
          payload.taxonomy.categories = payload.taxonomy.categories.filter((c) => c.code !== "NH03");
        }
      }
    }

    // Ensure taxonomy exists (even for legacy or browser-uploaded datasets)
    if (!payload.taxonomy || !Array.isArray(payload.taxonomy.categories) || payload.taxonomy.categories.length === 0) {
      const subSet = new Set([
        ...(lk.subcats || []),
        ...(payload.inventory?.lookups?.subcats || []),
        ...(payload.masterSummary?.lookups?.subcats || []),
        ...(payload.masterProducts?.lookups?.subcats || []),
      ]);
      const catMap = new Map();
      const catNames = {
        NH03: "NH03 — Linh kiện & Thiết bị",
        NH06: "NH06 — Âm thanh & Gaming Gear",
        NH07: "NH07 — Thiết bị văn phòng",
        NH10: "NH10 — Phụ kiện công nghệ",
        NH11: "NH11 — Phụ kiện lưu trữ & Cáp sạc",
        NH93: "NH93 — Linh kiện bảo hành & Sửa chữa",
      };
      (lk.categories || []).forEach((c) => {
        if (c && !catMap.has(c)) catMap.set(c, []);
      });
      Array.from(subSet).sort().forEach((sc) => {
        const m = String(sc).match(/^(NH\d{2})/i);
        const code = m ? m[1].toUpperCase() : "OTHER";
        if (!catMap.has(code)) catMap.set(code, []);
        catMap.get(code).push(sc);
      });
      payload.taxonomy = {
        categories: Array.from(catMap.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([code, subcats]) => ({
          code,
          label: catNames[code] || code,
          subcats,
        })),
        allSubcats: Array.from(subSet).sort(),
      };
    }

    if (!Array.isArray(lk.categories) || lk.categories.length === 0) {
      lk.categories = payload.taxonomy.categories.map((c) => c.code);
      lk.cats = lk.categories;
    }

    // Unpack Schema v3 salesCube into rows compatible with C
    if (Array.isArray(payload.salesCube) && (!Array.isArray(payload.rows) || payload.rows.length === 0)) {
      const monthsL = lk.months || [];
      const sitesL = lk.sites || [];
      const storesL = lk.stores || [];
      const siteDir = payload.siteDirectory || {};
      const siteToStoreIdx = sitesL.map((sc) => {
        const stName = siteDir[sc]?.storeName || sc;
        const idx = storesL.indexOf(stName);
        return idx >= 0 ? idx : 0;
      });

      payload.rows = payload.salesCube.map((r) => {
        const mStr = typeof r[0] === "number" ? (monthsL[r[0]] || "2026-01") : String(r[0]);
        return [
          `${mStr}-01`,              // 0: DATE
          mStr,                      // 1: MONTH
          mStr,                      // 2: WEEK
          r[1],                      // 3: SITE
          siteToStoreIdx[r[1]] || 0, // 4: STORE
          r[2],                      // 5: REGION
          r[3],                      // 6: CHANNEL
          r[5],                      // 7: SUBCAT
          r[6],                      // 8: BRAND
          r[7],                      // 9: ORDER_TYPE
          0,                         // 10: SKU
          r[9],                      // 11: QTY
          r[10],                     // 12: SALES
          r[11],                     // 13: COGS
          r[12],                     // 14: GP
          r[4],                      // 15: CAT
          r[13] || 1,                // 16: COUNT
          r[8] || 0,                 // 17: IS_BULK
        ];
      });
    }
    return payload;
  }

  async function ensureLookupShardsLoaded() {
    if (!state.raw) return false;
    if (state.raw.masterProducts?.rows?.length && state.raw.invSerials?.rows?.length) {
      syncSectionCategories(state.raw.masterProducts);
      syncSectionCategories(state.raw.invSerials);
      state.shardsLoaded = true;
      return true;
    }
    if (state.shardsLoading) return false;
    state.shardsLoading = true;
    try {
      const [mpRes, snRes] = await Promise.all([
        fetch("./data/lookup_master.json", { cache: "no-store" }).catch(() => null),
        fetch("./data/lookup_serials.json", { cache: "no-store" }).catch(() => null),
      ]);
      if (mpRes && mpRes.ok) {
        const mpJson = await mpRes.json();
        if (mpJson && Array.isArray(mpJson.rows)) {
          syncSectionCategories(mpJson);
          state.raw.masterProducts = mpJson;
        }
      }
      if (snRes && snRes.ok) {
        const snJson = await snRes.json();
        if (snJson && Array.isArray(snJson.rows)) {
          syncSectionCategories(snJson);
          state.raw.invSerials = snJson;
        }
      }
      state.shardsLoaded = true;
      buildLookupIndexes();
      initMeta();
      populateInventoryFilters();
      populateBadStockFilters();
      renderLookupQuickPicks();
      if (state.activeView === "lookup" && state.lookup.selectedSku) {
        renderLookupProfile(state.lookup.selectedSku, state.lookup.selectedSerial);
      } else if (state.activeView === "inventory" && (state.inv.tableTab === "serials" || state.inv.tableTab === "master")) {
        renderInvTable(getFilteredInvRows(), getFilteredSerialRows());
      } else if (state.activeView === "badstock") {
        renderBadStockView();
      }
      return true;
    } catch {
      return false;
    } finally {
      state.shardsLoading = false;
    }
  }

  async function loadBaselineData() {
    if (window.REPORT_DATA && isValidDataset(window.REPORT_DATA)) {
      return window.REPORT_DATA;
    }
    const res = await fetch("./data/report_data.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }

  async function fetchWithTimeout(url, options = {}, timeoutMs = 4500) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      return await fetch(url, { ...options, signal: ctrl.signal });
    } finally {
      clearTimeout(timer);
    }
  }

  function countDatasetCategories(d) {
    if (!d || typeof d !== "object") return 0;
    if (Array.isArray(d.taxonomy?.categories) && d.taxonomy.categories.length) return d.taxonomy.categories.length;
    if (Array.isArray(d.lookups?.cats) && d.lookups.cats.length) return d.lookups.cats.length;
    if (Array.isArray(d.lookups?.categories) && d.lookups.categories.length) return d.lookups.categories.length;
    return 0;
  }

  function shouldPreferOverride(candidate, baseline) {
    if (!isValidDataset(candidate)) return false;
    if (!isValidDataset(baseline)) return true;
    if (baseline.storageReport && !candidate.storageReport) return false;
    // Never let an old 1-NH dataset override a multi-NH baseline dataset
    const candCats = countDatasetCategories(candidate);
    const baseCats = countDatasetCategories(baseline);
    if (candCats < baseCats) return false;
    const candRows = candidate.meta?.rowCount || 0;
    const baseRows = baseline.meta?.rowCount || 0;
    if (candRows < baseRows * 0.5) return false;
    const candTime = Date.parse(candidate.meta?.updatedAt || candidate.meta?.generatedAt || "") || 0;
    const baseTime = Date.parse(baseline.meta?.updatedAt || baseline.meta?.generatedAt || "") || 0;
    return candTime >= baseTime;
  }

  // --- INIT ---
  async function init() {
    // Purge legacy v1/v2/v3 IndexedDB cache keys so stale data never persists
    idbDeleteKey("latest");
    idbDeleteKey("latest_v3_6nh");
    idbDeleteKey("latest_v3_storage");

    const isHttp = location.protocol === "http:" || location.protocol === "https:";
    let baseline = null;
    let cloudData = null;
    let loaded = null;
    let sourceMode = "default";

    // Fetch baseline report_data.json and optional cloud override in parallel
    const [baseResult, cloudResult] = await Promise.all([
      loadBaselineData().catch(() => null),
      isHttp ? fetchWithTimeout("/api/report-data", { cache: "no-store" }, 4500).catch(() => null) : Promise.resolve(null),
    ]);

    if (isValidDataset(baseResult)) {
      baseline = baseResult;
    }

    if (cloudResult) {
      if (cloudResult.ok) {
        const ct = cloudResult.headers.get("content-type") || "";
        if (ct.includes("application/json")) {
          const json = await cloudResult.json().catch(() => null);
          if (isValidDataset(json)) {
            cloudData = json;
            state.cloudAvailable = true;
            state.cloudAuthRequired = cloudResult.headers.get("x-auth-required") === "1";
            state.cloudUpdatedAt = cloudResult.headers.get("x-data-updated-at") || json.meta?.updatedAt || "";
          }
        }
      } else if (cloudResult.status === 404) {
        try {
          const body = await cloudResult.json();
          state.cloudAvailable = true;
          state.cloudAuthRequired = Boolean(body?.authRequired);
        } catch {
          // Static host returning HTML 404
        }
      }
    }

    // 1. Use Cloud override only if it is at least as complete & newer than Baseline
    if (cloudData && shouldPreferOverride(cloudData, baseline)) {
      loaded = cloudData;
      sourceMode = "cloud";
    }

    // 2. Check IndexedDB override only if it is at least as complete & newer than Baseline
    if (!loaded) {
      const localCached = await idbGetLatest();
      if (localCached && shouldPreferOverride(localCached, baseline)) {
        loaded = localCached;
        sourceMode = "local";
      } else if (localCached) {
        idbClearLatest();
      }
    }

    // 3. Default to bundled Repo Baseline (full 6-NH dataset)
    if (!loaded && baseline) {
      loaded = baseline;
      sourceMode = "default";
    }

    if (!loaded) {
      document.getElementById("insightText").textContent =
        "Lỗi tải dữ liệu. Hãy chạy lại python scripts/build_data.py hoặc bấm Update Data.";
      return;
    }

    state.raw = normalizePayloadOnLoad(loaded);
    state.dataSourceMode = sourceMode;

    buildLookupIndexes();
    initMeta();
    populateGlobalMasterFilter();
    populateFilters();
    populateInventoryFilters();
    populateBadStockFilters();
    initAllMultiSelectDropdowns();
    syncAllMultiSelectUIs();
    initCharts();
    bindEvents();
    bindInventoryEvents();
    bindBadStockEvents();
    bindPriceCompareEvents();
    bindLookupEvents();
    bindUpdateModalEvents();
    renderLookupQuickPicks();
    renderAll();

    // Warm load 17K Master SKUs & 40K Serials shards in the background right after first paint
    setTimeout(() => {
      ensureLookupShardsLoaded();
    }, 350);
  }

  function formatIsoVn(isoStr) {
    if (!isoStr) return "";
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    return d.toLocaleString("vi-VN", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  }

  function initMeta() {
    const { meta, lookups, inventory } = state.raw;
    const files = [
      ...(meta.sources || []).map((s) => s.file),
      ...(inventory?.meta?.sources || []).map((s) => s.file),
    ].filter(Boolean).join(", ");
    const invSummary = inventory?.meta ? ` • Inv: ${fmtInt(inventory.meta.rowCount)} BIN (${fmtInt(inventory.meta.totals?.qty || 0)} QTY)` : "";
    const updatedTag = meta.updatedAt ? ` • Cập nhật: ${formatIsoVn(meta.updatedAt)}` : "";
    document.getElementById("footerSource").textContent =
      `Source: ${files || "Sale_Revenue_Detail.xlsx"} • Sales: ${fmtInt(meta.rowCount)} rows (${meta.dateMin} → ${meta.dateMax})${invSummary}${updatedTag}`;

    const pill = document.getElementById("dataSourcePill");
    if (pill) {
      pill.classList.remove("cloud", "local");
      if (state.dataSourceMode === "cloud") {
        pill.textContent = "☁ CLOUD LIVE";
        pill.classList.add("cloud");
      } else if (state.dataSourceMode === "local") {
        pill.textContent = "LOCAL CACHE";
        pill.classList.add("local");
      } else {
        pill.textContent = "REPO BASELINE";
      }
    }

    // Update dynamic counts across UI
    const siteCount = lookups.sites.length;
    const rankAllBtn = document.getElementById("rankAllBtn");
    if (rankAllBtn) rankAllBtn.textContent = `All ${siteCount}`;
    const siteTotalLbl = document.getElementById("siteTotalCountLabel");
    if (siteTotalLbl) siteTotalLbl.textContent = String(siteCount);
    const rawTabBtn = document.getElementById("rawTabBtn");
    if (rawTabBtn) rawTabBtn.textContent = `Chi tiết ${fmtInt(meta.rowCount)} giao dịch`;

    const snapBadge = document.getElementById("invSnapshotBadge");
    if (snapBadge) {
      snapBadge.textContent = inventory?.meta?.snapshotDate
        ? `Snapshot: ${inventory.meta.snapshotDate} • ${fmtInt(inventory.meta.rowCount)} dòng`
        : "Chưa có dữ liệu tồn kho";
    }
    const invRawTab = document.getElementById("invRawTabBtn");
    if (invRawTab && inventory?.meta) {
      invRawTab.textContent = `SKU & BIN (${fmtInt(inventory.meta.rowCount)})`;
    }
    const invSnTab = document.getElementById("invSerialTabBtn");
    const snCount = state.raw.invSerials?.meta?.rowCount || state.raw.invSerialCube?.meta?.rowCount || 0;
    if (invSnTab && snCount) {
      invSnTab.textContent = `Serial & Bad Stock (${fmtInt(snCount)})`;
    }
    const invVelTab = document.getElementById("invVelocityTabBtn");
    if (invVelTab && state.raw.invSkuLevel?.meta) {
      invVelTab.textContent = `Bán 7D–180D (${fmtInt(state.raw.invSkuLevel.meta.rowCount)})`;
    }
    const invMpTab = document.getElementById("invMasterTabBtn");
    const mpCount = state.raw.masterProducts?.meta?.rowCount || state.raw.masterSummary?.meta?.rowCount || 0;
    if (invMpTab && mpCount) {
      invMpTab.textContent = `Master (${fmtInt(mpCount)})`;
    }
    const invSiteTag = document.getElementById("invSiteCountTag");
    if (invSiteTag && inventory?.lookups) {
      invSiteTag.textContent = `${inventory.lookups.sites.length} KHO`;
    }
  }

  function applyNewDataset(payload, sourceMode) {
    state.raw = normalizePayloadOnLoad(payload);
    state.dataSourceMode = sourceMode;
    state.globalCat = "";
    state.globalSubcat = "";
    state.region = "";
    state.site = "";
    state.channel = "";
    state.orderType = "";
    state.clickedMonth = "";
    state.excludeBulk = false;
    state.storeRegionsOnly = false;
    state.tablePage = 1;

    buildLookupIndexes();
    initMeta();
    populateGlobalMasterFilter();
    populateFilters();
    populateInventoryFilters();
    populateBadStockFilters();
    resetInvFilters(false);
    resetBadStockFilters(false);
    renderLookupQuickPicks();
    if (state.lookup.selectedSku) {
      renderLookupProfile(state.lookup.selectedSku, state.lookup.selectedSerial);
    }

    const setValSafe = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
    const setChkSafe = (id, v) => { const el = document.getElementById(id); if (el) el.checked = v; };
    setValSafe("filterRegion", "");
    setValSafe("filterSite", "");
    setValSafe("filterChannel", "");
    setValSafe("filterOrderType", "");
    setChkSafe("excludeBulkToggle", false);
    setChkSafe("storeRegionsOnlyToggle", false);
    initAllMultiSelectDropdowns();
    syncAllMultiSelectUIs();

    renderAll();
  }

  // --- MULTI-SELECT FILTER ENGINE (CTRL + CLICK SUPPORT) ---
  const MULTI_SEP = "||";
  const msRegistry = new Map();
  let msDocListenerBound = false;

  function splitMulti(val) {
    if (!val) return [];
    if (Array.isArray(val)) return val.map((x) => String(x || "").trim()).filter(Boolean);
    return String(val).split(MULTI_SEP).map((x) => x.trim()).filter(Boolean);
  }

  function joinMulti(arr) {
    if (!Array.isArray(arr) || !arr.length) return "";
    return Array.from(new Set(arr.map((x) => String(x || "").trim()).filter(Boolean))).join(MULTI_SEP);
  }

  function isMultiMatch(filterVal, candidateVal) {
    if (!filterVal) return true;
    const s = String(filterVal);
    if (!s.includes(MULTI_SEP)) return s === candidateVal;
    return splitMulti(s).includes(candidateVal);
  }

  function hasMultiPrefix(filterVal, candidateStr) {
    if (!filterVal) return true;
    const cand = String(candidateStr || "");
    const list = splitMulti(filterVal);
    return list.some((prefix) => cand.startsWith(prefix));
  }

  function getLookupIdxSet(filterVal, lookupArr) {
    if (!filterVal || !Array.isArray(lookupArr)) return null;
    const list = splitMulti(filterVal);
    if (!list.length) return null;
    const set = new Set();
    for (let i = 0; i < list.length; i++) {
      const idx = lookupArr.indexOf(list[i]);
      if (idx !== -1) set.add(idx);
    }
    return set;
  }

  function toggleMultiVal(currentVal, targetVal, isMultiKey = false) {
    const t = String(targetVal || "").trim();
    if (!t) return "";
    const list = splitMulti(currentVal);
    if (isMultiKey) {
      const idx = list.indexOf(t);
      if (idx !== -1) list.splice(idx, 1);
      else list.push(t);
      return joinMulti(list);
    }
    if (list.length === 1 && list[0] === t) return "";
    return t;
  }

  function removeMultiVal(currentVal, targetVal) {
    const t = String(targetVal || "").trim();
    if (!t) return "";
    return joinMulti(splitMulti(currentVal).filter((x) => x !== t));
  }

  function isCtrlEvent(eOrParams) {
    if (!eOrParams) return false;
    const nativeEv = eOrParams.event?.event || eOrParams.event || eOrParams;
    return Boolean(nativeEv?.ctrlKey || nativeEv?.metaKey);
  }

  function syncMultiSelectUI(selectId, rawVal) {
    const entry = msRegistry.get(selectId);
    if (entry) entry.sync(rawVal);
  }

  function syncAllMultiSelectUIs() {
    syncMultiSelectUI("globalSubcatSelect", state.globalSubcat);
    syncMultiSelectUI("filterChannel", state.channel);
    syncMultiSelectUI("filterSite", state.site);
    syncMultiSelectUI("filterRegion", state.region);
    syncMultiSelectUI("invFilterStatus", state.inv.status);
    syncMultiSelectUI("invFilterRange", state.inv.range);
    syncMultiSelectUI("invFilterBadStock", state.inv.badStock);
    syncMultiSelectUI("invFilterSite", state.inv.site);
    syncMultiSelectUI("invFilterBinType", state.inv.binType);
    syncMultiSelectUI("invFilterBinZone", state.inv.binZone);
    syncMultiSelectUI("invFilterBrand", state.inv.brand);
    syncMultiSelectUI("bsFilterBadType", state.badstock.badType);
    syncMultiSelectUI("bsFilterSite", state.badstock.site);
    syncMultiSelectUI("bsFilterStatus", state.badstock.status);
    syncMultiSelectUI("bsFilterRange", state.badstock.range);
    syncMultiSelectUI("bsFilterBinType", state.badstock.binType);
    syncMultiSelectUI("bsFilterBinZone", state.badstock.binZone);
    syncMultiSelectUI("bsFilterBrand", state.badstock.brand);
  }

  function initMultiSelectDropdown(selectId, getValFn, onChangeFn) {
    const sel = document.getElementById(selectId);
    if (!sel) return;

    if (msRegistry.has(selectId)) {
      msRegistry.get(selectId).rebuild();
      return;
    }

    const wrap = document.createElement("div");
    wrap.className = "ms-dropdown";
    wrap.dataset.msFor = selectId;
    sel.parentNode.insertBefore(wrap, sel);
    wrap.appendChild(sel);
    sel.style.display = "none";

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "ms-trigger";
    trigger.title = (sel.title ? sel.title + " • " : "") + "Giữ phím Ctrl + Click để chọn nhiều Option";

    const popover = document.createElement("div");
    popover.className = "ms-popover";
    wrap.appendChild(trigger);
    wrap.appendChild(popover);

    let searchQuery = "";

    const renderTriggerLabel = (rawVal) => {
      const selected = splitMulti(rawVal);
      const opts = Array.from(sel.options);
      const allOpt = opts.find((o) => o.value === "") || opts[0];
      const allText = allOpt ? allOpt.textContent : "Tất cả";

      if (selected.length === 0) {
        trigger.classList.remove("has-value");
        trigger.innerHTML = `<span class="ms-trigger-text">${esc(allText)}</span><span class="ms-caret">▼</span>`;
      } else if (selected.length === 1) {
        const matchOpt = opts.find((o) => o.value === selected[0]);
        const lbl = matchOpt ? matchOpt.textContent : selected[0];
        trigger.classList.add("has-value");
        trigger.innerHTML = `<span class="ms-trigger-text">${esc(lbl)}</span><span class="ms-caret">▼</span>`;
      } else {
        const labels = selected.map((v) => {
          const o = opts.find((opt) => opt.value === v);
          return o ? o.textContent : v;
        });
        trigger.classList.add("has-value");
        trigger.innerHTML = `
          <span class="ms-count-badge">${selected.length}</span>
          <span class="ms-trigger-text" title="${esc(labels.join(", "))}">${esc(labels.join(", "))}</span>
          <span class="ms-caret">▼</span>`;
      }
    };

    const renderOptionsList = (overrideVal) => {
      const rawVal = overrideVal !== undefined ? overrideVal : getValFn();
      const selected = splitMulti(rawVal);
      const opts = Array.from(sel.options);
      const q = searchQuery.trim().toLowerCase();

      const listEl = popover.querySelector(".ms-list");
      if (!listEl) return;

      const filteredOpts = opts.filter((o) => {
        if (o.value === "") return !q;
        if (!q) return true;
        return o.textContent.toLowerCase().includes(q) || o.value.toLowerCase().includes(q);
      });

      if (!filteredOpts.length) {
        listEl.innerHTML = `<div class="muted" style="padding:10px;font-size:11.5px;text-align:center">Không tìm thấy mục nào khớp "${esc(searchQuery)}"</div>`;
        return;
      }

      listEl.innerHTML = filteredOpts.map((o) => {
        const isAll = o.value === "";
        const isSel = isAll ? selected.length === 0 : selected.includes(o.value);
        return `
          <div class="ms-item ${isSel ? "selected" : ""}" data-ms-val="${esc(o.value)}" title="${isAll ? "Chọn tất cả (Bỏ lọc)" : "Click vào tên để chọn 1 • Giữ Ctrl + Click hoặc bấm vào ô tích để chọn nhiều"}">
            <span class="ms-check" data-ms-check="1">${isSel ? "✓" : ""}</span>
            <span class="ms-item-label">${esc(o.textContent)}</span>
          </div>`;
      }).join("");

      const clearBtn = popover.querySelector(".ms-clear-mini");
      if (clearBtn) clearBtn.style.display = selected.length > 0 ? "inline-block" : "none";
    };

    const rebuildPopoverStructure = () => {
      const optsCount = sel.options.length;
      const showSearch = optsCount > 7;
      const prevScroll = popover.querySelector(".ms-list")?.scrollTop || 0;
      popover.innerHTML = `
        <div class="ms-hint">
          <span>💡 Giữ <b>Ctrl + Click</b> (hoặc bấm ô <b>☑</b>) để chọn nhiều</span>
          <button type="button" class="ms-clear-mini" style="display:none">Bỏ chọn</button>
        </div>
        ${showSearch ? `<div class="ms-search-wrap"><input type="search" class="ms-search" placeholder="Tìm nhanh trong ${Math.max(0, optsCount - 1)} mục..." value="${esc(searchQuery)}" /></div>` : ""}
        <div class="ms-list"></div>`;

      const clearBtn = popover.querySelector(".ms-clear-mini");
      clearBtn?.addEventListener("click", (e) => {
        e.stopPropagation();
        sel.value = "";
        onChangeFn("", false);
        renderTriggerLabel("");
        renderOptionsList("");
      });

      const searchInp = popover.querySelector(".ms-search");
      searchInp?.addEventListener("input", (e) => {
        searchQuery = e.target.value;
        renderOptionsList();
      });
      searchInp?.addEventListener("click", (e) => e.stopPropagation());

      const listEl = popover.querySelector(".ms-list");
      listEl?.addEventListener("mousedown", (e) => {
        if (e.ctrlKey || e.metaKey || e.shiftKey) {
          e.preventDefault();
        }
      });
      listEl?.addEventListener("click", (e) => {
        e.stopPropagation();
        const item = e.target.closest(".ms-item[data-ms-val]");
        if (!item) return;
        const val = item.dataset.msVal;
        const clickedCheckbox = Boolean(e.target.closest("[data-ms-check]"));
        const isMultiKey = Boolean(e.ctrlKey || e.metaKey || e.shiftKey || clickedCheckbox);

        let nextVal = "";
        if (val === "") {
          nextVal = "";
          wrap.classList.remove("open");
        } else if (isMultiKey) {
          nextVal = toggleMultiVal(getValFn(), val, true);
        } else {
          nextVal = val;
          wrap.classList.remove("open");
        }

        sel.value = splitMulti(nextVal)[0] || "";
        const savedScroll = listEl.scrollTop;
        onChangeFn(nextVal, isMultiKey);
        renderTriggerLabel(nextVal);
        renderOptionsList(nextVal);
        const currentListEl = popover.querySelector(".ms-list");
        if (currentListEl) currentListEl.scrollTop = savedScroll;
      });

      renderTriggerLabel(getValFn());
      renderOptionsList();
      const newListEl = popover.querySelector(".ms-list");
      if (newListEl && prevScroll) newListEl.scrollTop = prevScroll;
    };

    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      const wasOpen = wrap.classList.contains("open");
      document.querySelectorAll(".ms-dropdown.open").forEach((d) => d.classList.remove("open"));
      if (!wasOpen) {
        searchQuery = "";
        rebuildPopoverStructure();
        wrap.classList.add("open");
        setTimeout(() => popover.querySelector(".ms-search")?.focus(), 20);
      }
    });

    if (!msDocListenerBound) {
      msDocListenerBound = true;
      document.addEventListener("click", (e) => {
        if (!e.target.closest(".ms-dropdown")) {
          document.querySelectorAll(".ms-dropdown.open").forEach((d) => d.classList.remove("open"));
        }
      });
    }

    msRegistry.set(selectId, {
      sync: (rawVal) => {
        const v = rawVal !== undefined ? rawVal : getValFn();
        sel.value = splitMulti(v)[0] || "";
        renderTriggerLabel(v);
        if (wrap.classList.contains("open")) renderOptionsList();
      },
      rebuild: () => {
        rebuildPopoverStructure();
      },
    });

    rebuildPopoverStructure();
  }

  function initAllMultiSelectDropdowns() {
    initMultiSelectDropdown(
      "globalSubcatSelect",
      () => state.globalSubcat,
      (val) => setGlobalSubcat(val)
    );
    initMultiSelectDropdown(
      "filterChannel",
      () => state.channel,
      (val) => { state.channel = val; state.tablePage = 1; renderAll(); }
    );
    initMultiSelectDropdown(
      "filterSite",
      () => state.site,
      (val) => { state.site = val; state.tablePage = 1; renderAll(); }
    );
    initMultiSelectDropdown(
      "filterRegion",
      () => state.region,
      (val) => { state.region = val; state.tablePage = 1; renderAll(); }
    );

    const invProps = [
      ["invFilterStatus", "status"],
      ["invFilterRange", "range"],
      ["invFilterBadStock", "badStock"],
      ["invFilterSite", "site"],
      ["invFilterBinType", "binType"],
      ["invFilterBinZone", "binZone"],
      ["invFilterBrand", "brand"],
    ];
    invProps.forEach(([id, prop]) => {
      initMultiSelectDropdown(
        id,
        () => state.inv[prop],
        (val) => { state.inv[prop] = val; state.inv.tablePage = 1; renderInventoryView(); }
      );
    });

    const bsProps = [
      ["bsFilterBadType", "badType"],
      ["bsFilterSite", "site"],
      ["bsFilterStatus", "status"],
      ["bsFilterRange", "range"],
      ["bsFilterBinType", "binType"],
      ["bsFilterBinZone", "binZone"],
      ["bsFilterBrand", "brand"],
    ];
    bsProps.forEach(([id, prop]) => {
      initMultiSelectDropdown(
        id,
        () => state.badstock[prop],
        (val) => { state.badstock[prop] = val; state.badstock.page = 1; renderBadStockView(); }
      );
    });
  }

  // --- TIER 1: GLOBAL MASTER FILTER BAR (CATEGORY CODE BUTTONS + SUBCAT 2) ---
  const HIDDEN_GLOBAL_CATS = new Set(["NH07", "NH10"]);

  function getVisibleGlobalCategories() {
    const tax = state.raw?.taxonomy || { categories: [], allSubcats: [] };
    return (tax.categories || []).filter((c) => !HIDDEN_GLOBAL_CATS.has(String(c.code || "").toUpperCase()));
  }

  function populateGlobalMasterFilter() {
    const visibleCats = getVisibleGlobalCategories();
    const validCatCodes = new Set(visibleCats.map((c) => c.code));
    if (state.globalCat) {
      state.globalCat = joinMulti(splitMulti(state.globalCat).filter((code) => validCatCodes.has(code)));
    }
    const selectedCats = splitMulti(state.globalCat);
    const catWrap = document.getElementById("globalCatBtnGroup");
    if (catWrap) {
      const allActive = selectedCats.length === 0 ? "active" : "";
      let html = `<button type="button" class="cat-pill-btn ${allActive}" data-cat="" title="Xem tất cả Ngành hàng">Tất cả (${visibleCats.length} NH)</button>`;
      visibleCats.forEach((c) => {
        const isAct = selectedCats.includes(c.code) ? "active" : "";
        const shortDesc = String(c.label || "").replace(new RegExp(`^${c.code}\\s*[—-]\\s*`, "i"), "");
        const subText = shortDesc && shortDesc !== c.code ? shortDesc : `${c.subcats?.length || 0} nhóm`;
        html += `
          <button type="button" class="cat-pill-btn ${isAct}" data-cat="${esc(c.code)}" title="${esc(c.label)} (${c.subcats?.length || 0} Subcat 2) • Giữ Ctrl + Click để chọn nhiều NH">
            <span class="cat-code">${esc(c.code)}</span>
            <span class="cat-name">${esc(subText)}</span>
          </button>`;
      });
      catWrap.innerHTML = html;
    }

    refreshGlobalSubcatDropdown();
  }

  function refreshGlobalSubcatDropdown() {
    const visibleCats = getVisibleGlobalCategories();
    const sel = document.getElementById("globalSubcatSelect");
    if (!sel) return;

    const selectedCats = splitMulti(state.globalCat);
    let subList = [];
    if (selectedCats.length > 0) {
      subList = Array.from(
        new Set(
          visibleCats
            .filter((c) => selectedCats.includes(c.code))
            .flatMap((c) => c.subcats || [])
        )
      ).sort();
    } else {
      subList = Array.from(new Set(visibleCats.flatMap((c) => c.subcats || []))).sort();
    }

    if (state.globalSubcat) {
      state.globalSubcat = joinMulti(splitMulti(state.globalSubcat).filter((s) => subList.includes(s)));
    }

    const headText = selectedCats.length > 0
      ? `Tất cả Subcat 2 của ${selectedCats.join("+")} (${subList.length} nhóm)`
      : `Tất cả Subcat 2 (${subList.length} nhóm Code - Name)`;
    sel.innerHTML = `<option value="">${esc(headText)}</option>`;
    subList.forEach((sc) => sel.add(new Option(sc, sc)));
    sel.value = splitMulti(state.globalSubcat)[0] || "";
    if (msRegistry.has("globalSubcatSelect")) {
      msRegistry.get("globalSubcatSelect").rebuild();
    }

    const clearBtn = document.getElementById("clearGlobalFilterBtn");
    if (clearBtn) {
      const defRange = getDefaultYearMonthRange(state.monthsAll);
      const isCustomDate = Boolean(
        state.monthsAll.length &&
        ((state.monthFrom && state.monthFrom !== defRange.from) ||
         (state.monthTo && state.monthTo !== defRange.to))
      );
      clearBtn.classList.toggle("hidden", !state.globalCat && !state.globalSubcat && !isCustomDate);
    }
  }

  function getDefaultYearMonthRange(monthsAll) {
    if (!Array.isArray(monthsAll) || monthsAll.length === 0) {
      return { from: "", to: "" };
    }
    const curYear = String(new Date().getFullYear());
    const latestMonth = monthsAll[monthsAll.length - 1] || "";
    const targetYear = monthsAll.some((m) => m.startsWith(curYear))
      ? curYear
      : latestMonth.slice(0, 4);
    const yearMonths = monthsAll.filter((m) => m.startsWith(targetYear));
    if (yearMonths.length > 0) {
      return {
        from: yearMonths[0],
        to: yearMonths[yearMonths.length - 1],
      };
    }
    return {
      from: monthsAll[0],
      to: latestMonth,
    };
  }

  function setGlobalCategory(catCode, isMulti = false) {
    if (!catCode) {
      state.globalCat = "";
    } else {
      state.globalCat = toggleMultiVal(state.globalCat, catCode, isMulti);
    }
    state.tablePage = 1;
    state.inv.tablePage = 1;
    populateGlobalMasterFilter();
    renderLookupQuickPicks();
    renderAll();
  }

  function setGlobalSubcat(subcatStr) {
    state.globalSubcat = subcatStr || "";
    const subs = splitMulti(state.globalSubcat);
    let catChanged = false;
    if (subs.length && state.globalCat) {
      const currentCats = new Set(splitMulti(state.globalCat));
      const beforeSize = currentCats.size;
      subs.forEach((s) => {
        const m = s.match(/^(NH\d{2})/i);
        if (m) {
          const c = m[1].toUpperCase() === "NH03" ? "NH93" : m[1].toUpperCase();
          currentCats.add(c);
        }
      });
      if (currentCats.size !== beforeSize) {
        state.globalCat = joinMulti(Array.from(currentCats));
        catChanged = true;
      }
    }
    state.tablePage = 1;
    state.inv.tablePage = 1;
    state.badstock.page = 1;
    if (catChanged) {
      populateGlobalMasterFilter();
    } else {
      const clearBtn = document.getElementById("clearGlobalFilterBtn");
      if (clearBtn) {
        const defRange = getDefaultYearMonthRange(state.monthsAll);
        const isCustomDate = Boolean(
          state.monthsAll.length &&
          ((state.monthFrom && state.monthFrom !== defRange.from) ||
           (state.monthTo && state.monthTo !== defRange.to))
        );
        clearBtn.classList.toggle("hidden", !state.globalCat && !state.globalSubcat && !isCustomDate);
      }
    }
    syncMultiSelectUI("globalSubcatSelect", state.globalSubcat);
    renderLookupQuickPicks();
    renderAll();
  }

  function clearGlobalMasterFilter() {
    state.globalCat = "";
    state.globalSubcat = "";
    const defRange = getDefaultYearMonthRange(state.monthsAll);
    if (defRange.from) {
      state.monthFrom = defRange.from;
      state.monthTo = defRange.to;
      const mFrom = document.getElementById("filterMonthFrom");
      const mTo = document.getElementById("filterMonthTo");
      if (mFrom) mFrom.value = state.monthFrom;
      if (mTo) mTo.value = state.monthTo;
    }
    state.clickedMonth = "";
    state.tablePage = 1;
    state.inv.tablePage = 1;
    populateGlobalMasterFilter();
    syncMultiSelectUI("globalSubcatSelect", "");
    renderLookupQuickPicks();
    renderAll();
  }

  function populateFilters() {
    const { lookups, rows, siteDirectory } = state.raw;

    state.monthsAll = Array.from(new Set(rows.map((r) => r[C.MONTH]))).sort();
    const defRange = getDefaultYearMonthRange(state.monthsAll);
    state.monthFrom = defRange.from;
    state.monthTo = defRange.to;
    populateGlobalMasterFilter();

    const mFrom = document.getElementById("filterMonthFrom");
    const mTo = document.getElementById("filterMonthTo");
    mFrom.innerHTML = "";
    mTo.innerHTML = "";
    state.monthsAll.forEach((m) => {
      const lbl = `T${m.slice(5)}/${m.slice(0, 4)}`;
      mFrom.add(new Option(lbl, m));
      mTo.add(new Option(lbl, m));
    });
    mFrom.value = state.monthFrom;
    mTo.value = state.monthTo;

    const mdSelect = document.getElementById("monthlyDailyMonthSelect");
    if (mdSelect) {
      mdSelect.innerHTML = "";
      const revMonths = [...state.monthsAll].reverse();
      revMonths.forEach((m) => {
        const lbl = `Tháng ${m.slice(5)}/${m.slice(0, 4)} (${m})`;
        mdSelect.add(new Option(lbl, m));
      });
      if (!state.monthlyDailyMonth || !state.monthsAll.includes(state.monthlyDailyMonth)) {
        state.monthlyDailyMonth = revMonths[0] || "";
      }
      mdSelect.value = state.monthlyDailyMonth;
    }

    const regEl = document.getElementById("filterRegion");
    if (regEl) {
      regEl.innerHTML = `<option value="">Tất cả Region Name (${lookups.regions.length})</option>`;
      [...lookups.regions]
        .sort((a, b) => {
          const an = a.startsWith("Non-Store"), bn = b.startsWith("Non-Store");
          if (an !== bn) return an ? 1 : -1;
          return a.localeCompare(b);
        })
        .forEach((r) => regEl.add(new Option(r, r)));
    }

    const siteEl = document.getElementById("filterSite");
    if (siteEl) {
      siteEl.innerHTML = `<option value="">Tất cả Site - Store (${lookups.sites.length})</option>`;
      [...lookups.sites].sort().forEach((code) => {
        const info = siteDirectory[code];
        const lbl = info && info.storeName && info.storeName !== code ? `${code} - ${info.storeName}` : code;
        siteEl.add(new Option(lbl, code));
      });
    }

    const chEl = document.getElementById("filterChannel");
    if (chEl) {
      chEl.innerHTML = `<option value="">Tất cả Channel (${lookups.channels.length})</option>`;
      [...lookups.channels].sort().forEach((ch) => chEl.add(new Option(ch, ch)));
    }

    ["filterRegion", "filterSite", "filterChannel"].forEach((id) => {
      if (msRegistry.has(id)) msRegistry.get(id).rebuild();
    });
  }

  function initCharts() {
    if (typeof echarts === "undefined") return;

    const make = (id) => echarts.init(document.getElementById(id), null, { renderer: "canvas" });
    charts.gaugeRing = make("gaugeRing");
    charts.gaugeSemi = make("gaugeSemi");
    charts.hero = make("chartHero");
    charts.trend = make("chartTrend");
    charts.deepMonthly = make("chartDeepMonthly");
    charts.deepSite = make("chartDeepSite");
    charts.deepRegionPie = make("chartDeepRegionPie");
    charts.deepRegionStack = make("chartDeepRegionStack");
    charts.deepChannel = make("chartDeepChannel");
    charts.deepDriver = make("chartDeepDriver");
    charts.invBadStock = make("chartInvBadStock");
    charts.invStatusRange = make("chartInvStatusRange");
    charts.invSite = make("chartInvSite");
    charts.invBin = make("chartInvBin");
    charts.invAging = make("chartInvAging");
    charts.invCat = make("chartInvCat");
    charts.lookupVelocity = make("chartLookupVelocity");
    const elTarget = document.getElementById("chartTargetProgress");
    if (elTarget) charts.targetProgress = make("chartTargetProgress");
    const elYearly = document.getElementById("chartYearlyCompare");
    if (elYearly) charts.yearlyCompare = make("chartYearlyCompare");
    const elMonthlyDaily = document.getElementById("chartMonthlyDaily");
    if (elMonthlyDaily) charts.monthlyDaily = make("chartMonthlyDaily");

    // Cross-filter click listeners (with Ctrl + Click multi-select support)
    charts.hero.on("click", (params) => {
      if (state.heroGranularity === "month" && params.name) {
        let m = params.name.startsWith("20") ? params.name : "";
        if (!m && /^T\d{2}$/.test(params.name)) {
          const curY = (state.monthTo || "2026-11").slice(0, 4);
          m = `${curY}-${params.name.slice(1)}`;
        }
        if (m) {
          state.clickedMonth = toggleMultiVal(state.clickedMonth, m, isCtrlEvent(params));
          state.tablePage = 1;
          renderAll();
        }
      }
    });

    charts.trend.on("click", (params) => {
      if (params.name && params.name.startsWith("20")) {
        state.clickedMonth = toggleMultiVal(state.clickedMonth, params.name, isCtrlEvent(params));
        state.tablePage = 1;
        renderAll();
      }
    });

    charts.deepMonthly.on("click", (params) => {
      if (state.deepGranularity === "month" && params.name) {
        state.clickedMonth = toggleMultiVal(state.clickedMonth, params.name, isCtrlEvent(params));
        renderAll();
      }
    });

    charts.deepSite.on("click", (params) => {
      const sc = params.data?.siteCode || params.name;
      if (sc) toggleSiteFilter(sc, isCtrlEvent(params));
    });

    charts.deepRegionPie.on("click", (params) => {
      if (params.name) toggleRegionFilter(params.name, isCtrlEvent(params));
    });

    charts.deepRegionStack.on("click", (params) => {
      if (params.seriesName) toggleRegionFilter(params.seriesName, isCtrlEvent(params));
    });

    charts.deepChannel.on("click", (params) => {
      if (!params.name) return;
      const isCtrl = isCtrlEvent(params);
      if (state.channelDim === "site") {
        const sc = params.data?.siteCode || params.name.split(" - ")[0];
        if (sc) toggleSiteFilter(sc, isCtrl);
        return;
      }
      if (state.channelDim === "channel") {
        state.channel = toggleMultiVal(state.channel, params.name, isCtrl);
        syncMultiSelectUI("filterChannel", state.channel);
        renderAll();
      }
    });

    // Inventory cross-filter clicks
    charts.invBadStock.on("click", (params) => {
      if (!params.name) return;
      state.inv.badStock = toggleMultiVal(state.inv.badStock, params.name, isCtrlEvent(params));
      syncMultiSelectUI("invFilterBadStock", state.inv.badStock);
      state.inv.tablePage = 1;
      renderInventoryView();
    });

    charts.invStatusRange.on("click", (params) => {
      if (!params.name) return;
      const isCtrl = isCtrlEvent(params);
      if (state.inv.statusDim === "range_inv") {
        state.inv.range = toggleMultiVal(state.inv.range, params.name, isCtrl);
        syncMultiSelectUI("invFilterRange", state.inv.range);
      } else {
        state.inv.status = toggleMultiVal(state.inv.status, params.name, isCtrl);
        syncMultiSelectUI("invFilterStatus", state.inv.status);
      }
      state.inv.tablePage = 1;
      renderInventoryView();
    });

    charts.invSite.on("click", (params) => {
      const code = params.name;
      if (!code) return;
      state.inv.site = toggleMultiVal(state.inv.site, code, isCtrlEvent(params));
      syncMultiSelectUI("invFilterSite", state.inv.site);
      state.inv.tablePage = 1;
      renderInventoryView();
    });

    charts.invBin.on("click", (params) => {
      if (!params.name) return;
      const isCtrl = isCtrlEvent(params);
      if (state.inv.binDim === "binType") {
        state.inv.binType = toggleMultiVal(state.inv.binType, params.name, isCtrl);
        syncMultiSelectUI("invFilterBinType", state.inv.binType);
      } else {
        state.inv.binZone = toggleMultiVal(state.inv.binZone, params.name, isCtrl);
        syncMultiSelectUI("invFilterBinZone", state.inv.binZone);
      }
      state.inv.tablePage = 1;
      renderInventoryView();
    });

    charts.invAging.on("click", (params) => {
      const b = AGING_BUCKETS.find((x) => x.label === params.name);
      if (!b) return;
      state.inv.agingBucket = toggleMultiVal(state.inv.agingBucket, b.key, isCtrlEvent(params));
      state.inv.tablePage = 1;
      renderInventoryView();
    });

    charts.invCat.on("click", (params) => {
      if (!params.name) return;
      const isCtrl = isCtrlEvent(params);
      if (state.inv.catDim === "subcat") {
        setGlobalSubcat(toggleMultiVal(state.globalSubcat, params.name, isCtrl));
      } else {
        state.inv.brand = toggleMultiVal(state.inv.brand, params.name, isCtrl);
        syncMultiSelectUI("invFilterBrand", state.inv.brand);
        state.inv.tablePage = 1;
        renderInventoryView();
      }
    });

    window.addEventListener("resize", () => {
      Object.values(charts).forEach((ch) => ch && ch.resize());
    });
  }

  function toggleRegionFilter(reg, isMulti = false) {
    state.region = toggleMultiVal(state.region, reg, isMulti);
    syncMultiSelectUI("filterRegion", state.region);
    state.tablePage = 1;
    renderAll();
  }

  function toggleSiteFilter(siteCode, isMulti = false) {
    state.site = toggleMultiVal(state.site, siteCode, isMulti);
    syncMultiSelectUI("filterSite", state.site);
    state.tablePage = 1;
    renderAll();
  }

  function switchView(view) {
    state.activeView = view;
    document.querySelectorAll("#railMenu .rail-item").forEach((b) => {
      b.classList.toggle("active", b.dataset.view === view);
    });
    document.querySelectorAll(".view-pane").forEach((p) => p.classList.remove("active"));
    const pane = document.getElementById(`view-${view}`);
    if (pane) pane.classList.add("active");

    const isInvOrLookup = view === "inventory" || view === "lookup" || view === "badstock" || view === "pricecompare";
    const hideSidebar = view === "lookup" || view === "badstock" || view === "pricecompare";
    document.getElementById("appShell")?.classList.toggle("hide-sidebar", hideSidebar);
    document.getElementById("salesTopFilters")?.classList.toggle("hidden", isInvOrLookup);
    document.getElementById("activeChipsBar")?.classList.toggle("hidden", isInvOrLookup);
    document.getElementById("invTopBanner")?.classList.toggle("hidden", !isInvOrLookup);

    const bannerTitle = document.getElementById("invTopBannerTitle");
    if (bannerTitle) {
      bannerTitle.textContent = view === "lookup"
        ? "🔍 TRA CỨU 360° SKU & SERIAL NUMBER"
        : view === "badstock"
          ? "⚠️ BÁO CÁO CHUYÊN SÂU BAD STOCK (TỒN XẤU / TỒN RẤT XẤU)"
          : view === "pricecompare"
            ? "⚖️ SO SÁNH GIÁ ĐA ĐỐI THỦ — PHONG VŨ vs TGDD • CELLPHONES (Ổ CỨNG GẮN NGOÀI)"
            : "📦 BÁO CÁO TỒN KHO & BAD STOCK";
    }
    document.getElementById("jumpToLookupBtn")?.classList.toggle("hidden", view === "lookup");

    if ((view === "lookup" || view === "badstock") && !state.shardsLoaded) {
      ensureLookupShardsLoaded();
    }
    if (view === "pricecompare" && !state.priceCompare.loaded) {
      ensurePriceCompareLoaded();
    }

    const filtered = getFilteredRows(false);
    const filteredTime = state.clickedMonth ? getFilteredRows(true) : filtered;
    renderSidebarForView(filtered);
    renderActiveView(filtered, filteredTime);
    setTimeout(() => {
      Object.values(charts).forEach((ch) => ch && ch.resize());
    }, 35);
  }

  function bindEvents() {
    // Blue Rail Navigation
    document.getElementById("railMenu").addEventListener("click", (e) => {
      const btn = e.target.closest(".rail-item[data-view]");
      if (!btn) return;
      switchView(btn.dataset.view);
    });

    document.getElementById("jumpToLookupBtn")?.addEventListener("click", () => {
      switchView("lookup");
      document.getElementById("lookupSearchInput")?.focus();
    });

    // Tier 1 Global Master Filter (Category Code buttons + Subcat 2 dropdown)
    document.getElementById("globalCatBtnGroup")?.addEventListener("mousedown", (e) => {
      if (e.ctrlKey || e.metaKey || e.shiftKey) e.preventDefault();
    });
    document.getElementById("globalCatBtnGroup")?.addEventListener("click", (e) => {
      const btn = e.target.closest(".cat-pill-btn[data-cat]");
      if (!btn) return;
      setGlobalCategory(btn.dataset.cat || "", Boolean(e.ctrlKey || e.metaKey || e.shiftKey));
    });
    document.getElementById("globalSubcatSelect")?.addEventListener("change", (e) => {
      setGlobalSubcat(e.target.value || "");
    });
    document.getElementById("clearGlobalFilterBtn")?.addEventListener("click", () => {
      clearGlobalMasterFilter();
    });

    // Theme Switcher (Dark Mode ⇄ Light Mode)
    document.getElementById("themeSwitchGroup")?.addEventListener("click", (e) => {
      const btn = e.target.closest(".theme-switch-btn[data-theme-val]");
      if (!btn) return;
      applyTheme(btn.dataset.themeVal, true);
    });
    document.getElementById("themeToggleRailBtn")?.addEventListener("click", () => {
      applyTheme(state.theme === "light" ? "dark" : "light", true);
    });
    applyTheme(state.theme, false);

    // Tier 2 Sales Local Filters (Channel, Sale Site Code - Store name, Region name)
    document.getElementById("filterRegion")?.addEventListener("change", (e) => {
      state.region = e.target.value; syncMultiSelectUI("filterRegion", state.region); state.tablePage = 1; renderAll();
    });
    document.getElementById("filterSite")?.addEventListener("change", (e) => {
      state.site = e.target.value; syncMultiSelectUI("filterSite", state.site); state.tablePage = 1; renderAll();
    });
    document.getElementById("filterChannel")?.addEventListener("change", (e) => {
      state.channel = e.target.value; syncMultiSelectUI("filterChannel", state.channel); state.tablePage = 1; renderAll();
    });
    document.getElementById("filterOrderType")?.addEventListener("change", (e) => {
      state.orderType = e.target.value; state.tablePage = 1; renderAll();
    });
    document.getElementById("filterMonthFrom")?.addEventListener("change", (e) => {
      state.monthFrom = e.target.value;
      if (state.monthFrom > state.monthTo) {
        state.monthTo = state.monthFrom;
        document.getElementById("filterMonthTo").value = state.monthTo;
      }
      state.clickedMonth = ""; state.tablePage = 1; populateGlobalMasterFilter(); renderAll();
    });
    document.getElementById("filterMonthTo")?.addEventListener("change", (e) => {
      state.monthTo = e.target.value;
      if (state.monthTo < state.monthFrom) {
        state.monthFrom = state.monthTo;
        document.getElementById("filterMonthFrom").value = state.monthFrom;
      }
      state.clickedMonth = ""; state.tablePage = 1; populateGlobalMasterFilter(); renderAll();
    });

    document.getElementById("excludeBulkToggle")?.addEventListener("change", (e) => {
      state.excludeBulk = e.target.checked; state.tablePage = 1; renderAll();
    });
    document.getElementById("storeRegionsOnlyToggle")?.addEventListener("change", (e) => {
      state.storeRegionsOnly = e.target.checked; state.tablePage = 1; renderAll();
    });

    document.getElementById("resetFiltersBtn").addEventListener("click", () => {
      if (state.activeView === "inventory") resetInvFilters(true);
      else resetFilters();
    });

    // Segmented group helper
    const bindSeg = (id, cb) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener("click", (e) => {
        const btn = e.target.closest(".seg-btn");
        if (!btn) return;
        el.querySelectorAll(".seg-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        cb(btn.dataset.val);
      });
    };

    bindSeg("heroModeGroup", (v) => {
      state.heroMode = v;
      renderHeroChart(state.clickedMonth ? getFilteredRows(true) : getFilteredRows(false));
    });
    bindSeg("heroGranularityGroup", (v) => {
      state.heroGranularity = v;
      const map = { month: "THEO THÁNG", week: "THEO TUẦN", day: "THEO NGÀY" };
      document.getElementById("heroGranularityTag").textContent = map[v] || v;
      renderHeroChart(state.clickedMonth ? getFilteredRows(true) : getFilteredRows(false));
    });
    bindSeg("rankLimitGroup", (v) => {
      state.rankLimit = Number(v);
      renderSiteRankList(getFilteredRows(false));
    });
    bindSeg("rankSortGroup", (v) => {
      state.rankSort = v;
      renderSiteRankList(getFilteredRows(false));
    });
    bindSeg("regionModalityMetric", (v) => {
      state.regionMetric = v;
      renderRegionModality(getFilteredRows(false));
    });
    bindSeg("trendMetricGroup", (v) => {
      state.trendMetric = v;
      const titles = {
        qty: "Xu hướng Sales QTY theo Tháng",
        gm: "Biên lợi nhuận GM (%) theo Tháng",
        sales: "Xu hướng Sales (VND) theo Tháng",
      };
      document.getElementById("trendCardTitle").textContent = titles[v];
      renderTrendChart(state.clickedMonth ? getFilteredRows(true) : getFilteredRows(false));
    });

    bindSeg("targetDataSourceGroup", (v) => {
      state.targetDataSource = v;
      renderTargetReport(getFilteredRows(false));
    });
    document.getElementById("exportTargetCsvBtn")?.addEventListener("click", () => exportTargetCsv());
    document.getElementById("targetExpandAllBtn")?.addEventListener("click", () => {
      const codes = ["NH06", "NH11", "NH93"];
      const allExp = codes.every((c) => state.targetExpandedCats.has(c));
      if (allExp) state.targetExpandedCats.clear();
      else codes.forEach((c) => state.targetExpandedCats.add(c));
      renderTargetReport();
    });

    bindSeg("yearlyCompareMetricGroup", (v) => {
      state.yearlyCompareMetric = v;
      renderYearlyComparisonChart();
    });

    bindSeg("monthlyDailyMetricGroup", (v) => {
      state.monthlyDailyMetric = v;
      renderMonthlyDailyChart();
    });
    document.getElementById("monthlyDailyMonthSelect")?.addEventListener("change", (e) => {
      state.monthlyDailyMonth = e.target.value;
      renderMonthlyDailyChart();
    });

    bindSeg("deepGranularityGroup", (v) => {
      state.deepGranularity = v;
      renderDeepMonthly(state.clickedMonth ? getFilteredRows(true) : getFilteredRows(false));
    });
    bindSeg("deepModeGroup", (v) => {
      state.deepMode = v;
      renderDeepMonthly(state.clickedMonth ? getFilteredRows(true) : getFilteredRows(false));
    });
    bindSeg("siteChartViewGroup", (v) => {
      state.siteChartView = v;
      renderDeepSite(getFilteredRows(false));
    });
    bindSeg("siteChartSortGroup", (v) => {
      state.siteChartSort = v;
      renderDeepSite(getFilteredRows(false));
    });
    bindSeg("channelDimGroup", (v) => {
      state.channelDim = v;
      renderDeepChannelAndDriver(getFilteredRows(false));
    });
    bindSeg("driverDimGroup", (v) => {
      state.driverDim = v;
      renderDeepChannelAndDriver(getFilteredRows(false));
    });

    // Special Storage Report Modal (OCGN & PK Lưu trữ)
    document.getElementById("openStorageReportBtn")?.addEventListener("click", () => openStorageReportModal());
    document.getElementById("closeStorageReportModal")?.addEventListener("click", () => closeStorageReportModal());
    document.getElementById("storageReportModal")?.addEventListener("click", (e) => {
      if (e.target.id === "storageReportModal") closeStorageReportModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && state.storage.open) closeStorageReportModal();
    });
    const syncSegActive = (id, val) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.querySelectorAll(".seg-btn").forEach((b) => {
        b.classList.toggle("active", b.dataset.val === val);
      });
    };

    bindSeg("storageGroupTabs", (v) => {
      state.storage.group = v;
      renderStorageReport();
    });
    bindSeg("storageMetricTabs", (v) => {
      state.storage.metric = v;
      state.storage.brandMetric = v;
      state.storage.tableMetric = v;
      syncSegActive("storageBrandMetricTabs", v);
      syncSegActive("storageTableMetricTabs", v);
      renderStorageReport();
    });
    bindSeg("storageBrandMetricTabs", (v) => {
      state.storage.brandMetric = v;
      renderStorageBrandChart();
    });
    bindSeg("storageTableMetricTabs", (v) => {
      state.storage.tableMetric = v;
      renderStorageMatrixTable();
    });
    bindSeg("storageTableShareBasisTabs", (v) => {
      state.storage.tableShareBasis = v;
      renderStorageMatrixTable();
    });
    document.getElementById("storageResetBtn")?.addEventListener("click", () => {
      state.storage.cap = "";
      state.storage.brand = "";
      state.storage.priceBand = "";
      renderStorageReport();
    });
    document.getElementById("storageExportCsvBtn")?.addEventListener("click", () => {
      const { headers, rows, filename } = state.storage.lastExport;
      if (rows.length) downloadCsv(headers, rows, filename);
    });
    document.getElementById("storageTableExportBtn")?.addEventListener("click", () => {
      const { headers, rows, filename } = state.storage.matrixExport;
      if (rows && rows.length) downloadCsv(headers, rows, filename);
    });
    bindSeg("tableTabGroup", (v) => {
      state.tableTab = v;
      state.tablePage = 1;
      state.tableSortCol = v === "raw" ? "date" : v === "matrix" ? "total" : "sales";
      state.tableSortDir = "desc";
      renderLedgerTable(getFilteredRows(false));
    });

    document.getElementById("tableSearchInput").addEventListener("input", (e) => {
      state.tableSearch = e.target.value.trim().toLowerCase();
      state.tablePage = 1;
      renderLedgerTable(getFilteredRows(false));
    });

    // PNG Export
    document.querySelectorAll("[data-export-chart]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.dataset.exportChart;
        const ch = charts[key];
        if (!ch) return;
        const a = document.createElement("a");
        a.href = ch.getDataURL({ type: "png", pixelRatio: 2, backgroundColor: "#15181D" });
        a.download = `cyberpulse_${key}_${new Date().toISOString().slice(0, 10)}.png`;
        a.click();
      });
    });

    // CSV Exports
    document.getElementById("exportCsvRailBtn").addEventListener("click", () => exportRawCsv(getFilteredRows(false)));
    document.getElementById("exportTableCsvBtn").addEventListener("click", () => {
      const { headers, rows, filename } = state.lastTableExport;
      downloadCsv(headers, rows, filename);
    });
  }

  function resetFilters() {
    state.region = "";
    state.site = "";
    state.channel = "";
    state.orderType = "";
    state.clickedMonth = "";
    state.excludeBulk = false;
    state.storeRegionsOnly = false;
    const defRange = getDefaultYearMonthRange(state.monthsAll);
    state.monthFrom = defRange.from;
    state.monthTo = defRange.to;
    state.tablePage = 1;

    const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
    const setChk = (id, v) => { const el = document.getElementById(id); if (el) el.checked = v; };
    setVal("filterRegion", "");
    setVal("filterSite", "");
    setVal("filterChannel", "");
    setVal("filterOrderType", "");
    setVal("filterMonthFrom", state.monthFrom);
    setVal("filterMonthTo", state.monthTo);
    setChk("excludeBulkToggle", false);
    setChk("storeRegionsOnlyToggle", false);
    syncAllMultiSelectUIs();
    renderAll();
  }

  // --- FILTER ENGINE (TIER 1 GLOBAL + TIER 2 LOCAL — MULTI-SELECT ENABLED) ---
  function getFilteredRows(ignoreClickedMonth = false, ignoreDateRange = false) {
    const { rows, lookups } = state.raw;
    const catIdxSet = getLookupIdxSet(state.globalCat, lookups.categories);
    const subIdxSet = getLookupIdxSet(state.globalSubcat, lookups.subcats);
    const regIdxSet = getLookupIdxSet(state.region, lookups.regions);
    const siteIdxSet = getLookupIdxSet(state.site, lookups.sites);
    const chIdxSet = getLookupIdxSet(state.channel, lookups.channels);
    const otIdxSet = getLookupIdxSet(state.orderType, lookups.orderTypes);
    const clickedMonthSet = (!ignoreClickedMonth && state.clickedMonth) ? new Set(splitMulti(state.clickedMonth)) : null;

    const storeRegSet = new Set();
    if (state.storeRegionsOnly) {
      lookups.regions.forEach((n, idx) => { if (!n.startsWith("Non-Store")) storeRegSet.add(idx); });
    }

    const out = [];
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (state.globalCat) {
        if (r.length > C.CAT) {
          if (!catIdxSet || !catIdxSet.has(r[C.CAT])) continue;
        } else if (!hasMultiPrefix(state.globalCat, lookups.subcats[r[C.SUBCAT]])) {
          continue;
        }
      }
      if (subIdxSet && !subIdxSet.has(r[C.SUBCAT])) continue;
      if (!ignoreDateRange && state.monthFrom && r[C.MONTH] < state.monthFrom) continue;
      if (!ignoreDateRange && state.monthTo && r[C.MONTH] > state.monthTo) continue;
      if (clickedMonthSet && !clickedMonthSet.has(r[C.MONTH])) continue;
      if (regIdxSet && !regIdxSet.has(r[C.REGION])) continue;
      if (siteIdxSet && !siteIdxSet.has(r[C.SITE])) continue;
      if (chIdxSet && !chIdxSet.has(r[C.CHANNEL])) continue;
      if (otIdxSet && !otIdxSet.has(r[C.ORDER_TYPE])) continue;
      if (state.excludeBulk) {
        const isBulk = r.length > C.IS_BULK ? r[C.IS_BULK] === 1 : Math.abs(r[C.QTY]) >= 100;
        if (isBulk) continue;
      }
      if (state.storeRegionsOnly && !storeRegSet.has(r[C.REGION])) continue;
      out.push(r);
    }
    return out;
  }

  function getFilteredDailyRows(ignoreClickedMonth = false, ignoreDateRange = false) {
    const daily = state.raw?.salesDaily;
    if (!Array.isArray(daily) || !daily.length) return getFilteredRows(ignoreClickedMonth, ignoreDateRange);
    const { lookups } = state.raw;
    const datesL = lookups.dates || [];
    const weeksL = lookups.weeks || [];
    const monthsL = lookups.months || [];
    const dateToWeek = lookups.dateToWeek || [];
    const catIdxSet = getLookupIdxSet(state.globalCat, lookups.categories);
    const subIdxSet = getLookupIdxSet(state.globalSubcat, lookups.subcats);
    const regIdxSet = getLookupIdxSet(state.region, lookups.regions);
    const clickedMonthSet = (!ignoreClickedMonth && state.clickedMonth) ? new Set(splitMulti(state.clickedMonth)) : null;

    const storeRegSet = new Set();
    if (state.storeRegionsOnly) {
      lookups.regions.forEach((n, idx) => { if (!n.startsWith("Non-Store")) storeRegSet.add(idx); });
    }

    const out = [];
    const isCompact8 = daily[0].length === 8;
    for (let i = 0; i < daily.length; i++) {
      const d = daily[i];
      if (isCompact8) {
        // Compact 8-col: [0:dIdx, 1:catIdx, 2:subIdx, 3:regIdx, 4:isBulk, 5:qty, 6:sales, 7:gp]
        if (catIdxSet && !catIdxSet.has(d[1])) continue;
        if (subIdxSet && !subIdxSet.has(d[2])) continue;
        if (regIdxSet && !regIdxSet.has(d[3])) continue;
        if (state.excludeBulk && d[4] === 1) continue;
        if (state.storeRegionsOnly && !storeRegSet.has(d[3])) continue;
        const dStr = datesL[d[0]] || "";
        const mStr = dStr.slice(0, 7);
        if (!ignoreDateRange && state.monthFrom && mStr < state.monthFrom) continue;
        if (!ignoreDateRange && state.monthTo && mStr > state.monthTo) continue;
        if (clickedMonthSet && !clickedMonthSet.has(mStr)) continue;
        const wStr = weeksL[dateToWeek[d[0]]] || mStr;
        out.push([
          dStr, mStr, wStr, 0, 0, d[3], 0, d[2], 0, 0, 0,
          d[5], d[6], d[6] - d[7], d[7], d[1], 1, d[4] || 0,
        ]);
      } else {
        // Legacy 12-col: [0:dIdx, 1:wIdx, 2:mIdx, 3:catIdx, 4:subIdx, 5:regIdx, 6:isBulk, 7:qty, 8:sales, 9:cogs, 10:gp, 11:cnt]
        const mStr = typeof d[2] === "number" ? (monthsL[d[2]] || "") : String(d[2]);
        if (catIdxSet && !catIdxSet.has(d[3])) continue;
        if (subIdxSet && !subIdxSet.has(d[4])) continue;
        if (!ignoreDateRange && state.monthFrom && mStr < state.monthFrom) continue;
        if (!ignoreDateRange && state.monthTo && mStr > state.monthTo) continue;
        if (clickedMonthSet && !clickedMonthSet.has(mStr)) continue;
        if (regIdxSet && !regIdxSet.has(d[5])) continue;
        if (state.excludeBulk && d[6] === 1) continue;
        if (state.storeRegionsOnly && !storeRegSet.has(d[5])) continue;
        const dStr = typeof d[0] === "number" ? (datesL[d[0]] || mStr) : String(d[0]);
        const wStr = typeof d[1] === "number" ? (weeksL[d[1]] || mStr) : String(d[1]);
        out.push([
          dStr, mStr, wStr, 0, 0, d[5], 0, d[4], 0, 0, 0,
          d[7], d[8], d[9], d[10], d[3], d[11] || 1, d[6] || 0,
        ]);
      }
    }
    return out;
  }

  // --- MASTER RENDER ---
  function renderAll() {
    const filtered = getFilteredRows(false);
    const filteredTime = state.clickedMonth ? getFilteredRows(true) : filtered;

    renderSidebarForView(filtered);
    renderChipsAndInsight(filtered);
    renderActiveView(filtered, filteredTime);
  }

  function renderActiveView(filtered, filteredTime) {
    if (state.activeView === "dashboard") {
      renderHeroChart(filteredTime);
      renderTargetReport(filtered);
      renderSiteRankList(filtered);
      renderRegionModality(filtered);
      renderTrendChart(filteredTime);
      renderYearlyComparisonChart();
    } else if (state.activeView === "monthly") {
      renderDeepMonthly(filteredTime);
      renderMonthlyDailyChart();
    } else if (state.activeView === "site") {
      renderDeepSite(filtered);
    } else if (state.activeView === "region") {
      renderDeepRegion(filtered);
    } else if (state.activeView === "channel") {
      renderDeepChannelAndDriver(filtered);
    } else if (state.activeView === "ledger") {
      renderLedgerTable(filtered);
    } else if (state.activeView === "inventory") {
      renderInventoryView();
    } else if (state.activeView === "badstock") {
      renderBadStockView();
    } else if (state.activeView === "pricecompare") {
      renderPriceCompareView();
    } else if (state.activeView === "lookup") {
      if (state.lookup.selectedSku) {
        renderLookupProfile(state.lookup.selectedSku, state.lookup.selectedSerial);
      }
    }
  }

  // =========================================================================
  // 0. THEME ENGINE (DARK MODE ⇄ LIGHT MODE)
  // =========================================================================
  function applyTheme(theme, shouldRender = true) {
    const isLight = theme === "light";
    state.theme = isLight ? "light" : "dark";
    try {
      localStorage.setItem("cyberpulse_theme", state.theme);
    } catch {
      // ignore storage errors
    }

    document.body.classList.toggle("theme-light", isLight);
    document.body.classList.toggle("theme-dark", !isLight);

    // Update topbar theme switch buttons
    document.querySelectorAll("#themeSwitchGroup .theme-switch-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.themeVal === state.theme);
    });

    // Update left rail theme button label
    const railLbl = document.getElementById("railThemeLabel");
    if (railLbl) {
      railLbl.innerHTML = isLight ? "Dark<br/>Mode" : "Light<br/>Mode";
    }

    // Update ECharts dynamic color tokens
    if (isLight) {
      COLORS.gridLine = "rgba(15, 23, 42, 0.08)";
      COLORS.axisLine = "rgba(15, 23, 42, 0.18)";
      COLORS.axisLabel = "#475569";
      COLORS.textMain = "#1E1B4B";
      COLORS.textSub = "#334155";
      COLORS.textMuted = "#64748B";
      COLORS.pieBorder = "#FFFFFF";
      COLORS.tooltipBg = "rgba(15, 23, 42, 0.94)";
      COLORS.tooltipBorder = "rgba(99, 102, 241, 0.45)";
    } else {
      COLORS.gridLine = "rgba(255, 255, 255, 0.07)";
      COLORS.axisLine = "rgba(255, 255, 255, 0.14)";
      COLORS.axisLabel = "#8492A6";
      COLORS.textMain = "#E2E8F0";
      COLORS.textSub = "#CBD5E1";
      COLORS.textMuted = "#94A3B8";
      COLORS.pieBorder = "#15181D";
      COLORS.tooltipBg = "rgba(15, 18, 24, 0.96)";
      COLORS.tooltipBorder = "rgba(29, 122, 252, 0.55)";
    }

    if (shouldRender && state.raw) {
      renderAll();
      if (state.activeView === "inventory") renderInventoryView();
      if (state.storage?.open) renderStorageReport();
    }
  }

  // =========================================================================
  // 1. CONTEXT-AWARE LEFT KPI & GAUGE SIDEBAR (TAILORED PER TAB)
  // =========================================================================
  function applySidebarSpec(spec) {
    const set = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };
    set("sidebarTitle", spec.title);
    set("sbGauge1Label", spec.g1Label);
    set("sidebarSalesShareTag", spec.g1Tag);
    set("gaugeGmValue", spec.g1Big);
    const gpPill = document.getElementById("gaugeGpPill");
    if (gpPill) {
      gpPill.textContent = spec.g1Pill;
      gpPill.classList.toggle("negative", Boolean(spec.g1PillNeg));
      gpPill.classList.toggle("positive", !spec.g1PillNeg);
    }

    set("sbBar1Label", spec.bar1Label);
    set("statSalesVal", spec.bar1Val);
    document.getElementById("barSalesFill").style.width = `${Math.max(4, Math.min(100, spec.bar1Pct))}%`;

    set("sbBar2Label", spec.bar2Label);
    set("statCogsVal", spec.bar2Val);
    document.getElementById("barCogsFill").style.width = `${Math.max(4, Math.min(100, spec.bar2Pct))}%`;

    set("sbGauge2Label", spec.g2Label);
    set("statQtyHeader", spec.g2Tag);
    set("gaugeFulfillVal", spec.g2Big);
    const qtyPill = document.getElementById("gaugeQtyPill");
    if (qtyPill) {
      qtyPill.textContent = spec.g2Pill;
      qtyPill.classList.toggle("negative", Boolean(spec.g2PillNeg));
      qtyPill.classList.toggle("positive", !spec.g2PillNeg);
    }

    const mIds = [
      ["mLbl1", "mAvgMonthSales", "mAvgMonthSalesSub"],
      ["mLbl2", "mAvgMonthQty", "mAvgMonthQtySub"],
      ["mLbl3", "mAsp", "mAspSub"],
      ["mLbl4", "mTotalGp", "mTotalGpPct"],
    ];
    spec.metrics.forEach((m, i) => {
      const [lId, vId, sId] = mIds[i];
      const lEl = document.getElementById(lId);
      const box = lEl ? lEl.closest(".metric-item") : null;
      if (box) box.classList.toggle("hidden", Boolean(m.hidden));
      if (m.hidden) return;
      set(lId, m.l); set(vId, m.v); set(sId, m.s);
      const sEl = document.getElementById(sId);
      if (sEl) sEl.className = `metric-delta ${m.cls || "pos"} mono`;
    });

    const iIds = [
      ["iLbl1", "mActiveSites", "mActiveSitesSub"],
      ["iLbl2", "mActiveRegions", "mActiveRegionsSub"],
      ["iLbl3", "mExportRows", "mExportPct"],
      ["iLbl4", "mReturnRows", "mReturnPct"],
    ];
    spec.insets.forEach((m, i) => {
      const [lId, vId, sId] = iIds[i];
      set(lId, m.l); set(vId, m.v); set(sId, m.s);
      const sEl = document.getElementById(sId);
      if (sEl) sEl.className = `metric-delta ${m.cls || "pos"} mono`;
    });

    const isLight = state.theme === "light";

    if (charts.gaugeRing) {
      const ringPct = Math.max(0, Math.min(100, spec.g1Pct));
      charts.gaugeRing.setOption({
        series: [
          {
            type: "gauge", startAngle: 90, endAngle: -270, radius: "96%", min: 0, max: 100, splitNumber: 12,
            pointer: { show: false }, axisLine: { show: false },
            axisTick: { distance: -6, length: 7, splitNumber: 5, lineStyle: { color: isLight ? "rgba(79,70,229,0.28)" : "rgba(255,255,255,0.16)", width: 1.5 } },
            splitLine: { show: false }, axisLabel: { show: false }, detail: { show: false },
          },
          {
            type: "gauge", startAngle: 90, endAngle: -270, radius: "80%", min: 0, max: 100, pointer: { show: false },
            progress: {
              show: true, overlap: false, roundCap: true, clip: false,
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 1, 1, [
                  { offset: 0, color: spec.g1ColorA || (isLight ? "#6366F1" : "#1D7AFC") },
                  { offset: 1, color: spec.g1ColorB || (isLight ? "#EC4899" : "#12D37A") },
                ]),
                shadowBlur: 10, shadowColor: isLight ? "rgba(99, 102, 241, 0.35)" : "rgba(29, 122, 252, 0.5)",
              },
            },
            axisLine: { lineStyle: { width: 7, color: [[1, isLight ? "#E2E8F0" : "rgba(255,255,255,0.08)"]] } },
            splitLine: { show: false }, axisTick: { show: false }, axisLabel: { show: false }, detail: { show: false },
            data: [{ value: ringPct }],
          },
        ],
      });
    }

    if (charts.gaugeSemi) {
      const semiPct = Math.max(0, Math.min(100, spec.g2Pct));
      charts.gaugeSemi.setOption({
        series: [{
          type: "gauge", startAngle: 180, endAngle: 0, center: ["50%", "84%"], radius: "136%", min: 0, max: 100,
          pointer: { show: false },
          progress: {
            show: true, width: 20,
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                { offset: 0, color: spec.g2ColorA || (isLight ? "#6366F1" : "#0D63D9") },
                { offset: 1, color: spec.g2ColorB || (isLight ? "#38BDF8" : "#2196F3") },
              ]),
            },
          },
          axisLine: { lineStyle: { width: 20, color: [[1, isLight ? "#E2E8F0" : "#252A34"]] } },
          axisTick: { show: false },
          splitLine: { show: true, distance: -20, length: 20, lineStyle: { color: isLight ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.22)", width: 1.5 } },
          splitNumber: 5,
          axisLabel: {
            show: true, distance: -32, color: isLight ? "#64748B" : "#8492A6", fontFamily: "JetBrains Mono", fontSize: 9,
            formatter: (v) => (v === 0 || v === 80 || v === 100 ? `${v}%` : ""),
          },
          detail: { show: false },
          data: [{ value: Number(semiPct.toFixed(1)) }],
        }],
      });
    }
  }

  function renderSidebarForView(salesRows) {
    const v = state.activeView;
    if (v === "lookup" || v === "badstock") return; // Sidebar hidden on Tra cứu SKU/SN & Bad Stock
    if (v === "inventory") { renderSidebarInventory(); return; }
    if (v === "monthly") { renderSidebarMonthly(salesRows); return; }
    if (v === "site") { renderSidebarSite(salesRows); return; }
    if (v === "region") { renderSidebarRegion(salesRows); return; }
    if (v === "channel") { renderSidebarChannel(salesRows); return; }
    if (v === "ledger") { renderSidebarLedger(salesRows); return; }
    renderSidebar(salesRows); // Default: Dashboard (giữ nguyên 100%)
  }

  function renderSidebarInventory() {
    const inv = state.raw?.inventory;
    if (!inv || !inv.rows?.length) return;
    const rows = getFilteredInvRows();
    const serialRows = getFilteredSerialRows();
    const { lookups } = inv;
    let totVal = 0, totQty = 0, sellVal = 0, sellQty = 0, dmgVal = 0, dmgQty = 0, discVal = 0, discQty = 0, age365Val = 0, age365Qty = 0;
    const skus = new Set(), sites = new Set();
    const siteInvMap = new Map();

    rows.forEach((r) => {
      const val = r[INV_C.VALUE], qty = r[INV_C.QTY];
      totVal += val; totQty += qty; skus.add(r[INV_C.SKU]); sites.add(r[INV_C.SITE]);
      const sc = lookups.sites[r[INV_C.SITE]] || "—";
      const sCur = siteInvMap.get(sc) || { code: sc, val: 0, qty: 0 };
      sCur.val += val; sCur.qty += qty;
      siteInvMap.set(sc, sCur);

      const bt = (lookups.binTypes[r[INV_C.BIN_TYPE]] || "").toLowerCase();
      if (bt.includes("bán mới")) { sellVal += val; sellQty += qty; }
      if (bt.includes("hư hỏng")) { dmgVal += val; dmgQty += qty; }
      if ((lookups.purchaseStatuses[r[INV_C.STATUS]] || "").toLowerCase() === "discontinued") { discVal += val; discQty += qty; }
      const d = state.inv.agingBasis === "first" && r.length > INV_C.AGING_FIRST ? r[INV_C.AGING_FIRST] : r[INV_C.AGING];
      if (d > 365) { age365Val += val; age365Qty += qty; }
    });

    let healthyCnt = 0, clsCnt = 0, badRiskCnt = 0, badRiskVal = 0, totalSnCnt = 0;
    const isStrictlyBad = (lbl) => lbl === "Tồn xấu" || lbl === "Tồn rất xấu";
    const siteBadMap = new Map();
    const cubeRows = getFilteredSerialCubeRows();
    if (cubeRows && state.raw.invSerialCube) {
      const snL = state.raw.invSerialCube.lookups;
      const badCol = state.inv.badScope === "site" ? SC_C.BAD_SITE : SC_C.BAD_COMP;
      const badL = state.inv.badScope === "site" ? snL.badSite : snL.badComp;
      cubeRows.forEach((cr) => {
        const cnt = cr[SC_C.COUNT];
        const val = cr[SC_C.VAL];
        const sc = snL.sites[cr[SC_C.SITE]] || "—";
        let sb = siteBadMap.get(sc);
        if (!sb) { sb = { code: sc, badVal: 0, badCnt: 0, snTotVal: 0, snTotCnt: 0 }; siteBadMap.set(sc, sb); }
        sb.snTotVal += val;
        sb.snTotCnt += cnt;
        totalSnCnt += cnt;
        if (!cr[SC_C.IN_BAD_FILE]) return;
        clsCnt += cnt;
        const lbl = badL[cr[badCol]];
        if (lbl === "Tồn thông thường") healthyCnt += cnt;
        if (isStrictlyBad(lbl)) {
          badRiskCnt += cnt;
          badRiskVal += val;
          sb.badVal += val;
          sb.badCnt += cnt;
        }
      });
    } else if (state.raw.invSerials) {
      const snL = state.raw.invSerials.lookups;
      const badCol = state.inv.badScope === "site" ? SN_C.BAD_SITE : SN_C.BAD_COMP;
      const badL = state.inv.badScope === "site" ? snL.badSite : snL.badComp;
      totalSnCnt = serialRows.length;
      serialRows.forEach((sr) => {
        const val = sr[SN_C.INV_VAL];
        const sc = snL.sites[sr[SN_C.SITE]] || "—";
        let sb = siteBadMap.get(sc);
        if (!sb) { sb = { code: sc, badVal: 0, badCnt: 0, snTotVal: 0, snTotCnt: 0 }; siteBadMap.set(sc, sb); }
        sb.snTotVal += val;
        sb.snTotCnt += 1;
        if (!sr[SN_C.IN_BAD_FILE]) return;
        clsCnt++;
        const lbl = badL[sr[badCol]];
        if (lbl === "Tồn thông thường") healthyCnt++;
        if (isStrictlyBad(lbl)) {
          badRiskCnt++;
          badRiskVal += val;
          sb.badVal += val;
          sb.badCnt += 1;
        }
      });
    }

    // 1. Vòng tròn đầu tiên: Bad Stock so với Tổng tồn
    const badPct = totVal > 0 ? Math.min(100, (badRiskVal / totVal) * 100) : (totalSnCnt > 0 ? (badRiskCnt / totalSnCnt) * 100 : 0);
    // 2. Bán nguyệt tiếp theo: Tồn lâu > 365 ngày so với tổng tồn
    const age365Pct = totVal > 0 ? Math.min(100, (age365Val / totVal) * 100) : (totQty > 0 ? (age365Qty / totQty) * 100 : 0);

    // 3. Kho tồn nhiều nhất - giá trị bao nhiêu
    const sortedInvSites = Array.from(siteInvMap.values()).sort((a, b) => b.val - a.val);
    const topInvSite = sortedInvSites[0] || { code: "—", val: 0, qty: 0 };
    const topInvSiteShare = totVal > 0 ? (topInvSite.val / totVal) * 100 : 0;

    // 4. Kho có tỷ lệ tồn Bad Stock cao nhất
    let worstBadSite = { code: "—", pct: 0, badVal: 0, totVal: 0, badCnt: 0 };
    siteBadMap.forEach((sb) => {
      const sInv = siteInvMap.get(sb.code);
      const denomVal = (sInv && sInv.val > 0) ? sInv.val : sb.snTotVal;
      if (denomVal > 0 && sb.badVal > 0) {
        const pct = Math.min(100, (sb.badVal / denomVal) * 100);
        if (pct > worstBadSite.pct || (pct === worstBadSite.pct && sb.badVal > worstBadSite.badVal)) {
          worstBadSite = { code: sb.code, pct, badVal: sb.badVal, totVal: denomVal, badCnt: sb.badCnt };
        }
      }
    });

    // 5. 4 ô dưới cùng: Số SKU có bán trong 7D, 30D, 90D, 180D (tỷ lệ %)
    let cnt7d = 0, cnt30d = 0, cnt90d = 0, cnt180d = 0, totVelSkus = 0;
    const iv = state.inv;
    if (iv.site && state.raw.invBranchLevel?.rows?.length) {
      const brL = state.raw.invBranchLevel.lookups;
      const brSiteIdxSet = getLookupIdxSet(iv.site, brL.sites);
      const validSkuSet = new Set();
      rows.forEach((r) => validSkuSet.add(extractSkuCodeFromLabel(lookups.skus[r[INV_C.SKU]])));
      const seenSkuVel = new Map();
      state.raw.invBranchLevel.rows.forEach((br) => {
        if (brSiteIdxSet && !brSiteIdxSet.has(br[1])) return;
        if (validSkuSet.size > 0 && !validSkuSet.has(br[0])) return;
        const prev = seenSkuVel.get(br[0]) || [0, 0, 0, 0];
        prev[0] += br[3]; prev[1] += br[4]; prev[2] += br[5]; prev[3] += br[6];
        seenSkuVel.set(br[0], prev);
      });
      seenSkuVel.forEach((v) => {
        totVelSkus++;
        if (v[0] > 0) cnt7d++;
        if (v[1] > 0) cnt30d++;
        if (v[2] > 0) cnt90d++;
        if (v[3] > 0) cnt180d++;
      });
    } else if (state.raw.invSkuLevel?.rows?.length) {
      const hasLocalFilter = Boolean(state.globalCat || state.globalSubcat || iv.brand || iv.status || iv.range || iv.binType || iv.binZone || iv.badStock || iv.agingBucket || iv.sellableOnly || iv.damagedOnly);
      const validSkuSet = new Set();
      if (hasLocalFilter) {
        rows.forEach((r) => validSkuSet.add(extractSkuCodeFromLabel(lookups.skus[r[INV_C.SKU]])));
      }
      state.raw.invSkuLevel.rows.forEach((sr) => {
        // [0:sku, 1:name, 2:subcat2, 3:brand, 4:pstatus, 5:range, 6:s7, 7:s30, 8:s90, 9:s180, 10:gm, 11:sdays, 12:iq, 13:iv, 14:uc, 15:lp, 16:cat]
        const catCode = sr[16] || String(sr[2] || "").slice(0, 4);
        if (HIDDEN_GLOBAL_CATS.has(String(catCode).toUpperCase())) return;
        if (state.globalCat && !isMultiMatch(state.globalCat, catCode)) return;
        if (state.globalSubcat && !isMultiMatch(state.globalSubcat, sr[2])) return;
        if (iv.brand && !isMultiMatch(iv.brand, sr[3])) return;
        if (iv.status && !isMultiMatch(iv.status, sr[4])) return;
        if (iv.range && !isMultiMatch(iv.range, sr[5])) return;
        if (hasLocalFilter && validSkuSet.size > 0 && !validSkuSet.has(sr[0])) return;
        totVelSkus++;
        if (sr[6] > 0) cnt7d++;
        if (sr[7] > 0) cnt30d++;
        if (sr[8] > 0) cnt90d++;
        if (sr[9] > 0) cnt180d++;
      });
    }
    const pct7d = totVelSkus > 0 ? (cnt7d / totVelSkus) * 100 : 0;
    const pct30d = totVelSkus > 0 ? (cnt30d / totVelSkus) * 100 : 0;
    const pct90d = totVelSkus > 0 ? (cnt90d / totVelSkus) * 100 : 0;
    const pct180d = totVelSkus > 0 ? (cnt180d / totVelSkus) * 100 : 0;

    applySidebarSpec({
      title: "Tồn Kho",
      g1Label: "Bad Stock / Tổng Tồn",
      g1Tag: `${fmtInt(badRiskCnt)}/${fmtInt(totalSnCnt)} SN`,
      g1Big: fmtPct(badPct),
      g1Pill: `Bad ${fmtCompactVnd(badRiskVal)}`,
      g1PillNeg: badRiskVal > 0,
      g1Pct: badPct,
      bar1Label: "Tổng Giá trị Tồn",
      bar1Val: fmtCompactVnd(totVal),
      bar1Pct: 100,
      bar2Label: "Giá trị Bad Stock",
      bar2Val: fmtCompactVnd(badRiskVal),
      bar2Pct: badPct,
      g2Label: "Tồn lâu > 365 ngày / Tổng",
      g2Tag: `${fmtInt(age365Qty)} units`,
      g2Big: fmtPct(age365Pct),
      g2Pill: `>365D: ${fmtCompactVnd(age365Val)}`,
      g2PillNeg: age365Val > 0,
      g2Pct: age365Pct,
      metrics: [
        { l: "Kho Tồn Nhiều Nhất", v: `${topInvSite.code} • ${fmtCompactVnd(topInvSite.val)}`, s: `${fmtInt(topInvSite.qty)} sp (${fmtPct(topInvSiteShare)} tổng)`, cls: "pos" },
        { l: "Kho % Bad Stock Cao Nhất", v: `${worstBadSite.code} • ${fmtPct(worstBadSite.pct)}`, s: `Bad: ${fmtCompactVnd(worstBadSite.badVal)} / ${fmtCompactVnd(worstBadSite.totVal)}`, cls: "neg" },
        { l: "", v: "", s: "", hidden: true },
        { l: "", v: "", s: "", hidden: true },
      ],
      insets: [
        { l: "SKU có bán 7D", v: fmtInt(cnt7d), s: `${fmtPct(pct7d)} / ${fmtInt(totVelSkus)} SKU`, cls: "pos" },
        { l: "SKU có bán 30D", v: fmtInt(cnt30d), s: `${fmtPct(pct30d)} / ${fmtInt(totVelSkus)} SKU`, cls: "pos" },
        { l: "SKU có bán 90D", v: fmtInt(cnt90d), s: `${fmtPct(pct90d)} / ${fmtInt(totVelSkus)} SKU`, cls: "pos" },
        { l: "SKU có bán 180D", v: fmtInt(cnt180d), s: `${fmtPct(pct180d)} / ${fmtInt(totVelSkus)} SKU`, cls: "pos" },
      ],
    });
  }

  function renderSidebarMonthly(rows) {
    const byM = new Map(), weeks = new Set(), days = new Set();
    let totSales = 0, totQty = 0, totGp = 0, bulkCnt = 0;
    const dailyRows = getFilteredDailyRows(false);
    dailyRows.forEach((d) => { weeks.add(d[C.WEEK]); days.add(d[C.DATE]); });
    rows.forEach((r) => {
      const m = r[C.MONTH];
      const cur = byM.get(m) || { sales: 0, qty: 0 };
      cur.sales += r[C.SALES]; cur.qty += r[C.QTY];
      byM.set(m, cur);
      totSales += r[C.SALES]; totQty += r[C.QTY]; totGp += r[C.GP];
      const isB = r.length > C.IS_BULK ? r[C.IS_BULK] === 1 : Math.abs(r[C.QTY]) >= 100;
      if (isB) bulkCnt += (r.length > C.COUNT ? r[C.COUNT] : 1);
    });
    const sortedM = Array.from(byM.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    let peak = ["—", { sales: 0 }], low = ["—", { sales: Infinity }], posMom = 0;
    sortedM.forEach((e, idx) => {
      if (e[1].sales > peak[1].sales) peak = e;
      if (e[1].sales < low[1].sales) low = e;
      if (idx > 0 && e[1].sales >= sortedM[idx - 1][1].sales) posMom++;
    });
    if (!sortedM.length) low = ["—", { sales: 0 }];
    const peakShare = totSales > 0 ? (peak[1].sales / totSales) * 100 : 0;
    const momDenom = Math.max(1, sortedM.length - 1);
    const momPosRate = sortedM.length > 1 ? (posMom / momDenom) * 100 : 100;
    const ratioHL = low[1].sales > 0 ? (peak[1].sales / low[1].sales).toFixed(1) + "×" : "—";

    applySidebarSpec({
      title: "Monthly Report",
      g1Label: "Tỷ trọng Tháng Đỉnh",
      g1Tag: `${sortedM.length} tháng lọc`,
      g1Big: fmtPct(peakShare),
      g1Pill: `Đỉnh T${peak[0].slice(5)}/${peak[0].slice(2, 4)}`,
      g1Pct: peakShare,
      bar1Label: `Cao nhất (${peak[0]})`,
      bar1Val: fmtCompactVnd(peak[1].sales),
      bar1Pct: 100,
      bar2Label: `Thấp nhất (${low[0]})`,
      bar2Val: fmtCompactVnd(low[1].sales),
      bar2Pct: peak[1].sales > 0 ? (low[1].sales / peak[1].sales) * 100 : 0,
      g2Label: "Tỷ lệ Tháng Tăng MoM",
      g2Tag: `${posMom}/${momDenom} kỳ`,
      g2Big: fmtPct(momPosRate),
      g2Pill: `${fmtInt(totQty)} tổng QTY`,
      g2Pct: momPosRate,
      metrics: [
        { l: "TB Sales / Tháng", v: fmtCompactVnd(sortedM.length ? totSales / sortedM.length : 0), s: `${sortedM.length} tháng`, cls: "pos" },
        { l: "TB Qty / Tháng", v: fmtInt(sortedM.length ? totQty / sortedM.length : 0), s: "sp / tháng", cls: "pos" },
        { l: "Tổng Sales (Lọc)", v: fmtCompactVnd(totSales), s: `GM ${totSales ? fmtPct((totGp / totSales) * 100) : "0%"}`, cls: "neutral" },
        { l: "Biên độ Max / Min", v: ratioHL, s: "độ biến động", cls: "neutral" },
      ],
      insets: [
        { l: "Số Tháng", v: fmtInt(sortedM.length), s: "chu kỳ báo cáo", cls: "pos" },
        { l: "Số Tuần ISO", v: fmtInt(weeks.size), s: "tuần có đơn", cls: "pos" },
        { l: "Ngày phát sinh", v: fmtInt(days.size), s: "ngày bán hàng", cls: "pos" },
        { l: "Đơn sỉ ≥100", v: fmtInt(bulkCnt), s: "dòng đột biến", cls: bulkCnt ? "neg" : "pos" },
      ],
    });
  }

  function renderSidebarSite(rows) {
    const { lookups, siteDirectory } = state.raw;
    const byS = new Map();
    let totSales = 0, totQty = 0;
    rows.forEach((r) => {
      const code = lookups.sites[r[C.SITE]];
      const cur = byS.get(code) || { code, sales: 0, qty: 0, gp: 0 };
      cur.sales += r[C.SALES]; cur.qty += r[C.QTY]; cur.gp += r[C.GP];
      byS.set(code, cur);
      totSales += r[C.SALES]; totQty += r[C.QTY];
    });
    const list = Array.from(byS.values()).map((s) => ({
      ...s,
      gm: s.sales !== 0 ? (s.gp / s.sales) * 100 : 0,
      isStore: !(siteDirectory[s.code]?.region || "").startsWith("Non-Store"),
    })).sort((a, b) => b.sales - a.sales);

    const retailSales = list.filter((s) => s.isStore).reduce((a, b) => a + b.sales, 0);
    const nonStoreSales = Math.max(0, totSales - retailSales);
    const retailShare = totSales > 0 ? (retailSales / totSales) * 100 : 0;
    const nonStoreShare = totSales > 0 ? (nonStoreSales / totSales) * 100 : 0;
    const profCnt = list.filter((s) => s.gp > 0).length;
    const profRate = list.length ? (profCnt / list.length) * 100 : 0;
    const byGm = [...list].filter((s) => s.sales > 0).sort((a, b) => b.gm - a.gm);
    const bestGm = byGm[0] || { code: "—", gm: 0 };
    const worstGm = byGm[byGm.length - 1] || { code: "—", gm: 0 };
    const storeCnt = list.filter((s) => s.isStore).length;

    applySidebarSpec({
      title: "Site Report",
      g1Label: "Cửa hàng bán lẻ / Tổng số",
      g1Tag: `${storeCnt}/${list.length} sites`,
      g1Big: fmtPct(retailShare),
      g1Pill: `CH: ${fmtCompactVnd(retailSales)}`,
      g1Pct: retailShare,
      bar1Label: "Cửa hàng bán lẻ (CH)",
      bar1Val: fmtCompactVnd(retailSales),
      bar1Pct: retailShare,
      bar2Label: "Kênh Non-Store / Khác",
      bar2Val: fmtCompactVnd(nonStoreSales),
      bar2Pct: nonStoreShare,
      g2Label: "Tỷ lệ Site có lãi (GP>0)",
      g2Tag: `${profCnt}/${list.length} sites`,
      g2Big: fmtPct(profRate),
      g2Pill: `TB ${fmtCompactVnd(list.length ? totSales / list.length : 0)}/site`,
      g2Pct: profRate,
      metrics: [
        { l: "TB Sales / Site", v: fmtCompactVnd(list.length ? totSales / list.length : 0), s: `${list.length} điểm bán`, cls: "pos" },
        { l: "TB Qty / Site", v: fmtInt(list.length ? totQty / list.length : 0), s: "sp / site", cls: "pos" },
        { l: "GM% Cao nhất", v: fmtPct(bestGm.gm), s: bestGm.code, cls: "pos" },
        { l: "GM% Thấp nhất", v: fmtPct(worstGm.gm), s: worstGm.code, cls: worstGm.gm < 20 ? "neg" : "neutral" },
      ],
      insets: [
        { l: "Active Sites", v: fmtInt(list.length), s: `/ ${lookups.sites.length} sites`, cls: "pos" },
        { l: "Cửa hàng (CH)", v: fmtInt(storeCnt), s: "site bán lẻ", cls: "pos" },
        { l: "Non-Store", v: fmtInt(list.length - storeCnt), s: "BH / Corp / Inb", cls: "neutral" },
        { l: "Tổng QTY", v: fmtInt(totQty), s: "units bán ra", cls: "pos" },
      ],
    });
  }

  function renderSidebarRegion(rows) {
    const { lookups } = state.raw;
    const byR = new Map(), sites = new Set();
    let totSales = 0, totGp = 0, storeSales = 0, storeGp = 0, nonSales = 0;
    rows.forEach((r) => {
      const reg = lookups.regions[r[C.REGION]];
      const cur = byR.get(reg) || { reg, sales: 0, gp: 0, qty: 0 };
      cur.sales += r[C.SALES]; cur.gp += r[C.GP]; cur.qty += r[C.QTY];
      byR.set(reg, cur);
      sites.add(r[C.SITE]);
      totSales += r[C.SALES]; totGp += r[C.GP];
      if (reg.startsWith("Non-Store")) nonSales += r[C.SALES];
      else { storeSales += r[C.SALES]; storeGp += r[C.GP]; }
    });
    const list = Array.from(byR.values()).sort((a, b) => b.sales - a.sales);
    const top1 = list[0] || { reg: "—", sales: 0 };
    const top2 = list[1] || { reg: "—", sales: 0 };
    const r264 = byR.get("264") || { reg: "264", sales: 0, gp: 0, qty: 0 };
    const sales264 = r264.sales;
    const restSales = Math.max(0, totSales - sales264);
    const share264 = totSales > 0 ? (sales264 / totSales) * 100 : 0;
    const restShare = totSales > 0 ? (restSales / totSales) * 100 : 0;
    const storeGm = storeSales > 0 ? (storeGp / storeSales) * 100 : 0;
    const storeRegCnt = list.filter((x) => !x.reg.startsWith("Non-Store")).length;

    applySidebarSpec({
      title: "Region Report",
      g1Label: "Region 264 so với Còn lại",
      g1Tag: `264 vs ${Math.max(0, list.length - (byR.has("264") ? 1 : 0))} vùng khác`,
      g1Big: fmtPct(share264),
      g1Pill: `264: ${fmtCompactVnd(sales264)}`,
      g1Pct: share264,
      bar1Label: "Region 264 (CH 264 XNT)",
      bar1Val: fmtCompactVnd(sales264),
      bar1Pct: share264,
      bar2Label: "Các Region còn lại",
      bar2Val: fmtCompactVnd(restSales),
      bar2Pct: restShare,
      g2Label: "Biên lợi nhuận Khối CH",
      g2Tag: "Store GM (%)",
      g2Big: fmtPct(storeGm),
      g2Pill: `GP CH ${fmtCompactVnd(storeGp)}`,
      g2Pct: Math.min(100, (storeGm / 40) * 100),
      metrics: [
        { l: "Top #1 Region", v: shortRegionLabel(top1.reg), s: fmtCompactVnd(top1.sales), cls: "pos" },
        { l: "Top #2 Region", v: shortRegionLabel(top2.reg), s: fmtCompactVnd(top2.sales), cls: "neutral" },
        { l: "TB Sales / Region", v: fmtCompactVnd(list.length ? totSales / list.length : 0), s: `${list.length} vùng`, cls: "pos" },
        { l: "Tổng Lợi nhuận", v: fmtCompactVnd(totGp), s: `GM ${totSales ? fmtPct((totGp / totSales) * 100) : "0%"}`, cls: "pos" },
      ],
      insets: [
        { l: "Active Regions", v: fmtInt(list.length), s: `/ ${lookups.regions.length} vùng`, cls: "pos" },
        { l: "Region CH", v: fmtInt(storeRegCnt), s: "vùng cửa hàng", cls: "pos" },
        { l: "Non-Store", v: fmtInt(list.length - storeRegCnt), s: "kênh dịch vụ", cls: "neutral" },
        { l: "Active Sites", v: fmtInt(sites.size), s: "điểm bán", cls: "pos" },
      ],
    });
  }

  function renderSidebarChannel(rows) {
    const { lookups } = state.raw;
    const bySeg = new Map(), byBr = new Map();
    PRICE_SEGMENTS.forEach((seg) => bySeg.set(seg, { name: seg, sales: 0, qty: 0 }));

    let totSales = 0, totQty = 0;
    let shopeeSales = 0, shopeeQty = 0;
    let hddQty = 0, hddSales = 0;
    let usbQty = 0, usbSales = 0;
    let cableQty = 0, cableSales = 0;
    let chargerQty = 0, chargerSales = 0;

    rows.forEach((r) => {
      const ch = lookups.channels[r[C.CHANNEL]] || "";
      const sub = lookups.subcats[r[C.SUBCAT]] || "";
      const br = lookups.brands[r[C.BRAND]] || "Khác";
      const sal = r[C.SALES];
      const qty = r[C.QTY];

      byBr.set(br, (byBr.get(br) || 0) + sal);
      totSales += sal;
      totQty += qty;

      // Price Segment classification
      const unitP = qty !== 0 ? Math.abs(sal / qty) : 0;
      const segName = PRICE_SEGMENTS[getPriceSegmentIndex(unitP)];
      const segObj = bySeg.get(segName);
      if (segObj) { segObj.sales += sal; segObj.qty += qty; }

      // Shopee Mart sales
      if (ch.toLowerCase().includes("shopee")) {
        shopeeSales += sal;
        shopeeQty += qty;
      }

      // Product item counts: Ổ cứng, USB, Dây cáp, Củ sạc
      const itemBrk = getRowItemBreakdown(sub, br, qty, sal);
      if (itemBrk) {
        hddQty += itemBrk.hddQty; hddSales += itemBrk.hddSales;
        usbQty += itemBrk.usbQty; usbSales += itemBrk.usbSales;
        cableQty += itemBrk.cableQty; cableSales += itemBrk.cableSales;
        chargerQty += itemBrk.chargerQty; chargerSales += itemBrk.chargerSales;
      }
    });

    const segList = Array.from(bySeg.values()).filter((s) => s.sales > 0).sort((a, b) => b.sales - a.sales);
    const brList = Array.from(byBr.entries()).sort((a, b) => b[1] - a[1]);

    const topSeg1 = segList[0] || { name: "—", sales: 0, qty: 0 };
    const topSeg2 = segList[1] || { name: "—", sales: 0, qty: 0 };
    const topBr1 = brList[0] || ["—", 0];
    const topBr2 = brList[1] || ["—", 0];
    const topSegShare = totSales > 0 ? (topSeg1.sales / totSales) * 100 : 0;
    const topSeg2Share = totSales > 0 ? (topSeg2.sales / totSales) * 100 : 0;
    const top3BrSales = brList.slice(0, 3).reduce((s, x) => s + x[1], 0);
    const top3BrShare = totSales > 0 ? (top3BrSales / totSales) * 100 : 0;

    applySidebarSpec({
      title: "Brand & Segment",
      g1Label: `Segment Tốt Nhất (${topSeg1.name})`,
      g1Tag: `${segList.length} khúc giá`,
      g1Big: fmtPct(topSegShare),
      g1Pill: fmtCompactVnd(topSeg1.sales),
      g1Pct: topSegShare,
      bar1Label: `#1 Giá: ${topSeg1.name}`,
      bar1Val: fmtCompactVnd(topSeg1.sales),
      bar1Pct: topSegShare,
      bar2Label: `#2 Giá: ${topSeg2.name}`,
      bar2Val: fmtCompactVnd(topSeg2.sales),
      bar2Pct: topSeg2Share,
      g2Label: "Tỷ trọng Top 3 Brands",
      g2Tag: `${brList.length} brands`,
      g2Big: fmtPct(top3BrShare),
      g2Pill: fmtCompactVnd(top3BrSales),
      g2Pct: top3BrShare,
      metrics: [
        { l: "Top #1 Brand", v: topBr1[0].slice(0, 12), s: fmtCompactVnd(topBr1[1]), cls: "pos" },
        { l: "Top #2 Brand", v: topBr2[0].slice(0, 12), s: fmtCompactVnd(topBr2[1]), cls: "neutral" },
        { l: "Doanh số ShopeeMart", v: fmtCompactVnd(shopeeSales), s: `${fmtInt(shopeeQty)} sp bán ra`, cls: "pos" },
        { l: "Giá bán TB (ASP)", v: fmtCompactVnd(totQty ? totSales / totQty : 0), s: "VND / unit", cls: "neutral" },
      ],
      insets: [
        { l: "Số Ổ cứng đã bán", v: fmtInt(Math.round(hddQty)), s: fmtCompactVnd(hddSales), cls: "pos" },
        { l: "Số USB đã bán", v: fmtInt(Math.round(usbQty)), s: fmtCompactVnd(usbSales), cls: "pos" },
        { l: "Số Dây cáp đã bán", v: fmtInt(Math.round(cableQty)), s: fmtCompactVnd(cableSales), cls: "pos" },
        { l: "Số Củ sạc đã bán", v: fmtInt(Math.round(chargerQty)), s: fmtCompactVnd(chargerSales), cls: "pos" },
      ],
    });
  }

  function renderSidebarLedger(rows) {
    const { meta, lookups } = state.raw;
    const retIdx = lookups.orderTypes.indexOf("don_nhap_hoan_ban");
    let expRows = 0, retRows = 0, expSales = 0, retSales = 0, totSales = 0, totGp = 0, totQty = 0;
    const sites = new Set(), subcats = new Set();
    rows.forEach((r) => {
      const cnt = r.length > C.COUNT ? (r[C.COUNT] || 1) : 1;
      totSales += r[C.SALES]; totGp += r[C.GP]; totQty += r[C.QTY];
      sites.add(r[C.SITE]); subcats.add(r[C.SUBCAT]);
      if (r[C.ORDER_TYPE] === retIdx) { retRows += cnt; retSales += Math.abs(r[C.SALES]); }
      else { expRows += cnt; expSales += r[C.SALES]; }
    });
    const totalTx = expRows + retRows;
    const expRate = totalTx ? (expRows / totalTx) * 100 : 0;
    const filterShare = meta.rowCount ? (totalTx / meta.rowCount) * 100 : 0;

    applySidebarSpec({
      title: "Data Ledger",
      g1Label: "Tỷ lệ Đơn Xuất Bán",
      g1Tag: `${fmtInt(totalTx)} đơn`,
      g1Big: fmtPct(expRate),
      g1Pill: `${fmtInt(expRows)} đơn xuất`,
      g1Pct: expRate,
      bar1Label: "Giá trị Xuất bán",
      bar1Val: fmtCompactVnd(expSales),
      bar1Pct: 100,
      bar2Label: "Giá trị Hoàn bán",
      bar2Val: fmtCompactVnd(retSales),
      bar2Pct: expSales > 0 ? (retSales / expSales) * 100 : 0,
      g2Label: "Phạm vi Dữ liệu Lọc",
      g2Tag: `/ ${fmtInt(meta.rowCount)} gốc`,
      g2Big: fmtPct(filterShare),
      g2Pill: "Sẵn sàng Export CSV",
      g2Pct: filterShare,
      metrics: [
        { l: "Tổng đơn lọc", v: fmtInt(totalTx), s: `/ ${fmtInt(meta.rowCount)}`, cls: "pos" },
        { l: "Tổng Sales (Lọc)", v: fmtCompactVnd(totSales), s: "doanh thu thuần", cls: "pos" },
        { l: "Tổng GP (Lọc)", v: fmtCompactVnd(totGp), s: `GM ${totSales ? fmtPct((totGp / totSales) * 100) : "0%"}`, cls: "pos" },
        { l: "Tổng QTY (Lọc)", v: fmtInt(totQty), s: "units thuần", cls: "neutral" },
      ],
      insets: [
        { l: "Đơn Xuất bán", v: fmtInt(expRows), s: fmtPct(expRate), cls: "pos" },
        { l: "Đơn Hoàn bán", v: fmtInt(retRows), s: totalTx ? fmtPct((retRows / totalTx) * 100) : "0%", cls: "neg" },
        { l: "Active Sites", v: fmtInt(sites.size), s: "điểm bán", cls: "pos" },
        { l: "Subcat 2", v: fmtInt(subcats.size), s: "nhóm hàng", cls: "neutral" },
      ],
    });
  }

  function renderSidebar(rows) {
    const { meta, lookups } = state.raw;
    let sales = 0, qty = 0, cogs = 0, gp = 0, exportRows = 0, returnRows = 0;
    let sales2026 = 0, sales2025 = 0;
    const sites = new Set(), regions = new Set(), months = new Set(), months2026 = new Set();
    const retIdx = lookups.orderTypes.indexOf("don_nhap_hoan_ban");

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const cnt = r.length > C.COUNT ? (r[C.COUNT] || 1) : 1;
      const mStr = r[C.MONTH] || "";
      sales += r[C.SALES];
      qty += r[C.QTY];
      cogs += r[C.COGS];
      gp += r[C.GP];
      if (mStr.startsWith("2026")) {
        sales2026 += r[C.SALES];
        months2026.add(mStr);
      } else if (mStr.startsWith("2025")) {
        sales2025 += r[C.SALES];
      }
      if (r[C.ORDER_TYPE] === retIdx) returnRows += cnt;
      else exportRows += cnt;
      sites.add(r[C.SITE]);
      regions.add(r[C.REGION]);
      months.add(mStr);
    }

    const totalRows = exportRows + returnRows;
    const gm = sales !== 0 ? (gp / sales) * 100 : 0;
    const fulfillRate = totalRows > 0 ? (exportRows / totalRows) * 100 : 0;
    const avgMonthSales = months.size > 0 ? sales / months.size : 0;
    const avgMonthQty = months.size > 0 ? qty / months.size : 0;
    const asp = qty !== 0 ? sales / qty : 0;

    // Active Target Benchmark integration (Doanh số / Target là chỉ số chính, Margin là chỉ số phụ)
    let activeTargetTr = TARGET_BENCHMARK.total.target; // 165,866 Tr VND
    let activeTargetLabel = "Kế hoạch 165.9 Tỷ";
    let activeCatTitle = "Toàn bộ 3 NH";

    const selectedCats = splitMulti(state.globalCat).filter((c) => TARGET_BENCHMARK.categories[c]);
    if (selectedCats.length > 0 && selectedCats.length < 3) {
      activeTargetTr = selectedCats.reduce((sum, c) => sum + TARGET_BENCHMARK.categories[c].target, 0);
      activeCatTitle = selectedCats.join("+");
      activeTargetLabel = `Kế hoạch ${fmtCompactVnd(activeTargetTr * 1e6)}`;
    }

    // Use 2026 YTD sales against 2026 YTD Target when 2026 data is included in filter
    const effectiveSalesForTarget = sales2026 > 0 ? sales2026 : sales;
    const targetVnd = activeTargetTr * 1e6;
    const vsTargetPct = targetVnd > 0 ? (effectiveSalesForTarget / targetVnd) * 100 : 0;
    const targetGap = targetVnd - effectiveSalesForTarget;
    const targetGapLabel = targetGap > 0 ? `Thiếu -${fmtCompactVnd(targetGap)}` : `Vượt +${fmtCompactVnd(-targetGap)}`;

    // Calculate daily & YoY / MoM same-period telemetry for bottom 4 inset cards (use all-year history for YoY baseline)
    const dailyRows = getFilteredDailyRows(true, true);
    const allYearCubeRows = (state.site || state.channel || state.orderType) ? getFilteredRows(true, true) : rows;
    const byDate = new Map();
    const byMonthDaily = new Map();
    dailyRows.forEach((d) => {
      const dt = d[C.DATE];
      const m = d[C.MONTH];
      byDate.set(dt, (byDate.get(dt) || 0) + d[C.SALES]);
      byMonthDaily.set(m, (byMonthDaily.get(m) || 0) + d[C.SALES]);
    });

    // Scale factor if site / channel / orderType filter is active
    const byMonthCube = new Map();
    allYearCubeRows.forEach((r) => {
      const m = r[C.MONTH];
      byMonthCube.set(m, (byMonthCube.get(m) || 0) + r[C.SALES]);
    });
    const getMonthScale = (m) => {
      if (!state.site && !state.channel && !state.orderType) return 1;
      const dSum = byMonthDaily.get(m) || 0;
      const cSum = byMonthCube.get(m) || 0;
      return dSum !== 0 ? cSum / dSum : 0;
    };

    const sortedDates = Array.from(byDate.keys()).sort();
    const latestDateStr = sortedDates[sortedDates.length - 1] || (meta?.dateMax || "2026-11-21");
    const latestMonthStr = latestDateStr.slice(0, 7);
    const latestDayNum = Number(latestDateStr.slice(8, 10)) || 21;
    const latestDaySales = (byDate.get(latestDateStr) || 0) * getMonthScale(latestMonthStr);
    const latestDateVn = latestDateStr.length === 10
      ? `${latestDateStr.slice(8, 10)}/${latestDateStr.slice(5, 7)}/${latestDateStr.slice(0, 4)}`
      : latestDateStr;

    // 2026 Daily Average
    let totSales2026Daily = 0, days2026Cnt = 0;
    sortedDates.forEach((dt) => {
      if (dt.startsWith("2026-")) {
        const m = dt.slice(0, 7);
        const val = (byDate.get(dt) || 0) * getMonthScale(m);
        if (val !== 0 || byDate.get(dt) !== 0) {
          totSales2026Daily += val;
          days2026Cnt++;
        }
      }
    });
    if (state.site || state.channel || state.orderType) {
      totSales2026Daily = sales2026;
    }
    const avgDaily2026 = days2026Cnt > 0 ? totSales2026Daily / days2026Cnt : 0;

    // MoM Same-Period Growth (e.g. Nov 01..21 vs Oct 01..21)
    const active2026Months = Array.from(byMonthCube.keys()).filter((m) => m.startsWith("2026")).sort();
    const clickedMonthsList = splitMulti(state.clickedMonth).sort();
    const curM = clickedMonthsList[clickedMonthsList.length - 1] || active2026Months[active2026Months.length - 1] || latestMonthStr;
    const curY = Number(curM.slice(0, 4)) || 2026;
    const curMM = Number(curM.slice(5, 7)) || 11;
    const prevM = curMM > 1 ? `${curY}-${String(curMM - 1).padStart(2, "0")}` : `${curY - 1}-12`;
    let curMaxDay = 31;
    sortedDates.forEach((dt) => {
      if (dt.startsWith(curM)) curMaxDay = Math.max(1, Number(dt.slice(8, 10)) || 31);
    });
    let curPeriodSales = 0, prevPeriodSales = 0;
    sortedDates.forEach((dt) => {
      const dayN = Number(dt.slice(8, 10)) || 1;
      if (dt.startsWith(curM) && dayN <= curMaxDay) {
        curPeriodSales += (byDate.get(dt) || 0) * getMonthScale(curM);
      } else if (dt.startsWith(prevM) && dayN <= curMaxDay) {
        prevPeriodSales += (byDate.get(dt) || 0) * getMonthScale(prevM);
      }
    });
    const momSamePct = prevPeriodSales > 0 ? ((curPeriodSales - prevPeriodSales) / prevPeriodSales) * 100 : 0;
    const momSubLabel = `${curMaxDay} ngày T${String(curMM).padStart(2, "0")} vs T${prevM.slice(5, 7)}`;

    // YoY Same-Period Growth (2026 vs cùng kỳ 2025)
    let yoyPct = TARGET_BENCHMARK.total.vsLyPct;
    let yoySubLabel = "2026 vs cùng kỳ 2025";
    const hasSubFilter = Boolean(state.region || state.site || state.channel || state.globalSubcat || state.clickedMonth || state.orderType || state.excludeBulk || state.storeRegionsOnly);
    if (!hasSubFilter) {
      if (selectedCats.length === 1) {
        yoyPct = TARGET_BENCHMARK.categories[selectedCats[0]].vsLyPct;
      } else if (selectedCats.length > 1) {
        const sumYtd = selectedCats.reduce((s, c) => s + TARGET_BENCHMARK.categories[c].ytdSales, 0);
        const sumLy = selectedCats.reduce((s, c) => s + TARGET_BENCHMARK.categories[c].lySales, 0);
        yoyPct = sumLy > 0 ? ((sumYtd - sumLy) / sumLy) * 100 : TARGET_BENCHMARK.total.vsLyPct;
      } else {
        yoyPct = TARGET_BENCHMARK.total.vsLyPct;
      }
    } else if (clickedMonthsList.length === 1) {
      const lyM = `2025-${curM.slice(5, 7)}`;
      let lyMonthSameSales = 0;
      sortedDates.forEach((dt) => {
        const dayN = Number(dt.slice(8, 10)) || 1;
        if (dt.startsWith(lyM) && dayN <= curMaxDay) {
          lyMonthSameSales += (byDate.get(dt) || 0) * getMonthScale(lyM);
        }
      });
      yoyPct = lyMonthSameSales > 0 ? ((curPeriodSales - lyMonthSameSales) / lyMonthSameSales) * 100 : 0;
      yoySubLabel = `T${curM.slice(5, 7)}/26 vs T${curM.slice(5, 7)}/25`;
    } else {
      const cutoffMmDd = latestDateStr.slice(5, 10) || "11-21";
      let ytd26 = 0, ytd25 = 0;
      sortedDates.forEach((dt) => {
        const mmdd = dt.slice(5, 10);
        const m = dt.slice(0, 7);
        if (dt.startsWith("2026-") && mmdd <= cutoffMmDd) {
          ytd26 += (byDate.get(dt) || 0) * getMonthScale(m);
        } else if (dt.startsWith("2025-") && mmdd <= cutoffMmDd) {
          ytd25 += (byDate.get(dt) || 0) * getMonthScale(m);
        }
      });
      if (ytd25 > 0) {
        yoyPct = ((ytd26 - ytd25) / ytd25) * 100;
      } else if (sales2025 > 0) {
        yoyPct = ((sales2026 - sales2025) / sales2025) * 100;
      }
    }

    applySidebarSpec({
      title: "Dashboard",
      g1Label: "Doanh số / Target",
      g1Tag: activeTargetLabel,
      g1Big: `${vsTargetPct.toFixed(1)}%`,
      g1Pill: targetGapLabel,
      g1Pct: Math.min(100, Math.max(0, vsTargetPct)),
      bar1Label: "Doanh số Thực đạt (2026)",
      bar1Val: fmtCompactVnd(effectiveSalesForTarget),
      bar1Pct: Math.min(100, Math.max(0, vsTargetPct)),
      bar2Label: `Kế hoạch Target (${activeCatTitle})`,
      bar2Val: fmtCompactVnd(targetVnd),
      bar2Pct: 100,
      g2Label: "Net Export Rate",
      g2Tag: `${fmtInt(qty)} QTY`,
      g2Big: fmtPct(fulfillRate),
      g2Pill: `${fmtInt(qty)} units`,
      g2Pct: fulfillRate,
      metrics: [
        { l: "TB Sales / Tháng", v: fmtCompactVnd(avgMonthSales), s: `${months.size} tháng`, cls: "pos" },
        { l: "TB Qty / Tháng", v: fmtInt(avgMonthQty), s: "sp / tháng", cls: "pos" },
        { l: "Giá bán TB (ASP)", v: fmtCompactVnd(asp), s: "VND / unit", cls: "neutral" },
        { l: "Lợi nhuận GP (Phụ)", v: fmtCompactVnd(gp), s: `GM ${fmtPct(gm)} (chỉ số phụ)`, cls: "pos" },
      ],
      insets: [
        { l: "Tăng trưởng YoY", v: `${yoyPct >= 0 ? "+" : ""}${yoyPct.toFixed(1)}%`, s: yoySubLabel, cls: yoyPct >= 0 ? "pos" : "neg" },
        { l: "Tăng trưởng MoM", v: `${momSamePct >= 0 ? "+" : ""}${momSamePct.toFixed(1)}%`, s: momSubLabel, cls: momSamePct >= 0 ? "pos" : "neg" },
        { l: "DS Ngày gần nhất", v: fmtCompactVnd(latestDaySales), s: `Ngày ${latestDateVn}`, cls: "pos" },
        { l: "DS TB Ngày (2026)", v: fmtCompactVnd(avgDaily2026), s: `${fmtInt(days2026Cnt)} ngày năm 2026`, cls: "pos" },
      ],
    });
  }

  // =========================================================================
  // 2. ACTIVE CHIPS & INSIGHT
  // =========================================================================
  function renderChipsAndInsight(rows) {
    const wrap = document.getElementById("activeChips");
    const chips = [];
    const add = (label, cls, fn) => chips.push({ label, cls, fn });

    splitMulti(state.globalCat).forEach((cat) => {
      add(`Cat: ${cat}`, "amber", () => {
        state.globalCat = removeMultiVal(state.globalCat, cat);
        populateGlobalMasterFilter();
        renderLookupQuickPicks();
        renderAll();
      });
    });
    splitMulti(state.globalSubcat).forEach((sc) => {
      add(`Subcat 2: ${sc}`, "amber", () => {
        setGlobalSubcat(removeMultiVal(state.globalSubcat, sc));
      });
    });
    splitMulti(state.clickedMonth).forEach((m) => {
      add(`Month: ${m}`, "", () => {
        state.clickedMonth = removeMultiVal(state.clickedMonth, m);
        renderAll();
      });
    });
    splitMulti(state.region).forEach((reg) => {
      add(`Region: ${reg}`, "", () => {
        state.region = removeMultiVal(state.region, reg);
        syncMultiSelectUI("filterRegion", state.region);
        renderAll();
      });
    });
    splitMulti(state.site).forEach((siteCode) => {
      const sInfo = state.raw?.siteDirectory?.[siteCode];
      const sLbl = sInfo && sInfo.storeName && sInfo.storeName !== siteCode ? `${siteCode} - ${sInfo.storeName}` : siteCode;
      add(`Site: ${sLbl}`, "", () => {
        state.site = removeMultiVal(state.site, siteCode);
        syncMultiSelectUI("filterSite", state.site);
        renderAll();
      });
    });
    splitMulti(state.channel).forEach((ch) => {
      add(`Channel: ${ch}`, "", () => {
        state.channel = removeMultiVal(state.channel, ch);
        syncMultiSelectUI("filterChannel", state.channel);
        renderAll();
      });
    });
    if (state.orderType) add(state.orderType === "don_xuat_ban" ? "Xuất bán" : "Hoàn bán", "amber", () => {
      state.orderType = ""; const el = document.getElementById("filterOrderType"); if (el) el.value = ""; renderAll();
    });
    if (state.excludeBulk) add("Ẩn đơn sỉ (≥100 Qty)", "amber", () => {
      state.excludeBulk = false; const el = document.getElementById("excludeBulkToggle"); if (el) el.checked = false; renderAll();
    });
    if (state.storeRegionsOnly) add("Chỉ 5 Region CH", "amber", () => {
      state.storeRegionsOnly = false; const el = document.getElementById("storeRegionsOnlyToggle"); if (el) el.checked = false; renderAll();
    });

    const totalTx = rows.reduce((acc, r) => acc + (r.length > C.COUNT ? (r[C.COUNT] || 1) : 1), 0);
    wrap.innerHTML = "";
    if (chips.length === 0) {
      wrap.innerHTML = `<span class="chip muted-chip">Toàn bộ dữ liệu • ${fmtInt(totalTx)} giao dịch</span>`;
    } else {
      chips.forEach((c) => {
        const el = document.createElement("span");
        el.className = `chip ${c.cls}`;
        el.innerHTML = `<span>${esc(c.label)}</span><button type="button" aria-label="Xóa">×</button>`;
        el.querySelector("button").addEventListener("click", c.fn);
        wrap.appendChild(el);
      });
    }

    const insightEl = document.getElementById("insightText");
    if (rows.length === 0) {
      insightEl.textContent = "Không có dữ liệu khớp bộ lọc — bấm Reset hoặc Bỏ lọc chung.";
      return;
    }

    const byMonth = new Map();
    rows.forEach((r) => byMonth.set(r[C.MONTH], (byMonth.get(r[C.MONTH]) || 0) + r[C.SALES]));
    let peakM = "", peakS = -Infinity;
    byMonth.forEach((v, k) => { if (v > peakS) { peakS = v; peakM = k; } });

    let bulkInPeak = 0, bulkQtyInPeak = 0;
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const isB = r.length > C.IS_BULK ? r[C.IS_BULK] === 1 : Math.abs(r[C.QTY]) >= 100;
      if (r[C.MONTH] === peakM && isB) {
        bulkInPeak += (r.length > C.COUNT ? (r[C.COUNT] || 1) : 1);
        bulkQtyInPeak += r[C.QTY];
      }
    }
    const note = !state.excludeBulk && bulkInPeak > 0
      ? ` (gồm ${fmtInt(bulkInPeak)} đơn sỉ ${fmtInt(bulkQtyInPeak)} Qty)`
      : "";
    insightEl.textContent = `Đỉnh doanh thu: Tháng ${peakM} (${fmtCompactVnd(peakS)})${note}`;
  }

  // =========================================================================
  // 3. HERO CHART (DIALOGUE VOLUME SLOT — MULTI-COLOR BAR / SALES+QTY COMBO)
  // =========================================================================
  function renderHeroChart(rowsInput) {
    if (!charts.hero) return;
    const rows = state.heroGranularity !== "month" && !state.site && !state.channel && !state.orderType
      ? getFilteredDailyRows(Boolean(state.clickedMonth))
      : rowsInput;
    if (rows.length === 0) {
      charts.hero.clear();
      charts.hero.setOption(emptyOption("Không có dữ liệu khớp bộ lọc"));
      return;
    }

    const { lookups } = state.raw;
    const bucketCol =
      state.heroGranularity === "day" ? C.DATE :
      state.heroGranularity === "week" ? C.WEEK : C.MONTH;

    if (state.heroMode === "compare_ly") {
      // Compare current selected period vs same period Last Year (Month / Week / Day)
      let allRows = [];
      if (state.heroGranularity !== "month") {
        allRows = getFilteredDailyRows(Boolean(state.clickedMonth), true);
        if (state.site || state.channel || state.orderType) {
          const filteredMonthlyAll = getFilteredRows(Boolean(state.clickedMonth), true);
          const monthFilterSales = new Map();
          filteredMonthlyAll.forEach((r) => {
            monthFilterSales.set(r[C.MONTH], (monthFilterSales.get(r[C.MONTH]) || 0) + r[C.SALES]);
          });
          const monthDailyTotal = new Map();
          allRows.forEach((r) => {
            monthDailyTotal.set(r[C.MONTH], (monthDailyTotal.get(r[C.MONTH]) || 0) + r[C.SALES]);
          });
          allRows = allRows.map((r) => {
            const mTot = monthDailyTotal.get(r[C.MONTH]) || 0;
            const fTot = monthFilterSales.get(r[C.MONTH]) || 0;
            const ratio = mTot > 0 ? fTot / mTot : 0;
            if (ratio === 1) return r;
            const copy = [...r];
            copy[C.QTY] = Math.round(r[C.QTY] * ratio);
            copy[C.SALES] = r[C.SALES] * ratio;
            copy[C.GP] = r[C.GP] * ratio;
            return copy;
          });
        }
      } else {
        allRows = getFilteredRows(Boolean(state.clickedMonth), true);
      }

      // Determine comparison years (default: max year in active rows vs curYear - 1)
      const activeYears = Array.from(new Set(rows.map((r) => String(r[C.MONTH] || "").slice(0, 4)).filter(Boolean))).sort();
      const curYear = activeYears.length ? activeYears[activeYears.length - 1] : ((state.monthTo || "2026-11").slice(0, 4) || "2026");
      const prevYear = String(Number(curYear) - 1);

      const extractUnitKey = (rawKey) => {
        const s = String(rawKey || "");
        if (state.heroGranularity === "month") return s.slice(5, 7); // "MM"
        if (state.heroGranularity === "week") {
          const idx = s.indexOf("W");
          return idx !== -1 ? s.slice(idx) : s.slice(5); // "W01"
        }
        return s.slice(5); // "MM-DD"
      };

      const formatUnitLabel = (u) => {
        if (state.heroGranularity === "month") return `T${u}`;
        if (state.heroGranularity === "week") return u;
        const parts = u.split("-");
        return parts.length === 2 ? `${parts[1]}/${parts[0]}` : u;
      };

      // Collect active unit keys from current filtered rows
      const unitSet = new Set();
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const y = String(r[C.MONTH] || "").slice(0, 4);
        if (y === curYear || activeYears.length === 1) {
          const u = extractUnitKey(r[bucketCol]);
          if (u) unitSet.add(u);
        }
      }
      if (unitSet.size === 0) {
        rows.forEach((r) => {
          const u = extractUnitKey(r[bucketCol]);
          if (u) unitSet.add(u);
        });
      }
      const units = Array.from(unitSet).sort();

      const curMap = new Map();
      const lyMap = new Map();
      for (let i = 0; i < allRows.length; i++) {
        const r = allRows[i];
        const rawB = String(r[bucketCol] || "");
        const y = rawB.slice(0, 4) || String(r[C.MONTH] || "").slice(0, 4);
        if (y !== curYear && y !== prevYear) continue;
        const u = extractUnitKey(rawB);
        if (!unitSet.has(u)) continue;
        const targetMap = y === curYear ? curMap : lyMap;
        let agg = targetMap.get(u);
        if (!agg) {
          agg = { sales: 0, qty: 0, gp: 0 };
          targetMap.set(u, agg);
        }
        agg.sales += r[C.SALES];
        agg.qty += r[C.QTY];
        agg.gp += r[C.GP];
      }

      const xLabels = units.map(formatUnitLabel);
      const curSalesData = units.map((u) => {
        const monthKey = `${curYear}-${u}`;
        const sel = state.heroGranularity === "month" && state.clickedMonth && isMultiMatch(state.clickedMonth, monthKey);
        const dim = state.heroGranularity === "month" && state.clickedMonth && !sel;
        return {
          value: Math.round(curMap.get(u)?.sales || 0),
          itemStyle: {
            color: sel
              ? "#00E5FF"
              : new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: "#00E5FF" },
                  { offset: 1, color: "#1068DF" },
                ]),
            opacity: dim ? 0.35 : 0.95,
            borderRadius: [3, 3, 0, 0],
          },
        };
      });
      const lySalesData = units.map((u) => ({
        value: Math.round(lyMap.get(u)?.sales || 0),
        itemStyle: {
          color: "#8B5CF6",
          opacity: 0.78,
          borderRadius: [3, 3, 0, 0],
        },
      }));
      const yoyData = units.map((u) => {
        const cS = curMap.get(u)?.sales || 0;
        const lS = lyMap.get(u)?.sales || 0;
        if (lS > 0) return Number((((cS - lS) / lS) * 100).toFixed(1));
        return null;
      });

      charts.hero.setOption({
        backgroundColor: "transparent",
        tooltip: {
          trigger: "axis",
          axisPointer: { type: "shadow" },
          backgroundColor: COLORS.tooltipBg,
          borderColor: COLORS.tooltipBorder,
          textStyle: { color: "#F1F5F9", fontSize: 12 },
          formatter: (params) => {
            const idx = params[0]?.dataIndex ?? 0;
            const u = units[idx];
            const lbl = xLabels[idx];
            const c = curMap.get(u) || { sales: 0, qty: 0, gp: 0 };
            const l = lyMap.get(u) || { sales: 0, qty: 0, gp: 0 };
            const diff = c.sales - l.sales;
            const yoy = l.sales > 0 ? ((c.sales - l.sales) / l.sales) * 100 : null;
            const yoyColor = yoy === null ? "#94A3B8" : yoy >= 0 ? "#12D37A" : "#FB7185";
            const yoyText = yoy === null ? "N/A (Năm trước = 0)" : `${yoy >= 0 ? "+" : ""}${yoy.toFixed(1)}%`;
            return `
              <div style="min-width:225px">
                <div style="font-family:JetBrains Mono;color:#38BDF8;font-weight:700;margin-bottom:5px">${lbl} (${curYear} vs ${prevYear})</div>
                <div style="display:flex;justify-content:space-between;gap:14px"><span>Năm ${curYear}:</span><strong style="font-family:JetBrains Mono;color:#00E5FF">${fmtVndFull(c.sales)} (${fmtInt(c.qty)} sp)</strong></div>
                <div style="display:flex;justify-content:space-between;gap:14px"><span>Cùng kỳ ${prevYear}:</span><strong style="font-family:JetBrains Mono;color:#C4B5FD">${fmtVndFull(l.sales)} (${fmtInt(l.qty)} sp)</strong></div>
                <div style="display:flex;justify-content:space-between;gap:14px;margin-top:3px;padding-top:3px;border-top:1px solid rgba(255,255,255,0.12)"><span>Chênh lệch:</span><strong style="font-family:JetBrains Mono;color:${diff >= 0 ? "#12D37A" : "#FB7185"}">${diff >= 0 ? "+" : ""}${fmtCompactVnd(diff)}</strong></div>
                <div style="display:flex;justify-content:space-between;gap:14px"><span>Tăng trưởng YoY:</span><strong style="font-family:JetBrains Mono;color:${yoyColor}">${yoyText}</strong></div>
              </div>`;
          },
        },
        legend: {
          bottom: 0,
          icon: "circle",
          itemWidth: 8,
          itemHeight: 8,
          textStyle: { color: COLORS.textMuted, fontSize: 11 },
        },
        grid: { left: 54, right: 54, top: 24, bottom: 44 },
        xAxis: {
          type: "category",
          data: xLabels,
          axisLine: { lineStyle: { color: COLORS.axisLine } },
          axisLabel: { color: COLORS.textSub, fontFamily: "JetBrains Mono", fontSize: 10.5 },
        },
        yAxis: [
          {
            type: "value",
            axisLabel: { color: COLORS.axisLabel, fontFamily: "JetBrains Mono", fontSize: 10.5, formatter: fmtAxisVnd },
            splitLine: { lineStyle: { color: COLORS.gridLine } },
          },
          {
            type: "value",
            axisLabel: {
              color: COLORS.amber,
              fontFamily: "JetBrains Mono",
              fontSize: 10.5,
              formatter: (v) => `${v > 0 ? "+" : ""}${Math.round(v)}%`,
            },
            splitLine: { show: false },
          },
        ],
        series: [
          {
            name: `Doanh số ${curYear}`,
            type: "bar",
            yAxisIndex: 0,
            barMaxWidth: 26,
            barGap: "18%",
            data: curSalesData,
            label: {
              show: units.length <= 13,
              position: "top",
              color: COLORS.textSub,
              fontFamily: "JetBrains Mono",
              fontSize: 9.5,
              formatter: (p) => (p.value > 0 ? fmtCompactVnd(p.value) : ""),
            },
          },
          {
            name: `Cùng kỳ ${prevYear}`,
            type: "bar",
            yAxisIndex: 0,
            barMaxWidth: 26,
            data: lySalesData,
          },
          {
            name: "Tăng trưởng YoY (%)",
            type: "line",
            yAxisIndex: 1,
            smooth: 0.3,
            symbol: "circle",
            symbolSize: units.length > 35 ? 4 : 7,
            data: yoyData,
            lineStyle: { width: 2.5, color: COLORS.amber },
            itemStyle: { color: COLORS.amber, borderColor: COLORS.pieBorder, borderWidth: 1.5 },
          },
        ],
      }, true);
      return;
    }

    // Sales + Qty combo
    const map = new Map();
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const k = r[bucketCol];
      let o = map.get(k);
      if (!o) { o = { sales: 0, qty: 0, gp: 0, rows: 0 }; map.set(k, o); }
      o.sales += r[C.SALES];
      o.qty += r[C.QTY];
      o.gp += r[C.GP];
      o.rows += 1;
    }
    const keys = Array.from(map.keys()).sort();

    const salesBars = keys.map((k, idx) => {
      const sel = state.heroGranularity === "month" && state.clickedMonth && isMultiMatch(state.clickedMonth, k);
      const dim = state.heroGranularity === "month" && state.clickedMonth && !sel;
      const baseColor = sel ? COLORS.cyan : FALLBACK_COLORS[idx % FALLBACK_COLORS.length];
      return {
        value: Math.round(map.get(k).sales),
        itemStyle: {
          color: baseColor,
          opacity: dim ? 0.32 : 0.95,
          borderRadius: [3, 3, 0, 0],
        },
      };
    });

    const series = [
      {
        name: "Sales (VND)",
        type: "bar",
        yAxisIndex: 0,
        barMaxWidth: 34,
        data: salesBars,
        label: {
          show: keys.length <= 13,
          position: "top",
          color: COLORS.textSub,
          fontFamily: "JetBrains Mono",
          fontSize: 10,
          formatter: (p) => fmtCompactVnd(p.value),
        },
      },
      {
        name: "Sales QTY",
        type: "line",
        yAxisIndex: 1,
        smooth: 0.3,
        symbol: "circle",
        symbolSize: keys.length > 35 ? 4 : 7,
        data: keys.map((k) => map.get(k).qty),
        lineStyle: { width: 2.5, color: COLORS.amber },
        itemStyle: { color: COLORS.amber, borderColor: COLORS.pieBorder, borderWidth: 1.5 },
      },
    ];

    charts.hero.setOption({
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        backgroundColor: COLORS.tooltipBg,
        borderColor: COLORS.tooltipBorder,
        textStyle: { color: "#F1F5F9", fontSize: 12 },
        formatter: (params) => {
          const k = keys[params[0].dataIndex];
          const b = map.get(k);
          const gm = b.sales ? (b.gp / b.sales) * 100 : 0;
          return `
            <div style="min-width:195px">
              <div style="font-family:JetBrains Mono;color:#38BDF8;font-weight:700;margin-bottom:4px">${k} (${fmtInt(b.rows)} dòng)</div>
              <div style="display:flex;justify-content:space-between;gap:12px"><span>Sales:</span><strong style="font-family:JetBrains Mono">${fmtVndFull(b.sales)}</strong></div>
              <div style="display:flex;justify-content:space-between;gap:12px"><span>Sales QTY:</span><strong style="font-family:JetBrains Mono;color:#F59E0B">${fmtInt(b.qty)}</strong></div>
              <div style="display:flex;justify-content:space-between;gap:12px"><span>GP (GM%):</span><strong style="font-family:JetBrains Mono;color:#12D37A">${fmtCompactVnd(b.gp)} (${fmtPct(gm)})</strong></div>
            </div>`;
        },
      },
      legend: {
        bottom: 0,
        icon: "circle",
        itemWidth: 8,
        itemHeight: 8,
        textStyle: { color: COLORS.textMuted, fontSize: 11 },
      },
      grid: { left: 54, right: 54, top: 24, bottom: 44 },
      xAxis: {
        type: "category",
        data: keys,
        axisLine: { lineStyle: { color: COLORS.axisLine } },
        axisLabel: { color: COLORS.textSub, fontFamily: "JetBrains Mono", fontSize: 10.5 },
      },
      yAxis: [
        {
          type: "value",
          axisLabel: { color: COLORS.axisLabel, fontFamily: "JetBrains Mono", fontSize: 10.5, formatter: fmtAxisVnd },
          splitLine: { lineStyle: { color: COLORS.gridLine } },
        },
        {
          type: "value",
          axisLabel: { color: COLORS.amber, fontFamily: "JetBrains Mono", fontSize: 10.5, formatter: fmtInt },
          splitLine: { show: false },
        },
      ],
      series,
    }, true);
  }

  // =========================================================================
  // 3B. TARGET & PROPORTION BENCHMARK REPORT (NGÀNH HÀNG — ACTUAL DATA FROM Sale_Revenue_Detail)
  // =========================================================================
  function computeActualTargetReportData(useActiveFilters = true) {
    const { rows = [], lookups = {}, salesDaily = [] } = state.raw || {};
    const catsL = lookups.categories || [];
    const subsL = lookups.subcats || [];
    const datesL = lookups.dates || [];

    const subIdxSet = useActiveFilters ? getLookupIdxSet(state.globalSubcat, lookups.subcats) : null;
    const regIdxSet = useActiveFilters ? getLookupIdxSet(state.region, lookups.regions) : null;
    const siteIdxSet = useActiveFilters ? getLookupIdxSet(state.site, lookups.sites) : null;
    const chIdxSet = useActiveFilters ? getLookupIdxSet(state.channel, lookups.channels) : null;
    const otIdxSet = useActiveFilters ? getLookupIdxSet(state.orderType, lookups.orderTypes) : null;
    const clickedMonthSet = (useActiveFilters && state.clickedMonth) ? new Set(splitMulti(state.clickedMonth)) : null;

    const storeRegSet = new Set();
    if (useActiveFilters && state.storeRegionsOnly && Array.isArray(lookups.regions)) {
      lookups.regions.forEach((n, idx) => { if (!n.startsWith("Non-Store")) storeRegSet.add(idx); });
    }

    const resolveRowCat = (r) => {
      let c = "";
      if (r.length > C.CAT && catsL[r[C.CAT]]) {
        c = String(catsL[r[C.CAT]]).toUpperCase();
      } else {
        const sc = String(subsL[r[C.SUBCAT]] || "");
        const m = sc.match(/^(NH\d{2})/i);
        c = m ? m[1].toUpperCase() : "";
      }
      return c === "NH03" ? "NH93" : c;
    };

    // Determine active months & year to compare (default: 2026 YTD vs 2025 Same-Period)
    const catSales2026 = { NH06: 0, NH11: 0, NH93: 0 };
    const catSales2025Cube = { NH06: 0, NH11: 0, NH93: 0 };
    const subSales2026 = { NH06: new Map(), NH11: new Map(), NH93: new Map() };
    const subSales2025Daily = { NH06: new Map(), NH11: new Map(), NH93: new Map() };
    const subSales2025Cube = { NH06: new Map(), NH11: new Map(), NH93: new Map() };
    const active2026Months = new Set();
    let has2026InPeriod = false;

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (useActiveFilters) {
        if (subIdxSet && !subIdxSet.has(r[C.SUBCAT])) continue;
        if (regIdxSet && !regIdxSet.has(r[C.REGION])) continue;
        if (siteIdxSet && !siteIdxSet.has(r[C.SITE])) continue;
        if (chIdxSet && !chIdxSet.has(r[C.CHANNEL])) continue;
        if (otIdxSet && !otIdxSet.has(r[C.ORDER_TYPE])) continue;
        if (state.excludeBulk) {
          const isBulk = r.length > C.IS_BULK ? r[C.IS_BULK] === 1 : Math.abs(r[C.QTY]) >= 100;
          if (isBulk) continue;
        }
        if (state.storeRegionsOnly && !storeRegSet.has(r[C.REGION])) continue;
      }

      const mStr = String(r[C.MONTH] || "");
      const inSelectedRange = !useActiveFilters
        ? mStr.startsWith("2026")
        : ((!state.monthFrom || mStr >= state.monthFrom) &&
           (!state.monthTo || mStr <= state.monthTo) &&
           (!clickedMonthSet || clickedMonthSet.has(mStr)));

      if (inSelectedRange && mStr.startsWith("2026")) {
        has2026InPeriod = true;
      }
    }

    // Pass 2: Accumulate current period sales and corresponding Subcat 2 breakdown
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (useActiveFilters) {
        if (subIdxSet && !subIdxSet.has(r[C.SUBCAT])) continue;
        if (regIdxSet && !regIdxSet.has(r[C.REGION])) continue;
        if (siteIdxSet && !siteIdxSet.has(r[C.SITE])) continue;
        if (chIdxSet && !chIdxSet.has(r[C.CHANNEL])) continue;
        if (otIdxSet && !otIdxSet.has(r[C.ORDER_TYPE])) continue;
        if (state.excludeBulk) {
          const isBulk = r.length > C.IS_BULK ? r[C.IS_BULK] === 1 : Math.abs(r[C.QTY]) >= 100;
          if (isBulk) continue;
        }
        if (state.storeRegionsOnly && !storeRegSet.has(r[C.REGION])) continue;
      }

      const code = resolveRowCat(r);
      if (catSales2026[code] === undefined) continue;
      const subName = String(subsL[r[C.SUBCAT]] || "Khác");

      const mStr = String(r[C.MONTH] || "");
      if (!useActiveFilters) {
        if (mStr.startsWith("2026")) {
          catSales2026[code] += r[C.SALES];
          subSales2026[code].set(subName, (subSales2026[code].get(subName) || 0) + r[C.SALES]);
          active2026Months.add(mStr.slice(5, 7));
        }
      } else {
        const inRange =
          (!state.monthFrom || mStr >= state.monthFrom) &&
          (!state.monthTo || mStr <= state.monthTo) &&
          (!clickedMonthSet || clickedMonthSet.has(mStr));
        if (inRange) {
          if (has2026InPeriod) {
            if (mStr.startsWith("2026")) {
              catSales2026[code] += r[C.SALES];
              subSales2026[code].set(subName, (subSales2026[code].get(subName) || 0) + r[C.SALES]);
              active2026Months.add(mStr.slice(5, 7));
            }
          } else {
            catSales2026[code] += r[C.SALES];
            subSales2026[code].set(subName, (subSales2026[code].get(subName) || 0) + r[C.SALES]);
            active2026Months.add(mStr.slice(5, 7));
          }
        }
      }
    }

    // Compute exact same-period Last Year (2025) sales from salesDaily (up to max date in active 2026 months)
    const catSales2025Daily = { NH06: 0, NH11: 0, NH93: 0 };
    if (Array.isArray(salesDaily) && salesDaily.length > 0 && datesL.length > 0) {
      let maxMmDd = "11-21";
      for (let i = 0; i < salesDaily.length; i++) {
        const d = salesDaily[i];
        const dt = datesL[d[0]] || "";
        if (dt.startsWith("2026-") && active2026Months.has(dt.slice(5, 7))) {
          const mmdd = dt.slice(5, 10);
          if (mmdd > maxMmDd) maxMmDd = mmdd;
        }
      }

      for (let i = 0; i < salesDaily.length; i++) {
        const d = salesDaily[i];
        const dt = datesL[d[0]] || "";
        if (!dt.startsWith("2025-")) continue;
        const mm = dt.slice(5, 7);
        const mmdd = dt.slice(5, 10);
        if (active2026Months.size > 0 && !active2026Months.has(mm)) continue;
        if (mmdd > maxMmDd) continue;

        if (useActiveFilters) {
          if (subIdxSet && !subIdxSet.has(d[2])) continue;
          if (regIdxSet && !regIdxSet.has(d[3])) continue;
          if (state.excludeBulk && d[4] === 1) continue;
          if (state.storeRegionsOnly && !storeRegSet.has(d[3])) continue;
        }
        let c = String(catsL[d[1]] || "").toUpperCase();
        if (c === "NH03") c = "NH93";
        if (catSales2025Daily[c] !== undefined) {
          catSales2025Daily[c] += d[6];
          const subName = String(subsL[d[2]] || "Khác");
          subSales2025Daily[c].set(subName, (subSales2025Daily[c].get(subName) || 0) + d[6]);
        }
      }

      // If site / channel / orderType filter is active, scale 2025 daily by 2025 cube filter ratio
      if (useActiveFilters && (siteIdxSet || chIdxSet || otIdxSet)) {
        const raw2025CubeAll = { NH06: 0, NH11: 0, NH93: 0 };
        const raw2025SubAll = { NH06: new Map(), NH11: new Map(), NH93: new Map() };
        for (let i = 0; i < rows.length; i++) {
          const r = rows[i];
          const mStr = String(r[C.MONTH] || "");
          if (!mStr.startsWith("2025") || (active2026Months.size > 0 && !active2026Months.has(mStr.slice(5, 7)))) continue;
          if (subIdxSet && !subIdxSet.has(r[C.SUBCAT])) continue;
          if (regIdxSet && !regIdxSet.has(r[C.REGION])) continue;
          if (state.excludeBulk && (r.length > C.IS_BULK ? r[C.IS_BULK] === 1 : Math.abs(r[C.QTY]) >= 100)) continue;
          if (state.storeRegionsOnly && !storeRegSet.has(r[C.REGION])) continue;
          const code = resolveRowCat(r);
          if (raw2025CubeAll[code] === undefined) continue;
          const subName = String(subsL[r[C.SUBCAT]] || "Khác");
          raw2025CubeAll[code] += r[C.SALES];
          raw2025SubAll[code].set(subName, (raw2025SubAll[code].get(subName) || 0) + r[C.SALES]);
          if (siteIdxSet && !siteIdxSet.has(r[C.SITE])) continue;
          if (chIdxSet && !chIdxSet.has(r[C.CHANNEL])) continue;
          if (otIdxSet && !otIdxSet.has(r[C.ORDER_TYPE])) continue;
          catSales2025Cube[code] += r[C.SALES];
          subSales2025Cube[code].set(subName, (subSales2025Cube[code].get(subName) || 0) + r[C.SALES]);
        }
        ["NH06", "NH11", "NH93"].forEach((code) => {
          const ratio = raw2025CubeAll[code] > 0 ? catSales2025Cube[code] / raw2025CubeAll[code] : 0;
          catSales2025Daily[code] *= ratio;
          subSales2025Daily[code].forEach((val, sName) => {
            const sAll = raw2025SubAll[code].get(sName) || 0;
            const sFilt = subSales2025Cube[code].get(sName) || 0;
            const sRatio = sAll > 0 ? sFilt / sAll : ratio;
            subSales2025Daily[code].set(sName, val * sRatio);
          });
        });
      }
    }

    const totalSales = catSales2026.NH06 + catSales2026.NH11 + catSales2026.NH93;
    const totalSalesTr = totalSales / 1e6;
    const totalLyTr = (catSales2025Daily.NH06 + catSales2025Daily.NH11 + catSales2025Daily.NH93) / 1e6;

    const codes = ["NH06", "NH11", "NH93"];
    const reportRows = codes.map((code) => {
      const bm = TARGET_BENCHMARK.categories[code];
      const salesTr = catSales2026[code] / 1e6;
      const lySalesTr = catSales2025Daily[code] > 0 ? (catSales2025Daily[code] / 1e6) : bm.lySales;
      const targetTr = bm.target;
      const vsTargetPct = targetTr > 0 ? (salesTr / targetTr) * 100 : 0;
      const proportPct = totalSalesTr > 0 ? (salesTr / totalSalesTr) * 100 : 0;
      const vsLyPct = lySalesTr > 0 ? ((salesTr - lySalesTr) / lySalesTr) * 100 : bm.vsLyPct;

      // Build active Subcat 2 list (only Subcat 2 with positive sales > 0)
      const subcats = Array.from(subSales2026[code].entries())
        .filter(([, sVnd]) => sVnd > 0)
        .map(([subName, sVnd]) => {
          const sTr = sVnd / 1e6;
          const lyVnd = subSales2025Daily[code].get(subName) || 0;
          const sLyTr = lyVnd / 1e6;
          const sVsLyPct = sLyTr > 0 ? ((sTr - sLyTr) / sLyTr) * 100 : null;
          const sProportTotalPct = totalSalesTr > 0 ? (sTr / totalSalesTr) * 100 : 0;
          const sProportCatPct = salesTr > 0 ? (sTr / salesTr) * 100 : 0;
          return {
            parentCat: code,
            subcat: subName,
            ytdSales: sTr,
            lySales: sLyTr,
            vsLyPct: sVsLyPct,
            proportPct: sProportTotalPct,
            proportCatPct: sProportCatPct,
          };
        })
        .sort((a, b) => b.ytdSales - a.ytdSales);

      return {
        code: bm.code,
        label: bm.label,
        ytdSales: salesTr,
        vsLyPct,
        proportPct,
        target: targetTr,
        vsTargetPct,
        lySales: lySalesTr,
        subcats,
      };
    });

    const totalTargetTr = TARGET_BENCHMARK.total.target;
    const totalVsTargetPct = totalTargetTr > 0 ? (totalSalesTr / totalTargetTr) * 100 : 0;
    const effTotalLy = totalLyTr > 0 ? totalLyTr : TARGET_BENCHMARK.total.lySales;
    const totalVsLyPct = effTotalLy > 0 ? ((totalSalesTr - effTotalLy) / effTotalLy) * 100 : TARGET_BENCHMARK.total.vsLyPct;

    const totalRow = {
      code: "TOTAL",
      label: "Total",
      ytdSales: totalSalesTr,
      vsLyPct: totalVsLyPct,
      proportPct: 100,
      target: totalTargetTr,
      vsTargetPct: totalVsTargetPct,
      lySales: effTotalLy,
    };

    return { reportRows, totalRow };
  }

  function renderTargetReport() {
    const tbody = document.getElementById("targetTableBody");
    if (!tbody) return;

    const isFiltered = state.targetDataSource === "filtered";
    const modeBadge = document.getElementById("targetModeBadge");
    if (modeBadge) {
      modeBadge.textContent = isFiltered ? "THỰC TẾ THEO BỘ LỌC" : "TOÀN BỘ YTD (DATA GỐC)";
    }

    const { reportRows, totalRow } = computeActualTargetReportData(isFiltered);

    const expAllBtn = document.getElementById("targetExpandAllBtn");
    if (expAllBtn) {
      const allExp = ["NH06", "NH11", "NH93"].every((c) => state.targetExpandedCats.has(c));
      expAllBtn.textContent = allExp ? "⊟ Thu gọn Subcat 2" : "⊞ Mở rộng Subcat 2";
    }

    // Build Table Body HTML with expandable Subcat 2 Pivot under each Category
    const rowsHtml = reportRows
      .map((r) => {
        const isNh11 = r.code === "NH11";
        const isSelected = Boolean(state.globalCat && isMultiMatch(state.globalCat, r.code));
        const isExp = state.targetExpandedCats.has(r.code);
        const trCls = [
          "target-cat-row",
          isNh11 ? "row-nh11" : "",
          isSelected ? "active-cat-row" : "",
          isExp ? "expanded" : "",
        ].filter(Boolean).join(" ");

        const vsLyCls = r.vsLyPct < 0 ? "target-delta-neg" : "target-delta-pos";
        const vsLyText = `${r.vsLyPct.toFixed(1)}%`;
        const vsTargetClamp = Math.min(100, Math.max(0, r.vsTargetPct));
        const subCount = r.subcats ? r.subcats.length : 0;

        let subRowsHtml = "";
        if (isExp && subCount > 0) {
          subRowsHtml = r.subcats.map((sub) => {
            const isSubSelected = Boolean(state.globalSubcat && isMultiMatch(state.globalSubcat, sub.subcat));
            const subVsLyCls = sub.vsLyPct === null ? "muted" : sub.vsLyPct < 0 ? "target-delta-neg" : "target-delta-pos";
            const subVsLyText = sub.vsLyPct === null ? "Mới" : `${sub.vsLyPct.toFixed(1)}%`;
            const subSalesDisp = sub.ytdSales >= 10 ? fmtInt(Math.round(sub.ytdSales)) : sub.ytdSales.toFixed(1);
            const subPropDisp = sub.proportPct >= 1 ? `${sub.proportPct.toFixed(1)}%` : `${sub.proportPct.toFixed(2)}%`;
            const subCatShareClamp = Math.min(100, Math.max(0, sub.proportCatPct));
            return `
              <tr class="target-subcat-row ${isSubSelected ? "active-subcat-row" : ""}" data-subcat="${esc(sub.subcat)}" title="Click để lọc theo Subcat 2: ${esc(sub.subcat)} • Giữ Ctrl + Click để chọn nhiều">
                <td class="target-subcat-name-cell">${esc(sub.subcat)}</td>
                <td class="num mono">${subSalesDisp}</td>
                <td class="num ${subVsLyCls}">${subVsLyText}</td>
                <td class="num mono">${subPropDisp}</td>
                <td class="num"><span class="target-subcat-share-note">${sub.proportCatPct.toFixed(1)}% ${esc(r.code)}</span></td>
                <td class="num">
                  <div class="target-progress-cell">
                    <span class="target-cell-pct" style="font-size:10.5px;color:#94A3B8">${Math.round(sub.proportCatPct)}%</span>
                    <div class="target-cell-track">
                      <div class="target-cell-bar" style="width: ${subCatShareClamp}%; opacity: 0.7"></div>
                    </div>
                  </div>
                </td>
              </tr>`;
          }).join("");
        }

        return `
        <tr class="${trCls}" data-cat="${r.code}" title="Click để xổ/thu gọn ${subCount} Subcat 2 có doanh số • Giữ Ctrl + Click hoặc bấm nút Lọc để lọc Ngành Hàng">
          <td>
            <div class="target-cat-cell">
              <div class="target-cat-left">
                <span class="target-expand-icon" data-toggle-cat="${r.code}">▶</span>
                <strong>${esc(r.label)}</strong>
                <span class="target-subcat-count" title="${subCount} Subcat 2 có doanh số">${subCount}</span>
              </div>
              <button type="button" class="target-cat-filter-btn" data-filter-cat="${r.code}" title="Lọc theo ${esc(r.label)} (Giữ Ctrl + Click để chọn nhiều NH)">Lọc</button>
            </div>
          </td>
          <td class="num">${fmtInt(Math.round(r.ytdSales))}</td>
          <td class="num ${vsLyCls}">${vsLyText}</td>
          <td class="num">${Math.round(r.proportPct)}%</td>
          <td class="num">${fmtInt(Math.round(r.target))}</td>
          <td class="num">
            <div class="target-progress-cell">
              <span class="target-cell-pct">${Math.round(r.vsTargetPct)}%</span>
              <div class="target-cell-track">
                <div class="target-cell-bar" style="width: ${vsTargetClamp}%"></div>
              </div>
            </div>
          </td>
        </tr>${subRowsHtml}`;
      })
      .join("");

    const totalVsLyCls = totalRow.vsLyPct < 0 ? "target-delta-neg" : "target-delta-pos";
    const totalVsTargetClamp = Math.min(100, Math.max(0, totalRow.vsTargetPct));
    const totalRowHtml = `
      <tr class="row-total" data-cat="" title="Bấm để bỏ lọc Ngành Hàng (Xem tất cả 3 NH)">
        <td><strong>${esc(totalRow.label)}</strong></td>
        <td class="num"><strong>${fmtInt(Math.round(totalRow.ytdSales))}</strong></td>
        <td class="num ${totalVsLyCls}"><strong>${totalRow.vsLyPct.toFixed(1)}%</strong></td>
        <td class="num"><strong>100%</strong></td>
        <td class="num"><strong>${fmtInt(Math.round(totalRow.target))}</strong></td>
        <td class="num">
          <div class="target-progress-cell">
            <span class="target-cell-pct"><strong>${Math.round(totalRow.vsTargetPct)}%</strong></span>
            <div class="target-cell-track">
              <div class="target-cell-bar" style="width: ${totalVsTargetClamp}%"></div>
            </div>
          </div>
        </td>
      </tr>`;

    tbody.innerHTML = rowsHtml + totalRowHtml;

    // Attach click listeners on Category rows (expand/collapse Subcat 2 pivot or filter with Ctrl/Lọc button)
    tbody.querySelectorAll("tr[data-cat]").forEach((tr) => {
      tr.addEventListener("mousedown", (e) => {
        if (e.ctrlKey || e.metaKey || e.shiftKey) e.preventDefault();
      });
      tr.addEventListener("click", (e) => {
        const cat = tr.dataset.cat;
        if (!cat) {
          setGlobalCategory("", false);
          return;
        }
        const clickedFilterBtn = Boolean(e.target.closest("[data-filter-cat]"));
        const isCtrl = Boolean(e.ctrlKey || e.metaKey || e.shiftKey);
        if (clickedFilterBtn || isCtrl) {
          e.stopPropagation();
          setGlobalCategory(cat, isCtrl);
          return;
        }
        if (state.targetExpandedCats.has(cat)) state.targetExpandedCats.delete(cat);
        else state.targetExpandedCats.add(cat);
        renderTargetReport();
      });
    });

    // Attach click listeners on Subcat 2 child pivot rows
    tbody.querySelectorAll("tr[data-subcat]").forEach((tr) => {
      tr.addEventListener("mousedown", (e) => {
        if (e.ctrlKey || e.metaKey || e.shiftKey) e.preventDefault();
      });
      tr.addEventListener("click", (e) => {
        e.stopPropagation();
        const sub = tr.dataset.subcat;
        const isCtrl = Boolean(e.ctrlKey || e.metaKey || e.shiftKey);
        setGlobalSubcat(toggleMultiVal(state.globalSubcat, sub, isCtrl));
      });
    });

    // Update KPI Cards
    const kpiTotalPct = document.getElementById("targetKpiTotalPct");
    const kpiTotalSub = document.getElementById("targetKpiTotalSub");
    const kpiTotalBar = document.getElementById("targetKpiTotalBar");
    if (kpiTotalPct) kpiTotalPct.textContent = `${Math.round(totalRow.vsTargetPct)}%`;
    if (kpiTotalSub) {
      const remaining = Math.max(0, totalRow.target - totalRow.ytdSales);
      kpiTotalSub.textContent = `${fmtInt(Math.round(totalRow.ytdSales))} / ${fmtInt(Math.round(totalRow.target))} Tr VND • Thiếu ${fmtInt(Math.round(remaining))} Tr`;
    }
    if (kpiTotalBar) kpiTotalBar.style.width = `${totalVsTargetClamp}%`;

    const nh11Data = reportRows.find((r) => r.code === "NH11") || reportRows[1];
    const kpiDominantVal = document.getElementById("targetKpiDominantVal");
    const kpiDominantSub = document.getElementById("targetKpiDominantSub");
    if (kpiDominantVal && nh11Data) {
      kpiDominantVal.textContent = `NH11 • ${Math.round(nh11Data.proportPct)}%`;
    }
    if (kpiDominantSub && nh11Data) {
      kpiDominantSub.textContent = `${fmtInt(Math.round(nh11Data.ytdSales))} Tr VND • Đạt ${Math.round(nh11Data.vsTargetPct)}% Target`;
    }

    // Render Target Chart
    renderTargetChart(reportRows);
  }

  function renderTargetChart(reportRows) {
    if (!charts.targetProgress) return;

    const isLight = state.theme === "light";
    const reversed = [...reportRows].reverse();
    const catLabels = reversed.map((r) => `${r.code} (${Math.round(r.proportPct)}%)`);
    const salesData = reversed.map((r) => Math.round(r.ytdSales));
    const targetData = reversed.map((r) => Math.round(r.target));
    const completionPct = reversed.map((r) => Math.round(r.vsTargetPct));

    charts.targetProgress.setOption({
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        backgroundColor: COLORS.tooltipBg,
        borderColor: COLORS.tooltipBorder,
        textStyle: { color: "#F1F5F9", fontSize: 11 },
        formatter: (params) => {
          if (!params || !params.length) return "";
          const idx = params[0].dataIndex;
          const r = reversed[idx];
          return `
            <div style="font-weight:700;margin-bottom:4px;color:#38BDF8">${esc(r.label)}</div>
            <div>Doanh số Thực đạt: <strong>${fmtInt(Math.round(r.ytdSales))} Tr VND</strong></div>
            <div>Kế hoạch Target: <strong>${fmtInt(Math.round(r.target))} Tr VND</strong></div>
            <div>Tiến độ hoàn thành: <strong style="color:#12D37A">${Math.round(r.vsTargetPct)}%</strong></div>
            <div>Tăng trưởng Vs LY: <strong style="${r.vsLyPct < 0 ? 'color:#FF4D6D' : 'color:#38BDF8'}">${r.vsLyPct.toFixed(1)}%</strong></div>
            <div>Tỷ trọng Proport: <strong>${Math.round(r.proportPct)}%</strong></div>
          `;
        },
      },
      legend: {
        data: ["Doanh số (Sales)", "Kế hoạch (Target)"],
        textStyle: { color: COLORS.axisLabel, fontSize: 11 },
        top: 2,
        right: 8,
      },
      grid: {
        top: 28,
        left: 8,
        right: 48,
        bottom: 4,
        containLabel: true,
      },
      xAxis: {
        type: "value",
        axisLabel: {
          color: COLORS.axisLabel,
          fontSize: 10,
          formatter: (v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k Tr` : `${v} Tr`,
        },
        splitLine: { lineStyle: { color: COLORS.gridLine } },
      },
      yAxis: {
        type: "category",
        data: catLabels,
        axisLabel: { color: isLight ? "#1E1B4B" : "#F1F5F9", fontSize: 11, fontWeight: 600 },
        axisLine: { lineStyle: { color: COLORS.axisLine } },
      },
      series: [
        {
          name: "Doanh số (Sales)",
          type: "bar",
          barWidth: 14,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: isLight ? "#6366F1" : "#1D7AFC" },
              { offset: 1, color: isLight ? "#EC4899" : "#12D37A" },
            ]),
            borderRadius: [0, 4, 4, 0],
          },
          label: {
            show: true,
            position: "right",
            color: isLight ? "#059669" : "#12D37A",
            fontSize: 10,
            fontFamily: "JetBrains Mono",
            formatter: (p) => `${completionPct[p.dataIndex]}%`,
          },
          data: salesData,
        },
        {
          name: "Kế hoạch (Target)",
          type: "bar",
          barWidth: 14,
          itemStyle: {
            color: isLight ? "rgba(99, 102, 241, 0.14)" : "rgba(255, 255, 255, 0.12)",
            borderColor: isLight ? "rgba(99, 102, 241, 0.45)" : "rgba(255, 255, 255, 0.35)",
            borderWidth: 1,
            borderRadius: [0, 4, 4, 0],
          },
          data: targetData,
        },
      ],
    });
  }

  function exportTargetCsv() {
    const isFiltered = state.targetDataSource === "filtered";
    const headers = [
      "Ngành Hàng (Category)",
      "Doanh số YTD (Tr VND)",
      "Vs Cùng kỳ LY (%)",
      "Tỷ trọng Proport (%)",
      "Kế hoạch Target (Tr VND)",
      "Tiến độ Vs Target (%)",
    ];

    const { reportRows, totalRow } = computeActualTargetReportData(isFiltered);
    const rowsData = reportRows.map((r) => [
      r.label,
      Math.round(r.ytdSales),
      `${r.vsLyPct.toFixed(1)}%`,
      `${r.proportPct.toFixed(1)}%`,
      r.target,
      `${r.vsTargetPct.toFixed(1)}%`,
    ]);
    rowsData.push([
      totalRow.label,
      Math.round(totalRow.ytdSales),
      `${totalRow.vsLyPct.toFixed(1)}%`,
      "100%",
      totalRow.target,
      `${totalRow.vsTargetPct.toFixed(1)}%`,
    ]);

    downloadCsv(headers, rowsData, `Bao_cao_Doanh_so_Vs_Target_Proport_${new Date().toISOString().slice(0, 10)}.csv`);
  }

  // =========================================================================
  // 4. TOP SALES SITE CODES ("THE 5 MOST USED SKILLS" STYLE)
  // =========================================================================
  function renderSiteRankList(rows) {
    const container = document.getElementById("siteRankList");
    const { lookups, siteDirectory } = state.raw;

    if (rows.length === 0) {
      container.innerHTML = `<div class="muted" style="padding:20px;text-align:center">Không có dữ liệu Site Code khớp bộ lọc.</div>`;
      return;
    }

    const agg = new Map();
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const sc = lookups.sites[r[C.SITE]];
      let o = agg.get(sc);
      if (!o) {
        const meta = siteDirectory[sc] || {};
        o = {
          siteCode: sc,
          storeName: meta.storeName || sc,
          region: meta.region || lookups.regions[r[C.REGION]],
          sales: 0, qty: 0, gp: 0, rows: 0,
        };
        agg.set(sc, o);
      }
      o.sales += r[C.SALES];
      o.qty += r[C.QTY];
      o.gp += r[C.GP];
      o.rows += 1;
    }

    const list = Array.from(agg.values()).map((d) => ({
      ...d,
      gm: d.sales ? (d.gp / d.sales) * 100 : 0,
    }));

    list.sort((a, b) => b[state.rankSort] - a[state.rankSort]);
    const top = list.slice(0, state.rankLimit);
    const maxSales = Math.max(...top.map((d) => Math.abs(d.sales)), 1);
    const maxQty = Math.max(...top.map((d) => Math.abs(d.qty)), 1);

    // Compute total across all sites to calculate % trên tổng số
    const totalRankSales = list.reduce((acc, d) => acc + (d.sales > 0 ? d.sales : 0), 0);
    const totalRankQty = list.reduce((acc, d) => acc + (d.qty > 0 ? d.qty : 0), 0);
    const totalRankMetric = state.rankSort === "qty" ? totalRankQty : totalRankSales;
    const metricName = state.rankSort === "qty" ? "QTY" : "Doanh số";

    const isLight = state.theme === "light";
    const ringFill = isLight ? "#6366F1" : "#1D7AFC";
    const ringTrack = isLight ? "#E2E8F0" : "#2A313D";

    container.innerHTML = top
      .map((d, idx) => {
        const itemVal = state.rankSort === "qty" ? d.qty : d.sales;
        const sharePct = totalRankMetric > 0 ? Math.max(0, (itemVal / totalRankMetric) * 100) : 0;
        const ringDeg = Math.round(Math.min(100, sharePct) * 3.6);
        const sPct = Math.max(3, Math.min(100, (Math.abs(d.sales) / maxSales) * 100));
        const qPct = Math.max(3, Math.min(100, (Math.abs(d.qty) / maxQty) * 100));
        const title = d.storeName !== d.siteCode ? `${d.siteCode} — ${d.storeName}` : d.siteCode;
        const selectedCls = (state.site && isMultiMatch(state.site, d.siteCode)) ? "selected" : "";
        const shareLabel = `${sharePct.toFixed(1)}%`;

        return `
        <div class="rank-row ${selectedCls}" data-site="${esc(d.siteCode)}" title="Click để lọc Site Code: ${esc(d.siteCode)} • Giữ Ctrl + Click để chọn nhiều">
          <div class="rank-idx">${idx + 1}</div>
          <div class="rank-ring" style="background: conic-gradient(${ringFill} 0deg ${ringDeg}deg, ${ringTrack} ${ringDeg}deg 360deg)" title="Tỷ trọng: ${sharePct.toFixed(1)}% trên tổng ${metricName}">
            <div class="rank-ring-inner">${shareLabel}</div>
          </div>
          <div class="rank-mid">
            <div class="rank-mid-head">
              <span class="rank-site-title" title="${esc(title)}">${esc(title)}</span>
              <span class="rank-region-tag">${esc(shortRegionLabel(d.region))}</span>
            </div>
            <div class="rank-bars">
              <div class="rank-bar-line">
                <span class="lbl">Sales:</span>
                <div class="bar-track"><div class="bar-fill emerald" style="width:${sPct.toFixed(1)}%"></div></div>
                <span class="val">${fmtCompactVnd(d.sales)}</span>
              </div>
              <div class="rank-bar-line">
                <span class="lbl">Qty:</span>
                <div class="bar-track"><div class="bar-fill crimson" style="width:${qPct.toFixed(1)}%"></div></div>
                <span class="val">${fmtInt(d.qty)}</span>
              </div>
            </div>
          </div>
          <div class="rank-right">
            <span class="rank-right-lbl">Gross Profit</span>
            <span class="rank-right-val">${fmtCompactVnd(d.gp)}</span>
            <span class="rank-right-sub">GM ${fmtPct(d.gm)}</span>
          </div>
        </div>`;
      })
      .join("");

    container.querySelectorAll(".rank-row").forEach((el) => {
      el.addEventListener("click", (e) => toggleSiteFilter(el.dataset.site, Boolean(e.ctrlKey || e.metaKey)));
    });
  }

  // =========================================================================
  // 5. REGION NAME MODALITY ("DIALOGUE VOLUME BY MODALITY" STYLE)
  // =========================================================================
  function renderRegionModality(rows) {
    const { lookups } = state.raw;
    const metric = state.regionMetric; // sales | qty | gp
    const agg = new Map();

    // Ensure all 8 regions appear cleanly
    lookups.regions.forEach((reg) => agg.set(reg, { region: reg, sales: 0, qty: 0, gp: 0 }));

    let total = 0;
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const reg = lookups.regions[r[C.REGION]];
      const o = agg.get(reg);
      o.sales += r[C.SALES];
      o.qty += r[C.QTY];
      o.gp += r[C.GP];
      total += metric === "qty" ? r[C.QTY] : metric === "gp" ? r[C.GP] : r[C.SALES];
    }

    const list = Array.from(agg.values()).sort((a, b) => b[metric] - a[metric]);
    const fmtVal = (v) => (metric === "qty" ? fmtInt(v) : fmtCompactVnd(v));

    document.getElementById("regionTotalHeadline").textContent = fmtVal(total);

    // Stacked multi-color segment bar
    const barEl = document.getElementById("regionStackedBar");
    barEl.innerHTML = list
      .filter((d) => d[metric] > 0)
      .map((d, idx) => {
        const pct = total > 0 ? (d[metric] / total) * 100 : 0;
        const color = REGION_COLORS[d.region] || FALLBACK_COLORS[idx % FALLBACK_COLORS.length];
        return `<div class="seg-slice" data-reg="${esc(d.region)}" style="width:${pct.toFixed(2)}%;background:${color}" title="${esc(d.region)}: ${fmtVal(d[metric])} (${fmtPct(pct)})"></div>`;
      })
      .join("");

    // 2-row colored icon grid
    const gridEl = document.getElementById("regionModalityGrid");
    gridEl.innerHTML = list
      .map((d, idx) => {
        const color = REGION_COLORS[d.region] || FALLBACK_COLORS[idx % FALLBACK_COLORS.length];
        const activeCls = (state.region && isMultiMatch(state.region, d.region)) ? "active" : "";
        return `
        <div class="reg-mod-item ${activeCls}" data-reg="${esc(d.region)}" title="Click để lọc Region ${esc(d.region)} (Sales: ${fmtVndFull(d.sales)} | Qty: ${fmtInt(d.qty)}) • Giữ Ctrl + Click để chọn nhiều">
          <div class="reg-mod-val">${fmtVal(d[metric])}</div>
          <div class="reg-mod-label">
            <span class="reg-dot" style="background:${color}"></span>
            <span>${esc(shortRegionLabel(d.region))}</span>
          </div>
        </div>`;
      })
      .join("");

    barEl.querySelectorAll("[data-reg]").forEach((el) => {
      el.addEventListener("click", (e) => toggleRegionFilter(el.dataset.reg, Boolean(e.ctrlKey || e.metaKey)));
    });
    gridEl.querySelectorAll("[data-reg]").forEach((el) => {
      el.addEventListener("click", (e) => toggleRegionFilter(el.dataset.reg, Boolean(e.ctrlKey || e.metaKey)));
    });
  }

  // =========================================================================
  // 6. BOTTOM-RIGHT AREA TREND ("SLA BY DATE" STYLE)
  // =========================================================================
  function renderTrendChart(rows) {
    if (!charts.trend) return;
    if (rows.length === 0) {
      charts.trend.clear();
      charts.trend.setOption(emptyOption("Không có dữ liệu xu hướng"));
      return;
    }

    const map = new Map();
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const m = r[C.MONTH];
      let o = map.get(m);
      if (!o) { o = { sales: 0, qty: 0, gp: 0 }; map.set(m, o); }
      o.sales += r[C.SALES];
      o.qty += r[C.QTY];
      o.gp += r[C.GP];
    }

    const months = Array.from(map.keys()).sort();
    const metric = state.trendMetric;
    const vals = months.map((m) => {
      const o = map.get(m);
      if (metric === "gm") return o.sales ? Number(((o.gp / o.sales) * 100).toFixed(1)) : 0;
      if (metric === "sales") return Math.round(o.sales);
      return o.qty;
    });

    const avgVal = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    const avgLine = months.map(() => (metric === "gm" ? Number(avgVal.toFixed(1)) : Math.round(avgVal)));

    const seriesLabel = metric === "gm" ? "GM (%)" : metric === "sales" ? "Sales" : "Sales QTY";

    charts.trend.setOption({
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        backgroundColor: COLORS.tooltipBg,
        borderColor: COLORS.tooltipBorder,
        textStyle: { color: "#F1F5F9", fontSize: 12 },
        valueFormatter: (v) => (metric === "gm" ? `${v}%` : metric === "sales" ? fmtVndFull(v) : `${fmtInt(v)} sp`),
      },
      legend: {
        bottom: 0,
        left: 6,
        icon: "circle",
        itemWidth: 8,
        itemHeight: 8,
        textStyle: { color: COLORS.textMuted, fontSize: 11 },
      },
      grid: { left: 48, right: 16, top: 14, bottom: 42 },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: months,
        axisLine: { lineStyle: { color: COLORS.axisLine } },
        axisLabel: {
          color: COLORS.textMuted,
          fontFamily: "JetBrains Mono",
          fontSize: 10,
          formatter: (v) => `T${v.slice(5)}`,
        },
      },
      yAxis: {
        type: "value",
        axisLabel: {
          color: COLORS.axisLabel,
          fontFamily: "JetBrains Mono",
          fontSize: 10,
          formatter: (v) => (metric === "gm" ? `${v}%` : metric === "sales" ? fmtAxisVnd(v) : fmtInt(v)),
        },
        splitLine: { lineStyle: { color: COLORS.gridLine } },
      },
      series: [
        {
          name: seriesLabel,
          type: "line",
          smooth: 0.2,
          symbol: "circle",
          symbolSize: 5,
          data: vals,
          lineStyle: { width: 2.5, color: "#1D7AFC" },
          itemStyle: { color: "#1D7AFC" },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "rgba(29, 122, 252, 0.42)" },
              { offset: 1, color: "rgba(29, 122, 252, 0.02)" },
            ]),
          },
        },
        {
          name: "Trung bình (Avg)",
          type: "line",
          symbol: "none",
          data: avgLine,
          lineStyle: { width: 1.5, type: "dashed", color: COLORS.amber },
          itemStyle: { color: COLORS.amber },
        },
      ],
    }, true);
  }

  // =========================================================================
  // 6B. YEAR-OVER-YEAR MONTHLY LINE COMPARISON (2025 - 2026 - 2027)
  // =========================================================================
  function renderYearlyComparisonChart() {
    if (!charts.yearlyCompare || !state.raw) return;
    const { lookups, rows } = state.raw;
    const metric = state.yearlyCompareMetric || "sales"; // sales | qty | gp

    // Filter rows by active category/subcat/region/site/channel/orderType/bulk, ignoring month range so all years compare fairly
    const catIdxSet = getLookupIdxSet(state.globalCat, lookups.categories);
    const subIdxSet = getLookupIdxSet(state.globalSubcat, lookups.subcats);
    const regIdxSet = getLookupIdxSet(state.region, lookups.regions);
    const siteIdxSet = getLookupIdxSet(state.site, lookups.sites);
    const chIdxSet = getLookupIdxSet(state.channel, lookups.channels);
    const ordIdxSet = getLookupIdxSet(state.orderType, lookups.orderTypes);
    const catsL = lookups.categories || [];

    const storeRegSet = new Set();
    if (state.storeRegionsOnly) {
      lookups.regions.forEach((n, idx) => { if (!n.startsWith("Non-Store")) storeRegSet.add(idx); });
    }

    // yearMap: year -> Array(12) of { sales, qty, gp, hasData }
    const yearMap = new Map();
    ["2025", "2026", "2027"].forEach((y) => {
      yearMap.set(y, Array.from({ length: 12 }, () => ({ sales: 0, qty: 0, gp: 0, hasData: false })));
    });

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (r.length > C.CAT) {
        const cCode = String(catsL[r[C.CAT]] || "").toUpperCase();
        if (HIDDEN_GLOBAL_CATS.has(cCode)) continue;
        if (catIdxSet && !catIdxSet.has(r[C.CAT])) continue;
      } else {
        const sc = String(lookups.subcats[r[C.SUBCAT]] || "");
        const cCode = sc.slice(0, 4).toUpperCase();
        if (HIDDEN_GLOBAL_CATS.has(cCode)) continue;
        if (state.globalCat && !hasMultiPrefix(state.globalCat, sc)) continue;
      }
      if (subIdxSet && !subIdxSet.has(r[C.SUBCAT])) continue;
      if (regIdxSet && !regIdxSet.has(r[C.REGION])) continue;
      if (siteIdxSet && !siteIdxSet.has(r[C.SITE])) continue;
      if (chIdxSet && !chIdxSet.has(r[C.CHANNEL])) continue;
      if (ordIdxSet && !ordIdxSet.has(r[C.ORDER_TYPE])) continue;
      if (state.excludeBulk) {
        const isBulk = r.length > C.IS_BULK ? r[C.IS_BULK] === 1 : Math.abs(r[C.QTY]) >= 100;
        if (isBulk) continue;
      }
      if (state.storeRegionsOnly && !storeRegSet.has(r[C.REGION])) continue;

      const mStr = r[C.MONTH] || "";
      const yStr = mStr.slice(0, 4);
      const mIdx = Number(mStr.slice(5, 7)) - 1;
      if (mIdx < 0 || mIdx > 11) continue;
      if (!yearMap.has(yStr)) {
        yearMap.set(yStr, Array.from({ length: 12 }, () => ({ sales: 0, qty: 0, gp: 0, hasData: false })));
      }
      const bucket = yearMap.get(yStr)[mIdx];
      bucket.sales += r[C.SALES];
      bucket.qty += r[C.QTY];
      bucket.gp += r[C.GP];
      bucket.hasData = true;
    }

    // Only keep years that actually have data (if 2027 has no data, do not display it)
    const activeYears = Array.from(yearMap.keys())
      .sort()
      .filter((y) => yearMap.get(y).some((b) => b.hasData && (b.sales !== 0 || b.qty !== 0)));

    const badgeEl = document.getElementById("yearlyCompareYearsBadge");
    if (badgeEl) {
      badgeEl.textContent = activeYears.length ? activeYears.join(" vs ") : "2025 vs 2026";
    }

    if (activeYears.length === 0) {
      charts.yearlyCompare.clear();
      charts.yearlyCompare.setOption(emptyOption("Không có dữ liệu so sánh theo năm"));
      return;
    }

    const monthLabels = ["T01", "T02", "T03", "T04", "T05", "T06", "T07", "T08", "T09", "T10", "T11", "T12"];
    const yearColors = {
      "2025": "#8492A6",
      "2026": "#1D7AFC",
      "2027": "#12D37A",
    };

    const series = activeYears.map((y, idx) => {
      const buckets = yearMap.get(y);
      const color = yearColors[y] || FALLBACK_COLORS[idx % FALLBACK_COLORS.length];
      const isLatestYear = idx === activeYears.length - 1;
      const data = buckets.map((b) => {
        if (!b.hasData) return null;
        return metric === "qty" ? b.qty : metric === "gp" ? Math.round(b.gp) : Math.round(b.sales);
      });

      return {
        name: `Năm ${y}`,
        type: "line",
        smooth: 0.25,
        symbol: "circle",
        symbolSize: isLatestYear ? 7 : 5,
        data,
        lineStyle: {
          width: isLatestYear ? 3 : 2,
          color,
          type: y === "2025" ? "dashed" : "solid",
        },
        itemStyle: { color },
        areaStyle: isLatestYear
          ? {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: "rgba(29, 122, 252, 0.28)" },
                { offset: 1, color: "rgba(29, 122, 252, 0.01)" },
              ]),
            }
          : undefined,
      };
    });

    const fmtVal = (v) => (metric === "qty" ? `${fmtInt(v)} sp` : fmtVndFull(v));

    charts.yearlyCompare.setOption({
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        backgroundColor: COLORS.tooltipBg,
        borderColor: COLORS.tooltipBorder,
        textStyle: { color: "#F1F5F9", fontSize: 12 },
        formatter: (params) => {
          if (!params || !params.length) return "";
          const mIdx = params[0].dataIndex;
          const mLbl = monthLabels[mIdx];
          let html = `<div style="font-family:JetBrains Mono;color:#38BDF8;font-weight:700;margin-bottom:4px">Tháng ${mLbl.slice(1)}</div>`;
          params.forEach((p) => {
            if (p.value === null || p.value === undefined) return;
            html += `<div style="display:flex;justify-content:space-between;gap:14px"><span>${p.marker} ${esc(p.seriesName)}:</span><strong style="font-family:JetBrains Mono">${fmtVal(p.value)}</strong></div>`;
          });
          if (yearMap.has("2025") && yearMap.has("2026")) {
            const b25 = yearMap.get("2025")[mIdx];
            const b26 = yearMap.get("2026")[mIdx];
            const v25 = metric === "qty" ? b25.qty : metric === "gp" ? b25.gp : b25.sales;
            const v26 = metric === "qty" ? b26.qty : metric === "gp" ? b26.gp : b26.sales;
            if (b25.hasData && b26.hasData && v25 > 0) {
              const yoy = ((v26 - v25) / v25) * 100;
              const col = yoy >= 0 ? "#12D37A" : "#FF4D6D";
              html += `<div style="margin-top:4px;padding-top:4px;border-top:1px solid rgba(255,255,255,0.1);display:flex;justify-content:space-between;gap:14px"><span>Tăng trưởng 2026 vs 2025:</span><strong style="font-family:JetBrains Mono;color:${col}">${yoy >= 0 ? "+" : ""}${yoy.toFixed(1)}%</strong></div>`;
            }
          }
          return html;
        },
      },
      legend: {
        top: 0,
        right: 12,
        icon: "circle",
        textStyle: { color: COLORS.textSub, fontSize: 11 },
      },
      grid: { left: 56, right: 24, top: 32, bottom: 28 },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: monthLabels,
        axisLine: { lineStyle: { color: COLORS.axisLine } },
        axisLabel: { color: COLORS.textSub, fontFamily: "JetBrains Mono", fontSize: 11 },
      },
      yAxis: {
        type: "value",
        axisLabel: {
          color: COLORS.axisLabel,
          fontFamily: "JetBrains Mono",
          fontSize: 10.5,
          formatter: (v) => (metric === "qty" ? fmtInt(v) : fmtAxisVnd(v)),
        },
        splitLine: { lineStyle: { color: COLORS.gridLine } },
      },
      series,
    }, true);
  }

  // =========================================================================
  // 7. DEEP VIEWS (BLUE RAIL PAGES 2–6)
  // =========================================================================
  function renderDeepMonthly(rowsInput) {
    if (!charts.deepMonthly) return;
    const rows = state.deepGranularity !== "month" && !state.site && !state.channel && !state.orderType
      ? getFilteredDailyRows(Boolean(state.clickedMonth))
      : rowsInput;
    if (rows.length === 0) {
      charts.deepMonthly.clear();
      charts.deepMonthly.setOption(emptyOption("Không có dữ liệu"));
      return;
    }

    const col = state.deepGranularity === "day" ? C.DATE : state.deepGranularity === "week" ? C.WEEK : C.MONTH;
    const map = new Map();
    rows.forEach((r) => {
      const k = r[col];
      let o = map.get(k);
      if (!o) { o = { sales: 0, qty: 0, gp: 0 }; map.set(k, o); }
      o.sales += r[C.SALES]; o.qty += r[C.QTY]; o.gp += r[C.GP];
    });
    const keys = Array.from(map.keys()).sort();

    if (state.deepMode === "mom") {
      const momS = keys.map((k, i) => {
        if (i === 0) return null;
        const p = map.get(keys[i - 1]).sales;
        return p ? Number((((map.get(k).sales - p) / Math.abs(p)) * 100).toFixed(1)) : null;
      });
      const momQ = keys.map((k, i) => {
        if (i === 0) return null;
        const p = map.get(keys[i - 1]).qty;
        return p ? Number((((map.get(k).qty - p) / Math.abs(p)) * 100).toFixed(1)) : null;
      });

      charts.deepMonthly.setOption({
        tooltip: { trigger: "axis", backgroundColor: COLORS.tooltipBg, borderColor: COLORS.tooltipBorder, textStyle: { color: "#F1F5F9" } },
        legend: { top: 0, textStyle: { color: COLORS.textSub } },
        grid: { left: 58, right: 24, top: 36, bottom: 70 },
        xAxis: { type: "category", data: keys, axisLabel: { color: COLORS.textSub, fontFamily: "JetBrains Mono" } },
        yAxis: { type: "value", axisLabel: { color: COLORS.axisLabel, formatter: (v) => `${v}%` }, splitLine: { lineStyle: { color: COLORS.gridLine } } },
        dataZoom: [{ type: "inside" }, { type: "slider", bottom: 8, height: 22 }],
        series: [
          {
            name: "Sales MoM (%)",
            type: "bar",
            barMaxWidth: 32,
            data: momS.map((v) => ({ value: v, itemStyle: { color: v >= 0 ? COLORS.emerald : COLORS.crimson } })),
          },
          { name: "Qty MoM (%)", type: "line", smooth: 0.25, data: momQ, lineStyle: { width: 2.5, color: COLORS.cyan }, itemStyle: { color: COLORS.cyan } },
        ],
      }, true);
      return;
    }

    charts.deepMonthly.setOption({
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, backgroundColor: COLORS.tooltipBg, borderColor: COLORS.tooltipBorder, textStyle: { color: "#F1F5F9" } },
      legend: { top: 0, textStyle: { color: COLORS.textSub } },
      grid: { left: 62, right: 62, top: 38, bottom: 70 },
      xAxis: { type: "category", data: keys, axisLabel: { color: COLORS.textSub, fontFamily: "JetBrains Mono" } },
      yAxis: [
        { type: "value", name: "Sales", axisLabel: { color: COLORS.axisLabel, formatter: fmtAxisVnd }, splitLine: { lineStyle: { color: COLORS.gridLine } } },
        { type: "value", name: "Qty", axisLabel: { color: COLORS.amber }, splitLine: { show: false } },
      ],
      dataZoom: [{ type: "inside" }, { type: "slider", bottom: 8, height: 22 }],
      series: [
        {
          name: "Sales (VND)",
          type: "bar",
          yAxisIndex: 0,
          barMaxWidth: 38,
          data: keys.map((k) => Math.round(map.get(k).sales)),
          itemStyle: { color: COLORS.blue, borderRadius: [3, 3, 0, 0] },
        },
        {
          name: "Sales QTY",
          type: "line",
          yAxisIndex: 1,
          smooth: 0.3,
          data: keys.map((k) => map.get(k).qty),
          lineStyle: { width: 2.5, color: COLORS.amber },
          itemStyle: { color: COLORS.amber },
        },
      ],
    }, true);
  }

  function renderMonthlyDailyChart() {
    if (!charts.monthlyDaily || !state.raw) return;

    const mdSelect = document.getElementById("monthlyDailyMonthSelect");
    const clickedMonthsList = splitMulti(state.clickedMonth).sort();
    const lastClickedM = clickedMonthsList[clickedMonthsList.length - 1] || "";
    if (lastClickedM && state.monthsAll.includes(lastClickedM)) {
      state.monthlyDailyMonth = lastClickedM;
    }
    if (!state.monthlyDailyMonth || !state.monthsAll.includes(state.monthlyDailyMonth)) {
      state.monthlyDailyMonth = state.monthsAll[state.monthsAll.length - 1] || "";
    }
    if (mdSelect && mdSelect.value !== state.monthlyDailyMonth) {
      mdSelect.value = state.monthlyDailyMonth;
    }

    const selMonth = state.monthlyDailyMonth;
    const badgeEl = document.getElementById("monthlyDailyActiveBadge");
    if (badgeEl) badgeEl.textContent = selMonth ? `THÁNG ${selMonth.slice(5)}/${selMonth.slice(0, 4)}` : "--";

    // Get daily rows for the selected month (ignoring global monthFrom/monthTo so the user's selected month in the dropdown always loads!)
    const daily = state.raw.salesDaily || [];
    const { lookups } = state.raw;
    const datesL = lookups.dates || [];
    const catIdxSet = getLookupIdxSet(state.globalCat, lookups.categories);
    const subIdxSet = getLookupIdxSet(state.globalSubcat, lookups.subcats);
    const regIdxSet = getLookupIdxSet(state.region, lookups.regions);
    const storeRegSet = new Set();
    if (state.storeRegionsOnly) {
      lookups.regions.forEach((n, idx) => { if (!n.startsWith("Non-Store")) storeRegSet.add(idx); });
    }

    const dayMap = new Map();
    let rawDailyMonthSales = 0, rawDailyMonthQty = 0;

    for (let i = 0; i < daily.length; i++) {
      const d = daily[i];
      // Compact 8-col: [0:dIdx, 1:catIdx, 2:subIdx, 3:regIdx, 4:isBulk, 5:qty, 6:sales, 7:gp]
      const cCode = String((lookups.categories || [])[d[1]] || "").toUpperCase();
      if (HIDDEN_GLOBAL_CATS.has(cCode)) continue;
      if (catIdxSet && !catIdxSet.has(d[1])) continue;
      if (subIdxSet && !subIdxSet.has(d[2])) continue;
      if (regIdxSet && !regIdxSet.has(d[3])) continue;
      if (state.excludeBulk && d[4] === 1) continue;
      if (state.storeRegionsOnly && !storeRegSet.has(d[3])) continue;
      const dStr = datesL[d[0]] || "";
      if (!dStr.startsWith(selMonth)) continue;

      let o = dayMap.get(dStr);
      if (!o) { o = { sales: 0, qty: 0, gp: 0 }; dayMap.set(dStr, o); }
      o.qty += d[5];
      o.sales += d[6];
      o.gp += d[7];
      rawDailyMonthSales += d[6];
      rawDailyMonthQty += d[5];
    }

    // If site / channel / orderType filter is active, scale daily values so monthly sum matches exact filtered monthly total
    let scaleS = 1, scaleQ = 1;
    if (state.site || state.channel || state.orderType) {
      const cubeRows = getFilteredRows(true).filter((r) => r[C.MONTH] === selMonth);
      const cubeSales = cubeRows.reduce((s, r) => s + r[C.SALES], 0);
      const cubeQty = cubeRows.reduce((s, r) => s + r[C.QTY], 0);
      scaleS = rawDailyMonthSales !== 0 ? cubeSales / rawDailyMonthSales : 0;
      scaleQ = rawDailyMonthQty !== 0 ? cubeQty / rawDailyMonthQty : 0;
    }

    const days = Array.from(dayMap.keys()).sort();
    const hintEl = document.getElementById("monthlyDailySummaryHint");

    if (days.length === 0 || (scaleS === 0 && scaleQ === 0)) {
      if (hintEl) hintEl.textContent = `Không có dữ liệu phát sinh trong tháng ${selMonth} với bộ lọc hiện tại`;
      charts.monthlyDaily.clear();
      charts.monthlyDaily.setOption(emptyOption(`Không có dữ liệu ngày trong tháng ${selMonth}`));
      return;
    }

    let totS = 0, totQ = 0, peakDay = days[0], peakS = -Infinity;
    const salesArr = [];
    const qtyArr = [];
    days.forEach((dt) => {
      const o = dayMap.get(dt);
      const sVal = Math.round(o.sales * scaleS);
      const qVal = Math.round(o.qty * scaleQ);
      salesArr.push(sVal);
      qtyArr.push(qVal);
      totS += sVal;
      totQ += qVal;
      if (sVal > peakS) { peakS = sVal; peakDay = dt; }
    });

    const avgS = days.length > 0 ? Math.round(totS / days.length) : 0;
    if (hintEl) {
      hintEl.innerHTML = `Tháng <strong>${selMonth}</strong> (${days.length} ngày): Tổng Sales <strong class="mono" style="color:#38BDF8">${fmtVndFull(totS)}</strong> • Tổng Qty <strong class="mono" style="color:#F59E0B">${fmtInt(totQ)} sp</strong> • TB/ngày <strong class="mono" style="color:#12D37A">${fmtCompactVnd(avgS)}</strong> • Đỉnh ngày <strong>${peakDay.slice(8, 10)}/${peakDay.slice(5, 7)}</strong> (${fmtCompactVnd(peakS)})`;
    }

    const mode = state.monthlyDailyMetric || "sales_qty";
    const xLabels = days.map((dt) => `${dt.slice(8, 10)}/${dt.slice(5, 7)}`);

    const series = [];
    if (mode === "sales_qty" || mode === "sales") {
      series.push({
        name: "Doanh số Ngày (VND)",
        type: mode === "sales" ? "line" : "bar",
        yAxisIndex: 0,
        barMaxWidth: 28,
        smooth: 0.25,
        data: salesArr,
        itemStyle: { color: COLORS.blue, borderRadius: [3, 3, 0, 0] },
        lineStyle: { width: 2.5, color: COLORS.blue },
        areaStyle: mode === "sales" ? {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "rgba(29, 122, 252, 0.35)" },
            { offset: 1, color: "rgba(29, 122, 252, 0.02)" },
          ]),
        } : undefined,
        label: {
          show: true,
          position: "top",
          color: "#93C5FD",
          fontFamily: "JetBrains Mono",
          fontSize: 9.5,
          formatter: (p) => fmtCompactVnd(p.value),
        },
        markLine: {
          symbol: "none",
          label: { color: COLORS.emerald, fontFamily: "JetBrains Mono", fontSize: 10, formatter: () => `TB: ${fmtCompactVnd(avgS)}` },
          lineStyle: { color: COLORS.emerald, type: "dashed", width: 1.5 },
          data: [{ yAxis: avgS }],
        },
      });
    }

    if (mode === "sales_qty" || mode === "qty") {
      series.push({
        name: "Sản lượng Ngày (QTY)",
        type: "line",
        yAxisIndex: mode === "sales_qty" ? 1 : 0,
        smooth: 0.25,
        symbol: "circle",
        symbolSize: 6,
        data: qtyArr,
        lineStyle: { width: 2.5, color: COLORS.amber },
        itemStyle: { color: COLORS.amber },
        label: mode === "qty" ? {
          show: true,
          position: "top",
          color: "#FCD34D",
          fontFamily: "JetBrains Mono",
          fontSize: 10,
          formatter: (p) => fmtInt(p.value),
        } : undefined,
      });
    }

    charts.monthlyDaily.setOption({
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        backgroundColor: COLORS.tooltipBg,
        borderColor: COLORS.tooltipBorder,
        textStyle: { color: "#F1F5F9", fontSize: 12 },
        formatter: (params) => {
          if (!params || !params.length) return "";
          const idx = params[0].dataIndex;
          const dt = days[idx];
          const sVal = salesArr[idx];
          const qVal = qtyArr[idx];
          const dPct = totS > 0 ? ((sVal / totS) * 100).toFixed(1) : "0.0";
          return `
            <div style="font-family:JetBrains Mono;color:#38BDF8;font-weight:700;margin-bottom:4px">Ngày ${dt.slice(8, 10)}/${dt.slice(5, 7)}/${dt.slice(0, 4)}</div>
            <div style="display:flex;justify-content:space-between;gap:14px"><span>Doanh số:</span><strong style="font-family:JetBrains Mono">${fmtVndFull(sVal)} (${dPct}%)</strong></div>
            <div style="display:flex;justify-content:space-between;gap:14px"><span>Số lượng (QTY):</span><strong style="font-family:JetBrains Mono;color:#F59E0B">${fmtInt(qVal)} sp</strong></div>
            <div style="display:flex;justify-content:space-between;gap:14px"><span>So với TB ngày:</span><strong style="font-family:JetBrains Mono;color:${sVal >= avgS ? "#12D37A" : "#FF4D6D"}">${avgS > 0 ? `${sVal >= avgS ? "+" : ""}${(((sVal - avgS) / avgS) * 100).toFixed(1)}%` : "—"}</strong></div>
          `;
        },
      },
      legend: { top: 0, textStyle: { color: COLORS.textSub } },
      grid: { left: 60, right: mode === "sales_qty" ? 60 : 28, top: 38, bottom: 32 },
      xAxis: {
        type: "category",
        data: xLabels,
        axisLabel: { color: COLORS.textSub, fontFamily: "JetBrains Mono", fontSize: 10.5 },
      },
      yAxis: mode === "sales_qty"
        ? [
            { type: "value", name: "Sales", axisLabel: { color: COLORS.axisLabel, formatter: fmtAxisVnd }, splitLine: { lineStyle: { color: COLORS.gridLine } } },
            { type: "value", name: "Qty", axisLabel: { color: COLORS.amber, formatter: fmtInt }, splitLine: { show: false } },
          ]
        : [
            {
              type: "value",
              name: mode === "qty" ? "Qty" : "Sales",
              axisLabel: { color: mode === "qty" ? COLORS.amber : COLORS.axisLabel, formatter: mode === "qty" ? fmtInt : fmtAxisVnd },
              splitLine: { lineStyle: { color: COLORS.gridLine } },
            },
          ],
      series,
    }, true);
  }

  function renderDeepSite(rows) {
    if (!charts.deepSite) return;
    const { lookups, siteDirectory } = state.raw;
    if (rows.length === 0) {
      charts.deepSite.clear();
      charts.deepSite.setOption(emptyOption("Không có dữ liệu Site Code"));
      return;
    }

    const agg = new Map();
    rows.forEach((r) => {
      const sc = lookups.sites[r[C.SITE]];
      let o = agg.get(sc);
      if (!o) {
        const meta = siteDirectory[sc] || {};
        o = { siteCode: sc, storeName: meta.storeName || sc, region: meta.region || lookups.regions[r[C.REGION]], sales: 0, qty: 0, gp: 0 };
        agg.set(sc, o);
      }
      o.sales += r[C.SALES]; o.qty += r[C.QTY]; o.gp += r[C.GP];
    });

    const list = Array.from(agg.values())
      .map((d) => ({ ...d, gm: d.sales ? (d.gp / d.sales) * 100 : 0 }))
      .sort((a, b) => b[state.siteChartSort] - a[state.siteChartSort]);

    if (state.siteChartView === "bar") {
      const rev = [...list].reverse();
      const sk = state.siteChartSort;
      charts.deepSite.setOption({
        tooltip: {
          trigger: "axis",
          axisPointer: { type: "shadow" },
          backgroundColor: COLORS.tooltipBg,
          borderColor: COLORS.tooltipBorder,
          textStyle: { color: "#F1F5F9" },
          formatter: (p) => {
            const d = rev[p[0].dataIndex];
            return `<strong>${d.siteCode}</strong> — ${esc(d.storeName)} (${esc(d.region)})<br/>Sales: ${fmtVndFull(d.sales)}<br/>Qty: ${fmtInt(d.qty)}<br/>GM%: ${fmtPct(d.gm)}`;
          },
        },
        grid: { left: 132, right: 80, top: 14, bottom: 28 },
        xAxis: {
          type: "value",
          axisLabel: { color: COLORS.axisLabel, formatter: (v) => (sk === "qty" ? fmtInt(v) : sk === "gm" ? `${v}%` : fmtAxisVnd(v)) },
          splitLine: { lineStyle: { color: COLORS.gridLine } },
        },
        yAxis: { type: "category", data: rev.map((d) => d.siteCode), axisLabel: { color: COLORS.textMain, fontFamily: "JetBrains Mono", fontSize: 11 } },
        dataZoom: rev.length > 16 ? [{ type: "slider", yAxisIndex: 0, right: 6, width: 12, start: 40, end: 100 }] : [],
        series: [{
          type: "bar",
          data: rev.map((d) => ({
            value: sk === "gm" ? Number(d.gm.toFixed(1)) : Math.round(d[sk]),
            siteCode: d.siteCode,
            itemStyle: { color: REGION_COLORS[d.region] || COLORS.blue, borderRadius: [0, 3, 3, 0] },
          })),
          label: {
            show: true,
            position: "right",
            color: COLORS.textSub,
            fontFamily: "JetBrains Mono",
            fontSize: 10,
            formatter: (p) => (sk === "qty" ? fmtInt(p.value) : sk === "gm" ? `${p.value}%` : fmtCompactVnd(p.value)),
          },
        }],
      }, true);
    } else if (state.siteChartView === "treemap") {
      charts.deepSite.setOption({
        tooltip: {
          backgroundColor: COLORS.tooltipBg,
          borderColor: COLORS.tooltipBorder,
          textStyle: { color: "#F1F5F9" },
          formatter: (p) => {
            const d = p.data.raw;
            return d ? `<strong>${d.siteCode}</strong> (${esc(d.storeName)})<br/>Sales: ${fmtVndFull(d.sales)}<br/>Qty: ${fmtInt(d.qty)}<br/>GM%: ${fmtPct(d.gm)}` : p.name;
          },
        },
        series: [{
          type: "treemap",
          roam: false,
          nodeClick: false,
          breadcrumb: { show: false },
          data: list.map((d) => ({
            name: `${d.siteCode}\n${fmtCompactVnd(d.sales)}`,
            siteCode: d.siteCode,
            value: Math.max(1, Math.round(state.siteChartSort === "qty" ? d.qty : d.sales)),
            raw: d,
            itemStyle: { color: REGION_COLORS[d.region] || COLORS.blue, borderColor: COLORS.pieBorder, borderWidth: 2 },
          })),
        }],
      }, true);
    } else {
      charts.deepSite.setOption({
        tooltip: {
          backgroundColor: COLORS.tooltipBg,
          borderColor: COLORS.tooltipBorder,
          textStyle: { color: "#F1F5F9" },
          formatter: (p) => {
            const d = p.data.raw;
            return `<strong>${d.siteCode}</strong> (${esc(d.region)})<br/>Sales: ${fmtVndFull(d.sales)}<br/>Qty: ${fmtInt(d.qty)}<br/>GM%: ${fmtPct(d.gm)}`;
          },
        },
        grid: { left: 68, right: 24, top: 24, bottom: 44 },
        xAxis: { type: "value", name: "Sales QTY", nameLocation: "middle", nameGap: 26, axisLabel: { color: COLORS.axisLabel }, splitLine: { lineStyle: { color: COLORS.gridLine } } },
        yAxis: { type: "value", name: "Sales", axisLabel: { color: COLORS.axisLabel, formatter: fmtAxisVnd }, splitLine: { lineStyle: { color: COLORS.gridLine } } },
        series: [{
          type: "scatter",
          symbolSize: 18,
          data: list.map((d) => ({
            name: d.siteCode,
            siteCode: d.siteCode,
            value: [d.qty, Math.round(d.sales)],
            raw: d,
            itemStyle: { color: REGION_COLORS[d.region] || COLORS.blue },
          })),
          label: { show: true, position: "top", color: COLORS.textSub, fontFamily: "JetBrains Mono", fontSize: 10, formatter: (p) => p.data.siteCode },
        }],
      }, true);
    }
  }

  function renderDeepRegion(rows) {
    if (!charts.deepRegionPie || !charts.deepRegionStack) return;
    const { lookups } = state.raw;
    const agg = new Map();
    const months = Array.from(new Set(rows.map((r) => r[C.MONTH]))).sort();
    const mat = new Map();

    rows.forEach((r) => {
      const reg = lookups.regions[r[C.REGION]];
      agg.set(reg, (agg.get(reg) || 0) + r[C.SALES]);
      const k = `${reg}__${r[C.MONTH]}`;
      mat.set(k, (mat.get(k) || 0) + r[C.SALES]);
    });

    const regs = Array.from(agg.entries()).sort((a, b) => b[1] - a[1]);
    const totalRegSales = regs.reduce((sum, [, v]) => sum + v, 0);

    charts.deepRegionPie.setOption({
      tooltip: {
        trigger: "item",
        backgroundColor: COLORS.tooltipBg,
        borderColor: COLORS.tooltipBorder,
        textStyle: { color: "#F1F5F9" },
        formatter: (p) => `<strong>${esc(p.name)}</strong><br/>Doanh số: <b>${fmtVndFull(p.value)}</b> (${p.percent}%)`,
      },
      legend: { show: false },
      series: [{
        type: "pie",
        radius: ["42%", "70%"],
        center: ["50%", "50%"],
        avoidLabelOverlap: true,
        minShowLabelAngle: 10,
        label: {
          color: COLORS.textMain,
          fontSize: 11,
          fontFamily: "JetBrains Mono",
          formatter: "{d}%",
        },
        labelLine: {
          length: 8,
          length2: 6,
          smooth: true,
        },
        data: regs.map(([name, val], i) => ({
          name,
          value: Math.round(val),
          itemStyle: { color: REGION_COLORS[name] || FALLBACK_COLORS[i % FALLBACK_COLORS.length], borderColor: COLORS.pieBorder, borderWidth: 2 },
        })),
      }],
    }, true);

    const legendContainer = document.getElementById("regionPieLegendList");
    if (legendContainer) {
      legendContainer.innerHTML = regs
        .map(([name, val], i) => {
          const color = REGION_COLORS[name] || FALLBACK_COLORS[i % FALLBACK_COLORS.length];
          const pct = totalRegSales > 0 ? ((val / totalRegSales) * 100).toFixed(1) : "0.0";
          const activeCls = (state.region && isMultiMatch(state.region, name)) ? "active" : "";
          return `
            <div class="region-legend-row ${activeCls}" data-reg="${esc(name)}" title="${esc(name)}: ${fmtVndFull(val)} (${pct}%) — Click để lọc • Giữ Ctrl + Click để chọn nhiều">
              <span class="region-legend-dot" style="background:${color}"></span>
              <span class="region-legend-name">${esc(name)}</span>
              <span class="region-legend-val">${fmtCompactVnd(val)}</span>
              <span class="region-legend-pct">${pct}%</span>
            </div>`;
        })
        .join("");

      legendContainer.querySelectorAll(".region-legend-row").forEach((rowEl) => {
        rowEl.addEventListener("click", (e) => toggleRegionFilter(rowEl.dataset.reg, Boolean(e.ctrlKey || e.metaKey)));
      });
    }

    charts.deepRegionStack.setOption({
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, backgroundColor: COLORS.tooltipBg, borderColor: COLORS.tooltipBorder, textStyle: { color: "#F1F5F9" }, valueFormatter: fmtVndFull },
      legend: { bottom: 0, type: "scroll", textStyle: { color: COLORS.textMuted, fontSize: 11 } },
      grid: { left: 56, right: 16, top: 18, bottom: 54 },
      xAxis: { type: "category", data: months, axisLabel: { color: COLORS.textSub, fontFamily: "JetBrains Mono", fontSize: 10.5 } },
      yAxis: { type: "value", axisLabel: { color: COLORS.axisLabel, formatter: fmtAxisVnd }, splitLine: { lineStyle: { color: COLORS.gridLine } } },
      series: regs.map(([reg], i) => ({
        name: reg,
        type: "bar",
        stack: "total",
        itemStyle: { color: REGION_COLORS[reg] || FALLBACK_COLORS[i % FALLBACK_COLORS.length] },
        data: months.map((m) => Math.round(mat.get(`${reg}__${m}`) || 0)),
      })),
    }, true);
  }

  function renderDeepChannelAndDriver(rows) {
    if (!charts.deepChannel || !charts.deepDriver) return;
    const { lookups, siteDirectory } = state.raw;

    const titleEl = document.getElementById("channelPanelTitle");
    if (state.channelDim === "segment") {
      if (titleEl) titleEl.textContent = "Phân tích theo Brand và Segment giá";
      const segAgg = PRICE_SEGMENTS.map((name, idx) => ({
        name,
        idx,
        sales: 0,
        qty: 0,
        gp: 0,
        brands: new Map(),
      }));
      let totSales = 0;

      rows.forEach((r) => {
        const sal = r[C.SALES], qty = r[C.QTY], gp = r[C.GP];
        const br = lookups.brands[r[C.BRAND]] || "Khác";
        const unitP = qty !== 0 ? Math.abs(sal / qty) : 0;
        const sIdx = getPriceSegmentIndex(unitP);
        const bucket = segAgg[sIdx];
        bucket.sales += sal;
        bucket.qty += qty;
        bucket.gp += gp;
        bucket.brands.set(br, (bucket.brands.get(br) || 0) + sal);
        totSales += sal;
      });

      charts.deepChannel.setOption({
        tooltip: {
          trigger: "axis",
          axisPointer: { type: "shadow" },
          backgroundColor: COLORS.tooltipBg,
          borderColor: COLORS.tooltipBorder,
          textStyle: { color: "#F1F5F9", fontSize: 12 },
          formatter: (params) => {
            if (!params || !params.length) return "";
            const idx = params[0].dataIndex;
            const b = segAgg[idx];
            const share = totSales > 0 ? ((b.sales / totSales) * 100).toFixed(1) : "0.0";
            const topBrands = Array.from(b.brands.entries())
              .sort((x, y) => y[1] - x[1])
              .slice(0, 3)
              .map(([bn, bv]) => `${esc(bn)} (${fmtCompactVnd(bv)})`)
              .join(", ");
            return `
              <div style="font-weight:700;color:#38BDF8;margin-bottom:4px">Segment giá: ${esc(b.name)}</div>
              <div>Doanh số: <strong class="mono">${fmtVndFull(b.sales)} (${share}%)</strong></div>
              <div>Số lượng (QTY): <strong class="mono" style="color:#F59E0B">${fmtInt(b.qty)} sp</strong></div>
              ${topBrands ? `<div style="margin-top:4px;font-size:11px;color:#94A3B8">Top Brands: ${topBrands}</div>` : ""}
            `;
          },
        },
        legend: { top: 0, textStyle: { color: COLORS.textSub, fontSize: 11 } },
        grid: { left: 58, right: 54, top: 32, bottom: 34 },
        xAxis: {
          type: "category",
          data: segAgg.map((d) => d.name),
          axisLabel: { color: COLORS.textMain, fontFamily: "JetBrains Mono", fontSize: 10.5 },
        },
        yAxis: [
          { type: "value", name: "Sales", axisLabel: { color: COLORS.axisLabel, formatter: fmtAxisVnd }, splitLine: { lineStyle: { color: COLORS.gridLine } } },
          { type: "value", name: "Qty", axisLabel: { color: COLORS.amber, formatter: fmtInt }, splitLine: { show: false } },
        ],
        series: [
          {
            name: "Doanh số (Sales)",
            type: "bar",
            barMaxWidth: 42,
            data: segAgg.map((d, i) => ({
              value: Math.round(d.sales),
              itemStyle: { color: PRICE_SEGMENT_COLORS[i % PRICE_SEGMENT_COLORS.length], borderRadius: [3, 3, 0, 0] },
            })),
            label: {
              show: true,
              position: "top",
              color: COLORS.textSub,
              fontFamily: "JetBrains Mono",
              fontSize: 9.5,
              formatter: (p) => (totSales > 0 && p.value > 0 ? `${((p.value / totSales) * 100).toFixed(0)}%` : ""),
            },
          },
          {
            name: "Số lượng (Qty)",
            type: "line",
            yAxisIndex: 1,
            smooth: 0.25,
            data: segAgg.map((d) => d.qty),
            lineStyle: { color: COLORS.amber, width: 2.5 },
            itemStyle: { color: COLORS.amber },
          },
        ],
      }, true);
    } else if (state.channelDim === "brand_segment") {
      if (titleEl) titleEl.textContent = "Phân tích Brand × Segment giá (Top 12 Brands)";
      const brandMap = new Map();
      rows.forEach((r) => {
        const br = lookups.brands[r[C.BRAND]] || "Khác";
        const sal = r[C.SALES], qty = r[C.QTY];
        const sIdx = getPriceSegmentIndex(qty !== 0 ? Math.abs(sal / qty) : 0);
        let bObj = brandMap.get(br);
        if (!bObj) {
          bObj = { brand: br, total: 0, qty: 0, segs: Array(PRICE_SEGMENTS.length).fill(0) };
          brandMap.set(br, bObj);
        }
        bObj.total += sal;
        bObj.qty += qty;
        bObj.segs[sIdx] += sal;
      });

      const topBrands = Array.from(brandMap.values())
        .sort((a, b) => b.total - a.total)
        .slice(0, 12)
        .reverse();

      charts.deepChannel.setOption({
        tooltip: {
          trigger: "axis",
          axisPointer: { type: "shadow" },
          backgroundColor: COLORS.tooltipBg,
          borderColor: COLORS.tooltipBorder,
          textStyle: { color: "#F1F5F9", fontSize: 11.5 },
          formatter: (params) => {
            if (!params || !params.length) return "";
            const idx = params[0].dataIndex;
            const bObj = topBrands[idx];
            let html = `<div style="font-weight:700;color:#38BDF8;margin-bottom:4px">${esc(bObj.brand)} — Tổng: ${fmtCompactVnd(bObj.total)} (${fmtInt(bObj.qty)} sp)</div>`;
            params.forEach((p) => {
              if (!p.value) return;
              const pct = bObj.total > 0 ? ((p.value / bObj.total) * 100).toFixed(1) : "0.0";
              html += `<div style="display:flex;justify-content:space-between;gap:12px"><span>${p.marker} ${esc(p.seriesName)}:</span><strong class="mono">${fmtCompactVnd(p.value)} (${pct}%)</strong></div>`;
            });
            return html;
          },
        },
        legend: {
          bottom: 0,
          type: "scroll",
          itemWidth: 10,
          itemHeight: 10,
          textStyle: { color: COLORS.textMuted, fontSize: 10.5 },
        },
        grid: { left: 105, right: 24, top: 12, bottom: 42 },
        xAxis: { type: "value", axisLabel: { color: COLORS.axisLabel, formatter: fmtAxisVnd }, splitLine: { lineStyle: { color: COLORS.gridLine } } },
        yAxis: { type: "category", data: topBrands.map((b) => b.brand), axisLabel: { color: COLORS.textMain, width: 95, overflow: "truncate", fontSize: 11 } },
        series: PRICE_SEGMENTS.map((segName, sIdx) => ({
          name: segName,
          type: "bar",
          stack: "total",
          barMaxWidth: 18,
          itemStyle: { color: PRICE_SEGMENT_COLORS[sIdx % PRICE_SEGMENT_COLORS.length] },
          data: topBrands.map((b) => Math.round(b.segs[sIdx])),
        })),
      }, true);
    } else if (state.channelDim === "site") {
      if (titleEl) titleEl.textContent = "Cơ cấu theo Site - Store (Top 15)";
      const sAgg = new Map();
      rows.forEach((r) => {
        const sc = lookups.sites[r[C.SITE]];
        let o = sAgg.get(sc);
        if (!o) {
          const info = siteDirectory?.[sc];
          const lbl = info && info.storeName && info.storeName !== sc ? `${sc} - ${info.storeName}` : sc;
          o = { siteCode: sc, name: lbl, sales: 0, qty: 0, gp: 0 };
          sAgg.set(sc, o);
        }
        o.sales += r[C.SALES];
        o.qty += r[C.QTY];
        o.gp += r[C.GP];
      });
      const siteList = Array.from(sAgg.values()).sort((a, b) => b.sales - a.sales).slice(0, 15).reverse();

      charts.deepChannel.setOption({
        tooltip: {
          trigger: "axis",
          axisPointer: { type: "shadow" },
          backgroundColor: COLORS.tooltipBg,
          borderColor: COLORS.tooltipBorder,
          textStyle: { color: "#F1F5F9" },
          formatter: (params) => {
            const p = params[0];
            if (!p || !p.data) return "";
            const d = p.data;
            const gm = d.sales ? ((d.gp / d.sales) * 100).toFixed(1) : "0.0";
            return `<div style="font-weight:600;margin-bottom:4px">${esc(d.fullName)}</div>`
              + `<div>Sales: <b class="mono">${fmtVndFull(d.sales)}</b></div>`
              + `<div>Qty: <b class="mono">${fmtInt(d.qty)}</b> • GM: <b class="mono">${gm}%</b></div>`;
          },
        },
        grid: { left: 190, right: 76, top: 14, bottom: 26 },
        xAxis: { type: "value", axisLabel: { color: COLORS.axisLabel, formatter: fmtAxisVnd }, splitLine: { lineStyle: { color: COLORS.gridLine } } },
        yAxis: { type: "category", data: siteList.map((d) => d.name), axisLabel: { color: COLORS.textMain, width: 178, overflow: "truncate", fontSize: 11 } },
        series: [{
          name: "Sales",
          type: "bar",
          barMaxWidth: 18,
          data: siteList.map((d, i) => ({
            value: Math.round(d.sales),
            siteCode: d.siteCode,
            fullName: d.name,
            sales: d.sales,
            qty: d.qty,
            gp: d.gp,
            itemStyle: { color: (state.site && isMultiMatch(state.site, d.siteCode)) ? COLORS.amber : FALLBACK_COLORS[i % FALLBACK_COLORS.length], borderRadius: [0, 3, 3, 0] },
          })),
          label: { show: true, position: "right", color: COLORS.textSub, fontFamily: "JetBrains Mono", fontSize: 10, formatter: (p) => fmtCompactVnd(p.value) },
        }],
      }, true);
    } else {
      if (titleEl) titleEl.textContent = "Cơ cấu Sales Channel";
      const chAgg = new Map();
      rows.forEach((r) => {
        const ch = lookups.channels[r[C.CHANNEL]];
        let o = chAgg.get(ch);
        if (!o) { o = { name: ch, sales: 0, qty: 0 }; chAgg.set(ch, o); }
        o.sales += r[C.SALES]; o.qty += r[C.QTY];
      });
      const chList = Array.from(chAgg.values()).sort((a, b) => b.sales - a.sales);

      charts.deepChannel.setOption({
        tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, backgroundColor: COLORS.tooltipBg, borderColor: COLORS.tooltipBorder, textStyle: { color: "#F1F5F9" } },
        grid: { left: 58, right: 54, top: 24, bottom: 34 },
        xAxis: { type: "category", data: chList.map((d) => d.name), axisLabel: { color: COLORS.textMain, fontFamily: "JetBrains Mono" } },
        yAxis: [
          { type: "value", axisLabel: { color: COLORS.axisLabel, formatter: fmtAxisVnd }, splitLine: { lineStyle: { color: COLORS.gridLine } } },
          { type: "value", axisLabel: { color: COLORS.amber }, splitLine: { show: false } },
        ],
        series: [
          {
            name: "Sales",
            type: "bar",
            barMaxWidth: 48,
            data: chList.map((d, i) => ({ value: Math.round(d.sales), itemStyle: { color: FALLBACK_COLORS[i % FALLBACK_COLORS.length], borderRadius: [3, 3, 0, 0] } })),
          },
          { name: "Qty", type: "line", yAxisIndex: 1, data: chList.map((d) => d.qty), lineStyle: { color: COLORS.amber, width: 2.5 }, itemStyle: { color: COLORS.amber } },
        ],
      }, true);
    }

    const dimCol = state.driverDim === "subcat" ? C.SUBCAT : C.BRAND;
    const dict = state.driverDim === "subcat" ? lookups.subcats : lookups.brands;
    const drAgg = new Map();
    rows.forEach((r) => {
      const n = dict[r[dimCol]];
      drAgg.set(n, (drAgg.get(n) || 0) + r[C.SALES]);
    });
    const topDr = Array.from(drAgg.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10).reverse();

    charts.deepDriver.setOption({
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, backgroundColor: COLORS.tooltipBg, borderColor: COLORS.tooltipBorder, textStyle: { color: "#F1F5F9" }, valueFormatter: fmtVndFull },
      grid: { left: 176, right: 72, top: 14, bottom: 26 },
      xAxis: { type: "value", axisLabel: { color: COLORS.axisLabel, formatter: fmtAxisVnd }, splitLine: { lineStyle: { color: COLORS.gridLine } } },
      yAxis: { type: "category", data: topDr.map(([n]) => n), axisLabel: { color: COLORS.textMain, width: 164, overflow: "truncate" } },
      series: [{
        type: "bar",
        barMaxWidth: 20,
        data: topDr.map(([, v]) => Math.round(v)),
        itemStyle: { color: COLORS.emerald, borderRadius: [0, 3, 3, 0] },
        label: { show: true, position: "right", color: COLORS.textSub, fontFamily: "JetBrains Mono", fontSize: 10, formatter: (p) => fmtCompactVnd(p.value) },
      }],
    }, true);

    if (state.storage.open) {
      renderStorageReport();
    }
  }

  // =========================================================================
  // 7B. SPECIALIST STORAGE REPORT: OCGN & PK LƯU TRỮ (USB, THẺ NHỚ)
  //     Dung lượng • Hãng (Brand) • Khoảng giá (Sales ⇄ Qty)
  // =========================================================================
  function openStorageReportModal() {
    const modal = document.getElementById("storageReportModal");
    if (!modal) return;
    state.storage.open = true;
    modal.classList.add("open");

    // Lazy initialize charts when modal is visible with layout dimensions
    if (!charts.storageCap && document.getElementById("chartStorageCap")) {
      charts.storageCap = echarts.init(document.getElementById("chartStorageCap"), null, { renderer: "canvas" });
      charts.storageCap.on("click", (params) => {
        if (!params.name) return;
        state.storage.cap = toggleMultiVal(state.storage.cap, params.name, isCtrlEvent(params));
        renderStorageReport();
      });
    }
    if (!charts.storageBrand && document.getElementById("chartStorageBrand")) {
      charts.storageBrand = echarts.init(document.getElementById("chartStorageBrand"), null, { renderer: "canvas" });
      charts.storageBrand.on("click", (params) => {
        if (!params.name) return;
        state.storage.brand = toggleMultiVal(state.storage.brand, params.name, isCtrlEvent(params));
        renderStorageReport();
      });
    }
    if (!charts.storagePrice && document.getElementById("chartStoragePrice")) {
      charts.storagePrice = echarts.init(document.getElementById("chartStoragePrice"), null, { renderer: "canvas" });
      charts.storagePrice.on("click", (params) => {
        if (!params.name) return;
        state.storage.priceBand = toggleMultiVal(state.storage.priceBand, params.name, isCtrlEvent(params));
        renderStorageReport();
      });
    }

    renderStorageReport();
    setTimeout(() => {
      charts.storageCap?.resize();
      charts.storageBrand?.resize();
      charts.storagePrice?.resize();
    }, 45);
  }

  function closeStorageReportModal() {
    const modal = document.getElementById("storageReportModal");
    if (modal) modal.classList.remove("open");
    state.storage.open = false;
  }

  function renderStorageReport() {
    const sr = state.raw?.storageReport;
    const lookups = state.raw?.lookups;
    if (!sr || !Array.isArray(sr.rows) || !lookups) return;

    const sL = sr.lookups;
    const months = lookups.months || [];
    const st = state.storage;
    const isQty = st.metric === "qty";
    const mKey = isQty ? "qty" : "sales";
    const fmtVal = (v) => (isQty ? fmtInt(v) : fmtCompactVnd(v));
    const fmtAxis = (v) => (isQty ? fmtInt(v) : fmtAxisVnd(v));

    const regIdxSet = getLookupIdxSet(state.region, lookups.regions);
    const siteIdxSet = getLookupIdxSet(state.site, lookups.sites);
    const chIdxSet = getLookupIdxSet(state.channel, lookups.channels);
    const capFilterSet = getLookupIdxSet(st.cap, sL.capacities);
    const brandFilterSet = getLookupIdxSet(st.brand, lookups.brands);
    const pbFilterSet = getLookupIdxSet(st.priceBand, sL.priceBands);
    const clickedMonthSet = state.clickedMonth ? new Set(splitMulti(state.clickedMonth)) : null;

    // Row shape: [mIdx, si, ri, ci, grpI, stI, capI, bi, pbI, qty, sales, gp, cnt]
    const filtered = [];
    for (let i = 0; i < sr.rows.length; i++) {
      const r = sr.rows[i];
      const mStr = months[r[0]] || "";
      if (state.monthFrom && mStr < state.monthFrom) continue;
      if (state.monthTo && mStr > state.monthTo) continue;
      if (clickedMonthSet && !clickedMonthSet.has(mStr)) continue;
      if (regIdxSet && !regIdxSet.has(r[2])) continue;
      if (siteIdxSet && !siteIdxSet.has(r[1])) continue;
      if (chIdxSet && !chIdxSet.has(r[3])) continue;

      if (st.group !== "all") {
        const gCode = sL.groups[r[4]];
        const stCode = sL.subTypes[r[5]];
        if (st.group === "OCGN" || st.group === "PK_LUU_TRU") {
          if (gCode !== st.group) continue;
        } else if (stCode !== st.group) {
          continue;
        }
      }
      if (capFilterSet && !capFilterSet.has(r[6])) continue;
      if (brandFilterSet && !brandFilterSet.has(r[7])) continue;
      if (pbFilterSet && !pbFilterSet.has(r[8])) continue;
      filtered.push(r);
    }

    // Active chips
    const chipsWrap = document.getElementById("storageActiveChips");
    if (chipsWrap) {
      const chips = [];
      splitMulti(state.channel).forEach((ch) => chips.push({ lbl: `Channel: ${ch}`, cls: "" }));
      splitMulti(state.site).forEach((sc) => chips.push({ lbl: `Site: ${sc}`, cls: "" }));
      splitMulti(state.region).forEach((rg) => chips.push({ lbl: `Region: ${rg}`, cls: "" }));
      splitMulti(st.cap).forEach((c) => chips.push({ lbl: `Dung lượng: ${c}`, cls: "amber", clear: () => { st.cap = removeMultiVal(st.cap, c); renderStorageReport(); } }));
      splitMulti(st.brand).forEach((b) => chips.push({ lbl: `Hãng: ${b}`, cls: "amber", clear: () => { st.brand = removeMultiVal(st.brand, b); renderStorageReport(); } }));
      splitMulti(st.priceBand).forEach((pb) => chips.push({ lbl: `Khoảng giá: ${pb}`, cls: "amber", clear: () => { st.priceBand = removeMultiVal(st.priceBand, pb); renderStorageReport(); } }));
      chipsWrap.innerHTML = "";
      if (!chips.length) {
        chipsWrap.innerHTML = `<span class="chip muted-chip">Toàn bộ kỳ lọc • ${fmtInt(filtered.length)} tổ hợp</span>`;
      } else {
        chips.forEach((c) => {
          const el = document.createElement("span");
          el.className = `chip ${c.cls}`;
          el.innerHTML = c.clear ? `<span>${esc(c.lbl)}</span><button type="button" aria-label="Xóa">×</button>` : `<span>${esc(c.lbl)}</span>`;
          if (c.clear) el.querySelector("button").addEventListener("click", c.clear);
          chipsWrap.appendChild(el);
        });
      }
    }

    // Aggregations
    let totSales = 0, totQty = 0, totGp = 0, totTx = 0;
    const capMap = new Map();
    const brandMap = new Map();
    const priceMap = new Map();
    const pivotMap = new Map();
    const rowTotals = new Map();
    const colTotals = new Map();

    for (let i = 0; i < filtered.length; i++) {
      const r = filtered[i];
      const qty = r[9], sal = r[10], gp = r[11], cnt = r[12] || 1;
      totQty += qty; totSales += sal; totGp += gp; totTx += cnt;

      const capI = r[6], brI = r[7], pbI = r[8];
      let cObj = capMap.get(capI);
      if (!cObj) { cObj = { idx: capI, name: sL.capacities[capI], sales: 0, qty: 0, gp: 0 }; capMap.set(capI, cObj); }
      cObj.sales += sal; cObj.qty += qty; cObj.gp += gp;

      const brName = lookups.brands[brI] || "Khác";
      let bObj = brandMap.get(brName);
      if (!bObj) { bObj = { name: brName, sales: 0, qty: 0, gp: 0 }; brandMap.set(brName, bObj); }
      bObj.sales += sal; bObj.qty += qty; bObj.gp += gp;

      let pObj = priceMap.get(pbI);
      if (!pObj) { pObj = { idx: pbI, name: sL.priceBands[pbI], sales: 0, qty: 0, gp: 0 }; priceMap.set(pbI, pObj); }
      pObj.sales += sal; pObj.qty += qty; pObj.gp += gp;

      // Pivot: Brand (Rows) x Capacity (Columns)
      let bPivot = pivotMap.get(brName);
      if (!bPivot) { bPivot = new Map(); pivotMap.set(brName, bPivot); }
      let cell = bPivot.get(capI);
      if (!cell) { cell = { sales: 0, qty: 0, gp: 0 }; bPivot.set(capI, cell); }
      cell.sales += sal; cell.qty += qty; cell.gp += gp;

      let rTot = rowTotals.get(brName);
      if (!rTot) { rTot = { sales: 0, qty: 0, gp: 0 }; rowTotals.set(brName, rTot); }
      rTot.sales += sal; rTot.qty += qty; rTot.gp += gp;

      let cTot = colTotals.get(capI);
      if (!cTot) { cTot = { sales: 0, qty: 0, gp: 0 }; colTotals.set(capI, cTot); }
      cTot.sales += sal; cTot.qty += qty; cTot.gp += gp;
    }

    st.storageMapCache = {
      totSales, totQty, totGp, totTx,
      capMap, brandMap, priceMap, pivotMap, rowTotals, colTotals,
      grandTotal: { sales: totSales, qty: totQty, gp: totGp },
    };

    const totalMetric = isQty ? totQty : totSales;
    const capList = Array.from(capMap.values()).filter((d) => d.sales !== 0 || d.qty !== 0).sort((a, b) => a.idx - b.idx);
    const brandList = Array.from(brandMap.values()).filter((d) => d.sales !== 0 || d.qty !== 0).sort((a, b) => b[mKey] - a[mKey]);
    const priceList = sL.priceBands.map((lbl, idx) => priceMap.get(idx) || { idx, name: lbl, sales: 0, qty: 0, gp: 0 }).filter((d) => d.sales !== 0 || d.qty !== 0);

    // Update KPI Cards
    const asp = totQty ? totSales / totQty : 0;
    const gmPct = totSales ? (totGp / totSales) * 100 : 0;
    const topCap = [...capList].sort((a, b) => b[mKey] - a[mKey])[0];
    const topBrand = brandList[0];

    const setTxt = (id, t) => { const el = document.getElementById(id); if (el) el.textContent = t; };
    setTxt("stKpiSales", fmtCompactVnd(totSales));
    setTxt("stKpiSalesSub", `GP: ${fmtCompactVnd(totGp)} • ${fmtInt(totTx)} dòng GD`);
    setTxt("stKpiQty", fmtInt(totQty));
    setTxt("stKpiQtySub", `${capList.length} mức dung lượng • ${brandList.length} hãng`);
    setTxt("stKpiAsp", fmtCompactVnd(asp));
    setTxt("stKpiGmSub", `Biên LN (GM): ${gmPct.toFixed(1)}%`);
    setTxt("stKpiTop", topCap ? `${topCap.name} • ${topBrand ? topBrand.name : "--"}` : "--");
    setTxt("stKpiTopSub", topCap ? `${topCap.name}: ${fmtVal(topCap[mKey])} (${totalMetric ? ((topCap[mKey] / totalMetric) * 100).toFixed(1) : "0.0"}%)` : "Không có dữ liệu");
    setTxt("stCapMetricBadge", isQty ? "SỐ LƯỢNG (QTY)" : "DOANH SỐ (VND)");

    // Chart 1: Capacity
    if (charts.storageCap) {
      charts.storageCap.setOption({
        tooltip: {
          trigger: "axis",
          axisPointer: { type: "shadow" },
          backgroundColor: COLORS.tooltipBg,
          borderColor: COLORS.tooltipBorder,
          textStyle: { color: "#F1F5F9" },
          formatter: (params) => {
            const d = params[0]?.data;
            if (!d) return "";
            const share = totalMetric ? ((d[mKey] / totalMetric) * 100).toFixed(1) : "0.0";
            const dAsp = d.qty ? d.sales / d.qty : 0;
            return `<div style="font-weight:700;margin-bottom:4px">Dung lượng: ${esc(d.name)} (${share}%)</div>`
              + `<div>Doanh số: <b class="mono">${fmtVndFull(d.sales)}</b></div>`
              + `<div>Số lượng: <b class="mono">${fmtInt(d.qty)}</b> • ASP: <b class="mono">${fmtCompactVnd(dAsp)}</b></div>`;
          },
        },
        grid: { left: 62, right: 20, top: 28, bottom: 32 },
        xAxis: { type: "category", data: capList.map((d) => d.name), axisLabel: { color: COLORS.textMain, fontFamily: "JetBrains Mono", fontSize: 11 } },
        yAxis: { type: "value", axisLabel: { color: COLORS.axisLabel, formatter: fmtAxis }, splitLine: { lineStyle: { color: COLORS.gridLine } } },
        series: [{
          name: isQty ? "Qty" : "Sales",
          type: "bar",
          barMaxWidth: 42,
          data: capList.map((d, i) => ({
            value: Math.round(d[mKey]),
            ...d,
            itemStyle: {
              color: (st.cap && isMultiMatch(st.cap, d.name)) ? COLORS.amber : (isQty ? COLORS.cyan : FALLBACK_COLORS[i % FALLBACK_COLORS.length]),
              borderRadius: [4, 4, 0, 0],
            },
          })),
          label: { show: true, position: "top", color: COLORS.textSub, fontFamily: "JetBrains Mono", fontSize: 10, formatter: (p) => fmtVal(p.value) },
        }],
      }, true);
    }

    // Chart 2: Brand (Top 12 Horizontal - with dedicated toggle)
    renderStorageBrandChart();

    // Chart 3: Price Range
    if (charts.storagePrice) {
      charts.storagePrice.setOption({
        tooltip: {
          trigger: "axis",
          axisPointer: { type: "shadow" },
          backgroundColor: COLORS.tooltipBg,
          borderColor: COLORS.tooltipBorder,
          textStyle: { color: "#F1F5F9" },
          formatter: (params) => {
            const d = params[0]?.data;
            if (!d) return "";
            const share = totalMetric ? ((d[mKey] / totalMetric) * 100).toFixed(1) : "0.0";
            return `<div style="font-weight:700;margin-bottom:4px">Khoảng giá: ${esc(d.name)} (${share}%)</div>`
              + `<div>Doanh số: <b class="mono">${fmtVndFull(d.sales)}</b></div>`
              + `<div>Số lượng: <b class="mono">${fmtInt(d.qty)}</b></div>`;
          },
        },
        grid: { left: 58, right: 16, top: 26, bottom: 44 },
        xAxis: { type: "category", data: priceList.map((d) => d.name), axisLabel: { color: COLORS.textMain, fontFamily: "JetBrains Mono", fontSize: 10.5, rotate: 18 } },
        yAxis: { type: "value", axisLabel: { color: COLORS.axisLabel, formatter: fmtAxis }, splitLine: { lineStyle: { color: COLORS.gridLine } } },
        series: [{
          type: "bar",
          barMaxWidth: 38,
          data: priceList.map((d) => ({
            value: Math.round(d[mKey]),
            ...d,
            itemStyle: { color: (st.priceBand && isMultiMatch(st.priceBand, d.name)) ? COLORS.amber : COLORS.violet, borderRadius: [4, 4, 0, 0] },
          })),
          label: { show: true, position: "top", color: COLORS.textSub, fontFamily: "JetBrains Mono", fontSize: 10, formatter: (p) => fmtVal(p.value) },
        }],
      }, true);
    }

    // Matrix Detail Table (Capacity Columns x Brand Rows)
    renderStorageMatrixTable();

    st.lastExport = {
      headers: ["Nhóm", "Dung lượng", "Hãng", "Số lượng (Qty)", "Doanh số (VND)", "Tỷ trọng (%)", "ASP (VND/sp)", "GM (%)"],
      rows: Array.from(pivotMap.entries()).flatMap(([brand, bMap]) =>
        Array.from(bMap.entries()).map(([cIdx, cell]) => [
          st.group,
          sL.capacities[cIdx],
          brand,
          cell.qty,
          Math.round(cell.sales),
          totalMetric ? ((cell[mKey] / totalMetric) * 100).toFixed(2) : "0.00",
          cell.qty ? Math.round(cell.sales / cell.qty) : 0,
          cell.sales ? ((cell.gp / cell.sales) * 100).toFixed(2) : "0.00",
        ])
      ),
      filename: `bao_cao_dung_luong_brand_${st.group}_${st.metric}.csv`,
    };
  }

  function renderStorageBrandChart() {
    if (!charts.storageBrand) return;
    const { storageMapCache } = state.storage;
    if (!storageMapCache) return;

    const st = state.storage;
    const isBrandQty = st.brandMetric === "qty";
    const bKey = isBrandQty ? "qty" : "sales";
    const brandList = Array.from(storageMapCache.brandMap.values())
      .filter((d) => d.sales !== 0 || d.qty !== 0)
      .sort((a, b) => b[bKey] - a[bKey]);

    const totalVal = isBrandQty ? storageMapCache.totQty : storageMapCache.totSales;
    const badgeEl = document.getElementById("stBrandMetricBadge");
    if (badgeEl) badgeEl.textContent = isBrandQty ? "SỐ LƯỢNG (QTY)" : "DOANH SỐ (VND)";

    const topBrands = brandList.slice(0, 12).reverse();
    charts.storageBrand.setOption({
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        backgroundColor: COLORS.tooltipBg,
        borderColor: COLORS.tooltipBorder,
        textStyle: { color: "#F1F5F9" },
        formatter: (params) => {
          const d = params[0]?.data;
          if (!d) return "";
          const share = totalVal ? ((d[bKey] / totalVal) * 100).toFixed(1) : "0.0";
          const asp = d.qty ? d.sales / d.qty : 0;
          return `<div style="font-weight:700;margin-bottom:4px">Hãng: ${esc(d.name)} (${share}%)</div>`
            + `<div>Doanh số: <b class="mono">${fmtVndFull(d.sales)}</b></div>`
            + `<div>Số lượng: <b class="mono">${fmtInt(d.qty)}</b></div>`
            + `<div>Đơn giá TB: <b class="mono">${fmtCompactVnd(asp)}</b></div>`;
        },
      },
      grid: { left: 110, right: 78, top: 12, bottom: 24 },
      xAxis: {
        type: "value",
        axisLabel: { color: COLORS.axisLabel, formatter: (v) => (isBrandQty ? fmtInt(v) : fmtAxisVnd(v)) },
        splitLine: { lineStyle: { color: COLORS.gridLine } },
      },
      yAxis: { type: "category", data: topBrands.map((d) => d.name), axisLabel: { color: COLORS.textMain, width: 100, overflow: "truncate", fontSize: 11 } },
      series: [{
        name: isBrandQty ? "Qty" : "Sales",
        type: "bar",
        barMaxWidth: 18,
        data: topBrands.map((d) => ({
          value: Math.round(d[bKey]),
          ...d,
          itemStyle: {
            color: (st.brand && isMultiMatch(st.brand, d.name)) ? COLORS.amber : (isBrandQty ? COLORS.cyan : COLORS.emerald),
            borderRadius: [0, 3, 3, 0],
          },
        })),
        label: {
          show: true,
          position: "right",
          color: COLORS.textSub,
          fontFamily: "JetBrains Mono",
          fontSize: 10,
          formatter: (p) => (isBrandQty ? fmtInt(p.value) : fmtCompactVnd(p.value)),
        },
      }],
    }, true);
  }

  function renderStorageMatrixTable() {
    const { storageMapCache } = state.storage;
    if (!storageMapCache || !state.raw?.storageReport?.lookups) return;

    const sL = state.raw.storageReport.lookups;
    const st = state.storage;
    const isTableQty = st.tableMetric === "qty";
    const tmKey = isTableQty ? "qty" : "sales";
    const basis = st.tableShareBasis || "col";

    const badgeEl = document.getElementById("stTableMetricBadge");
    if (badgeEl) badgeEl.textContent = isTableQty ? "SỐ LƯỢNG (QTY)" : "DOANH SỐ (VND)";

    const fmtVal = (v) => (isTableQty ? fmtInt(v) : fmtCompactVnd(v));

    const { pivotMap, grandTotal, rowTotals, colTotals } = storageMapCache;

    // Active capacities sorted in order
    const activeCaps = sL.capacities
      .map((name, idx) => ({ name, idx, obj: colTotals.get(idx) }))
      .filter((c) => c.obj && (c.obj.sales !== 0 || c.obj.qty !== 0));

    // Brands sorted descending by their row total in the chosen metric
    const sortedBrands = Array.from(rowTotals.entries())
      .filter(([b, tot]) => tot.sales !== 0 || tot.qty !== 0)
      .sort((a, b) => b[1][tmKey] - a[1][tmKey]);

    const infoEl = document.getElementById("storageTableInfo");
    if (infoEl) {
      infoEl.textContent = `Ma trận ${sortedBrands.length} Hãng × ${activeCaps.length} Mức dung lượng • Click Hãng hoặc Dung lượng để lọc chéo`;
    }

    // 1. Build <thead>
    const thead = document.getElementById("storageMatrixHead");
    if (thead) {
      let hHtml = `<tr><th class="piv-sticky-col">Hãng (Brand)</th>`;
      activeCaps.forEach((c) => {
        const isAct = (st.cap && isMultiMatch(st.cap, c.name)) ? "style='color:var(--amber)'" : "";
        hHtml += `<th class="num piv-cap-col" data-cap="${esc(c.name)}" ${isAct} title="Click để lọc Dung lượng ${esc(c.name)} • Giữ Ctrl + Click để chọn nhiều">${esc(c.name)}</th>`;
      });
      hHtml += `<th class="num piv-total-col">TỔNG CỘNG</th></tr>`;
      thead.innerHTML = hHtml;
    }

    // 2. Build <tbody>
    const tbody = document.getElementById("storageMatrixBody");
    const matrixExportRows = [];
    if (tbody) {
      if (!sortedBrands.length) {
        tbody.innerHTML = `<tr><td colspan="${activeCaps.length + 2}" style="text-align:center;padding:24px" class="muted">Không có dữ liệu khớp bộ lọc.</td></tr>`;
      } else {
        let bHtml = "";
        sortedBrands.forEach(([brand, rTot]) => {
          const bMap = pivotMap.get(brand);
          const isBrandAct = (st.brand && isMultiMatch(st.brand, brand)) ? "style='color:var(--amber)'" : "";
          const rowVal = rTot[tmKey];
          const rowPct = grandTotal[tmKey] ? ((rowVal / grandTotal[tmKey]) * 100).toFixed(1) : "0.0";
          const expRow = [brand];

          bHtml += `<tr><td class="piv-sticky-col" data-brand="${esc(brand)}" ${isBrandAct} title="Click để lọc Hãng ${esc(brand)}"><strong>${esc(brand)}</strong></td>`;

          activeCaps.forEach((c) => {
            const cell = bMap ? bMap.get(c.idx) : null;
            if (!cell || cell[tmKey] === 0) {
              bHtml += `<td class="num muted">-</td>`;
              expRow.push(0);
            } else {
              const cVal = cell[tmKey];
              let sharePct = "0.0";
              if (basis === "row") {
                sharePct = rowVal ? ((cVal / rowVal) * 100).toFixed(1) : "0.0";
              } else if (basis === "total") {
                sharePct = grandTotal[tmKey] ? ((cVal / grandTotal[tmKey]) * 100).toFixed(1) : "0.0";
              } else {
                // col
                const colVal = colTotals.get(c.idx)?.[tmKey] || 0;
                sharePct = colVal ? ((cVal / colVal) * 100).toFixed(1) : "0.0";
              }
              bHtml += `<td class="num">
                <div class="piv-cell">
                  <span class="piv-val">${fmtVal(cVal)}</span>
                  <span class="piv-pct">(${sharePct}%)</span>
                </div>
              </td>`;
              expRow.push(cVal);
            }
          });

          bHtml += `<td class="num piv-total-col">
            <div class="piv-cell">
              <span class="piv-val">${fmtVal(rowVal)}</span>
              <span class="piv-pct">(${rowPct}%)</span>
            </div>
          </td></tr>`;

          expRow.push(rowVal);
          matrixExportRows.push(expRow);
        });
        tbody.innerHTML = bHtml;
      }
    }

    // 3. Build <tfoot>
    const tfoot = document.getElementById("storageMatrixFoot");
    if (tfoot) {
      if (sortedBrands.length) {
        let fHtml = `<tr><th class="piv-sticky-col">TỔNG CỘNG</th>`;
        const footExp = ["TỔNG CỘNG"];
        activeCaps.forEach((c) => {
          const cTot = colTotals.get(c.idx);
          const cVal = cTot ? cTot[tmKey] : 0;
          const cPct = grandTotal[tmKey] ? ((cVal / grandTotal[tmKey]) * 100).toFixed(1) : "0.0";
          fHtml += `<th class="num piv-cap-col">
            <div class="piv-cell">
              <span class="piv-val">${fmtVal(cVal)}</span>
              <span class="piv-pct">(${cPct}%)</span>
            </div>
          </th>`;
          footExp.push(cVal);
        });
        const gVal = grandTotal[tmKey];
        fHtml += `<th class="num piv-total-col">
          <div class="piv-cell">
            <span class="piv-val">${fmtVal(gVal)}</span>
            <span class="piv-pct">(100%)</span>
          </div>
        </th></tr>`;
        footExp.push(gVal);
        matrixExportRows.push(footExp);
        tfoot.innerHTML = fHtml;
      } else {
        tfoot.innerHTML = "";
      }
    }

    // Attach click listeners on table
    thead?.querySelectorAll("th[data-cap]").forEach((th) => {
      th.addEventListener("click", (e) => {
        const c = th.dataset.cap;
        st.cap = toggleMultiVal(st.cap, c, Boolean(e.ctrlKey || e.metaKey));
        renderStorageReport();
      });
    });
    tbody?.querySelectorAll("td[data-brand]").forEach((td) => {
      td.addEventListener("click", (e) => {
        const b = td.dataset.brand;
        st.brand = toggleMultiVal(st.brand, b, Boolean(e.ctrlKey || e.metaKey));
        renderStorageReport();
      });
    });

    st.matrixExport = {
      headers: ["Hãng (Brand)", ...activeCaps.map((c) => c.name), "Tổng cộng"],
      rows: matrixExportRows,
      filename: `ma_tran_dung_luong_hang_${st.group}_${st.tableMetric}.csv`,
    };
  }

  // =========================================================================
  // 8. DATA LEDGER & MATRIX TABLE
  // =========================================================================
  function renderLedgerTable(rows) {
    if (state.tableTab === "sites") renderSitesTable(rows);
    else if (state.tableTab === "matrix") renderMatrixTable(rows);
    else renderRawTable(rows);
  }

  function renderSitesTable(rows) {
    const { lookups, siteDirectory } = state.raw;
    const agg = new Map();
    let totSales = 0;
    rows.forEach((r) => {
      const sc = lookups.sites[r[C.SITE]];
      let o = agg.get(sc);
      if (!o) {
        const m = siteDirectory[sc] || {};
        o = { siteCode: sc, storeName: m.storeName || sc, region: m.region || lookups.regions[r[C.REGION]], channel: m.channel || lookups.channels[r[C.CHANNEL]], sales: 0, qty: 0, gp: 0, rows: 0 };
        agg.set(sc, o);
      }
      o.sales += r[C.SALES]; o.qty += r[C.QTY]; o.gp += r[C.GP]; o.rows++; totSales += r[C.SALES];
    });

    let list = Array.from(agg.values()).map((d) => ({
      ...d,
      gm: d.sales ? (d.gp / d.sales) * 100 : 0,
      share: totSales ? (d.sales / totSales) * 100 : 0,
    }));

    if (state.tableSearch) {
      const q = state.tableSearch;
      list = list.filter((d) =>
        d.siteCode.toLowerCase().includes(q) ||
        d.storeName.toLowerCase().includes(q) ||
        d.region.toLowerCase().includes(q)
      );
    }

    const col = state.tableSortCol, dir = state.tableSortDir === "asc" ? 1 : -1;
    list.sort((a, b) => (typeof a[col] === "string" ? a[col].localeCompare(b[col]) * dir : ((a[col] || 0) - (b[col] || 0)) * dir));

    const cols = [
      { key: "siteCode", label: "Sales Site Code" },
      { key: "storeName", label: "Store Name" },
      { key: "region", label: "Region Name" },
      { key: "channel", label: "Channel" },
      { key: "sales", label: "Sales (VND)", num: true },
      { key: "share", label: "% Sales", num: true },
      { key: "qty", label: "Sales QTY", num: true },
      { key: "gp", label: "GP (VND)", num: true },
      { key: "gm", label: "GM (%)", num: true },
    ];
    renderHead(cols);

    const tbody = document.getElementById("tableBody");
    tbody.innerHTML = list
      .map((d) => `
      <tr class="clickable" data-sc="${esc(d.siteCode)}">
        <td class="mono"><strong>${esc(d.siteCode)}</strong></td>
        <td>${esc(d.storeName)}</td>
        <td><span class="tag-pill">${esc(d.region)}</span></td>
        <td>${esc(d.channel)}</td>
        <td class="num">${fmtInt(d.sales)}</td>
        <td class="num">${fmtPct(d.share)}</td>
        <td class="num" style="color:#F59E0B">${fmtInt(d.qty)}</td>
        <td class="num" style="color:#12D37A">${fmtInt(d.gp)}</td>
        <td class="num">${fmtPct(d.gm)}</td>
      </tr>`)
      .join("");

    tbody.querySelectorAll("[data-sc]").forEach((tr) => tr.addEventListener("click", (e) => toggleSiteFilter(tr.dataset.sc, Boolean(e.ctrlKey || e.metaKey))));
    document.getElementById("tableCountInfo").textContent = `Hiển thị ${list.length} Sales Site Codes`;
    document.getElementById("tablePagination").innerHTML = "";

    state.lastTableExport = {
      headers: cols.map((c) => c.label),
      rows: list.map((d) => [d.siteCode, d.storeName, d.region, d.channel, Math.round(d.sales), Number(d.share.toFixed(2)), d.qty, Math.round(d.gp), Number(d.gm.toFixed(2))]),
      filename: "report_sales_site_code.csv",
    };
  }

  function renderMatrixTable(rows) {
    const { lookups } = state.raw;
    const months = Array.from(new Set(rows.map((r) => r[C.MONTH]))).sort();
    const map = new Map();
    rows.forEach((r) => {
      const reg = lookups.regions[r[C.REGION]];
      const m = r[C.MONTH];
      if (!map.has(reg)) map.set(reg, { region: reg, total: 0, qty: 0, byM: {} });
      const o = map.get(reg);
      if (!o.byM[m]) o.byM[m] = { s: 0, q: 0 };
      o.byM[m].s += r[C.SALES]; o.byM[m].q += r[C.QTY];
      o.total += r[C.SALES]; o.qty += r[C.QTY];
    });

    let list = Array.from(map.values()).sort((a, b) => b.total - a.total);
    if (state.tableSearch) list = list.filter((d) => d.region.toLowerCase().includes(state.tableSearch));

    const cols = [
      { key: "region", label: "Region Name" },
      ...months.map((m) => ({ key: m, label: `T${m.slice(5)}/${m.slice(2, 4)}`, num: true })),
      { key: "total", label: "Tổng Sales", num: true },
      { key: "qty", label: "Tổng Qty", num: true },
    ];
    renderHead(cols, false);

    const colTot = {}; months.forEach((m) => (colTot[m] = { s: 0, q: 0 }));
    let gS = 0, gQ = 0;

    const html = list.map((d) => {
      gS += d.total; gQ += d.qty;
      const tds = months.map((m) => {
        const c = d.byM[m] || { s: 0, q: 0 };
        colTot[m].s += c.s; colTot[m].q += c.q;
        return `<td class="num">${c.s ? fmtCompactVnd(c.s) : "—"} <span style="color:#8492A6;font-size:10px">/ ${fmtInt(c.q)}</span></td>`;
      }).join("");
      return `<tr class="clickable" data-reg="${esc(d.region)}"><td><span class="tag-pill">${esc(d.region)}</span></td>${tds}<td class="num"><strong>${fmtCompactVnd(d.total)}</strong></td><td class="num" style="color:#F59E0B">${fmtInt(d.qty)}</td></tr>`;
    }).join("");

    const totTds = months.map((m) => `<td class="num">${fmtCompactVnd(colTot[m].s)} <span style="color:#8492A6;font-size:10px">/ ${fmtInt(colTot[m].q)}</span></td>`).join("");
    const tbody = document.getElementById("tableBody");
    tbody.innerHTML = html + `<tr class="row-total"><td>TỔNG CỘNG</td>${totTds}<td class="num">${fmtCompactVnd(gS)}</td><td class="num" style="color:#F59E0B">${fmtInt(gQ)}</td></tr>`;
    tbody.querySelectorAll("[data-reg]").forEach((tr) => tr.addEventListener("click", (e) => toggleRegionFilter(tr.dataset.reg, Boolean(e.ctrlKey || e.metaKey))));

    document.getElementById("tableCountInfo").textContent = `Ma trận ${list.length} Regions × ${months.length} Tháng`;
    document.getElementById("tablePagination").innerHTML = "";

    state.lastTableExport = {
      headers: ["Region Name", ...months.flatMap((m) => [`${m} Sales`, `${m} Qty`]), "Total Sales", "Total Qty"],
      rows: list.map((d) => [d.region, ...months.flatMap((m) => [Math.round(d.byM[m]?.s || 0), d.byM[m]?.q || 0]), Math.round(d.total), d.qty]),
      filename: "report_region_month_matrix.csv",
    };
  }

  function renderRawTable(rows) {
    const { lookups } = state.raw;
    const catsL = lookups.categories || [];
    let filtered = rows;
    if (state.tableSearch) {
      const q = state.tableSearch;
      filtered = rows.filter((r) =>
        r[C.MONTH].includes(q) ||
        lookups.sites[r[C.SITE]].toLowerCase().includes(q) ||
        lookups.stores[r[C.STORE]].toLowerCase().includes(q) ||
        lookups.regions[r[C.REGION]].toLowerCase().includes(q) ||
        (lookups.subcats[r[C.SUBCAT]] || "").toLowerCase().includes(q) ||
        (lookups.brands[r[C.BRAND]] || "").toLowerCase().includes(q)
      );
    }

    const colIdx = { date: C.MONTH, site: C.SITE, region: C.REGION, subcat: C.SUBCAT, count: C.COUNT, qty: C.QTY, sales: C.SALES, gp: C.GP }[state.tableSortCol] ?? C.SALES;
    const dir = state.tableSortDir === "asc" ? 1 : -1;
    const sorted = [...filtered].sort((a, b) => (typeof a[colIdx] === "string" ? a[colIdx].localeCompare(b[colIdx]) * dir : ((a[colIdx] || 0) - (b[colIdx] || 0)) * dir));

    const totalPages = Math.max(1, Math.ceil(sorted.length / state.tablePageSize));
    state.tablePage = Math.min(state.tablePage, totalPages);
    const start = (state.tablePage - 1) * state.tablePageSize;
    const pageRows = sorted.slice(start, start + state.tablePageSize);

    renderHead([
      { key: "date", label: "Tháng" },
      { key: "site", label: "Site Code" },
      { key: "store", label: "Store", nosort: true },
      { key: "region", label: "Region" },
      { key: "subcat", label: "Category / Subcat 2 (Code - Name)" },
      { key: "brand", label: "Brand", nosort: true },
      { key: "count", label: "Số đơn", num: true },
      { key: "qty", label: "Qty", num: true },
      { key: "sales", label: "Sales (VND)", num: true },
      { key: "gp", label: "GP (VND)", num: true },
    ]);

    document.getElementById("tableBody").innerHTML = pageRows
      .map((r) => {
        const catCode = r.length > C.CAT ? (catsL[r[C.CAT]] || "") : "";
        const subName = lookups.subcats[r[C.SUBCAT]] || "";
        const cnt = r.length > C.COUNT ? (r[C.COUNT] || 1) : 1;
        return `
      <tr>
        <td class="mono">${r[C.MONTH]}</td>
        <td class="mono"><strong>${esc(lookups.sites[r[C.SITE]])}</strong></td>
        <td>${esc(lookups.stores[r[C.STORE]])}</td>
        <td><span class="tag-pill">${esc(lookups.regions[r[C.REGION]])}</span></td>
        <td class="sku-cell" title="${esc(subName)}"><span class="tag-pill" style="margin-right:4px">${esc(catCode)}</span>${esc(subName)}</td>
        <td>${esc(lookups.brands[r[C.BRAND]] || "")}</td>
        <td class="num mono">${fmtInt(cnt)}</td>
        <td class="num" style="color:#F59E0B">${fmtInt(r[C.QTY])}</td>
        <td class="num">${fmtInt(r[C.SALES])}</td>
        <td class="num" style="color:#12D37A">${fmtInt(r[C.GP])}</td>
      </tr>`;
      })
      .join("");

    const totalTx = sorted.reduce((acc, r) => acc + (r.length > C.COUNT ? (r[C.COUNT] || 1) : 1), 0);
    document.getElementById("tableCountInfo").textContent =
      `Hiển thị ${fmtInt(start + 1)}–${fmtInt(Math.min(start + pageRows.length, sorted.length))} / ${fmtInt(sorted.length)} nhóm (${fmtInt(totalTx)} giao dịch)`;

    const pag = document.getElementById("tablePagination");
    pag.innerHTML = `
      <button class="page-btn" id="prevP" ${state.tablePage <= 1 ? "disabled" : ""}>◀</button>
      <span class="mono" style="font-size:11px;color:#94A3B8">Trang ${state.tablePage}/${totalPages}</span>
      <button class="page-btn" id="nextP" ${state.tablePage >= totalPages ? "disabled" : ""}>▶</button>`;
    pag.querySelector("#prevP").addEventListener("click", () => { if (state.tablePage > 1) { state.tablePage--; renderRawTable(rows); } });
    pag.querySelector("#nextP").addEventListener("click", () => { if (state.tablePage < totalPages) { state.tablePage++; renderRawTable(rows); } });

    state.lastTableExport = {
      headers: ["Month", "Sales Site Code", "Store Name", "Region Name", "Channel", "Category Code", "Subcat 2 (Code - Name)", "Brand", "Order Count", "Sales QTY", "Sales", "COGS", "GP"],
      rows: sorted.map((r) => [
        r[C.MONTH], lookups.sites[r[C.SITE]], lookups.stores[r[C.STORE]],
        lookups.regions[r[C.REGION]], lookups.channels[r[C.CHANNEL]],
        r.length > C.CAT ? (catsL[r[C.CAT]] || "") : "",
        lookups.subcats[r[C.SUBCAT]] || "", lookups.brands[r[C.BRAND]] || "",
        r.length > C.COUNT ? (r[C.COUNT] || 1) : 1,
        r[C.QTY], r[C.SALES], r[C.COGS], r[C.GP],
      ]),
      filename: "report_transactions_filtered.csv",
    };
  }

  function renderHead(cols, allowSort = true) {
    const thead = document.getElementById("tableHead");
    thead.innerHTML = `<tr>${cols.map((c) => {
      const sorted = allowSort && !c.nosort && state.tableSortCol === c.key;
      const arrow = sorted ? (state.tableSortDir === "asc" ? " ▲" : " ▼") : "";
      return `<th class="${c.num ? "num" : ""}" data-sort="${allowSort && !c.nosort ? c.key : ""}">${esc(c.label)}${arrow}</th>`;
    }).join("")}</tr>`;
    if (allowSort) {
      thead.querySelectorAll("th[data-sort]").forEach((th) => {
        if (!th.dataset.sort) return;
        th.addEventListener("click", () => {
          if (state.tableSortCol === th.dataset.sort) state.tableSortDir = state.tableSortDir === "asc" ? "desc" : "asc";
          else { state.tableSortCol = th.dataset.sort; state.tableSortDir = "desc"; }
          renderLedgerTable(getFilteredRows(false));
        });
      });
    }
  }

  function emptyOption(msg) {
    return {
      title: { text: msg, left: "center", top: "middle", textStyle: { color: "#8492A6", fontSize: 13 } },
    };
  }

  // --- CSV EXPORT ---
  function exportRawCsv(rows) {
    const { lookups } = state.raw;
    const headers = ["Report Date", "Month", "Sales Site Code", "Store Name", "Region Name", "Sales Channel", "Subcat 2", "Brand", "Order Type", "SKU", "Sales QTY", "Sales", "COGS", "GP"];
    const data = rows.map((r) => [
      r[C.DATE], r[C.MONTH], lookups.sites[r[C.SITE]], lookups.stores[r[C.STORE]],
      lookups.regions[r[C.REGION]], lookups.channels[r[C.CHANNEL]], lookups.subcats[r[C.SUBCAT]],
      lookups.brands[r[C.BRAND]], lookups.orderTypes[r[C.ORDER_TYPE]], lookups.skus[r[C.SKU]],
      r[C.QTY], r[C.SALES], r[C.COGS], r[C.GP],
    ]);
    downloadCsv(headers, data, `cyberpulse_sales_report_${new Date().toISOString().slice(0, 10)}.csv`);
  }

  function downloadCsv(headers, rows, filename) {
    const escCsv = (v) => {
      const s = String(v ?? "");
      return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [headers.map(escCsv).join(",")];
    for (let i = 0; i < rows.length; i++) lines.push(rows[i].map(escCsv).join(","));
    const blob = new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // =========================================================================
  // 8. INVENTORY (TỒN KHO, BAD STOCK, TUỔI TỒN, STATUS & RANGE) ENGINE
  // =========================================================================
  function statusBadgeClass(st) {
    const l = (st || "").toLowerCase();
    if (l === "normal") return "normal";
    if (l === "discontinued") return "disc";
    if (l.includes("shortage")) return "status-shortage";
    if (l === "eol") return "damaged";
    return "other";
  }

  function badStockBadgeClass(label) {
    const l = (label || "").toLowerCase();
    if (l.includes("thông thường")) return "bad-normal";
    if (l.includes("bán chậm")) return "bad-slow";
    if (l.includes("tồn lâu")) return "bad-long";
    if (l.includes("rất xấu")) return "bad-verybad";
    if (l.includes("tồn xấu")) return "bad-bad";
    return "other";
  }

  function extractSkuCodeFromLabel(lbl) {
    const s = String(lbl || "");
    const idx = s.indexOf(" — ");
    return idx >= 0 ? s.slice(0, idx).trim() : s.trim();
  }

  function populateInventoryFilters() {
    const inv = state.raw?.inventory;
    const mp = state.raw?.masterProducts;
    const ms = state.raw?.masterSummary;
    const sn = state.raw?.invSerials;
    const sc = state.raw?.invSerialCube;
    const fill = (id, allLabel, items, labelFn = (x) => x) => {
      const el = document.getElementById(id);
      if (!el) return;
      const prev = el.value;
      el.innerHTML = `<option value="">${allLabel}</option>`;
      items.forEach((v) => el.add(new Option(labelFn(v), v)));
      if (prev && items.includes(prev)) el.value = prev;
      if (msRegistry.has(id)) msRegistry.get(id).rebuild();
    };

    const statusSet = new Set([
      ...(inv?.lookups?.purchaseStatuses || []),
      ...(mp?.lookups?.purchaseStatuses || []),
      ...(ms?.lookups?.purchaseStatuses || []),
    ]);
    fill("invFilterStatus", `Tất cả TT Mua (${statusSet.size})`, [...statusSet].sort());

    const rangeSet = new Set([
      ...(inv?.lookups?.ranges || ["No"]),
      ...(mp?.lookups?.ranges || []),
      ...(ms?.lookups?.ranges || []),
    ]);
    fill("invFilterRange", `Tất cả Range (${rangeSet.size})`, [...rangeSet].sort());

    const badSet = new Set([
      ...BAD_STOCK_ORDER,
      ...(sn?.lookups?.badComp || []),
      ...(sc?.lookups?.badComp || []),
    ]);
    const badSorted = [...badSet].sort((a, b) => {
      const ia = BAD_STOCK_ORDER.indexOf(a), ib = BAD_STOCK_ORDER.indexOf(b);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a.localeCompare(b);
    });
    fill("invFilterBadStock", "Tất cả Loại tồn", badSorted);

    if (!inv || !inv.lookups) {
      fill("invFilterSite", "Chưa có dữ liệu Kho", []);
      fill("invFilterBinType", "Tất cả BIN Type", []);
      fill("invFilterBinZone", "Tất cả BIN Zone", []);
      fill("invFilterBrand", "Tất cả Brand", []);
      return;
    }

    const { lookups, siteDirectory = {} } = inv;
    fill(
      "invFilterSite",
      `Tất cả Site Kho (${lookups.sites.length})`,
      [...lookups.sites].sort(),
      (code) => {
        const info = siteDirectory[code];
        return info && info.siteName && info.siteName !== code ? `${code} — ${info.siteName}` : code;
      }
    );
    fill("invFilterBinType", `Tất cả BIN Type (${lookups.binTypes.length})`, [...lookups.binTypes].sort());
    fill("invFilterBinZone", `Tất cả BIN Zone (${lookups.binZones.length})`, [...lookups.binZones].sort());
    fill("invFilterBrand", `Tất cả Brand (${lookups.brands.length})`, [...lookups.brands].sort());
  }

  function resetInvFilters(shouldRender = true) {
    const iv = state.inv;
    iv.site = "";
    iv.binType = "";
    iv.binZone = "";
    iv.subcat = "";
    iv.brand = "";
    iv.status = "";
    iv.range = "";
    iv.badStock = "";
    iv.agingBucket = "";
    iv.sellableOnly = false;
    iv.damagedOnly = false;
    iv.tableSearch = "";
    iv.tablePage = 1;

    const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
    const setChk = (id, v) => { const el = document.getElementById(id); if (el) el.checked = v; };
    setVal("invFilterSite", "");
    setVal("invFilterBinType", "");
    setVal("invFilterBinZone", "");
    setVal("invFilterBrand", "");
    setVal("invFilterStatus", "");
    setVal("invFilterRange", "");
    setVal("invFilterBadStock", "");
    setVal("invTableSearchInput", "");
    setChk("invSellableOnlyToggle", false);
    setChk("invDamagedOnlyToggle", false);
    syncAllMultiSelectUIs();

    if (shouldRender && state.activeView === "inventory") renderInventoryView();
  }

  function bindInventoryEvents() {
    const onSelect = (id, prop) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener("change", (e) => {
        state.inv[prop] = e.target.value;
        state.inv.tablePage = 1;
        renderInventoryView();
      });
    };

    onSelect("invFilterSite", "site");
    onSelect("invFilterBinType", "binType");
    onSelect("invFilterBinZone", "binZone");
    onSelect("invFilterBrand", "brand");
    onSelect("invFilterStatus", "status");
    onSelect("invFilterRange", "range");
    onSelect("invFilterBadStock", "badStock");

    document.getElementById("invSellableOnlyToggle")?.addEventListener("change", (e) => {
      state.inv.sellableOnly = e.target.checked;
      if (e.target.checked) {
        state.inv.damagedOnly = false;
        const dm = document.getElementById("invDamagedOnlyToggle");
        if (dm) dm.checked = false;
      }
      state.inv.tablePage = 1;
      renderInventoryView();
    });

    document.getElementById("invDamagedOnlyToggle")?.addEventListener("change", (e) => {
      state.inv.damagedOnly = e.target.checked;
      if (e.target.checked) {
        state.inv.sellableOnly = false;
        const sl = document.getElementById("invSellableOnlyToggle");
        if (sl) sl.checked = false;
      }
      state.inv.tablePage = 1;
      renderInventoryView();
    });

    document.getElementById("invResetBtn")?.addEventListener("click", () => resetInvFilters(true));

    const bindInvSeg = (id, cb) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener("click", (e) => {
        const btn = e.target.closest(".seg-btn");
        if (!btn) return;
        el.querySelectorAll(".seg-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        cb(btn.dataset.val);
      });
    };

    bindInvSeg("invBadScopeGroup", (v) => { state.inv.badScope = v; renderInvBadStockChart(getFilteredSerialRows()); });
    bindInvSeg("invBadFilterGroup", (v) => { state.inv.badFilter = v; renderInvBadStockChart(getFilteredSerialRows()); });
    bindInvSeg("invBadMetricGroup", (v) => { state.inv.badMetric = v; renderInvBadStockChart(getFilteredSerialRows()); });
    bindInvSeg("invAgingBasisGroup", (v) => { state.inv.agingBasis = v; renderInventoryView(); });
    bindInvSeg("invAgingMetricGroup", (v) => { state.inv.agingMetric = v; renderInvAgingChart(getFilteredInvRows(), getFilteredSerialRows()); });
    bindInvSeg("invStatusDimGroup", (v) => { state.inv.statusDim = v; renderInvStatusRangeChart(getFilteredInvRows()); });
    bindInvSeg("invStatusMetricGroup", (v) => { state.inv.statusMetric = v; renderInvStatusRangeChart(getFilteredInvRows()); });
    bindInvSeg("invSiteModeGroup", (v) => { state.inv.siteMode = v; renderInvSiteChart(getFilteredInvRows()); });
    bindInvSeg("invSiteMetricGroup", (v) => { state.inv.siteMetric = v; renderInvSiteChart(getFilteredInvRows()); });
    bindInvSeg("invBinDimGroup", (v) => { state.inv.binDim = v; renderInvBinChart(getFilteredInvRows()); });
    bindInvSeg("invBinMetricGroup", (v) => { state.inv.binMetric = v; renderInvBinChart(getFilteredInvRows()); });
    bindInvSeg("invCatDimGroup", (v) => { state.inv.catDim = v; renderInvCatChart(getFilteredInvRows()); });
    bindInvSeg("invCatMetricGroup", (v) => { state.inv.catMetric = v; renderInvCatChart(getFilteredInvRows()); });

    bindInvSeg("invTableTabGroup", (v) => {
      state.inv.tableTab = v;
      state.inv.tablePage = 1;
      state.inv.tableSortCol = v === "velocity" ? "s30d" : "value";
      state.inv.tableSortDir = "desc";
      if ((v === "serials" || v === "master") && !state.shardsLoaded) {
        ensureLookupShardsLoaded();
      }
      renderInvTable(getFilteredInvRows(), getFilteredSerialRows());
    });

    document.getElementById("invTableSearchInput")?.addEventListener("input", (e) => {
      state.inv.tableSearch = e.target.value.trim().toLowerCase();
      state.inv.tablePage = 1;
      renderInvTable(getFilteredInvRows(), getFilteredSerialRows());
    });

    document.getElementById("exportInvCsvBtn")?.addEventListener("click", () => {
      const { headers, rows, filename } = state.inv.lastExport;
      downloadCsv(headers, rows, filename);
    });
  }

  function getFilteredSerialCubeRows() {
    const sc = state.raw?.invSerialCube;
    if (!sc || !Array.isArray(sc.rows)) return null;
    const { rows, lookups } = sc;
    const iv = state.inv;

    const catIdxSet = getLookupIdxSet(state.globalCat, lookups.categories);
    const gSubIdxSet = getLookupIdxSet(state.globalSubcat, lookups.subcats);
    const siteIdxSet = getLookupIdxSet(iv.site, lookups.sites);
    const btIdxSet = getLookupIdxSet(iv.binType, lookups.binTypes);
    const bzIdxSet = getLookupIdxSet(iv.binZone, lookups.binZones);
    const brIdxSet = getLookupIdxSet(iv.brand, lookups.brands);
    const stIdxSet = getLookupIdxSet(iv.status, lookups.purchaseStatuses);
    const rngIdxSet = getLookupIdxSet(iv.range, lookups.ranges || []);
    const badCol = iv.badScope === "site" ? SC_C.BAD_SITE : SC_C.BAD_COMP;
    const badLookup = iv.badScope === "site" ? lookups.badSite : lookups.badComp;
    const badIdxSet = getLookupIdxSet(iv.badStock, badLookup);
    const agingBucketIdxSet = iv.agingBucket
      ? new Set(splitMulti(iv.agingBucket).map((k) => AGING_BUCKETS.findIndex((b) => b.key === k)).filter((idx) => idx !== -1))
      : null;
    const agingCol = iv.agingBasis === "last" ? SC_C.AGING_SITE_B : SC_C.AGING_COMP_B;

    const sellableSet = new Set();
    const damagedSet = new Set();
    lookups.binTypes.forEach((n, idx) => {
      const low = n.toLowerCase();
      if (low.includes("bán mới")) sellableSet.add(idx);
      if (low.includes("hư hỏng")) damagedSet.add(idx);
    });

    const out = [];
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (catIdxSet && !catIdxSet.has(r[SC_C.CAT])) continue;
      if (gSubIdxSet && !gSubIdxSet.has(r[SC_C.SUBCAT])) continue;
      if (siteIdxSet && !siteIdxSet.has(r[SC_C.SITE])) continue;
      if (btIdxSet && !btIdxSet.has(r[SC_C.BIN_TYPE])) continue;
      if (bzIdxSet && !bzIdxSet.has(r[SC_C.BIN_ZONE])) continue;
      if (brIdxSet && !brIdxSet.has(r[SC_C.BRAND])) continue;
      if (stIdxSet && !stIdxSet.has(r[SC_C.STATUS])) continue;
      if (rngIdxSet && !rngIdxSet.has(r[SC_C.RANGE])) continue;
      if (badIdxSet && !badIdxSet.has(r[badCol])) continue;
      if (iv.sellableOnly && !sellableSet.has(r[SC_C.BIN_TYPE])) continue;
      if (iv.damagedOnly && !damagedSet.has(r[SC_C.BIN_TYPE])) continue;
      if (agingBucketIdxSet && agingBucketIdxSet.size > 0 && !agingBucketIdxSet.has(r[agingCol])) continue;
      out.push(r);
    }
    return out;
  }

  function getFilteredSerialRows() {
    const sn = state.raw?.invSerials;
    if (!sn || !Array.isArray(sn.rows)) return [];
    const { rows, lookups } = sn;
    const iv = state.inv;

    const catIdxSet = getLookupIdxSet(state.globalCat, lookups.categories);
    const gSubIdxSet = getLookupIdxSet(state.globalSubcat, lookups.subcats);
    const siteIdxSet = getLookupIdxSet(iv.site, lookups.sites);
    const btIdxSet = getLookupIdxSet(iv.binType, lookups.binTypes);
    const bzIdxSet = getLookupIdxSet(iv.binZone, lookups.binZones);
    const scIdxSet = getLookupIdxSet(iv.subcat, lookups.subcats);
    const brIdxSet = getLookupIdxSet(iv.brand, lookups.brands);
    const stIdxSet = getLookupIdxSet(iv.status, lookups.purchaseStatuses);
    const rngIdxSet = getLookupIdxSet(iv.range, lookups.ranges || []);
    const badCol = iv.badScope === "site" ? SN_C.BAD_SITE : SN_C.BAD_COMP;
    const badLookup = iv.badScope === "site" ? lookups.badSite : lookups.badComp;
    const badIdxSet = getLookupIdxSet(iv.badStock, badLookup);
    const agingObjs = iv.agingBucket
      ? splitMulti(iv.agingBucket).map((k) => AGING_BUCKETS.find((b) => b.key === k)).filter(Boolean)
      : [];
    const agingCol = iv.agingBasis === "last" ? SN_C.AGING_SITE : SN_C.AGING_COMP;

    const sellableSet = new Set();
    const damagedSet = new Set();
    lookups.binTypes.forEach((n, idx) => {
      const low = n.toLowerCase();
      if (low.includes("bán mới")) sellableSet.add(idx);
      if (low.includes("hư hỏng")) damagedSet.add(idx);
    });

    const out = [];
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (state.globalCat) {
        if (r.length > SN_C.CAT) {
          if (!catIdxSet || !catIdxSet.has(r[SN_C.CAT])) continue;
        } else if (!hasMultiPrefix(state.globalCat, lookups.subcats[r[SN_C.SUBCAT]])) {
          continue;
        }
      }
      if (gSubIdxSet && !gSubIdxSet.has(r[SN_C.SUBCAT])) continue;
      if (siteIdxSet && !siteIdxSet.has(r[SN_C.SITE])) continue;
      if (btIdxSet && !btIdxSet.has(r[SN_C.BIN_TYPE])) continue;
      if (bzIdxSet && !bzIdxSet.has(r[SN_C.BIN_ZONE])) continue;
      if (scIdxSet && !scIdxSet.has(r[SN_C.SUBCAT])) continue;
      if (brIdxSet && !brIdxSet.has(r[SN_C.BRAND])) continue;
      if (stIdxSet && !stIdxSet.has(r[SN_C.STATUS])) continue;
      if (rngIdxSet && !rngIdxSet.has(r[SN_C.RANGE])) continue;
      if (badIdxSet && !badIdxSet.has(r[badCol])) continue;
      if (iv.sellableOnly && !sellableSet.has(r[SN_C.BIN_TYPE])) continue;
      if (iv.damagedOnly && !damagedSet.has(r[SN_C.BIN_TYPE])) continue;
      if (agingObjs.length > 0 && !agingObjs.some((ao) => ao.test(r[agingCol]))) continue;
      out.push(r);
    }
    return out;
  }

  function getFilteredInvRows() {
    const inv = state.raw?.inventory;
    if (!inv || !Array.isArray(inv.rows)) return [];
    const { rows, lookups } = inv;
    const iv = state.inv;

    const catIdxSet = getLookupIdxSet(state.globalCat, lookups.categories);
    const gSubIdxSet = getLookupIdxSet(state.globalSubcat, lookups.subcats);
    const siteIdxSet = getLookupIdxSet(iv.site, lookups.sites);
    const btIdxSet = getLookupIdxSet(iv.binType, lookups.binTypes);
    const bzIdxSet = getLookupIdxSet(iv.binZone, lookups.binZones);
    const scIdxSet = getLookupIdxSet(iv.subcat, lookups.subcats);
    const brIdxSet = getLookupIdxSet(iv.brand, lookups.brands);
    const stIdxSet = getLookupIdxSet(iv.status, lookups.purchaseStatuses);
    const rngIdxSet = getLookupIdxSet(iv.range, lookups.ranges || []);
    const agingObjs = iv.agingBucket
      ? splitMulti(iv.agingBucket).map((k) => AGING_BUCKETS.find((b) => b.key === k)).filter(Boolean)
      : [];

    let badSkuSiteSet = null;
    if (iv.badStock && state.raw.invSerials) {
      badSkuSiteSet = new Set();
      const snLookups = state.raw.invSerials.lookups;
      getFilteredSerialRows().forEach((sr) => {
        badSkuSiteSet.add(`${sr[SN_C.SKU]}|${snLookups.sites[sr[SN_C.SITE]]}`);
      });
    }

    const sellableIdxSet = new Set();
    const damagedIdxSet = new Set();
    lookups.binTypes.forEach((n, idx) => {
      const low = n.toLowerCase();
      if (low.includes("bán mới")) sellableIdxSet.add(idx);
      if (low.includes("hư hỏng")) damagedIdxSet.add(idx);
    });

    const out = [];
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (state.globalCat) {
        if (r.length > INV_C.CAT) {
          if (!catIdxSet || !catIdxSet.has(r[INV_C.CAT])) continue;
        } else if (!hasMultiPrefix(state.globalCat, lookups.subcats[r[INV_C.SUBCAT]])) {
          continue;
        }
      }
      if (gSubIdxSet && !gSubIdxSet.has(r[INV_C.SUBCAT])) continue;
      if (siteIdxSet && !siteIdxSet.has(r[INV_C.SITE])) continue;
      if (btIdxSet && !btIdxSet.has(r[INV_C.BIN_TYPE])) continue;
      if (bzIdxSet && !bzIdxSet.has(r[INV_C.BIN_ZONE])) continue;
      if (scIdxSet && !scIdxSet.has(r[INV_C.SUBCAT])) continue;
      if (brIdxSet && !brIdxSet.has(r[INV_C.BRAND])) continue;
      if (stIdxSet && !stIdxSet.has(r[INV_C.STATUS])) continue;
      if (rngIdxSet && !rngIdxSet.has(r[INV_C.RANGE])) continue;
      if (iv.sellableOnly && !sellableIdxSet.has(r[INV_C.BIN_TYPE])) continue;
      if (iv.damagedOnly && !damagedIdxSet.has(r[INV_C.BIN_TYPE])) continue;
      if (agingObjs.length > 0) {
        const d = iv.agingBasis === "first" && r.length > INV_C.AGING_FIRST ? r[INV_C.AGING_FIRST] : r[INV_C.AGING];
        if (!agingObjs.some((ao) => ao.test(d))) continue;
      }
      if (badSkuSiteSet) {
        const skuCode = extractSkuCodeFromLabel(lookups.skus[r[INV_C.SKU]]);
        const siteCode = lookups.sites[r[INV_C.SITE]];
        if (!badSkuSiteSet.has(`${skuCode}|${siteCode}`)) continue;
      }
      out.push(r);
    }
    return out;
  }

  function renderInventoryView() {
    const inv = state.raw?.inventory;
    if (!inv || !Array.isArray(inv.rows) || inv.rows.length === 0) {
      document.getElementById("invInsightText").textContent =
        "Chưa có dữ liệu tồn kho — hãy bấm nút Update Data để đồng bộ từ thư mục gốc.";
      [charts.invBadStock, charts.invStatusRange, charts.invSite, charts.invBin, charts.invAging, charts.invCat].forEach((ch) => {
        if (ch) { ch.clear(); ch.setOption(emptyOption("Chưa có dữ liệu Inventory")); }
      });
      return;
    }

    const rows = getFilteredInvRows();
    const serialRows = getFilteredSerialRows();
    if (state.activeView === "inventory") renderSidebarInventory();
    renderInvKpis(rows, serialRows);
    renderInvChipsAndInsight(rows, serialRows);
    renderInvBadStockChart(serialRows);
    renderInvAgingChart(rows, serialRows);
    renderInvStatusRangeChart(rows);
    renderInvSiteChart(rows);
    renderInvBinChart(rows);
    renderInvCatChart(rows);
    renderInvTable(rows, serialRows);
  }

  function renderInvKpis(rows, serialRows) {
    const { lookups } = state.raw.inventory;
    let totalVal = 0, totalNet = 0, totalQty = 0;
    let sellVal = 0, sellQty = 0;
    let dmgVal = 0, dmgQty = 0;
    let discVal = 0, discQty = 0;
    let aging365Val = 0, aging365Qty = 0;
    const skuSet = new Set(), siteSet = new Set();

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const val = r[INV_C.VALUE];
      const qty = r[INV_C.QTY];
      totalVal += val;
      totalNet += r[INV_C.NET_VALUE];
      totalQty += qty;
      skuSet.add(r[INV_C.SKU]);
      siteSet.add(r[INV_C.SITE]);

      const bt = (lookups.binTypes[r[INV_C.BIN_TYPE]] || "").toLowerCase();
      if (bt.includes("bán mới")) { sellVal += val; sellQty += qty; }
      if (bt.includes("hư hỏng")) { dmgVal += val; dmgQty += qty; }
      if ((lookups.purchaseStatuses[r[INV_C.STATUS]] || "").toLowerCase() === "discontinued") {
        discVal += val; discQty += qty;
      }
      const d = state.inv.agingBasis === "first" && r.length > INV_C.AGING_FIRST ? r[INV_C.AGING_FIRST] : r[INV_C.AGING];
      if (d > 365) { aging365Val += val; aging365Qty += qty; }
    }

    let badRiskVal = 0, badRiskCnt = 0, veryBadCnt = 0, onlyBadCnt = 0, classifiedCnt = 0, totalSnCnt = 0;
    const isStrictlyBad = (lbl) => lbl === "Tồn xấu" || lbl === "Tồn rất xấu";
    const cubeRows = getFilteredSerialCubeRows();
    if (cubeRows && state.raw.invSerialCube) {
      const snL = state.raw.invSerialCube.lookups;
      const badCol = state.inv.badScope === "site" ? SC_C.BAD_SITE : SC_C.BAD_COMP;
      const badL = state.inv.badScope === "site" ? snL.badSite : snL.badComp;
      cubeRows.forEach((cr) => {
        const cnt = cr[SC_C.COUNT];
        totalSnCnt += cnt;
        if (cr[SC_C.IN_BAD_FILE]) {
          classifiedCnt += cnt;
          const lbl = badL[cr[badCol]];
          if (isStrictlyBad(lbl)) {
            badRiskCnt += cnt;
            badRiskVal += cr[SC_C.VAL];
            if (lbl === "Tồn rất xấu") veryBadCnt += cnt;
            else onlyBadCnt += cnt;
          }
        }
      });
    } else if (state.raw.invSerials) {
      const snL = state.raw.invSerials.lookups;
      const badCol = state.inv.badScope === "site" ? SN_C.BAD_SITE : SN_C.BAD_COMP;
      const badL = state.inv.badScope === "site" ? snL.badSite : snL.badComp;
      totalSnCnt = serialRows.length;
      serialRows.forEach((sr) => {
        if (sr[SN_C.IN_BAD_FILE]) {
          classifiedCnt++;
          const lbl = badL[sr[badCol]];
          if (isStrictlyBad(lbl)) {
            badRiskCnt++;
            badRiskVal += sr[SN_C.INV_VAL];
            if (lbl === "Tồn rất xấu") veryBadCnt++;
            else onlyBadCnt++;
          }
        }
      });
    }

    const pct = (part) => (totalVal > 0 ? fmtPct((part / totalVal) * 100) : "0.0%");
    const avgCost = totalQty > 0 ? totalVal / totalQty : 0;

    document.getElementById("invKpiValue").textContent = fmtCompactVnd(totalVal);
    document.getElementById("invKpiValueSub").textContent = `Net PP: ${fmtCompactVnd(totalNet)} • TB ${fmtCompactVnd(avgCost)}`;
    document.getElementById("invKpiQty").textContent = `${fmtInt(totalQty)} units`;
    document.getElementById("invKpiQtySub").textContent = `${fmtInt(totalSnCnt)} SN • ${fmtInt(skuSet.size)} SKU • ${fmtInt(siteSet.size)} kho`;
    document.getElementById("invKpiSellable").textContent = fmtCompactVnd(sellVal);
    document.getElementById("invKpiSellableSub").textContent = `${pct(sellVal)} • ${fmtInt(sellQty)} units`;
    document.getElementById("invKpiBadStock").textContent = fmtCompactVnd(badRiskVal);
    document.getElementById("invKpiBadStockSub").textContent = `${fmtInt(badRiskCnt)} SN (Rất xấu: ${fmtInt(veryBadCnt)} • Xấu: ${fmtInt(onlyBadCnt)})`;
    document.getElementById("invKpiDamaged").textContent = fmtCompactVnd(dmgVal);
    document.getElementById("invKpiDamagedSub").textContent = `${pct(dmgVal)} • ${fmtInt(dmgQty)} units`;
    document.getElementById("invKpiAging365").textContent = fmtCompactVnd(aging365Val);
    document.getElementById("invKpiAging365Sub").textContent = `${fmtInt(aging365Qty)} units • Discontinued: ${fmtCompactVnd(discVal)}`;
  }

  function renderInvChipsAndInsight(rows, serialRows) {
    const wrap = document.getElementById("invActiveChips");
    const iv = state.inv;
    const chips = [];
    const add = (label, cls, fn) => chips.push({ label, cls, fn });

    splitMulti(state.globalCat).forEach((cat) => {
      add(`Cat: ${cat}`, "amber", () => {
        state.globalCat = removeMultiVal(state.globalCat, cat);
        populateGlobalMasterFilter();
        renderLookupQuickPicks();
        renderAll();
      });
    });
    splitMulti(state.globalSubcat).forEach((sc) => {
      add(`Subcat 2: ${sc}`, "amber", () => {
        setGlobalSubcat(removeMultiVal(state.globalSubcat, sc));
      });
    });
    splitMulti(iv.status).forEach((v) => {
      add(`TT Mua: ${v}`, "amber", () => { iv.status = removeMultiVal(iv.status, v); syncMultiSelectUI("invFilterStatus", iv.status); renderInventoryView(); });
    });
    splitMulti(iv.range).forEach((v) => {
      add(`Range: ${v}`, "", () => { iv.range = removeMultiVal(iv.range, v); syncMultiSelectUI("invFilterRange", iv.range); renderInventoryView(); });
    });
    splitMulti(iv.badStock).forEach((v) => {
      add(`Loại tồn: ${v}`, "amber", () => { iv.badStock = removeMultiVal(iv.badStock, v); syncMultiSelectUI("invFilterBadStock", iv.badStock); renderInventoryView(); });
    });
    splitMulti(iv.agingBucket).forEach((k) => {
      const b = AGING_BUCKETS.find((x) => x.key === k);
      add(`Tuổi tồn: ${b ? b.label : k}`, "amber", () => { iv.agingBucket = removeMultiVal(iv.agingBucket, k); renderInventoryView(); });
    });
    splitMulti(iv.site).forEach((v) => {
      add(`Kho: ${v}`, "", () => { iv.site = removeMultiVal(iv.site, v); syncMultiSelectUI("invFilterSite", iv.site); renderInventoryView(); });
    });
    splitMulti(iv.binType).forEach((v) => {
      add(`BIN Type: ${v}`, "", () => { iv.binType = removeMultiVal(iv.binType, v); syncMultiSelectUI("invFilterBinType", iv.binType); renderInventoryView(); });
    });
    splitMulti(iv.binZone).forEach((v) => {
      add(`BIN Zone: ${v}`, "", () => { iv.binZone = removeMultiVal(iv.binZone, v); syncMultiSelectUI("invFilterBinZone", iv.binZone); renderInventoryView(); });
    });
    splitMulti(iv.brand).forEach((v) => {
      add(`Brand: ${v}`, "", () => { iv.brand = removeMultiVal(iv.brand, v); syncMultiSelectUI("invFilterBrand", iv.brand); renderInventoryView(); });
    });
    if (iv.sellableOnly) add("Chỉ hàng bán mới", "", () => { iv.sellableOnly = false; document.getElementById("invSellableOnlyToggle").checked = false; renderInventoryView(); });
    if (iv.damagedOnly) add("Chỉ hàng hư hỏng", "amber", () => { iv.damagedOnly = false; document.getElementById("invDamagedOnlyToggle").checked = false; renderInventoryView(); });

    const cubeRows = getFilteredSerialCubeRows();
    const totalSnCnt = cubeRows ? cubeRows.reduce((acc, cr) => acc + cr[SC_C.COUNT], 0) : serialRows.length;

    wrap.innerHTML = "";
    if (!chips.length) {
      wrap.innerHTML = `<span class="chip muted-chip">Toàn bộ tồn kho • ${fmtInt(rows.length)} BIN • ${fmtInt(totalSnCnt)} Serial</span>`;
    } else {
      chips.forEach((c) => {
        const el = document.createElement("span");
        el.className = `chip ${c.cls}`;
        el.innerHTML = `<span>${esc(c.label)}</span><button type="button" aria-label="Xóa">×</button>`;
        el.querySelector("button").addEventListener("click", c.fn);
        wrap.appendChild(el);
      });
    }

    const insightEl = document.getElementById("invInsightText");
    if (!rows.length && !totalSnCnt) {
      insightEl.textContent = "Không có dữ liệu khớp bộ lọc — bấm Reset Kho hoặc Bỏ lọc chung.";
      return;
    }
    const { lookups } = state.raw.inventory;
    let totVal = 0, dmgVal = 0;
    rows.forEach((r) => {
      totVal += r[INV_C.VALUE];
      if ((lookups.binTypes[r[INV_C.BIN_TYPE]] || "").toLowerCase().includes("hư hỏng")) dmgVal += r[INV_C.VALUE];
    });
    let veryBadVal = 0, veryBadCnt = 0;
    if (cubeRows && state.raw.invSerialCube) {
      const snL = state.raw.invSerialCube.lookups;
      const badCol = iv.badScope === "site" ? SC_C.BAD_SITE : SC_C.BAD_COMP;
      const badL = iv.badScope === "site" ? snL.badSite : snL.badComp;
      cubeRows.forEach((cr) => {
        if (badL[cr[badCol]] === "Tồn rất xấu") { veryBadCnt += cr[SC_C.COUNT]; veryBadVal += cr[SC_C.VAL]; }
      });
    } else if (state.raw.invSerials) {
      const snL = state.raw.invSerials.lookups;
      const badCol = iv.badScope === "site" ? SN_C.BAD_SITE : SN_C.BAD_COMP;
      const badL = iv.badScope === "site" ? snL.badSite : snL.badComp;
      serialRows.forEach((sr) => {
        if (badL[sr[badCol]] === "Tồn rất xấu") { veryBadCnt++; veryBadVal += sr[SN_C.INV_VAL]; }
      });
    }
    insightEl.textContent =
      `Tồn rất xấu: ${fmtInt(veryBadCnt)} SN (${fmtCompactVnd(veryBadVal)}) | Hàng hư hỏng: ${totVal ? fmtPct((dmgVal / totVal) * 100) : "0%"} (${fmtCompactVnd(dmgVal)})`;
  }

  function renderInvBadStockChart(serialRows) {
    if (!charts.invBadStock) return;
    const cubeRows = getFilteredSerialCubeRows();
    const sn = state.raw?.invSerials;
    const hasCube = Boolean(cubeRows && cubeRows.length && state.raw?.invSerialCube);
    if (!hasCube && (!sn || !serialRows.length)) {
      charts.invBadStock.clear();
      charts.invBadStock.setOption(emptyOption("Chưa có dữ liệu Bad Stock / Serial khớp bộ lọc"));
      return;
    }

    const iv = state.inv;
    const isSite = iv.badScope === "site";
    const isQty = iv.badMetric === "qty";
    const onlyClassified = iv.badFilter === "classified";

    const map = new Map();
    if (onlyClassified) {
      BAD_STOCK_ORDER.forEach((k) => map.set(k, { val: 0, qty: 0 }));
    }

    if (hasCube) {
      const scL = state.raw.invSerialCube.lookups;
      const badCol = isSite ? SC_C.BAD_SITE : SC_C.BAD_COMP;
      const badL = isSite ? scL.badSite : scL.badComp;
      cubeRows.forEach((cr) => {
        if (onlyClassified && !cr[SC_C.IN_BAD_FILE]) return;
        const label = badL[cr[badCol]] || "Khác";
        if (!map.has(label)) map.set(label, { val: 0, qty: 0 });
        const cur = map.get(label);
        cur.val += cr[SC_C.VAL];
        cur.qty += cr[SC_C.COUNT];
      });
    } else {
      const badCol = isSite ? SN_C.BAD_SITE : SN_C.BAD_COMP;
      const badL = isSite ? sn.lookups.badSite : sn.lookups.badComp;
      serialRows.forEach((sr) => {
        if (onlyClassified && !sr[SN_C.IN_BAD_FILE]) return;
        const label = badL[sr[badCol]] || "Khác";
        if (!map.has(label)) map.set(label, { val: 0, qty: 0 });
        const cur = map.get(label);
        cur.val += sr[SN_C.INV_VAL];
        cur.qty += 1;
      });
    }

    const entries = Array.from(map.entries()).sort((a, b) => {
      const ia = BAD_STOCK_ORDER.indexOf(a[0]), ib = BAD_STOCK_ORDER.indexOf(b[0]);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return b[1].val - a[1].val;
    });

    const totalVal = entries.reduce((s, e) => s + e[1].val, 0);
    const totalQty = entries.reduce((s, e) => s + e[1].qty, 0);

    charts.invBadStock.clear();
    charts.invBadStock.setOption({
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        backgroundColor: COLORS.tooltipBg,
        borderColor: COLORS.tooltipBorder,
        textStyle: { color: "#F1F5F9", fontSize: 12 },
        formatter: (params) => {
          const idx = params[0]?.dataIndex ?? 0;
          const [name, d] = entries[idx];
          const vPct = totalVal ? fmtPct((d.val / totalVal) * 100) : "0%";
          const qPct = totalQty ? fmtPct((d.qty / totalQty) * 100) : "0%";
          return `<strong>${esc(name)}</strong><br/>` +
            `Giá trị tồn: <b>${fmtVndFull(d.val)}</b> (${vPct})<br/>` +
            `Số lượng Serial: <b>${fmtInt(d.qty)} SN</b> (${qPct})`;
        },
      },
      grid: { top: 22, left: 56, right: 16, bottom: 38 },
      xAxis: {
        type: "category",
        data: entries.map((e) => e[0]),
        axisLine: { lineStyle: { color: COLORS.axisLine } },
        axisLabel: { color: COLORS.textSub, fontSize: 10.5, interval: 0, width: 95, overflow: "truncate" },
      },
      yAxis: {
        type: "value",
        splitLine: { lineStyle: { color: COLORS.gridLine } },
        axisLabel: {
          color: COLORS.axisLabel,
          fontSize: 10,
          fontFamily: "JetBrains Mono",
          formatter: (v) => (isQty ? fmtInt(v) : fmtAxisVnd(v)),
        },
      },
      series: [{
        type: "bar",
        barMaxWidth: 38,
        label: {
          show: true,
          position: "top",
          color: COLORS.textSub,
          fontSize: 10,
          fontFamily: "JetBrains Mono",
          formatter: (p) => {
            const d = entries[p.dataIndex][1];
            return isQty ? `${fmtInt(d.qty)} SN` : fmtCompactVnd(d.val);
          },
        },
        data: entries.map(([name, d]) => ({
          value: Math.round(isQty ? d.qty : d.val),
          itemStyle: {
            color: BAD_STOCK_COLORS[name] || "#64748B",
            borderRadius: [4, 4, 0, 0],
            opacity: iv.badStock && !isMultiMatch(iv.badStock, name) ? 0.35 : 0.94,
          },
        })),
      }],
    });
  }

  function renderInvStatusRangeChart(rows) {
    if (!charts.invStatusRange) return;
    const iv = state.inv;
    const isQty = iv.statusMetric === "qty";
    let entries = [];

    if (iv.statusDim === "status_master" && (state.raw.masterSummary || state.raw.masterProducts)) {
      const map = new Map();
      if (state.raw.masterSummary?.rows) {
        const ms = state.raw.masterSummary;
        const msL = ms.lookups;
        const catIdxSet = getLookupIdxSet(state.globalCat, msL.categories);
        const subIdxSet = getLookupIdxSet(state.globalSubcat, msL.subcats);
        ms.rows.forEach((r) => {
          // [0:catIdx, 1:subIdx, 2:statusIdx, 3:rangeIdx, 4:skuCount, 5:invQty, 6:invVal]
          if (catIdxSet && !catIdxSet.has(r[0])) return;
          if (subIdxSet && !subIdxSet.has(r[1])) return;
          const st = msL.purchaseStatuses[r[2]] || "Khác";
          const cur = map.get(st) || { val: 0, qty: 0, count: 0 };
          cur.count += r[4];
          cur.qty += r[5];
          cur.val += r[6];
          map.set(st, cur);
        });
      } else if (state.raw.masterProducts?.rows) {
        const mp = state.raw.masterProducts;
        const mpL = mp.lookups;
        const catIdxSet = getLookupIdxSet(state.globalCat, mpL.categories);
        const subIdxSet = getLookupIdxSet(state.globalSubcat, mpL.subcats);
        mp.rows.forEach((r) => {
          if (catIdxSet && !catIdxSet.has(r[MP_C.CAT])) return;
          if (subIdxSet && !subIdxSet.has(r[MP_C.SUBCAT])) return;
          const st = mpL.purchaseStatuses[r[MP_C.STATUS]] || "Khác";
          const cur = map.get(st) || { val: 0, qty: 0, count: 0 };
          cur.val += r[MP_C.INV_VAL];
          cur.qty += r[MP_C.INV_QTY];
          cur.count += 1;
          map.set(st, cur);
        });
      }
      entries = Array.from(map.entries()).map(([name, d]) => ({
        name,
        val: d.val,
        qty: d.qty,
        count: d.count,
        isMaster: true,
      })).sort((a, b) => b.count - a.count);
    } else {
      if (!rows.length) {
        charts.invStatusRange.clear();
        charts.invStatusRange.setOption(emptyOption("Không có dữ liệu khớp bộ lọc"));
        return;
      }
      const { lookups } = state.raw.inventory;
      const isRange = iv.statusDim === "range_inv";
      const map = new Map();
      rows.forEach((r) => {
        const key = isRange
          ? ((lookups.ranges && lookups.ranges[r[INV_C.RANGE]]) || "No")
          : (lookups.purchaseStatuses[r[INV_C.STATUS]] || "Normal");
        const cur = map.get(key) || { val: 0, qty: 0, count: 0 };
        cur.val += r[INV_C.VALUE];
        cur.qty += r[INV_C.QTY];
        cur.count += 1;
        map.set(key, cur);
      });
      entries = Array.from(map.entries()).map(([name, d]) => ({
        name,
        val: d.val,
        qty: d.qty,
        count: d.count,
        isMaster: false,
      })).sort((a, b) => (isQty ? b.qty - a.qty : b.val - a.val));
    }

    charts.invStatusRange.clear();
    charts.invStatusRange.setOption({
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        backgroundColor: COLORS.tooltipBg,
        borderColor: COLORS.tooltipBorder,
        textStyle: { color: "#F1F5F9", fontSize: 12 },
        formatter: (params) => {
          const item = entries[params[0]?.dataIndex ?? 0];
          if (item.isMaster) {
            return `<strong>${esc(item.name)} (Master Product)</strong><br/>` +
              `Số mã SKU: <b>${fmtInt(item.count)} SKUs</b><br/>` +
              `Đang tồn kho: <b>${fmtInt(item.qty)} units</b> (${fmtVndFull(item.val)})`;
          }
          return `<strong>${esc(item.name)}</strong><br/>` +
            `Giá trị tồn: <b>${fmtVndFull(item.val)}</b><br/>` +
            `Số lượng: <b>${fmtInt(item.qty)} units</b> (${fmtInt(item.count)} BIN)`;
        },
      },
      grid: { top: 22, left: 56, right: 20, bottom: 32 },
      xAxis: {
        type: "category",
        data: entries.map((e) => e.name),
        axisLine: { lineStyle: { color: COLORS.axisLine } },
        axisLabel: { color: COLORS.textSub, fontSize: 11 },
      },
      yAxis: {
        type: "value",
        splitLine: { lineStyle: { color: COLORS.gridLine } },
        axisLabel: {
          color: COLORS.axisLabel,
          fontSize: 10,
          fontFamily: "JetBrains Mono",
          formatter: (v) => (isQty || iv.statusDim === "status_master" ? fmtInt(v) : fmtAxisVnd(v)),
        },
      },
      series: [{
        type: "bar",
        barMaxWidth: 46,
        label: {
          show: true,
          position: "top",
          color: COLORS.textSub,
          fontSize: 10.5,
          fontFamily: "JetBrains Mono",
          formatter: (p) => {
            const it = entries[p.dataIndex];
            if (it.isMaster) return isQty ? `${fmtInt(it.count)} SKU` : fmtCompactVnd(it.val);
            return isQty ? `${fmtInt(it.qty)} qty` : fmtCompactVnd(it.val);
          },
        },
        data: entries.map((e, idx) => ({
          value: Math.round(e.isMaster && isQty ? e.count : (isQty ? e.qty : e.val)),
          itemStyle: {
            color: STATUS_COLORS[e.name] || FALLBACK_COLORS[idx % FALLBACK_COLORS.length],
            borderRadius: [4, 4, 0, 0],
          },
        })),
      }],
    });
  }

  function renderInvSiteChart(rows) {
    if (!charts.invSite) return;
    if (!rows.length) { charts.invSite.clear(); charts.invSite.setOption(emptyOption("Không có dữ liệu kho")); return; }
    const { lookups, siteDirectory = {} } = state.raw.inventory;
    const isQty = state.inv.siteMetric === "qty";
    const metricCol = isQty ? INV_C.QTY : INV_C.VALUE;

    const siteTotals = new Map();
    const binTypeSet = new Set();
    const mat = new Map();

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const site = lookups.sites[r[INV_C.SITE]];
      const bt = lookups.binTypes[r[INV_C.BIN_TYPE]];
      const val = r[metricCol];
      siteTotals.set(site, (siteTotals.get(site) || 0) + val);
      binTypeSet.add(bt);
      if (!mat.has(bt)) mat.set(bt, new Map());
      mat.get(bt).set(site, (mat.get(bt).get(site) || 0) + val);
    }

    const sites = Array.from(siteTotals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map((x) => x[0]);

    const binTypes = Array.from(binTypeSet).sort((a, b) => {
      const sum = (t) => Array.from(mat.get(t)?.values() || []).reduce((acc, v) => acc + v, 0);
      return sum(b) - sum(a);
    });

    const series = state.inv.siteMode === "stacked"
      ? binTypes.map((bt, idx) => ({
          name: bt,
          type: "bar",
          stack: "inv",
          barMaxWidth: 28,
          itemStyle: { color: BIN_TYPE_COLORS[bt] || FALLBACK_COLORS[idx % FALLBACK_COLORS.length] },
          data: sites.map((s) => Math.round((mat.get(bt)?.get(s) || 0) * 100) / 100),
        }))
      : [{
          name: isQty ? "Inventory QTY" : "Inventory Value",
          type: "bar",
          barMaxWidth: 28,
          itemStyle: {
            borderRadius: [4, 4, 0, 0],
            color: (p) => ((state.inv.site && isMultiMatch(state.inv.site, p.name)) ? "#00E5FF" : "#1D7AFC"),
          },
          data: sites.map((s) => Math.round((siteTotals.get(s) || 0) * 100) / 100),
        }];

    charts.invSite.clear();
    charts.invSite.setOption({
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        backgroundColor: COLORS.tooltipBg,
        borderColor: COLORS.tooltipBorder,
        textStyle: { color: "#F1F5F9", fontSize: 12 },
        formatter: (params) => {
          const code = params[0]?.axisValue || "";
          const sName = siteDirectory[code]?.siteName || code;
          const total = siteTotals.get(code) || 0;
          let html = `<strong>${esc(code)} — ${esc(sName)}</strong><br/>`;
          params.forEach((p) => {
            if (!p.value) return;
            html += `${p.marker} ${esc(p.seriesName)}: <b style="font-family:JetBrains Mono">${isQty ? fmtInt(p.value) + " units" : fmtVndFull(p.value)}</b><br/>`;
          });
          if (state.inv.siteMode === "stacked") {
            html += `<div style="margin-top:4px;border-top:1px solid rgba(255,255,255,0.12);padding-top:4px">Tổng: <b>${isQty ? fmtInt(total) + " units" : fmtVndFull(total)}</b></div>`;
          }
          return html;
        },
      },
      legend: state.inv.siteMode === "stacked" ? {
        bottom: 0,
        type: "scroll",
        icon: "circle",
        itemWidth: 8,
        itemHeight: 8,
        textStyle: { color: COLORS.textMuted, fontSize: 10.5 },
      } : { show: false },
      grid: { top: 18, left: 56, right: 16, bottom: state.inv.siteMode === "stacked" ? 42 : 28 },
      xAxis: {
        type: "category",
        data: sites,
        axisLine: { lineStyle: { color: COLORS.axisLine } },
        axisLabel: { color: COLORS.axisLabel, fontSize: 10.5, fontFamily: "JetBrains Mono" },
      },
      yAxis: {
        type: "value",
        splitLine: { lineStyle: { color: COLORS.gridLine } },
        axisLabel: {
          color: COLORS.axisLabel,
          fontSize: 10,
          fontFamily: "JetBrains Mono",
          formatter: (v) => (isQty ? fmtInt(v) : fmtAxisVnd(v)),
        },
      },
      series,
    });
  }

  function renderInvBinChart(rows) {
    if (!charts.invBin) return;
    if (!rows.length) { charts.invBin.clear(); charts.invBin.setOption(emptyOption("Không có dữ liệu BIN")); return; }
    const { lookups } = state.raw.inventory;
    const isZone = state.inv.binDim === "binZone";
    const isQty = state.inv.binMetric === "qty";
    const dimCol = isZone ? INV_C.BIN_ZONE : INV_C.BIN_TYPE;
    const dimLookup = isZone ? lookups.binZones : lookups.binTypes;
    const metricCol = isQty ? INV_C.QTY : INV_C.VALUE;

    const map = new Map();
    rows.forEach((r) => {
      const k = dimLookup[r[dimCol]];
      const cur = map.get(k) || { val: 0, qty: 0, count: 0 };
      cur.val += r[INV_C.VALUE];
      cur.qty += r[INV_C.QTY];
      cur.count += 1;
      map.set(k, cur);
    });

    const items = Array.from(map.entries())
      .map(([name, d], idx) => ({
        name,
        value: Math.round((isQty ? d.qty : d.val) * 100) / 100,
        rawVal: d.val,
        rawQty: d.qty,
        count: d.count,
        itemStyle: { color: BIN_TYPE_COLORS[name] || FALLBACK_COLORS[idx % FALLBACK_COLORS.length] },
      }))
      .sort((a, b) => b.value - a.value);

    charts.invBin.clear();
    charts.invBin.setOption({
      tooltip: {
        trigger: "item",
        backgroundColor: COLORS.tooltipBg,
        borderColor: COLORS.tooltipBorder,
        textStyle: { color: "#F1F5F9", fontSize: 12 },
        formatter: (p) => {
          const d = p.data;
          return `<strong>${esc(d.name)}</strong><br/>` +
            `Giá trị: <b>${fmtVndFull(d.rawVal)}</b> (${p.percent}%)<br/>` +
            `Số lượng: <b>${fmtInt(d.rawQty)} units</b> (${fmtInt(d.count)} BIN)`;
        },
      },
      legend: {
        bottom: 0,
        type: "scroll",
        icon: "circle",
        itemWidth: 8,
        itemHeight: 8,
        textStyle: { color: COLORS.textMuted, fontSize: 10.5 },
      },
      series: [{
        type: "pie",
        radius: ["48%", "74%"],
        center: ["50%", "44%"],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 4, borderColor: COLORS.pieBorder, borderWidth: 2 },
        label: {
          show: true,
          color: COLORS.textSub,
          fontSize: 10.5,
          formatter: (p) => (p.percent >= 4 ? `${p.percent}%` : ""),
        },
        data: items,
      }],
    });
  }

  function renderInvAgingChart(rows, serialRows = []) {
    if (!charts.invAging) return;
    const cubeRows = getFilteredSerialCubeRows();
    const hasCube = Boolean(cubeRows && cubeRows.length && state.raw?.invSerialCube);
    const useSerials = hasCube || (state.raw?.invSerials && serialRows.length > 0);
    if (!useSerials && !rows.length) {
      charts.invAging.clear();
      charts.invAging.setOption(emptyOption("Không có dữ liệu tuổi tồn"));
      return;
    }

    const basisFirst = state.inv.agingBasis === "first";
    const agg = AGING_BUCKETS.map((b) => ({ ...b, val: 0, qty: 0, count: 0 }));

    if (hasCube) {
      const bCol = basisFirst ? SC_C.AGING_COMP_B : SC_C.AGING_SITE_B;
      for (let i = 0; i < cubeRows.length; i++) {
        const cr = cubeRows[i];
        const bIdx = cr[bCol];
        if (agg[bIdx]) {
          agg[bIdx].val += cr[SC_C.VAL];
          agg[bIdx].qty += cr[SC_C.COUNT];
          agg[bIdx].count += cr[SC_C.COUNT];
        }
      }
    } else if (useSerials) {
      const col = basisFirst ? SN_C.AGING_COMP : SN_C.AGING_SITE;
      for (let i = 0; i < serialRows.length; i++) {
        const sr = serialRows[i];
        const d = sr[col];
        for (let j = 0; j < agg.length; j++) {
          if (agg[j].test(d)) {
            agg[j].val += sr[SN_C.INV_VAL];
            agg[j].qty += 1;
            agg[j].count += 1;
            break;
          }
        }
      }
    } else {
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const d = basisFirst && r.length > INV_C.AGING_FIRST ? r[INV_C.AGING_FIRST] : r[INV_C.AGING];
        for (let j = 0; j < agg.length; j++) {
          if (agg[j].test(d)) {
            agg[j].val += r[INV_C.VALUE];
            agg[j].qty += r[INV_C.QTY];
            agg[j].count += 1;
            break;
          }
        }
      }
    }
    // Hide 'unknown' bucket if zero
    const displayAgg = agg.filter((b) => b.key !== "unknown" || b.qty > 0);

    const mode = state.inv.agingMetric;
    const series = [];
    if (mode === "both" || mode === "value") {
      series.push({
        name: "Giá trị tồn (VND)",
        type: "bar",
        yAxisIndex: 0,
        barMaxWidth: 34,
        data: displayAgg.map((b) => ({
          value: Math.round(b.val),
          itemStyle: {
            color: b.color,
            borderRadius: [4, 4, 0, 0],
            opacity: state.inv.agingBucket && !isMultiMatch(state.inv.agingBucket, b.key) ? 0.35 : 0.92,
          },
        })),
      });
    }
    if (mode === "both" || mode === "qty") {
      series.push({
        name: useSerials ? "Số Serial" : "Số lượng (QTY)",
        type: mode === "qty" ? "bar" : "line",
        yAxisIndex: mode === "both" ? 1 : 0,
        smooth: true,
        symbolSize: 8,
        barMaxWidth: 34,
        itemStyle: { color: "#00E5FF", borderRadius: [4, 4, 0, 0] },
        lineStyle: { color: "#00E5FF", width: 2.5 },
        data: displayAgg.map((b) => b.qty),
      });
    }

    charts.invAging.clear();
    charts.invAging.setOption({
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        backgroundColor: COLORS.tooltipBg,
        borderColor: COLORS.tooltipBorder,
        textStyle: { color: "#F1F5F9", fontSize: 12 },
        formatter: (params) => {
          const idx = params[0]?.dataIndex ?? 0;
          const b = displayAgg[idx];
          return `<strong>Nhóm tuổi (${basisFirst ? "Nhập đầu Cty" : "Nhập kho Site"}): ${esc(b.label)}</strong><br/>` +
            `Giá trị tồn: <b>${fmtVndFull(b.val)}</b><br/>` +
            `Số lượng: <b>${fmtInt(b.qty)} ${useSerials ? "Serial" : "units"}</b>`;
        },
      },
      legend: { bottom: 0, textStyle: { color: COLORS.textMuted, fontSize: 10.5 } },
      grid: { top: 20, left: 56, right: mode === "both" ? 48 : 16, bottom: 38 },
      xAxis: {
        type: "category",
        data: displayAgg.map((b) => b.label),
        axisLine: { lineStyle: { color: COLORS.axisLine } },
        axisLabel: { color: COLORS.axisLabel, fontSize: 10.5 },
      },
      yAxis: mode === "both"
        ? [
            {
              type: "value",
              splitLine: { lineStyle: { color: COLORS.gridLine } },
              axisLabel: { color: COLORS.axisLabel, fontSize: 10, fontFamily: "JetBrains Mono", formatter: fmtAxisVnd },
            },
            {
              type: "value",
              splitLine: { show: false },
              axisLabel: { color: "#00E5FF", fontSize: 10, fontFamily: "JetBrains Mono" },
            },
          ]
        : {
            type: "value",
            splitLine: { lineStyle: { color: COLORS.gridLine } },
            axisLabel: {
              color: COLORS.axisLabel,
              fontSize: 10,
              fontFamily: "JetBrains Mono",
              formatter: (v) => (mode === "qty" ? fmtInt(v) : fmtAxisVnd(v)),
            },
          },
      series,
    });
  }

  function renderInvCatChart(rows) {
    if (!charts.invCat) return;
    if (!rows.length) { charts.invCat.clear(); charts.invCat.setOption(emptyOption("Không có dữ liệu")); return; }
    const { lookups } = state.raw.inventory;
    const isBrand = state.inv.catDim === "brand";
    const isQty = state.inv.catMetric === "qty";
    const dimCol = isBrand ? INV_C.BRAND : INV_C.SUBCAT;
    const dimLookup = isBrand ? lookups.brands : lookups.subcats;

    const map = new Map();
    rows.forEach((r) => {
      const k = dimLookup[r[dimCol]];
      const cur = map.get(k) || { val: 0, qty: 0 };
      cur.val += r[INV_C.VALUE];
      cur.qty += r[INV_C.QTY];
      map.set(k, cur);
    });

    const top = Array.from(map.entries())
      .map(([name, d]) => ({ name, val: d.val, qty: d.qty, metric: isQty ? d.qty : d.val }))
      .sort((a, b) => b.metric - a.metric)
      .slice(0, 10)
      .reverse();

    charts.invCat.clear();
    charts.invCat.setOption({
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        backgroundColor: COLORS.tooltipBg,
        borderColor: COLORS.tooltipBorder,
        textStyle: { color: "#F1F5F9", fontSize: 12 },
        formatter: (params) => {
          const item = top[params[0]?.dataIndex ?? 0];
          return `<strong>${esc(item.name)}</strong><br/>Giá trị: <b>${fmtVndFull(item.val)}</b><br/>Số lượng: <b>${fmtInt(item.qty)} units</b>`;
        },
      },
      grid: { top: 10, left: 150, right: 64, bottom: 24 },
      xAxis: {
        type: "value",
        splitLine: { lineStyle: { color: COLORS.gridLine } },
        axisLabel: {
          color: COLORS.axisLabel,
          fontSize: 10,
          fontFamily: "JetBrains Mono",
          formatter: (v) => (isQty ? fmtInt(v) : fmtAxisVnd(v)),
        },
      },
      yAxis: {
        type: "category",
        data: top.map((x) => x.name),
        axisLine: { lineStyle: { color: COLORS.axisLine } },
        axisLabel: {
          color: COLORS.textSub,
          fontSize: 10.5,
          width: 140,
          overflow: "truncate",
        },
      },
      series: [{
        type: "bar",
        barMaxWidth: 18,
        itemStyle: {
          borderRadius: [0, 4, 4, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: "#1068DF" },
            { offset: 1, color: "#12D37A" },
          ]),
        },
        label: {
          show: true,
          position: "right",
          color: COLORS.textMuted,
          fontSize: 10,
          fontFamily: "JetBrains Mono",
          formatter: (p) => (isQty ? fmtInt(p.value) : fmtCompactVnd(p.value)),
        },
        data: top.map((x) => Math.round(x.metric)),
      }],
    });
  }

  function renderInvTableHead(cols) {
    const thead = document.getElementById("invTableHead");
    const iv = state.inv;
    thead.innerHTML = `<tr>${cols.map((c) => {
      const sorted = !c.nosort && iv.tableSortCol === c.key;
      const arrow = sorted ? (iv.tableSortDir === "asc" ? " ▲" : " ▼") : "";
      return `<th class="${c.num ? "num" : ""}" data-sort="${!c.nosort ? c.key : ""}">${esc(c.label)}${arrow}</th>`;
    }).join("")}</tr>`;
    thead.querySelectorAll("th[data-sort]").forEach((th) => {
      if (!th.dataset.sort) return;
      th.addEventListener("click", () => {
        if (iv.tableSortCol === th.dataset.sort) iv.tableSortDir = iv.tableSortDir === "asc" ? "desc" : "asc";
        else { iv.tableSortCol = th.dataset.sort; iv.tableSortDir = "desc"; }
        renderInvTable(getFilteredInvRows());
      });
    });
  }

  function binBadgeClass(binType) {
    const l = (binType || "").toLowerCase();
    if (l.includes("bán mới")) return "sellable";
    if (l.includes("hư hỏng")) return "damaged";
    if (l.includes("bảo hành")) return "warranty";
    return "other";
  }

  function renderInvTable(rows, serialRows = getFilteredSerialRows()) {
    const inv = state.raw?.inventory;
    if (!inv) return;
    const { lookups, siteDirectory = {} } = inv;
    const iv = state.inv;
    const q = iv.tableSearch;
    const dir = iv.tableSortDir === "asc" ? 1 : -1;

    const bindSkuSerialClicks = () => {
      document.querySelectorAll("#invTableBody [data-open-sku]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          openSkuOrSerialInspector(btn.dataset.openSku, btn.dataset.openSn || "");
        });
      });
    };

    // TAB 2: SERIAL & BAD STOCK
    if (iv.tableTab === "serials") {
      const sn = state.raw?.invSerials;
      if (!sn) {
        ensureLookupShardsLoaded();
        document.getElementById("invTableBody").innerHTML = `<tr><td colspan="10" class="muted">Đang tải 40.726 Serial chi tiết... vui lòng chờ 1 giây.</td></tr>`;
        return;
      }
      const snL = sn.lookups;
      let filtered = serialRows;
      if (q) {
        filtered = serialRows.filter((r) =>
          r[SN_C.SN].toLowerCase().includes(q) ||
          r[SN_C.SKU].toLowerCase().includes(q) ||
          r[SN_C.SKU_NAME].toLowerCase().includes(q) ||
          snL.sites[r[SN_C.SITE]].toLowerCase().includes(q) ||
          snL.locations[r[SN_C.LOC]].toLowerCase().includes(q) ||
          snL.badComp[r[SN_C.BAD_COMP]].toLowerCase().includes(q)
        );
      }

      const colMap = {
        sn: (r) => r[SN_C.SN],
        sku: (r) => r[SN_C.SKU],
        site: (r) => snL.sites[r[SN_C.SITE]],
        binType: (r) => snL.binTypes[r[SN_C.BIN_TYPE]],
        badComp: (r) => snL.badComp[r[SN_C.BAD_COMP]],
        agingComp: (r) => r[SN_C.AGING_COMP],
        agingSite: (r) => r[SN_C.AGING_SITE],
        value: (r) => r[SN_C.INV_VAL],
      };
      const getter = colMap[iv.tableSortCol] || colMap.value;
      const sorted = [...filtered].sort((a, b) => {
        const va = getter(a), vb = getter(b);
        return typeof va === "string" ? va.localeCompare(vb) * dir : (va - vb) * dir;
      });

      const totalPages = Math.max(1, Math.ceil(sorted.length / iv.tablePageSize));
      iv.tablePage = Math.min(iv.tablePage, totalPages);
      const start = (iv.tablePage - 1) * iv.tablePageSize;
      const pageRows = sorted.slice(start, start + iv.tablePageSize);

      renderInvTableHead([
        { key: "sn", label: "Serial Number" },
        { key: "sku", label: "SKU — Sản phẩm" },
        { key: "site", label: "Site" },
        { key: "loc", label: "BIN", nosort: true },
        { key: "binType", label: "BIN Type" },
        { key: "badComp", label: "Loại tồn (Cty)" },
        { key: "agingComp", label: "Tuổi Cty", num: true },
        { key: "agingSite", label: "Tuổi Site", num: true },
        { key: "value", label: "Giá trị (VND)", num: true },
      ]);

      document.getElementById("invTableBody").innerHTML = pageRows.map((r) => {
        const bt = snL.binTypes[r[SN_C.BIN_TYPE]];
        const bc = snL.badComp[r[SN_C.BAD_COMP]];
        const ac = r[SN_C.AGING_COMP];
        const ageCls = ac < 0 ? "" : ac <= 90 ? "fresh" : ac <= 180 ? "mid" : "old";
        return `
          <tr>
            <td><button type="button" class="link-sku-btn" data-open-sku="${esc(r[SN_C.SKU])}" data-open-sn="${esc(r[SN_C.SN])}">${esc(r[SN_C.SN])}</button></td>
            <td class="sku-cell" title="${esc(r[SN_C.SKU])} — ${esc(r[SN_C.SKU_NAME])}">
              <button type="button" class="link-sku-btn" data-open-sku="${esc(r[SN_C.SKU])}">${esc(r[SN_C.SKU])}</button> — ${esc(r[SN_C.SKU_NAME])}
            </td>
            <td class="mono"><strong>${esc(snL.sites[r[SN_C.SITE]])}</strong></td>
            <td class="mono">${esc(snL.locations[r[SN_C.LOC]])}</td>
            <td><span class="inv-badge ${binBadgeClass(bt)}">${esc(bt)}</span></td>
            <td><span class="inv-badge ${badStockBadgeClass(bc)}">${esc(bc)}</span></td>
            <td class="num"><span class="aging-tag ${ageCls}">${ac >= 0 ? fmtInt(ac) + "d" : "—"}</span></td>
            <td class="num mono">${r[SN_C.AGING_SITE] >= 0 ? fmtInt(r[SN_C.AGING_SITE]) + "d" : "—"}</td>
            <td class="num"><strong>${fmtInt(r[SN_C.INV_VAL])}</strong></td>
          </tr>`;
      }).join("");
      bindSkuSerialClicks();

      document.getElementById("invTableCountInfo").textContent =
        `Hiển thị ${fmtInt(start + 1)}–${fmtInt(Math.min(start + pageRows.length, sorted.length))} / ${fmtInt(sorted.length)} Serial • Click Serial/SKU để tra cứu 360°`;
      renderInvPagination(totalPages);
      iv.lastExport = {
        headers: ["Serial Number", "SKU", "SKU Name", "Site", "BIN", "BIN Type", "Supplier", "First Date", "Last Date", "Aging Company", "Aging Site", "Bad Stock Company", "Bad Stock Site", "Stock Day Company", "Inventory Value"],
        rows: sorted.map((r) => [
          r[SN_C.SN], r[SN_C.SKU], r[SN_C.SKU_NAME], snL.sites[r[SN_C.SITE]], snL.locations[r[SN_C.LOC]],
          snL.binTypes[r[SN_C.BIN_TYPE]], snL.suppliers[r[SN_C.SUPPLIER]], r[SN_C.FIRST_DATE], r[SN_C.LAST_DATE],
          r[SN_C.AGING_COMP], r[SN_C.AGING_SITE], snL.badComp[r[SN_C.BAD_COMP]], snL.badSite[r[SN_C.BAD_SITE]],
          r[SN_C.SDAY_COMP], r[SN_C.INV_VAL],
        ]),
        filename: `inventory_serials_badstock_${new Date().toISOString().slice(0, 10)}.csv`,
      };
      return;
    }

    // TAB 3: SKU VELOCITY (7D / 30D / 90D / 180D)
    if (iv.tableTab === "velocity") {
      const sv = state.raw?.invSkuLevel;
      if (!sv) {
        document.getElementById("invTableBody").innerHTML = `<tr><td colspan="10" class="muted">Chưa có dữ liệu Inventory SKU Level.</td></tr>`;
        return;
      }
      const allowedSkus = new Set(rows.map((r) => extractSkuCodeFromLabel(lookups.skus[r[INV_C.SKU]])));
      let list = sv.rows.filter((r) => {
        if (state.globalCat && (r[SKU_C.CAT] ? !isMultiMatch(state.globalCat, r[SKU_C.CAT]) : !hasMultiPrefix(state.globalCat, r[SKU_C.SUBCAT]))) return false;
        if (state.globalSubcat && !isMultiMatch(state.globalSubcat, r[SKU_C.SUBCAT])) return false;
        if (iv.status && !isMultiMatch(iv.status, r[SKU_C.STATUS])) return false;
        if (iv.range && !isMultiMatch(iv.range, r[SKU_C.RANGE])) return false;
        if (iv.brand && !isMultiMatch(iv.brand, r[SKU_C.BRAND])) return false;
        if ((iv.site || iv.binType || iv.binZone || iv.badStock || iv.agingBucket || iv.sellableOnly || iv.damagedOnly) && !allowedSkus.has(r[SKU_C.SKU])) return false;
        if (q) {
          return r[SKU_C.SKU].toLowerCase().includes(q) || r[SKU_C.NAME].toLowerCase().includes(q) || r[SKU_C.BRAND].toLowerCase().includes(q);
        }
        return true;
      });

      const colMap = {
        sku: (r) => r[SKU_C.SKU],
        brand: (r) => r[SKU_C.BRAND],
        status: (r) => r[SKU_C.STATUS],
        s7d: (r) => r[SKU_C.S7D],
        s30d: (r) => r[SKU_C.S30D],
        s90d: (r) => r[SKU_C.S90D],
        s180d: (r) => r[SKU_C.S180D],
        sdays: (r) => r[SKU_C.SDAYS] ?? 999999,
        qty: (r) => r[SKU_C.INV_QTY],
        value: (r) => r[SKU_C.INV_VAL],
      };
      const getter = colMap[iv.tableSortCol] || colMap.s30d;
      list.sort((a, b) => {
        const va = getter(a), vb = getter(b);
        return typeof va === "string" ? va.localeCompare(vb) * dir : (va - vb) * dir;
      });

      const totalPages = Math.max(1, Math.ceil(list.length / iv.tablePageSize));
      iv.tablePage = Math.min(iv.tablePage, totalPages);
      const start = (iv.tablePage - 1) * iv.tablePageSize;
      const pageItems = list.slice(start, start + iv.tablePageSize);

      renderInvTableHead([
        { key: "sku", label: "SKU — Sản phẩm" },
        { key: "brand", label: "Brand" },
        { key: "status", label: "TT Mua" },
        { key: "s7d", label: "7D", num: true },
        { key: "s30d", label: "30D", num: true },
        { key: "s90d", label: "90D", num: true },
        { key: "s180d", label: "180D", num: true },
        { key: "sdays", label: "S.Days", num: true },
        { key: "qty", label: "Inv QTY", num: true },
        { key: "value", label: "Inv Value", num: true },
      ]);

      document.getElementById("invTableBody").innerHTML = pageItems.map((r) => `
        <tr>
          <td class="sku-cell" title="${esc(r[SKU_C.SKU])} — ${esc(r[SKU_C.NAME])}">
            <button type="button" class="link-sku-btn" data-open-sku="${esc(r[SKU_C.SKU])}">${esc(r[SKU_C.SKU])}</button> — ${esc(r[SKU_C.NAME])}
          </td>
          <td>${esc(r[SKU_C.BRAND])}</td>
          <td><span class="inv-badge ${statusBadgeClass(r[SKU_C.STATUS])}">${esc(r[SKU_C.STATUS])}</span></td>
          <td class="num">${fmtInt(r[SKU_C.S7D])}</td>
          <td class="num" style="color:#12D37A"><strong>${fmtInt(r[SKU_C.S30D])}</strong></td>
          <td class="num">${fmtInt(r[SKU_C.S90D])}</td>
          <td class="num">${fmtInt(r[SKU_C.S180D])}</td>
          <td class="num mono">${r[SKU_C.SDAYS] !== null ? r[SKU_C.SDAYS].toFixed(1) : "∞"}</td>
          <td class="num" style="color:#00E5FF">${fmtInt(r[SKU_C.INV_QTY])}</td>
          <td class="num"><strong>${fmtInt(r[SKU_C.INV_VAL])}</strong></td>
        </tr>`).join("");
      bindSkuSerialClicks();

      document.getElementById("invTableCountInfo").textContent =
        `Hiển thị ${fmtInt(start + 1)}–${fmtInt(Math.min(start + pageItems.length, list.length))} / ${fmtInt(list.length)} SKU (Tốc độ bán 7D–180D)`;
      renderInvPagination(totalPages);
      iv.lastExport = {
        headers: ["SKU", "SKU Name", "Brand", "Subcat 2", "Purchase Status", "Range", "7D Sales", "30D Sales", "90D Sales", "180D Sales", "Current S.Days", "Inv QTY", "Inv Value"],
        rows: list.map((r) => [r[SKU_C.SKU], r[SKU_C.NAME], r[SKU_C.BRAND], r[SKU_C.SUBCAT], r[SKU_C.STATUS], r[SKU_C.RANGE], r[SKU_C.S7D], r[SKU_C.S30D], r[SKU_C.S90D], r[SKU_C.S180D], r[SKU_C.SDAYS] ?? "", r[SKU_C.INV_QTY], r[SKU_C.INV_VAL]]),
        filename: `inventory_sku_velocity_${new Date().toISOString().slice(0, 10)}.csv`,
      };
      return;
    }

    // TAB 5: MASTER PRODUCT CATALOG (17,118 SKUs)
    if (iv.tableTab === "master") {
      const mp = state.raw?.masterProducts;
      if (!mp) {
        ensureLookupShardsLoaded();
        document.getElementById("invTableBody").innerHTML = `<tr><td colspan="9" class="muted">Đang tải danh mục 17.118 Master SKUs... vui lòng chờ 1 giây.</td></tr>`;
        return;
      }
      const mpL = mp.lookups;
      const catIdxSet = getLookupIdxSet(state.globalCat, mpL.categories);
      const subIdxSet = getLookupIdxSet(state.globalSubcat, mpL.subcats);
      let list = mp.rows.filter((r) => {
        if (catIdxSet && !catIdxSet.has(r[MP_C.CAT])) return false;
        if (subIdxSet && !subIdxSet.has(r[MP_C.SUBCAT])) return false;
        if (iv.status && !isMultiMatch(iv.status, mpL.purchaseStatuses[r[MP_C.STATUS]])) return false;
        if (iv.range && !isMultiMatch(iv.range, mpL.ranges[r[MP_C.RANGE]])) return false;
        if (iv.brand && !isMultiMatch(iv.brand, mpL.brands[r[MP_C.BRAND]])) return false;
        if (q) {
          return r[MP_C.SKU].toLowerCase().includes(q) || r[MP_C.NAME].toLowerCase().includes(q) || mpL.brands[r[MP_C.BRAND]].toLowerCase().includes(q);
        }
        return true;
      });

      const colMap = {
        sku: (r) => r[MP_C.SKU],
        brand: (r) => mpL.brands[r[MP_C.BRAND]],
        status: (r) => mpL.purchaseStatuses[r[MP_C.STATUS]],
        range: (r) => mpL.ranges[r[MP_C.RANGE]],
        listed: (r) => r[MP_C.LISTED_PRICE],
        s30d: (r) => r[MP_C.SALES_30D],
        qty: (r) => r[MP_C.INV_QTY],
        value: (r) => r[MP_C.INV_VAL],
      };
      const getter = colMap[iv.tableSortCol] || colMap.value;
      list.sort((a, b) => {
        const va = getter(a), vb = getter(b);
        return typeof va === "string" ? va.localeCompare(vb) * dir : (va - vb) * dir;
      });

      const totalPages = Math.max(1, Math.ceil(list.length / iv.tablePageSize));
      iv.tablePage = Math.min(iv.tablePage, totalPages);
      const start = (iv.tablePage - 1) * iv.tablePageSize;
      const pageItems = list.slice(start, start + iv.tablePageSize);

      renderInvTableHead([
        { key: "sku", label: "SKU — Sản phẩm" },
        { key: "brand", label: "Brand" },
        { key: "status", label: "TT Mua" },
        { key: "range", label: "Range" },
        { key: "listed", label: "Giá niêm yết", num: true },
        { key: "s30d", label: "30D Sales", num: true },
        { key: "qty", label: "Inv QTY", num: true },
        { key: "value", label: "Inv Value", num: true },
      ]);

      document.getElementById("invTableBody").innerHTML = pageItems.map((r) => {
        const st = mpL.purchaseStatuses[r[MP_C.STATUS]];
        return `
          <tr>
            <td class="sku-cell" title="${esc(r[MP_C.SKU])} — ${esc(r[MP_C.NAME])}">
              <button type="button" class="link-sku-btn" data-open-sku="${esc(r[MP_C.SKU])}">${esc(r[MP_C.SKU])}</button> — ${esc(r[MP_C.NAME])}
            </td>
            <td>${esc(mpL.brands[r[MP_C.BRAND]])}</td>
            <td><span class="inv-badge ${statusBadgeClass(st)}">${esc(st)}</span></td>
            <td class="mono">${esc(mpL.ranges[r[MP_C.RANGE]])}</td>
            <td class="num">${r[MP_C.LISTED_PRICE] ? fmtInt(r[MP_C.LISTED_PRICE]) : "—"}</td>
            <td class="num">${fmtInt(r[MP_C.SALES_30D])}</td>
            <td class="num" style="color:#00E5FF">${fmtInt(r[MP_C.INV_QTY])}</td>
            <td class="num"><strong>${fmtInt(r[MP_C.INV_VAL])}</strong></td>
          </tr>`;
      }).join("");
      bindSkuSerialClicks();

      document.getElementById("invTableCountInfo").textContent =
        `Hiển thị ${fmtInt(start + 1)}–${fmtInt(Math.min(start + pageItems.length, list.length))} / ${fmtInt(list.length)} SKU trong Master Product`;
      renderInvPagination(totalPages);
      iv.lastExport = {
        headers: ["SKU", "SKU Name", "Brand", "Subcat 2", "Listing", "Purchase Status", "Range", "Listed Price", "W.COGS", "30D Sales QTY", "Inv QTY", "Inv Value"],
        rows: list.map((r) => [r[MP_C.SKU], r[MP_C.NAME], mpL.brands[r[MP_C.BRAND]], mpL.subcats[r[MP_C.SUBCAT]], mpL.listings[r[MP_C.LISTING]], mpL.purchaseStatuses[r[MP_C.STATUS]], mpL.ranges[r[MP_C.RANGE]], r[MP_C.LISTED_PRICE], r[MP_C.WCOGS], r[MP_C.SALES_30D], r[MP_C.INV_QTY], r[MP_C.INV_VAL]]),
        filename: `master_product_filtered_${new Date().toISOString().slice(0, 10)}.csv`,
      };
      return;
    }

    // TAB 4: SUMMARY BY SITE
    if (iv.tableTab === "sites") {
      const map = new Map();
      rows.forEach((r) => {
        const code = lookups.sites[r[INV_C.SITE]];
        if (!map.has(code)) {
          map.set(code, {
            site: code,
            siteName: siteDirectory[code]?.siteName || lookups.siteNames[r[INV_C.SITE_NAME]],
            qty: 0, value: 0, sellVal: 0, dmgVal: 0, skus: new Set(), bins: 0,
          });
        }
        const m = map.get(code);
        m.qty += r[INV_C.QTY];
        m.value += r[INV_C.VALUE];
        m.skus.add(r[INV_C.SKU]);
        m.bins++;
        const bt = (lookups.binTypes[r[INV_C.BIN_TYPE]] || "").toLowerCase();
        if (bt.includes("bán mới")) m.sellVal += r[INV_C.VALUE];
        if (bt.includes("hư hỏng")) m.dmgVal += r[INV_C.VALUE];
      });

      let list = Array.from(map.values()).map((m) => ({
        ...m,
        skuCount: m.skus.size,
        dmgPct: m.value > 0 ? (m.dmgVal / m.value) * 100 : 0,
      }));
      if (q) list = list.filter((x) => x.site.toLowerCase().includes(q) || x.siteName.toLowerCase().includes(q));
      list.sort((a, b) => {
        const k = iv.tableSortCol;
        if (typeof a[k] === "string") return a[k].localeCompare(b[k]) * dir;
        return ((a[k] || 0) - (b[k] || 0)) * dir;
      });

      renderInvTableHead([
        { key: "site", label: "Site Code" },
        { key: "siteName", label: "Tên Kho / Cửa hàng" },
        { key: "skuCount", label: "Số SKU", num: true },
        { key: "qty", label: "Tổng QTY", num: true },
        { key: "value", label: "Tổng Giá trị (VND)", num: true },
        { key: "sellVal", label: "Bán mới (VND)", num: true },
        { key: "dmgVal", label: "Hư hỏng (VND)", num: true },
        { key: "dmgPct", label: "% Hư hỏng", num: true },
      ]);

      document.getElementById("invTableBody").innerHTML = list.map((m) => `
        <tr class="clickable" data-inv-site="${esc(m.site)}">
          <td class="mono"><strong>${esc(m.site)}</strong></td>
          <td>${esc(m.siteName)}</td>
          <td class="num">${fmtInt(m.skuCount)}</td>
          <td class="num" style="color:#00E5FF">${fmtInt(m.qty)}</td>
          <td class="num"><strong>${fmtInt(m.value)}</strong></td>
          <td class="num" style="color:#12D37A">${fmtInt(m.sellVal)}</td>
          <td class="num" style="color:#E53E51">${fmtInt(m.dmgVal)}</td>
          <td class="num">${fmtPct(m.dmgPct)}</td>
        </tr>`).join("");

      document.querySelectorAll("#invTableBody tr[data-inv-site]").forEach((tr) => {
        tr.addEventListener("click", (e) => {
          iv.site = toggleMultiVal(iv.site, tr.dataset.invSite, Boolean(e.ctrlKey || e.metaKey));
          syncMultiSelectUI("invFilterSite", iv.site);
          renderInventoryView();
        });
      });

      document.getElementById("invTableCountInfo").textContent = `Tổng hợp ${fmtInt(list.length)} kho / Site Code`;
      document.getElementById("invTablePagination").innerHTML = "";
      iv.lastExport = {
        headers: ["Site Code", "Site Name", "Unique SKUs", "Total QTY", "Total Value", "Sellable Value", "Damaged Value", "Damaged %"],
        rows: list.map((m) => [m.site, m.siteName, m.skuCount, m.qty, Math.round(m.value), Math.round(m.sellVal), Math.round(m.dmgVal), m.dmgPct.toFixed(1)]),
        filename: `inventory_by_site_${new Date().toISOString().slice(0, 10)}.csv`,
      };
      return;
    }

    // TAB 1: RAW SKU x BIN LEDGER
    let filtered = rows;
    if (q) {
      filtered = rows.filter((r) =>
        lookups.skus[r[INV_C.SKU]].toLowerCase().includes(q) ||
        lookups.sites[r[INV_C.SITE]].toLowerCase().includes(q) ||
        lookups.siteNames[r[INV_C.SITE_NAME]].toLowerCase().includes(q) ||
        lookups.binCodes[r[INV_C.BIN_CODE]].toLowerCase().includes(q) ||
        lookups.binTypes[r[INV_C.BIN_TYPE]].toLowerCase().includes(q) ||
        lookups.brands[r[INV_C.BRAND]].toLowerCase().includes(q)
      );
    }

    const colMap = {
      site: (r) => lookups.sites[r[INV_C.SITE]],
      sku: (r) => lookups.skus[r[INV_C.SKU]],
      binType: (r) => lookups.binTypes[r[INV_C.BIN_TYPE]],
      status: (r) => lookups.purchaseStatuses[r[INV_C.STATUS]],
      aging: (r) => (iv.agingBasis === "first" && r.length > INV_C.AGING_FIRST ? r[INV_C.AGING_FIRST] : r[INV_C.AGING]),
      qty: (r) => r[INV_C.QTY],
      unitCost: (r) => r[INV_C.UNIT_COST],
      value: (r) => r[INV_C.VALUE],
    };
    const getter = colMap[iv.tableSortCol] || colMap.value;
    const sorted = [...filtered].sort((a, b) => {
      const va = getter(a), vb = getter(b);
      return typeof va === "string" ? va.localeCompare(vb) * dir : (va - vb) * dir;
    });

    const totalPages = Math.max(1, Math.ceil(sorted.length / iv.tablePageSize));
    iv.tablePage = Math.min(iv.tablePage, totalPages);
    const start = (iv.tablePage - 1) * iv.tablePageSize;
    const pageRows = sorted.slice(start, start + iv.tablePageSize);

    renderInvTableHead([
      { key: "site", label: "Site" },
      { key: "sku", label: "SKU — Linh kiện" },
      { key: "binCode", label: "BIN Code", nosort: true },
      { key: "binType", label: "BIN Type" },
      { key: "status", label: "TT Mua" },
      { key: "qty", label: "QTY", num: true },
      { key: "unitCost", label: "Unit Cost", num: true },
      { key: "value", label: "Giá trị tồn (VND)", num: true },
    ]);

    document.getElementById("invTableBody").innerHTML = pageRows.map((r) => {
      const bt = lookups.binTypes[r[INV_C.BIN_TYPE]];
      const st = lookups.purchaseStatuses[r[INV_C.STATUS]];
      const skuLbl = lookups.skus[r[INV_C.SKU]];
      const skuCode = extractSkuCodeFromLabel(skuLbl);
      const skuRest = skuLbl.slice(skuCode.length);
      return `
        <tr>
          <td class="mono" title="${esc(lookups.siteNames[r[INV_C.SITE_NAME]])}"><strong>${esc(lookups.sites[r[INV_C.SITE]])}</strong></td>
          <td class="sku-cell" title="${esc(skuLbl)}">
            <button type="button" class="link-sku-btn" data-open-sku="${esc(skuCode)}">${esc(skuCode)}</button>${esc(skuRest)}
          </td>
          <td class="mono">${esc(lookups.binCodes[r[INV_C.BIN_CODE]])}</td>
          <td><span class="inv-badge ${binBadgeClass(bt)}">${esc(bt)}</span></td>
          <td><span class="inv-badge ${statusBadgeClass(st)}">${esc(st)}</span></td>
          <td class="num" style="color:#00E5FF">${fmtInt(r[INV_C.QTY])}</td>
          <td class="num">${fmtInt(r[INV_C.UNIT_COST])}</td>
          <td class="num"><strong>${fmtInt(r[INV_C.VALUE])}</strong></td>
        </tr>`;
    }).join("");
    bindSkuSerialClicks();

    document.getElementById("invTableCountInfo").textContent =
      `Hiển thị ${fmtInt(start + 1)}–${fmtInt(Math.min(start + pageRows.length, sorted.length))} / ${fmtInt(sorted.length)} dòng BIN • Click mã SKU để tra cứu 360°`;
    renderInvPagination(totalPages);

    iv.lastExport = {
      headers: ["Site Code", "Site Name", "SKU", "Subcat 2", "Brand", "BIN Code", "BIN Type", "BIN Zone", "Purchase Status", "Range", "Last Received Date", "First Received Date", "Aging Days", "Inventory QTY", "Unit Cost", "Inventory Value", "Net Value (Inc PP)"],
      rows: sorted.map((r) => [
        lookups.sites[r[INV_C.SITE]], lookups.siteNames[r[INV_C.SITE_NAME]], lookups.skus[r[INV_C.SKU]],
        lookups.subcats[r[INV_C.SUBCAT]], lookups.brands[r[INV_C.BRAND]], lookups.binCodes[r[INV_C.BIN_CODE]],
        lookups.binTypes[r[INV_C.BIN_TYPE]], lookups.binZones[r[INV_C.BIN_ZONE]], lookups.purchaseStatuses[r[INV_C.STATUS]],
        (lookups.ranges && lookups.ranges[r[INV_C.RANGE]]) || "No",
        r[INV_C.LAST_RECV], r[INV_C.FIRST_RECV], r[INV_C.AGING] >= 0 ? r[INV_C.AGING] : "", r[INV_C.QTY],
        r[INV_C.UNIT_COST], r[INV_C.VALUE], r[INV_C.NET_VALUE],
      ]),
      filename: `inventory_detail_filtered_${new Date().toISOString().slice(0, 10)}.csv`,
    };
  }

  function renderInvPagination(totalPages) {
    const pag = document.getElementById("invTablePagination");
    const iv = state.inv;
    pag.innerHTML = `
      <button class="page-btn" id="invPrevP" ${iv.tablePage <= 1 ? "disabled" : ""}>◀</button>
      <span class="mono" style="font-size:11px;color:#94A3B8">Trang ${iv.tablePage}/${totalPages}</span>
      <button class="page-btn" id="invNextP" ${iv.tablePage >= totalPages ? "disabled" : ""}>▶</button>`;
    pag.querySelector("#invPrevP").addEventListener("click", () => { if (iv.tablePage > 1) { iv.tablePage--; renderInvTable(getFilteredInvRows(), getFilteredSerialRows()); } });
    pag.querySelector("#invNextP").addEventListener("click", () => { if (iv.tablePage < totalPages) { iv.tablePage++; renderInvTable(getFilteredInvRows(), getFilteredSerialRows()); } });
  }

  // =========================================================================
  // 9. SKU / SERIAL 360° SEARCH INSPECTOR
  // =========================================================================
  function buildLookupIndexes() {
    const lk = state.lookup;
    lk.idxMaster.clear();
    lk.idxSkuVel.clear();
    lk.idxBranches.clear();
    lk.idxBins.clear();
    lk.idxSerialsBySku.clear();
    lk.idxSerialBySn.clear();
    lk.idxSalesBySku.clear();
    lk.idxPriceBySku.clear();

    if (!state.raw) return;

    if (state.raw.masterProducts?.rows) {
      state.raw.masterProducts.rows.forEach((r) => lk.idxMaster.set(r[MP_C.SKU], r));
    }
    if (state.raw.invSkuLevel?.rows) {
      state.raw.invSkuLevel.rows.forEach((r) => lk.idxSkuVel.set(r[SKU_C.SKU], r));
    }
    if (state.raw.invBranchLevel?.rows) {
      state.raw.invBranchLevel.rows.forEach((r) => {
        const sku = r[BR_C.SKU];
        if (!lk.idxBranches.has(sku)) lk.idxBranches.set(sku, []);
        lk.idxBranches.get(sku).push(r);
      });
    }
    if (state.raw.inventory?.rows) {
      const invL = state.raw.inventory.lookups;
      state.raw.inventory.rows.forEach((r) => {
        const sku = extractSkuCodeFromLabel(invL.skus[r[INV_C.SKU]]);
        if (!lk.idxBins.has(sku)) lk.idxBins.set(sku, []);
        lk.idxBins.get(sku).push(r);
      });
    }
    if (state.raw.invSerials?.rows) {
      state.raw.invSerials.rows.forEach((r) => {
        const sn = r[SN_C.SN];
        const sku = r[SN_C.SKU];
        lk.idxSerialBySn.set(sn.toLowerCase(), r);
        if (!lk.idxSerialsBySku.has(sku)) lk.idxSerialsBySku.set(sku, []);
        lk.idxSerialsBySku.get(sku).push(r);
      });
    }
    if (state.raw.masterProducts?.salesBySku) {
      Object.entries(state.raw.masterProducts.salesBySku).forEach(([sku, arr]) => {
        lk.idxSalesBySku.set(sku, {
          sales: arr[0] || 0,
          qty: arr[1] || 0,
          gp: arr[2] || 0,
          orders: arr[3] || 0,
        });
      });
    } else if (state.raw.rows && state.raw.lookups?.skus?.length > 1) {
      const sL = state.raw.lookups;
      state.raw.rows.forEach((r) => {
        const sku = extractSkuCodeFromLabel(sL.skus[r[C.SKU]]);
        if (!sku) return;
        const cur = lk.idxSalesBySku.get(sku) || { sales: 0, qty: 0, gp: 0, orders: 0 };
        cur.sales += r[C.SALES];
        cur.qty += r[C.QTY];
        cur.gp += r[C.GP];
        cur.orders += 1;
        lk.idxSalesBySku.set(sku, cur);
      });
    }
    if (state.raw.masterProducts?.priceBySku) {
      Object.entries(state.raw.masterProducts.priceBySku).forEach(([sku, arr]) => {
        if (Array.isArray(arr)) lk.idxPriceBySku.set(sku, arr);
      });
    }
  }

  function renderLookupQuickPicks() {
    const wrap = document.getElementById("lookupQuickPicks");
    if (!wrap || !state.raw) return;
    const picks = [];

    const matchesGlobalSku = (catStr, subStr) => {
      if (state.globalCat && !isMultiMatch(state.globalCat, catStr) && !hasMultiPrefix(state.globalCat, subStr)) return false;
      if (state.globalSubcat && !isMultiMatch(state.globalSubcat, subStr)) return false;
      return true;
    };

    // Top 2 SKUs by 30D sales velocity
    if (state.raw.invSkuLevel?.rows?.length) {
      const byVel = [...state.raw.invSkuLevel.rows]
        .filter((r) => matchesGlobalSku(r[SKU_C.CAT], r[SKU_C.SUBCAT]))
        .sort((a, b) => b[SKU_C.S30D] - a[SKU_C.S30D])
        .slice(0, 2);
      byVel.forEach((r) => picks.push({ label: `🔥 SKU ${r[SKU_C.SKU]} (${r[SKU_C.S30D]} bán/30D)`, sku: r[SKU_C.SKU], sn: "" }));
    }
    // 1 Very Bad Stock Serial
    if (state.raw.invSerials?.rows?.length) {
      const snL = state.raw.invSerials.lookups;
      const veryBad = state.raw.invSerials.rows.find((r) =>
        matchesGlobalSku(snL.categories?.[r[SN_C.CAT]], snL.subcats?.[r[SN_C.SUBCAT]]) &&
        snL.badComp[r[SN_C.BAD_COMP]] === "Tồn rất xấu"
      );
      if (veryBad) picks.push({ label: `🚨 Serial Rất xấu: ${veryBad[SN_C.SN]}`, sku: veryBad[SN_C.SKU], sn: veryBad[SN_C.SN] });
      const normalSn = state.raw.invSerials.rows.find((r) =>
        matchesGlobalSku(snL.categories?.[r[SN_C.CAT]], snL.subcats?.[r[SN_C.SUBCAT]]) &&
        snL.badComp[r[SN_C.BAD_COMP]] === "Tồn thông thường"
      );
      if (normalSn) picks.push({ label: `🏷️ Serial: ${normalSn[SN_C.SN]}`, sku: normalSn[SN_C.SKU], sn: normalSn[SN_C.SN] });
    }
    // 1 Market Shortage SKU from Master Product
    if (state.raw.masterProducts?.rows?.length) {
      const mpL = state.raw.masterProducts.lookups;
      const ms = state.raw.masterProducts.rows.find((r) =>
        matchesGlobalSku(mpL.categories?.[r[MP_C.CAT]], mpL.subcats?.[r[MP_C.SUBCAT]]) &&
        mpL.purchaseStatuses[r[MP_C.STATUS]] === "Market Shortage"
      );
      if (ms) picks.push({ label: `⚠️ Market Shortage: ${ms[MP_C.SKU]}`, sku: ms[MP_C.SKU], sn: "" });
    }

    wrap.innerHTML = `<span class="panel-hint">Gợi ý nhanh:</span>` + picks.map((p, idx) =>
      `<button type="button" class="quick-pick-btn" data-qp-idx="${idx}">${esc(p.label)}</button>`
    ).join("");
    wrap.querySelectorAll("[data-qp-idx]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const p = picks[Number(btn.dataset.qpIdx)];
        if (p) openSkuOrSerialInspector(p.sku, p.sn);
      });
    });
  }

  function searchSkuAndSerials(queryRaw) {
    const q = (queryRaw || "").trim().toLowerCase();
    if (!q) return [];
    if (!state.shardsLoaded) ensureLookupShardsLoaded();
    const results = [];
    const seenKeys = new Set();

    // 1. Exact or partial Serial matches first (high precision)
    if (state.raw?.invSerials?.rows) {
      const snL = state.raw.invSerials.lookups;
      const catIdxSet = getLookupIdxSet(state.globalCat, snL.categories);
      const subIdxSet = getLookupIdxSet(state.globalSubcat, snL.subcats);
      for (let i = 0; i < state.raw.invSerials.rows.length; i++) {
        const r = state.raw.invSerials.rows[i];
        if (catIdxSet && !catIdxSet.has(r[SN_C.CAT])) continue;
        if (subIdxSet && !subIdxSet.has(r[SN_C.SUBCAT])) continue;
        if (r[SN_C.SN].toLowerCase().includes(q)) {
          const k = `sn:${r[SN_C.SN]}`;
          if (seenKeys.has(k)) continue;
          seenKeys.add(k);
          results.push({
            kind: "serial",
            code: r[SN_C.SN],
            sku: r[SN_C.SKU],
            name: r[SN_C.SKU_NAME],
            badge: snL.badComp[r[SN_C.BAD_COMP]],
            badgeCls: badStockBadgeClass(snL.badComp[r[SN_C.BAD_COMP]]),
            extra: `${snL.sites[r[SN_C.SITE]]} • ${fmtCompactVnd(r[SN_C.INV_VAL])}`,
            score: r[SN_C.SN].toLowerCase() === q ? 100 : 80,
          });
          if (results.length >= 12) break;
        }
      }
    }

    // 2. SKU / Name matches across Master Product (17,118 SKUs)
    if (state.raw?.masterProducts?.rows) {
      const mpL = state.raw.masterProducts.lookups;
      const catIdxSet = getLookupIdxSet(state.globalCat, mpL.categories);
      const subIdxSet = getLookupIdxSet(state.globalSubcat, mpL.subcats);
      for (let i = 0; i < state.raw.masterProducts.rows.length; i++) {
        const r = state.raw.masterProducts.rows[i];
        if (catIdxSet && !catIdxSet.has(r[MP_C.CAT])) continue;
        if (subIdxSet && !subIdxSet.has(r[MP_C.SUBCAT])) continue;
        const skuLow = r[MP_C.SKU].toLowerCase();
        const nameLow = r[MP_C.NAME].toLowerCase();
        if (skuLow.includes(q) || nameLow.includes(q)) {
          const k = `sku:${r[MP_C.SKU]}`;
          if (seenKeys.has(k)) continue;
          seenKeys.add(k);
          const st = mpL.purchaseStatuses[r[MP_C.STATUS]];
          const hasInv = r[MP_C.INV_QTY] > 0;
          results.push({
            kind: "sku",
            code: r[MP_C.SKU],
            sku: r[MP_C.SKU],
            name: r[MP_C.NAME],
            badge: st,
            badgeCls: statusBadgeClass(st),
            extra: hasInv ? `Tồn ${fmtInt(r[MP_C.INV_QTY])} (${fmtCompactVnd(r[MP_C.INV_VAL])})` : "Tồn 0",
            score: (skuLow === q ? 95 : skuLow.startsWith(q) ? 75 : 50) + (hasInv ? 10 : 0),
          });
          if (results.length >= 25) break;
        }
      }
    } else if (state.raw?.invSkuLevel?.rows) {
      for (let i = 0; i < state.raw.invSkuLevel.rows.length; i++) {
        const r = state.raw.invSkuLevel.rows[i];
        if (state.globalCat && r[SKU_C.CAT] && !isMultiMatch(state.globalCat, r[SKU_C.CAT])) continue;
        if (state.globalSubcat && !isMultiMatch(state.globalSubcat, r[SKU_C.SUBCAT])) continue;
        if (r[SKU_C.SKU].toLowerCase().includes(q) || r[SKU_C.NAME].toLowerCase().includes(q)) {
          results.push({
            kind: "sku",
            code: r[SKU_C.SKU],
            sku: r[SKU_C.SKU],
            name: r[SKU_C.NAME],
            badge: r[SKU_C.STATUS],
            badgeCls: statusBadgeClass(r[SKU_C.STATUS]),
            extra: `Tồn ${fmtInt(r[SKU_C.INV_QTY])}`,
            score: 70,
          });
          if (results.length >= 20) break;
        }
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, 15);
  }

  function openSkuOrSerialInspector(sku, serial = "") {
    if (state.activeView !== "lookup") switchView("lookup");
    const inp = document.getElementById("lookupSearchInput");
    if (inp) inp.value = serial || sku;
    document.getElementById("lookupSuggestions")?.classList.add("hidden");
    renderLookupProfile(sku, serial);
  }

  function renderLookupProfile(skuCode, serialNum = "", keepPages = false) {
    const lk = state.lookup;
    const skuChanged = lk.selectedSku !== skuCode;
    if (!keepPages || skuChanged) {
      lk.serialPage = 1;
      lk.binPage = 1;
    }
    if (skuChanged) {
      lk.expandedSites.clear();
    }
    lk.selectedSku = skuCode;
    lk.selectedSerial = serialNum;

    const emptyEl = document.getElementById("lookupEmptyState");
    const resEl = document.getElementById("lookupResultPane");
    if (!skuCode) {
      emptyEl?.classList.remove("hidden");
      resEl?.classList.add("hidden");
      return;
    }

    const mpRow = lk.idxMaster.get(skuCode) || null;
    const mpL = state.raw?.masterProducts?.lookups;
    const velRow = lk.idxSkuVel.get(skuCode) || null;
    const branchRows = lk.idxBranches.get(skuCode) || [];
    const brL = state.raw?.invBranchLevel?.lookups;
    const binRows = lk.idxBins.get(skuCode) || [];
    const invL = state.raw?.inventory?.lookups;
    const invSiteDir = state.raw?.inventory?.siteDirectory || {};
    const serialRows = lk.idxSerialsBySku.get(skuCode) || [];
    const snL = state.raw?.invSerials?.lookups;
    const salesAgg = lk.idxSalesBySku.get(skuCode) || { sales: 0, qty: 0, gp: 0, orders: 0 };

    emptyEl?.classList.add("hidden");
    resEl?.classList.remove("hidden");

    // 1. SERIAL SPOTLIGHT CARD
    const snCard = document.getElementById("lookupSerialCard");
    const matchedSn = serialNum ? lk.idxSerialBySn.get(serialNum.toLowerCase()) : null;
    if (matchedSn && snL) {
      snCard.classList.remove("hidden");
      const bc = snL.badComp[matchedSn[SN_C.BAD_COMP]];
      const bs = snL.badSite[matchedSn[SN_C.BAD_SITE]];
      document.getElementById("lkSnCode").textContent = matchedSn[SN_C.SN];
      const bCompEl = document.getElementById("lkSnBadCompBadge");
      bCompEl.className = `inv-badge ${badStockBadgeClass(bc)}`;
      bCompEl.textContent = `Cty: ${bc}`;
      const bSiteEl = document.getElementById("lkSnBadSiteBadge");
      bSiteEl.className = `inv-badge ${badStockBadgeClass(bs)}`;
      bSiteEl.textContent = `Site: ${bs}`;

      const kv = [
        ["Kho / Site Code", `${snL.sites[matchedSn[SN_C.SITE]]} (${invSiteDir[snL.sites[matchedSn[SN_C.SITE]]]?.siteName || ""})`],
        ["Vị trí BIN", `${snL.locations[matchedSn[SN_C.LOC]]} • ${snL.binTypes[matchedSn[SN_C.BIN_TYPE]]}`],
        ["BIN Zone", snL.binZones[matchedSn[SN_C.BIN_ZONE]]],
        ["Nhà cung cấp (NCC)", snL.suppliers[matchedSn[SN_C.SUPPLIER]]],
        ["Ngày nhập đầu / cuối", `${matchedSn[SN_C.FIRST_DATE] || "—"} / ${matchedSn[SN_C.LAST_DATE] || "—"}`],
        ["Tuổi tồn Cty / Site", `${matchedSn[SN_C.AGING_COMP]} ngày / ${matchedSn[SN_C.AGING_SITE]} ngày`],
        ["Stock Day (Cty / Site)", `${matchedSn[SN_C.SDAY_COMP]} ngày / ${matchedSn[SN_C.SDAY_SITE]} ngày`],
        ["Giá trị tồn / PP", `${fmtVndFull(matchedSn[SN_C.INV_VAL])} (Net: ${fmtVndFull(matchedSn[SN_C.NET_VAL])})`],
      ];
      document.getElementById("lkSerialGrid").innerHTML = kv.map(([l, v]) => `
        <div class="lookup-kv">
          <span class="lookup-kv-lbl">${esc(l)}</span>
          <span class="lookup-kv-val mono">${esc(v)}</span>
        </div>`).join("");
    } else {
      snCard.classList.add("hidden");
    }

    // 2. SKU MASTER HEADER & METADATA
    const skuName = (mpRow ? mpRow[MP_C.NAME] : "") || (velRow ? velRow[SKU_C.NAME] : "") || (serialRows[0]?.[SN_C.SKU_NAME] || "Không rõ tên");
    const brand = (mpRow ? mpL.brands[mpRow[MP_C.BRAND]] : "") || (velRow ? velRow[SKU_C.BRAND] : "Khác");
    const subcat = (mpRow ? mpL.subcats[mpRow[MP_C.SUBCAT]] : "") || (velRow ? velRow[SKU_C.SUBCAT] : "Khác");
    const subcat3 = mpRow ? mpL.subcat3s[mpRow[MP_C.SUBCAT3]] : "";
    const status = (mpRow ? mpL.purchaseStatuses[mpRow[MP_C.STATUS]] : "") || (velRow ? velRow[SKU_C.STATUS] : "Normal");
    const rng = (mpRow ? mpL.ranges[mpRow[MP_C.RANGE]] : "") || (velRow ? velRow[SKU_C.RANGE] : "No");
    const listing = mpRow ? mpL.listings[mpRow[MP_C.LISTING]] : "active";
    const hasSerial = mpRow ? (mpRow[MP_C.HAS_SERIAL] ? "Quản lý Serial: Có" : "Không Serial") : "";

    document.getElementById("lkSkuCode").textContent = `SKU: ${skuCode}`;
    const stEl = document.getElementById("lkSkuStatusBadge");
    stEl.className = `inv-badge ${statusBadgeClass(status)}`;
    stEl.textContent = `TT Mua: ${status}`;

    const rngEl = document.getElementById("lkSkuRangeBadge");
    const isRangeYes = String(rng || "").toLowerCase() === "yes";
    rngEl.className = `inv-badge ${isRangeYes ? "range-yes" : "range-no"}`;
    rngEl.textContent = `Range: ${rng}`;

    const listEl = document.getElementById("lkSkuListingBadge");
    const isListingActive = String(listing || "").toLowerCase() === "active";
    listEl.className = `inv-badge ${isListingActive ? "listing-active" : "listing-inactive"}`;
    listEl.textContent = `Listing: ${listing}`;

    const serFlagEl = document.getElementById("lkSkuSerialFlag");
    const hasSerialBool = mpRow ? Boolean(mpRow[MP_C.HAS_SERIAL]) : serialRows.length > 0;
    serFlagEl.className = `inv-badge ${hasSerialBool ? "serial-yes" : "serial-no"}`;
    serFlagEl.textContent = hasSerial || (serialRows.length > 0 ? `Quản lý Serial: Có (${serialRows.length} SN)` : "Không Serial");

    document.getElementById("lkSkuName").textContent = skuName;
    document.getElementById("lkSkuMetaLine").textContent = `Brand: ${brand} • Subcat 2: ${subcat}${subcat3 ? ` • Subcat 3: ${subcat3}` : ""}`;

    const warBox = document.getElementById("lkWarrantyBox");
    if (mpRow) {
      const wMo = mpRow[MP_C.WARRANTY_MO];
      const wNote = mpRow[MP_C.WARRANTY_NOTE];
      const promoAlert = mpL.promoAlerts[mpRow[MP_C.PROMO]] || "";
      warBox.innerHTML =
        `<div><strong>Bảo hành:</strong> ${wMo ? `${wMo} tháng` : "Không rõ"}${wNote ? ` — ${esc(wNote)}` : ""}</div>` +
        (promoAlert ? `<div style="margin-top:3px;color:#94A3B8"><strong>Promo:</strong> ${esc(promoAlert)}</div>` : "");
    } else {
      warBox.innerHTML = `<div class="muted">Không có dòng trong Master Product</div>`;
    }

    // 3. 6 SUMMARY KPI CARDS
    const invQty = velRow ? velRow[SKU_C.INV_QTY] : (binRows.reduce((s, r) => s + r[INV_C.QTY], 0) || (mpRow ? mpRow[MP_C.INV_QTY] : 0));
    const invVal = velRow ? velRow[SKU_C.INV_VAL] : (binRows.reduce((s, r) => s + r[INV_C.VALUE], 0) || (mpRow ? mpRow[MP_C.INV_VAL] : 0));
    const s7 = velRow ? velRow[SKU_C.S7D] : 0;
    const s30 = velRow ? velRow[SKU_C.S30D] : (mpRow ? mpRow[MP_C.SALES_30D] : 0);
    const s90 = velRow ? velRow[SKU_C.S90D] : 0;
    const s180 = velRow ? velRow[SKU_C.S180D] : 0;
    const sDays = velRow && velRow[SKU_C.SDAYS] !== null ? `${velRow[SKU_C.SDAYS].toFixed(1)} ngày` : (invQty > 0 ? "∞ (Chưa bán)" : "0 ngày");
    const badSnCount = snL ? serialRows.filter((sr) => sr[SN_C.IN_BAD_FILE] && snL.badComp[sr[SN_C.BAD_COMP]] !== "Tồn thông thường").length : 0;
    const maxAging = serialRows.length ? Math.max(...serialRows.map((sr) => sr[SN_C.AGING_COMP])) : (binRows.length ? Math.max(...binRows.map((b) => b[INV_C.AGING])) : -1);

    const kpiItems = [
      { cls: "accent-blue", lbl: "Tổng Tồn kho (QTY / VND)", val: `${fmtInt(invQty)} units`, sub: fmtVndFull(invVal) },
      { cls: "accent-emerald", lbl: "Bán 7D / 30D (SKU Level)", val: `${fmtInt(s7)} / ${fmtInt(s30)}`, sub: `90D: ${fmtInt(s90)} • 180D: ${fmtInt(s180)}` },
      { cls: "accent-cyan", lbl: "Số ngày tồn (Current S.Days)", val: sDays, sub: `Tốc độ TB: ${(s30 / 30).toFixed(2)} sp/ngày` },
      { cls: "accent-amber", lbl: "Serial tồn / Bad Stock", val: `${fmtInt(serialRows.length)} SN`, sub: badSnCount > 0 ? `⚠️ ${badSnCount} SN Bad Stock` : "✓ 0 SN Bad Stock" },
      { cls: "accent-crimson", lbl: "Tuổi tồn lớn nhất", val: maxAging >= 0 ? `${fmtInt(maxAging)} ngày` : "—", sub: `${branchRows.length || binRows.length} chi nhánh / BIN` },
      { cls: "accent-violet", lbl: "Doanh thu YTD 2026", val: fmtCompactVnd(salesAgg.sales), sub: `${fmtInt(salesAgg.qty)} QTY • GP ${fmtCompactVnd(salesAgg.gp)}` },
    ];
    document.getElementById("lkSummaryKpis").innerHTML = kpiItems.map((k) => `
      <div class="inv-kpi-card ${k.cls}">
        <div class="inv-kpi-lbl">${esc(k.lbl)}</div>
        <div class="inv-kpi-val mono">${esc(k.val)}</div>
        <div class="inv-kpi-sub mono">${esc(k.sub)}</div>
      </div>`).join("");

    // 4. PRICING & MARGIN STRIP (+ BAO_CAO_QUAN_LY_GIA NORMAL SELLING PRICE & ACTIVE DATE)
    const listedP = (mpRow ? mpRow[MP_C.LISTED_PRICE] : 0) || (velRow ? velRow[SKU_C.LISTED_PRICE] : 0);
    const unitCost = (velRow ? velRow[SKU_C.UNIT_COST] : 0) || (binRows[0]?.[INV_C.UNIT_COST] || 0);
    const wcogs = mpRow ? mpRow[MP_C.WCOGS] : 0;
    const lastPur = mpRow ? mpRow[MP_C.LAST_PUR] : 0;
    const latestQ = mpRow ? mpRow[MP_C.LATEST_QUOTE] : 0;
    const tempGm = mpRow && mpRow[MP_C.TEMP_GM] !== null ? `${mpRow[MP_C.TEMP_GM].toFixed(1)}%` : "—";

    const fmtIsoDmy = (iso) => {
      if (!iso || typeof iso !== "string") return "";
      const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
    };
    const nowDt = new Date();
    const todayIso = `${nowDt.getFullYear()}-${String(nowDt.getMonth() + 1).padStart(2, "0")}-${String(nowDt.getDate()).padStart(2, "0")}`;

    const priceRec = lk.idxPriceBySku.get(skuCode) || null;
    const curNormalP = priceRec ? Number(priceRec[0] || 0) : 0;
    const newNormalP = priceRec ? Number(priceRec[1] || 0) : 0;
    const activeDateIso = priceRec ? String(priceRec[2] || "") : "";
    const newPromoP = priceRec ? Number(priceRec[3] || 0) : 0;
    const isNewActive = newNormalP > 0 && Boolean(activeDateIso) && activeDateIso <= todayIso;
    const isNewUpcoming = newNormalP > 0 && Boolean(activeDateIso) && activeDateIso > todayIso;
    const normalEffectiveP = isNewActive ? newNormalP : curNormalP;
    // Priority 1: New promotion price (if > 0), fallback to Normal selling price order
    const currentSellingP = newPromoP > 0 ? newPromoP : normalEffectiveP;

    const alertBox = document.getElementById("lkPriceAlertBox");
    if (alertBox) {
      if (isNewUpcoming) {
        const diff = newNormalP - curNormalP;
        const pct = curNormalP > 0 ? (diff / curNormalP) * 100 : 0;
        const daysLeft = Math.max(
          1,
          Math.round((new Date(`${activeDateIso}T00:00:00`) - new Date(`${todayIso}T00:00:00`)) / 86400000)
        );
        const dirCls = diff > 0 ? "is-increase" : diff < 0 ? "is-decrease" : "is-neutral";
        const dirLabel = diff > 0 ? "TĂNG GIÁ NIÊM YẾT THƯỜNG" : diff < 0 ? "GIẢM GIÁ NIÊM YẾT THƯỜNG" : "CẬP NHẬT GIÁ";
        const dirIcon = diff > 0 ? "📈" : diff < 0 ? "📉" : "🔄";
        const sign = diff > 0 ? "+" : "";
        const diffStr = curNormalP > 0 ? `${sign}${fmtVndFull(diff)} (${sign}${pct.toFixed(1)}%)` : "";
        alertBox.className = `lookup-price-alert ${dirCls}`;
        alertBox.innerHTML = `
          <div class="lpa-left">
            <span class="lpa-badge">${dirIcon} ${dirLabel}</span>
            <span class="lpa-msg">
              Giá Normal mới <strong class="mono">${esc(fmtVndFull(newNormalP))}</strong> sẽ có hiệu lực từ ngày
              <strong class="mono">${esc(fmtIsoDmy(activeDateIso))}</strong>
              <span class="lpa-days">(còn ${fmtInt(daysLeft)} ngày)</span>
            </span>
          </div>
          <div class="lpa-right mono">
            ${curNormalP > 0 ? `<span class="lpa-old">Normal hiện tại: ${esc(fmtVndFull(curNormalP))}</span>` : ""}
            ${diffStr ? `<span class="lpa-delta">${esc(diffStr)}</span>` : ""}
          </div>`;
      } else {
        alertBox.className = "lookup-price-alert hidden";
        alertBox.innerHTML = "";
      }
    }

    const subParts = [];
    if (newPromoP > 0) {
      subParts.push(
        normalEffectiveP > 0 && newPromoP !== normalEffectiveP
          ? `🏷️ Giá KM • Normal: ${fmtVndFull(normalEffectiveP)}`
          : `🏷️ Giá KM (New Promo)`
      );
    } else if (isNewActive) {
      subParts.push(`Đã hiệu lực từ ${fmtIsoDmy(activeDateIso)}` + (curNormalP && curNormalP !== newNormalP ? ` • Cũ: ${fmtVndFull(curNormalP)}` : ""));
    }
    if (isNewUpcoming) {
      const diff = newNormalP - curNormalP;
      const tag = diff > 0 ? "Tăng" : diff < 0 ? "Giảm" : "Đổi";
      subParts.push(`${tag} Normal → ${fmtVndFull(newNormalP)} (${fmtIsoDmy(activeDateIso)})`);
    }
    const curPriceSub = subParts.join(" • ");

    const priceItems = [
      {
        lbl: "Giá bán hiện tại (VAT)",
        val: currentSellingP ? fmtVndFull(currentSellingP) : "—",
        sub: curPriceSub,
        highlight: Boolean(currentSellingP),
      },
      { lbl: "Giá niêm yết (Listed)", val: listedP ? fmtVndFull(listedP) : "—" },
      { lbl: "Unit Cost tồn kho", val: unitCost ? fmtVndFull(unitCost) : "—" },
      { lbl: "W.COGS No VAT", val: wcogs ? fmtVndFull(wcogs) : "—" },
      { lbl: "Giá nhập gần nhất", val: lastPur ? fmtVndFull(lastPur) : "—" },
      { lbl: "Báo giá mới nhất", val: latestQ ? fmtVndFull(latestQ) : "—" },
      { lbl: "Temporary GM (%)", val: tempGm },
    ];
    document.getElementById("lkPriceStrip").innerHTML = priceItems.map((p) => `
      <div class="lookup-kv ${p.highlight ? "is-price-highlight" : ""}">
        <span class="lookup-kv-lbl">${esc(p.lbl)}</span>
        <span class="lookup-kv-val mono">${esc(p.val)}</span>
        ${p.sub ? `<span class="lookup-kv-sub mono">${esc(p.sub)}</span>` : ""}
      </div>`).join("");

    // 5. VELOCITY CHART (7D -> 30D -> 90D -> 180D)
    if (charts.lookupVelocity) {
      const periods = ["7 ngày (7D)", "30 ngày (30D)", "90 ngày (90D)", "180 ngày (180D)"];
      const vals = [s7, s30, s90, s180];
      const dailyRates = [
        Number((s7 / 7).toFixed(2)),
        Number((s30 / 30).toFixed(2)),
        Number((s90 / 90).toFixed(2)),
        Number((s180 / 180).toFixed(2)),
      ];
      charts.lookupVelocity.clear();
      charts.lookupVelocity.setOption({
        tooltip: {
          trigger: "axis",
          backgroundColor: COLORS.tooltipBg,
          borderColor: COLORS.tooltipBorder,
          textStyle: { color: "#F1F5F9", fontSize: 12 },
        },
        legend: { bottom: 0, textStyle: { color: COLORS.textMuted, fontSize: 10.5 } },
        grid: { top: 20, left: 44, right: 44, bottom: 38 },
        xAxis: {
          type: "category",
          data: periods,
          axisLine: { lineStyle: { color: COLORS.axisLine } },
          axisLabel: { color: COLORS.textSub, fontSize: 11 },
        },
        yAxis: [
          {
            type: "value",
            name: "QTY",
            nameTextStyle: { color: COLORS.axisLabel, fontSize: 10 },
            splitLine: { lineStyle: { color: COLORS.gridLine } },
            axisLabel: { color: COLORS.axisLabel, fontSize: 10, fontFamily: "JetBrains Mono" },
          },
          {
            type: "value",
            name: "sp/ngày",
            nameTextStyle: { color: "#F59E0B", fontSize: 10 },
            splitLine: { show: false },
            axisLabel: { color: "#F59E0B", fontSize: 10, fontFamily: "JetBrains Mono" },
          },
        ],
        series: [
          {
            name: "Sales QTY",
            type: "bar",
            yAxisIndex: 0,
            barMaxWidth: 42,
            label: { show: true, position: "top", color: "#fff", fontFamily: "JetBrains Mono", fontSize: 11 },
            itemStyle: {
              borderRadius: [4, 4, 0, 0],
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: "#00E5FF" },
                { offset: 1, color: "#1068DF" },
              ]),
            },
            data: vals,
          },
          {
            name: "Bình quân / ngày",
            type: "line",
            yAxisIndex: 1,
            smooth: true,
            symbolSize: 8,
            itemStyle: { color: "#F59E0B" },
            lineStyle: { color: "#F59E0B", width: 2.5 },
            data: dailyRates,
          },
        ],
      });
      setTimeout(() => charts.lookupVelocity?.resize(), 30);
    }

    // 6. BRANCH LEVEL BREAKDOWN TABLE
    document.getElementById("lkBranchCountInfo").textContent = `${fmtInt(branchRows.length)} chi nhánh có tồn/doanh số`;
    const brBody = document.getElementById("lkBranchTableBody");
    if (branchRows.length && brL) {
      brBody.innerHTML = [...branchRows]
        .sort((a, b) => b[BR_C.INV_VAL] - a[BR_C.INV_VAL])
        .map((r) => `
          <tr>
            <td class="mono"><strong>${esc(brL.sites[r[BR_C.SITE]])}</strong></td>
            <td>${esc(brL.siteNames[r[BR_C.SITE_NAME]])}</td>
            <td class="num" style="color:#00E5FF">${fmtInt(r[BR_C.INV_QTY])}</td>
            <td class="num"><strong>${fmtInt(r[BR_C.INV_VAL])}</strong></td>
            <td class="num">${fmtInt(r[BR_C.S7D])}</td>
            <td class="num" style="color:#12D37A"><strong>${fmtInt(r[BR_C.S30D])}</strong></td>
            <td class="num">${fmtInt(r[BR_C.S90D])}</td>
            <td class="num">${fmtInt(r[BR_C.S180D])}</td>
            <td class="num mono">${r[BR_C.SDAYS] !== null ? r[BR_C.SDAYS].toFixed(1) : "∞"}</td>
          </tr>`).join("");
    } else {
      brBody.innerHTML = `<tr><td colspan="9" class="muted">SKU này hiện không có dòng tồn/bán trong Inventory_Branch_Level.</td></tr>`;
    }

    // 7. SERIAL & BAD STOCK TABLE FOR THIS SKU (Paginated: 20 rows/page)
    const pageSize = lk.pageSize || 20;
    const snBody = document.getElementById("lkSerialTableBody");
    const snPag = document.getElementById("lkSerialPagination");
    if (serialRows.length && snL) {
      const sortedSn = [...serialRows].sort((a, b) => {
        if (serialNum && a[SN_C.SN].toLowerCase() === serialNum.toLowerCase()) return -1;
        if (serialNum && b[SN_C.SN].toLowerCase() === serialNum.toLowerCase()) return 1;
        return b[SN_C.AGING_COMP] - a[SN_C.AGING_COMP];
      });
      const totalSnPages = Math.max(1, Math.ceil(sortedSn.length / pageSize));
      lk.serialPage = Math.min(Math.max(1, lk.serialPage || 1), totalSnPages);
      const snStart = (lk.serialPage - 1) * pageSize;
      const pageSnRows = sortedSn.slice(snStart, snStart + pageSize);

      document.getElementById("lkSerialListInfo").textContent =
        `Hiển thị ${fmtInt(snStart + 1)}–${fmtInt(Math.min(snStart + pageSnRows.length, sortedSn.length))} / ${fmtInt(sortedSn.length)} Serial đang tồn (${fmtInt(badSnCount)} Bad Stock rủi ro)`;

      snBody.innerHTML = pageSnRows.map((r) => {
        const isHl = serialNum && r[SN_C.SN].toLowerCase() === serialNum.toLowerCase();
        const bt = snL.binTypes[r[SN_C.BIN_TYPE]];
        const bc = snL.badComp[r[SN_C.BAD_COMP]];
        const bs = snL.badSite[r[SN_C.BAD_SITE]];
        const ac = r[SN_C.AGING_COMP];
        const ageCls = ac < 0 ? "" : ac <= 90 ? "fresh" : ac <= 180 ? "mid" : "old";
        return `
          <tr class="${isHl ? "row-highlight" : ""}">
            <td class="mono"><button type="button" class="link-sku-btn" data-sn-focus="${esc(r[SN_C.SN])}">${esc(r[SN_C.SN])}</button></td>
            <td class="mono"><strong>${esc(snL.sites[r[SN_C.SITE]])}</strong></td>
            <td class="mono">${esc(snL.locations[r[SN_C.LOC]])}</td>
            <td><span class="inv-badge ${binBadgeClass(bt)}">${esc(bt)}</span></td>
            <td>${esc(snL.suppliers[r[SN_C.SUPPLIER]])}</td>
            <td class="mono">${esc(r[SN_C.FIRST_DATE] || "—")} / ${esc(r[SN_C.LAST_DATE] || "—")}</td>
            <td class="num"><span class="aging-tag ${ageCls}">${ac >= 0 ? fmtInt(ac) + "d" : "—"}</span></td>
            <td class="num mono">${r[SN_C.AGING_SITE] >= 0 ? fmtInt(r[SN_C.AGING_SITE]) + "d" : "—"}</td>
            <td><span class="inv-badge ${badStockBadgeClass(bc)}">${esc(bc)}</span></td>
            <td><span class="inv-badge ${badStockBadgeClass(bs)}">${esc(bs)}</span></td>
            <td class="num mono">${r[SN_C.SDAY_COMP] || "—"}</td>
            <td class="num"><strong>${fmtInt(r[SN_C.INV_VAL])}</strong></td>
          </tr>`;
      }).join("");
      snBody.querySelectorAll("[data-sn-focus]").forEach((b) => {
        b.addEventListener("click", () => renderLookupProfile(skuCode, b.dataset.snFocus, false));
      });
      if (snPag) {
        snPag.innerHTML = `
          <button class="page-btn" id="lkSnPrevP" ${lk.serialPage <= 1 ? "disabled" : ""}>◀</button>
          <span class="mono" style="font-size:11px;color:var(--text-secondary)">Trang ${lk.serialPage}/${totalSnPages}</span>
          <button class="page-btn" id="lkSnNextP" ${lk.serialPage >= totalSnPages ? "disabled" : ""}>▶</button>`;
        snPag.querySelector("#lkSnPrevP")?.addEventListener("click", () => {
          if (lk.serialPage > 1) { lk.serialPage--; renderLookupProfile(skuCode, serialNum, true); }
        });
        snPag.querySelector("#lkSnNextP")?.addEventListener("click", () => {
          if (lk.serialPage < totalSnPages) { lk.serialPage++; renderLookupProfile(skuCode, serialNum, true); }
        });
      }
    } else {
      document.getElementById("lkSerialListInfo").textContent = "0 Serial đang tồn";
      snBody.innerHTML = `<tr><td colspan="12" class="muted">Không có Serial nào đang tồn cho SKU này.</td></tr>`;
      if (snPag) snPag.innerHTML = "";
    }

    // 8. SITE-LEVEL PIVOT TABLE (CLICK SITE TO EXPAND SERIALS IN THAT SITE)
    const binBody = document.getElementById("lkBinTableBody");
    const binPag = document.getElementById("lkBinPagination");
    const expandAllBtn = document.getElementById("lkSiteExpandAllBtn");

    // Auto-expand the site containing the focused Serial Number
    if (matchedSn && snL && !keepPages) {
      const snSite = snL.sites[matchedSn[SN_C.SITE]];
      if (snSite) lk.expandedSites.add(snSite);
    }

    // Aggregate BIN rows, Serial rows, and Branch velocity by Site Code
    const siteMap = new Map();
    const getOrCreateSite = (siteCode, fallbackName = "") => {
      if (!siteMap.has(siteCode)) {
        siteMap.set(siteCode, {
          site: siteCode,
          siteName: invSiteDir[siteCode]?.siteName || fallbackName || "",
          binQty: 0,
          binVal: 0,
          binCodes: new Set(),
          binZones: new Set(),
          lastRecv: "",
          bins: [],
          serials: [],
          snVal: 0,
          badSnCount: 0,
          agingSiteSum: 0,
          agingSiteCnt: 0,
          maxAgingSite: -1,
          s7d: null,
          s30d: null,
        });
      }
      const obj = siteMap.get(siteCode);
      if (!obj.siteName && fallbackName) obj.siteName = fallbackName;
      return obj;
    };

    if (binRows.length && invL) {
      binRows.forEach((r) => {
        const sc = invL.sites[r[INV_C.SITE]] || "—";
        const sn = invL.siteNames[r[INV_C.SITE_NAME]] || "";
        const rec = getOrCreateSite(sc, sn);
        rec.binQty += Number(r[INV_C.QTY] || 0);
        rec.binVal += Number(r[INV_C.VALUE] || 0);
        const bc = invL.binCodes[r[INV_C.BIN_CODE]];
        if (bc) rec.binCodes.add(bc);
        const bz = invL.binZones[r[INV_C.BIN_ZONE]];
        if (bz) rec.binZones.add(bz);
        const lr = r[INV_C.LAST_RECV] || "";
        if (lr && lr > rec.lastRecv) rec.lastRecv = lr;
        rec.bins.push(r);
      });
    }

    if (serialRows.length && snL) {
      serialRows.forEach((r) => {
        const sc = snL.sites[r[SN_C.SITE]] || "—";
        const rec = getOrCreateSite(sc);
        rec.serials.push(r);
        rec.snVal += Number(r[SN_C.INV_VAL] || 0);
        const loc = snL.locations[r[SN_C.LOC]];
        if (loc) rec.binCodes.add(loc);
        const bz = snL.binZones[r[SN_C.BIN_ZONE]];
        if (bz) rec.binZones.add(bz);
        const ld = r[SN_C.LAST_DATE] || "";
        if (ld && ld > rec.lastRecv) rec.lastRecv = ld;
        const agS = Number(r[SN_C.AGING_SITE]);
        if (Number.isFinite(agS) && agS >= 0) {
          rec.agingSiteSum += agS;
          rec.agingSiteCnt += 1;
          if (agS > rec.maxAgingSite) rec.maxAgingSite = agS;
        }
        const bcLabel = snL.badComp[r[SN_C.BAD_COMP]];
        if (r[SN_C.IN_BAD_FILE] && (bcLabel === "Tồn xấu" || bcLabel === "Tồn rất xấu")) {
          rec.badSnCount += 1;
        }
      });
    }

    if (branchRows.length && brL) {
      branchRows.forEach((r) => {
        const sc = brL.sites[r[BR_C.SITE]];
        if (!sc || !siteMap.has(sc)) return;
        const rec = siteMap.get(sc);
        if (!rec.siteName) rec.siteName = brL.siteNames[r[BR_C.SITE_NAME]] || "";
        rec.s7d = (rec.s7d || 0) + Number(r[BR_C.S7D] || 0);
        rec.s30d = (rec.s30d || 0) + Number(r[BR_C.S30D] || 0);
      });
    }

    const siteList = Array.from(siteMap.values()).sort((a, b) => {
      const qa = a.binQty || a.serials.length;
      const qb = b.binQty || b.serials.length;
      if (qb !== qa) return qb - qa;
      return (b.binVal || b.snVal) - (a.binVal || a.snVal);
    });

    if (siteList.length) {
      const totalSitePages = Math.max(1, Math.ceil(siteList.length / pageSize));
      lk.binPage = Math.min(Math.max(1, lk.binPage || 1), totalSitePages);
      const sStart = (lk.binPage - 1) * pageSize;
      const pageSites = siteList.slice(sStart, sStart + pageSize);

      document.getElementById("lkBinListInfo").textContent =
        `Hiển thị ${fmtInt(sStart + 1)}–${fmtInt(Math.min(sStart + pageSites.length, siteList.length))} / ${fmtInt(siteList.length)} Site có tồn • ${fmtInt(serialRows.length)} Serial — Click dòng Site để xổ Pivot Serial`;

      const allPageExpanded = pageSites.every((s) => lk.expandedSites.has(s.site));
      if (expandAllBtn) {
        expandAllBtn.textContent = allPageExpanded ? "⊟ Thu gọn trang" : "⊞ Mở rộng trang";
        expandAllBtn.onclick = () => {
          if (allPageExpanded) {
            pageSites.forEach((s) => lk.expandedSites.delete(s.site));
          } else {
            pageSites.forEach((s) => lk.expandedSites.add(s.site));
          }
          renderLookupProfile(skuCode, serialNum, true);
        };
      }

      const rowsHtml = [];
      pageSites.forEach((st) => {
        const isExp = lk.expandedSites.has(st.site);
        const totalQty = st.binQty || st.serials.length;
        const totalVal = st.binVal || st.snVal;
        const avgAgeSite = st.agingSiteCnt > 0 ? Math.round(st.agingSiteSum / st.agingSiteCnt) : -1;
        const zonePreview = Array.from(st.binZones).slice(0, 2).join(", ");
        const binSummary = `${fmtInt(st.binCodes.size || st.bins.length)} BIN${zonePreview ? ` • ${zonePreview}` : ""}`;
        const velStr = st.s7d !== null || st.s30d !== null ? `${fmtInt(st.s7d || 0)} / ${fmtInt(st.s30d || 0)}` : "—";

        rowsHtml.push(`
          <tr class="bs-parent-row lk-site-pivot-row ${isExp ? "is-expanded" : ""}" data-lk-site="${esc(st.site)}">
            <td class="mono">
              <button type="button" class="bs-expand-btn" aria-label="Mở rộng Site ${esc(st.site)}">${isExp ? "▼" : "▶"}</button>
              <strong>${esc(st.site)}</strong>
            </td>
            <td>${esc(st.siteName || "—")}</td>
            <td class="muted">${esc(binSummary)}</td>
            <td class="num mono">
              <strong>${fmtInt(st.serials.length)}</strong>
              ${st.badSnCount > 0 ? ` <span class="inv-badge bad-verybad" title="Số Serial Tồn xấu / Tồn rất xấu">${fmtInt(st.badSnCount)} Bad</span>` : ""}
            </td>
            <td class="num mono" style="color:#00E5FF"><strong>${fmtInt(totalQty)}</strong></td>
            <td class="num mono">${avgAgeSite >= 0 ? `${fmtInt(avgAgeSite)}d / ${fmtInt(st.maxAgingSite)}d` : "—"}</td>
            <td class="mono">${esc(st.lastRecv || "—")}</td>
            <td class="num mono">${esc(velStr)}</td>
            <td class="num mono"><strong>${fmtInt(totalVal)}</strong></td>
          </tr>`);

        if (isExp) {
          if (st.serials.length && snL) {
            const sortedSiteSn = [...st.serials].sort((a, b) => {
              if (serialNum && a[SN_C.SN].toLowerCase() === serialNum.toLowerCase()) return -1;
              if (serialNum && b[SN_C.SN].toLowerCase() === serialNum.toLowerCase()) return 1;
              return b[SN_C.AGING_SITE] - a[SN_C.AGING_SITE];
            });
            const snRowsHtml = sortedSiteSn.map((sr) => {
              const isHl = serialNum && sr[SN_C.SN].toLowerCase() === serialNum.toLowerCase();
              const bt = snL.binTypes[sr[SN_C.BIN_TYPE]];
              const bz = snL.binZones[sr[SN_C.BIN_ZONE]];
              const bc = snL.badComp[sr[SN_C.BAD_COMP]];
              const bs = snL.badSite[sr[SN_C.BAD_SITE]];
              const ac = sr[SN_C.AGING_COMP];
              const agS = sr[SN_C.AGING_SITE];
              const ageCls = ac < 0 ? "" : ac <= 90 ? "fresh" : ac <= 180 ? "mid" : "old";
              return `
                <tr class="${isHl ? "row-highlight" : ""}">
                  <td class="mono"><button type="button" class="link-sku-btn" data-lk-site-sn="${esc(sr[SN_C.SN])}">${esc(sr[SN_C.SN])}</button></td>
                  <td class="mono">${esc(snL.locations[sr[SN_C.LOC]] || "—")}</td>
                  <td><span class="inv-badge ${binBadgeClass(bt)}">${esc(bt)}</span></td>
                  <td>${esc(bz || "—")}</td>
                  <td>${esc(snL.suppliers[sr[SN_C.SUPPLIER]] || "—")}</td>
                  <td class="mono">${esc(sr[SN_C.FIRST_DATE] || "—")} / ${esc(sr[SN_C.LAST_DATE] || "—")}</td>
                  <td class="num"><span class="aging-tag ${ageCls}">${ac >= 0 ? fmtInt(ac) + "d" : "—"}</span></td>
                  <td class="num mono">${agS >= 0 ? fmtInt(agS) + "d" : "—"}</td>
                  <td><span class="inv-badge ${badStockBadgeClass(bc)}">${esc(bc)}</span></td>
                  <td><span class="inv-badge ${badStockBadgeClass(bs)}">${esc(bs)}</span></td>
                  <td class="num mono"><strong>${fmtInt(sr[SN_C.INV_VAL])}</strong></td>
                </tr>`;
            }).join("");

            rowsHtml.push(`
              <tr class="bs-child-row">
                <td colspan="9">
                  <div class="bs-child-wrap">
                    <div class="bs-child-head">
                      <span>📦 <strong>${esc(st.site)}</strong> (${esc(st.siteName || "Site")}) — <strong>${fmtInt(sortedSiteSn.length)} Serial</strong> đang tồn</span>
                    </div>
                    <table class="dark-table bs-child-table">
                      <thead>
                        <tr>
                          <th>Serial Number</th>
                          <th>BIN Code</th>
                          <th>BIN Type</th>
                          <th>BIN Zone</th>
                          <th>Nhà cung cấp</th>
                          <th>Nhập Cty / Site</th>
                          <th class="num">Tuổi Cty</th>
                          <th class="num">Tuổi Site</th>
                          <th>Loại tồn (Cty)</th>
                          <th>Loại tồn (Site)</th>
                          <th class="num">Giá trị (VND)</th>
                        </tr>
                      </thead>
                      <tbody>${snRowsHtml}</tbody>
                    </table>
                  </div>
                </td>
              </tr>`);
          } else if (st.bins.length && invL) {
            const binChildHtml = st.bins.map((b) => {
              const bt = invL.binTypes[b[INV_C.BIN_TYPE]];
              return `
                <tr>
                  <td class="mono">${esc(invL.binCodes[b[INV_C.BIN_CODE]])}</td>
                  <td><span class="inv-badge ${binBadgeClass(bt)}">${esc(bt)}</span></td>
                  <td>${esc(invL.binZones[b[INV_C.BIN_ZONE]])}</td>
                  <td class="mono">${esc(b[INV_C.LAST_RECV] || "—")}</td>
                  <td class="num mono">${fmtInt(b[INV_C.MIN_STOCK])}</td>
                  <td class="num mono" style="color:#00E5FF"><strong>${fmtInt(b[INV_C.QTY])}</strong></td>
                  <td class="num mono">${fmtInt(b[INV_C.UNIT_COST])}</td>
                  <td class="num mono"><strong>${fmtInt(b[INV_C.VALUE])}</strong></td>
                </tr>`;
            }).join("");
            rowsHtml.push(`
              <tr class="bs-child-row">
                <td colspan="9">
                  <div class="bs-child-wrap">
                    <div class="bs-child-head">
                      <span>📍 <strong>${esc(st.site)}</strong> — SKU không quản lý Serial (hiển thị ${fmtInt(st.bins.length)} vị trí BIN)</span>
                    </div>
                    <table class="dark-table bs-child-table">
                      <thead>
                        <tr>
                          <th>BIN Code</th>
                          <th>BIN Type</th>
                          <th>BIN Zone</th>
                          <th>Last Recv</th>
                          <th class="num">Min Stock</th>
                          <th class="num">QTY</th>
                          <th class="num">Unit Cost</th>
                          <th class="num">Giá trị (VND)</th>
                        </tr>
                      </thead>
                      <tbody>${binChildHtml}</tbody>
                    </table>
                  </div>
                </td>
              </tr>`);
          }
        }
      });

      binBody.innerHTML = rowsHtml.join("");
      binBody.querySelectorAll("tr[data-lk-site]").forEach((tr) => {
        tr.addEventListener("click", () => {
          const sc = tr.dataset.lkSite;
          if (!sc) return;
          if (lk.expandedSites.has(sc)) lk.expandedSites.delete(sc);
          else lk.expandedSites.add(sc);
          renderLookupProfile(skuCode, serialNum, true);
        });
      });
      binBody.querySelectorAll("[data-lk-site-sn]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          renderLookupProfile(skuCode, btn.dataset.lkSiteSn, true);
        });
      });

      if (binPag) {
        binPag.innerHTML = `
          <button class="page-btn" id="lkBinPrevP" ${lk.binPage <= 1 ? "disabled" : ""}>◀</button>
          <span class="mono" style="font-size:11px;color:var(--text-secondary)">Trang ${lk.binPage}/${totalSitePages}</span>
          <button class="page-btn" id="lkBinNextP" ${lk.binPage >= totalSitePages ? "disabled" : ""}>▶</button>`;
        binPag.querySelector("#lkBinPrevP")?.addEventListener("click", () => {
          if (lk.binPage > 1) { lk.binPage--; renderLookupProfile(skuCode, serialNum, true); }
        });
        binPag.querySelector("#lkBinNextP")?.addEventListener("click", () => {
          if (lk.binPage < totalSitePages) { lk.binPage++; renderLookupProfile(skuCode, serialNum, true); }
        });
      }
    } else {
      document.getElementById("lkBinListInfo").textContent = "0 Site có tồn";
      binBody.innerHTML = `<tr><td colspan="9" class="muted">Không có dữ liệu tồn kho theo Site cho SKU này.</td></tr>`;
      if (binPag) binPag.innerHTML = "";
      if (expandAllBtn) expandAllBtn.onclick = null;
    }

    // Prepare CSV export for this SKU
    lk.lastExport = {
      headers: ["SKU", "SKU Name", "Purchase Status", "Range", "Serial Number", "Site", "BIN", "BIN Type", "Aging Company", "Aging Site", "Bad Stock Company", "Bad Stock Site", "Value"],
      rows: serialRows.length && snL
        ? serialRows.map((r) => [skuCode, skuName, status, rng, r[SN_C.SN], snL.sites[r[SN_C.SITE]], snL.locations[r[SN_C.LOC]], snL.binTypes[r[SN_C.BIN_TYPE]], r[SN_C.AGING_COMP], r[SN_C.AGING_SITE], snL.badComp[r[SN_C.BAD_COMP]], snL.badSite[r[SN_C.BAD_SITE]], r[SN_C.INV_VAL]])
        : [[skuCode, skuName, status, rng, "", "", "", "", "", "", "", "", invVal]],
      filename: `sku_${skuCode}_profile_${new Date().toISOString().slice(0, 10)}.csv`,
    };
  }

  function bindLookupEvents() {
    const inp = document.getElementById("lookupSearchInput");
    const btn = document.getElementById("lookupSearchBtn");
    const sugBox = document.getElementById("lookupSuggestions");
    const clearSnBtn = document.getElementById("lkClearSerialBtn");
    const expBtn = document.getElementById("lkExportSkuBtn");

    const renderSuggestions = () => {
      if (!inp || !sugBox) return;
      const q = inp.value.trim();
      if (!q) {
        sugBox.classList.add("hidden");
        sugBox.innerHTML = "";
        return;
      }
      const matches = searchSkuAndSerials(q);
      if (!matches.length) {
        sugBox.innerHTML = `<div class="muted" style="padding:8px 10px;font-size:12px">Không tìm thấy SKU hoặc Serial nào khớp "${esc(q)}".</div>`;
        sugBox.classList.remove("hidden");
        return;
      }
      sugBox.innerHTML = matches.map((m, idx) => `
        <div class="lookup-sug-item" data-sug-idx="${idx}">
          <div class="lookup-sug-left">
            <span class="inv-badge ${m.kind === "serial" ? "warranty" : "other"}">${m.kind === "serial" ? "SERIAL" : "SKU"}</span>
            <span class="lookup-sug-code">${esc(m.code)}</span>
            <span class="lookup-sug-name">${esc(m.name)}</span>
          </div>
          <div class="lookup-sug-right">
            <span class="inv-badge ${m.badgeCls}">${esc(m.badge)}</span>
            <span class="mono muted" style="font-size:11px">${esc(m.extra)}</span>
          </div>
        </div>`).join("");
      sugBox.classList.remove("hidden");
      sugBox.querySelectorAll("[data-sug-idx]").forEach((el) => {
        el.addEventListener("click", () => {
          const item = matches[Number(el.dataset.sugIdx)];
          if (item) openSkuOrSerialInspector(item.sku, item.kind === "serial" ? item.code : "");
        });
      });
    };

    const runDirectSearch = () => {
      if (!inp) return;
      const q = inp.value.trim();
      if (!q) return;
      const matches = searchSkuAndSerials(q);
      if (!matches.length) {
        showToast(`Không tìm thấy SKU hoặc Serial "${q}"`, true);
        return;
      }
      const top = matches[0];
      openSkuOrSerialInspector(top.sku, top.kind === "serial" ? top.code : "");
    };

    inp?.addEventListener("input", renderSuggestions);
    inp?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        runDirectSearch();
      }
    });
    btn?.addEventListener("click", runDirectSearch);
    clearSnBtn?.addEventListener("click", () => {
      if (state.lookup.selectedSku) renderLookupProfile(state.lookup.selectedSku, "");
    });
    expBtn?.addEventListener("click", () => {
      const { headers, rows, filename } = state.lookup.lastExport;
      downloadCsv(headers, rows, filename);
    });
  }

  // =========================================================================
  // 9B. BAD STOCK REPORT ENGINE (SKU TỒN XẤU / TỒN RẤT XẤU -> PIVOT SITE & SERIAL)
  // =========================================================================
  function populateBadStockFilters() {
    const inv = state.raw?.inventory;
    const mp = state.raw?.masterProducts;
    const ms = state.raw?.masterSummary;
    const sn = state.raw?.invSerials;
    const sc = state.raw?.invSerialCube;

    const fill = (id, allLabel, items, labelFn = (x) => x) => {
      const el = document.getElementById(id);
      if (!el) return;
      const prev = el.value;
      el.innerHTML = `<option value="">${allLabel}</option>`;
      items.forEach((v) => el.add(new Option(labelFn(v), v)));
      if (prev && items.includes(prev)) el.value = prev;
      if (msRegistry.has(id)) msRegistry.get(id).rebuild();
    };

    const badItems = ["Tồn rất xấu", "Tồn xấu", "Tồn lâu", "Tồn bán chậm", "Tồn thông thường"];
    fill("bsFilterBadType", "Tồn xấu & Tồn rất xấu (Mặc định)", badItems);

    const statusSet = new Set([
      ...(inv?.lookups?.purchaseStatuses || []),
      ...(mp?.lookups?.purchaseStatuses || []),
      ...(ms?.lookups?.purchaseStatuses || []),
      ...(sn?.lookups?.purchaseStatuses || []),
    ]);
    fill("bsFilterStatus", `Tất cả TT Mua (${statusSet.size})`, [...statusSet].sort());

    const rangeSet = new Set([
      ...(inv?.lookups?.ranges || ["No"]),
      ...(mp?.lookups?.ranges || []),
      ...(ms?.lookups?.ranges || []),
      ...(sn?.lookups?.ranges || []),
    ]);
    fill("bsFilterRange", `Tất cả Range (${rangeSet.size})`, [...rangeSet].sort());

    const siteDirectory = inv?.siteDirectory || {};
    const siteSet = new Set([
      ...(inv?.lookups?.sites || []),
      ...(sn?.lookups?.sites || []),
      ...(sc?.lookups?.sites || []),
    ]);
    fill(
      "bsFilterSite",
      `Tất cả Site Kho (${siteSet.size})`,
      [...siteSet].sort(),
      (code) => {
        const info = siteDirectory[code];
        return info && info.siteName && info.siteName !== code ? `${code} — ${info.siteName}` : code;
      }
    );

    const binTypeSet = new Set([
      ...(inv?.lookups?.binTypes || []),
      ...(sn?.lookups?.binTypes || []),
      ...(sc?.lookups?.binTypes || []),
    ]);
    fill("bsFilterBinType", `Tất cả BIN Type (${binTypeSet.size})`, [...binTypeSet].sort());

    const binZoneSet = new Set([
      ...(inv?.lookups?.binZones || []),
      ...(sn?.lookups?.binZones || []),
      ...(sc?.lookups?.binZones || []),
    ]);
    fill("bsFilterBinZone", `Tất cả BIN Zone (${binZoneSet.size})`, [...binZoneSet].sort());

    const brandSet = new Set([
      ...(inv?.lookups?.brands || []),
      ...(sn?.lookups?.brands || []),
      ...(sc?.lookups?.brands || []),
    ]);
    fill("bsFilterBrand", `Tất cả Brand (${brandSet.size})`, [...brandSet].sort());
  }

  function resetBadStockFilters(shouldRender = true) {
    const bs = state.badstock;
    bs.badType = "";
    bs.scope = "company";
    bs.site = "";
    bs.status = "";
    bs.range = "";
    bs.binType = "";
    bs.binZone = "";
    bs.brand = "";
    bs.search = "";
    bs.page = 1;
    bs.expandedSkus.clear();

    const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
    setVal("bsFilterBadType", "");
    setVal("bsFilterSite", "");
    setVal("bsFilterStatus", "");
    setVal("bsFilterRange", "");
    setVal("bsFilterBinType", "");
    setVal("bsFilterBinZone", "");
    setVal("bsFilterBrand", "");
    setVal("bsSearchInput", "");

    const scopeEl = document.getElementById("bsScopeGroup");
    if (scopeEl) {
      scopeEl.querySelectorAll(".seg-btn").forEach((b) => {
        b.classList.toggle("active", b.dataset.val === "company");
      });
    }

    syncAllMultiSelectUIs();
    if (shouldRender && state.activeView === "badstock") renderBadStockView();
  }

  function bindBadStockEvents() {
    const onSelect = (id, prop) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener("change", (e) => {
        state.badstock[prop] = e.target.value;
        state.badstock.page = 1;
        renderBadStockView();
      });
    };

    onSelect("bsFilterBadType", "badType");
    onSelect("bsFilterSite", "site");
    onSelect("bsFilterStatus", "status");
    onSelect("bsFilterRange", "range");
    onSelect("bsFilterBinType", "binType");
    onSelect("bsFilterBinZone", "binZone");
    onSelect("bsFilterBrand", "brand");

    const scopeEl = document.getElementById("bsScopeGroup");
    scopeEl?.addEventListener("click", (e) => {
      const btn = e.target.closest(".seg-btn");
      if (!btn) return;
      scopeEl.querySelectorAll(".seg-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      state.badstock.scope = btn.dataset.val;
      state.badstock.page = 1;
      renderBadStockView();
    });

    document.getElementById("bsResetBtn")?.addEventListener("click", () => resetBadStockFilters(true));

    document.getElementById("bsSearchInput")?.addEventListener("input", (e) => {
      state.badstock.search = e.target.value.trim().toLowerCase();
      state.badstock.page = 1;
      renderBadStockView();
    });

    document.getElementById("bsExpandAllBtn")?.addEventListener("click", () => {
      const bs = state.badstock;
      const currentRows = Array.from(document.querySelectorAll("#bsTableBody tr.bs-sku-row[data-bs-sku]"));
      const pageSkus = currentRows.map((tr) => tr.dataset.bsSku).filter(Boolean);
      const allExpanded = pageSkus.length > 0 && pageSkus.every((sku) => bs.expandedSkus.has(sku));
      if (allExpanded) {
        pageSkus.forEach((sku) => bs.expandedSkus.delete(sku));
      } else {
        pageSkus.forEach((sku) => bs.expandedSkus.add(sku));
      }
      renderBadStockView();
    });

    document.getElementById("bsExportCsvBtn")?.addEventListener("click", () => {
      const { headers, rows, filename } = state.badstock.lastExport;
      if (rows && rows.length) downloadCsv(headers, rows, filename);
    });
  }

  function parseVnOrIsoDateSortable(dStr) {
    if (!dStr) return "9999-99-99";
    const s = String(dStr).trim();
    // YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    // DD/MM/YYYY or DD.MM.YYYY
    const m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/);
    if (m) {
      let d = m[1].padStart(2, "0");
      let mo = m[2].padStart(2, "0");
      let y = m[3].length === 2 ? `20${m[3]}` : m[3];
      return `${y}-${mo}-${d}`;
    }
    return s;
  }

  function renderBadStockView() {
    const bs = state.badstock;
    const sn = state.raw?.invSerials;
    const tbody = document.getElementById("bsTableBody");
    const thead = document.getElementById("bsTableHead");
    if (!tbody || !thead) return;

    if (!sn || !Array.isArray(sn.rows)) {
      ensureLookupShardsLoaded();
      tbody.innerHTML = `<tr><td colspan="9" class="muted" style="padding:26px;text-align:center">Đang tải dữ liệu 40.726 Serial &amp; Bad Stock chi tiết... vui lòng chờ 1 giây.</td></tr>`;
      return;
    }

    const snL = sn.lookups;
    const invSiteDir = state.raw?.inventory?.siteDirectory || {};
    const lk = state.lookup;
    if (lk.idxSkuVel.size === 0 && state.raw?.invSkuLevel?.rows?.length) {
      buildLookupIndexes();
    }

    // Build fast Branch-level velocity index: "SKU|SITE" -> { s7d, s30d, s90d, s180d, sdays, invQty, invVal }
    const branchVelMap = new Map();
    const brData = state.raw?.invBranchLevel;
    if (brData && Array.isArray(brData.rows) && brData.lookups) {
      const brL = brData.lookups;
      for (let i = 0; i < brData.rows.length; i++) {
        const br = brData.rows[i];
        const siteCode = brL.sites[br[BR_C.SITE]] || "";
        const key = `${br[BR_C.SKU]}|${siteCode}`;
        branchVelMap.set(key, {
          siteName: brL.siteNames[br[BR_C.SITE_NAME]] || "",
          s7d: br[BR_C.S7D] || 0,
          s30d: br[BR_C.S30D] || 0,
          s90d: br[BR_C.S90D] || 0,
          s180d: br[BR_C.S180D] || 0,
          sdays: br[BR_C.SDAYS],
          invQty: br[BR_C.INV_QTY] || 0,
          invVal: br[BR_C.INV_VAL] || 0,
        });
      }
    }

    // Update Scope Badge
    const scopeBadge = document.getElementById("bsScopeBadge");
    if (scopeBadge) {
      scopeBadge.textContent =
        bs.scope === "site" ? "THEO CHI NHÁNH (SITE)" :
        bs.scope === "either" ? "THEO CÔNG TY HOẶC SITE" : "THEO CÔNG TY";
    }

    // Determine active Bad Stock Types (default: Tồn rất xấu + Tồn xấu)
    const activeBadTypes = bs.badType ? splitMulti(bs.badType) : ["Tồn rất xấu", "Tồn xấu"];
    const activeBadSet = new Set(activeBadTypes);

    const catIdxSet = getLookupIdxSet(state.globalCat, snL.categories);
    const gSubIdxSet = getLookupIdxSet(state.globalSubcat, snL.subcats);
    const siteIdxSet = getLookupIdxSet(bs.site, snL.sites);
    const stIdxSet = getLookupIdxSet(bs.status, snL.purchaseStatuses);
    const rngIdxSet = getLookupIdxSet(bs.range, snL.ranges || []);
    const btIdxSet = getLookupIdxSet(bs.binType, snL.binTypes);
    const bzIdxSet = getLookupIdxSet(bs.binZone, snL.binZones);
    const brIdxSet = getLookupIdxSet(bs.brand, snL.brands);

    // Render Active Filter Chips
    const chipsWrap = document.getElementById("bsActiveChips");
    if (chipsWrap) {
      const chips = [];
      const add = (label, cls, fn) => chips.push({ label, cls, fn });

      splitMulti(state.globalCat).forEach((cat) => {
        add(`Cat: ${cat}`, "amber", () => {
          state.globalCat = removeMultiVal(state.globalCat, cat);
          populateGlobalMasterFilter();
          renderAll();
        });
      });
      splitMulti(state.globalSubcat).forEach((sc) => {
        add(`Subcat 2: ${sc}`, "amber", () => {
          setGlobalSubcat(removeMultiVal(state.globalSubcat, sc));
        });
      });
      splitMulti(bs.badType).forEach((v) => {
        add(`Loại tồn: ${v}`, "amber", () => {
          bs.badType = removeMultiVal(bs.badType, v);
          syncMultiSelectUI("bsFilterBadType", bs.badType);
          renderBadStockView();
        });
      });
      splitMulti(bs.site).forEach((v) => {
        add(`Site: ${v}`, "", () => {
          bs.site = removeMultiVal(bs.site, v);
          syncMultiSelectUI("bsFilterSite", bs.site);
          renderBadStockView();
        });
      });
      splitMulti(bs.status).forEach((v) => {
        add(`TT Mua: ${v}`, "amber", () => {
          bs.status = removeMultiVal(bs.status, v);
          syncMultiSelectUI("bsFilterStatus", bs.status);
          renderBadStockView();
        });
      });
      splitMulti(bs.range).forEach((v) => {
        add(`Range: ${v}`, "", () => {
          bs.range = removeMultiVal(bs.range, v);
          syncMultiSelectUI("bsFilterRange", bs.range);
          renderBadStockView();
        });
      });
      splitMulti(bs.binType).forEach((v) => {
        add(`BIN Type: ${v}`, "", () => {
          bs.binType = removeMultiVal(bs.binType, v);
          syncMultiSelectUI("bsFilterBinType", bs.binType);
          renderBadStockView();
        });
      });
      splitMulti(bs.binZone).forEach((v) => {
        add(`BIN Zone: ${v}`, "", () => {
          bs.binZone = removeMultiVal(bs.binZone, v);
          syncMultiSelectUI("bsFilterBinZone", bs.binZone);
          renderBadStockView();
        });
      });
      splitMulti(bs.brand).forEach((v) => {
        add(`Brand: ${v}`, "", () => {
          bs.brand = removeMultiVal(bs.brand, v);
          syncMultiSelectUI("bsFilterBrand", bs.brand);
          renderBadStockView();
        });
      });

      chipsWrap.innerHTML = "";
      if (!chips.length) {
        chipsWrap.innerHTML = `<span class="chip muted-chip">Mặc định: Tồn xấu &amp; Tồn rất xấu • Nhấp vào từng dòng SKU để xổ bảng Pivot Serial &amp; Site</span>`;
      } else {
        chips.forEach((c) => {
          const el = document.createElement("span");
          el.className = `chip ${c.cls}`;
          el.innerHTML = `<span>${esc(c.label)}</span><button type="button" aria-label="Xóa">×</button>`;
          el.querySelector("button").addEventListener("click", c.fn);
          chipsWrap.appendChild(el);
        });
      }
    }

    // Group matching Bad Stock serials by SKU -> Site -> Serials
    const skuMap = new Map();
    const allSitesSet = new Set();
    let totalBadSn = 0, totalBadVal = 0;
    let totalVeryBadSn = 0, totalVeryBadVal = 0;
    let totalOnlyBadSn = 0, totalOnlyBadVal = 0;
    let globalMaxAgingComp = 0;

    for (let i = 0; i < sn.rows.length; i++) {
      const r = sn.rows[i];
      if (!r[SN_C.IN_BAD_FILE]) continue;

      if (state.globalCat) {
        if (r.length > SN_C.CAT) {
          if (!catIdxSet || !catIdxSet.has(r[SN_C.CAT])) continue;
        } else if (!hasMultiPrefix(state.globalCat, snL.subcats[r[SN_C.SUBCAT]])) {
          continue;
        }
      }
      if (gSubIdxSet && !gSubIdxSet.has(r[SN_C.SUBCAT])) continue;
      if (siteIdxSet && !siteIdxSet.has(r[SN_C.SITE])) continue;
      if (stIdxSet && !stIdxSet.has(r[SN_C.STATUS])) continue;
      if (rngIdxSet && !rngIdxSet.has(r[SN_C.RANGE])) continue;
      if (btIdxSet && !btIdxSet.has(r[SN_C.BIN_TYPE])) continue;
      if (bzIdxSet && !bzIdxSet.has(r[SN_C.BIN_ZONE])) continue;
      if (brIdxSet && !brIdxSet.has(r[SN_C.BRAND])) continue;

      const badCompLbl = snL.badComp[r[SN_C.BAD_COMP]] || "Khác";
      const badSiteLbl = snL.badSite[r[SN_C.BAD_SITE]] || "Khác";

      let matchesBadType = false;
      if (bs.scope === "company") {
        matchesBadType = activeBadSet.has(badCompLbl);
      } else if (bs.scope === "site") {
        matchesBadType = activeBadSet.has(badSiteLbl);
      } else {
        matchesBadType = activeBadSet.has(badCompLbl) || activeBadSet.has(badSiteLbl);
      }
      if (!matchesBadType) continue;

      const sku = r[SN_C.SKU];
      const siteCode = snL.sites[r[SN_C.SITE]] || "—";
      const val = r[SN_C.INV_VAL] || 0;
      const agingComp = r[SN_C.AGING_COMP] >= 0 ? r[SN_C.AGING_COMP] : 0;
      const agingSite = r[SN_C.AGING_SITE] >= 0 ? r[SN_C.AGING_SITE] : 0;
      const firstDate = r[SN_C.FIRST_DATE] || "";
      const lastDate = r[SN_C.LAST_DATE] || "";
      const firstIso = parseVnOrIsoDateSortable(firstDate);
      const lastIso = parseVnOrIsoDateSortable(lastDate);

      let skuObj = skuMap.get(sku);
      if (!skuObj) {
        const velRow = lk.idxSkuVel.get(sku) || null;
        const mpRow = lk.idxMaster.get(sku) || null;
        const mpL = state.raw?.masterProducts?.lookups;
        const s7d = velRow ? (velRow[SKU_C.S7D] || 0) : 0;
        const s30d = velRow ? (velRow[SKU_C.S30D] || 0) : (mpRow ? (mpRow[MP_C.SALES_30D] || 0) : 0);
        const s90d = velRow ? (velRow[SKU_C.S90D] || 0) : 0;
        const s180d = velRow ? (velRow[SKU_C.S180D] || 0) : 0;
        const compInvQty = velRow ? (velRow[SKU_C.INV_QTY] || 0) : (mpRow ? (mpRow[MP_C.INV_QTY] || 0) : 0);
        const statusStr = snL.purchaseStatuses[r[SN_C.STATUS]] || (velRow ? velRow[SKU_C.STATUS] : (mpRow && mpL ? mpL.purchaseStatuses[mpRow[MP_C.STATUS]] : "Normal"));
        const rangeStr = (snL.ranges && snL.ranges[r[SN_C.RANGE]]) || (velRow ? velRow[SKU_C.RANGE] : "No");

        skuObj = {
          sku,
          name: r[SN_C.SKU_NAME] || (velRow ? velRow[SKU_C.NAME] : "") || (mpRow ? mpRow[MP_C.NAME] : ""),
          brand: snL.brands[r[SN_C.BRAND]] || (velRow ? velRow[SKU_C.BRAND] : "Khác"),
          subcat: snL.subcats[r[SN_C.SUBCAT]] || (velRow ? velRow[SKU_C.SUBCAT] : ""),
          status: statusStr,
          range: rangeStr,
          qty: 0,
          val: 0,
          compInvQty,
          veryBadCnt: 0,
          veryBadVal: 0,
          badCnt: 0,
          badVal: 0,
          otherBadCnt: 0,
          maxAgingComp: -1,
          minAgingComp: Infinity,
          sumAgingComp: 0,
          earliestCompIso: "9999-99-99",
          earliestCompDate: "",
          latestCompIso: "",
          latestCompDate: "",
          s7d,
          s30d,
          s90d,
          s180d,
          sitesMap: new Map(),
        };
        skuMap.set(sku, skuObj);
      }

      skuObj.qty += 1;
      skuObj.val += val;
      skuObj.sumAgingComp += agingComp;
      if (agingComp > skuObj.maxAgingComp) skuObj.maxAgingComp = agingComp;
      if (agingComp < skuObj.minAgingComp) skuObj.minAgingComp = agingComp;
      if (firstDate && firstIso < skuObj.earliestCompIso) {
        skuObj.earliestCompIso = firstIso;
        skuObj.earliestCompDate = firstDate;
      }
      if (firstDate && firstIso > skuObj.latestCompIso) {
        skuObj.latestCompIso = firstIso;
        skuObj.latestCompDate = firstDate;
      }

      const primaryLbl = bs.scope === "site" ? badSiteLbl : badCompLbl;
      if (primaryLbl === "Tồn rất xấu" || (bs.scope === "either" && (badCompLbl === "Tồn rất xấu" || badSiteLbl === "Tồn rất xấu"))) {
        skuObj.veryBadCnt += 1;
        skuObj.veryBadVal += val;
      } else if (primaryLbl === "Tồn xấu" || (bs.scope === "either" && (badCompLbl === "Tồn xấu" || badSiteLbl === "Tồn xấu"))) {
        skuObj.badCnt += 1;
        skuObj.badVal += val;
      } else {
        skuObj.otherBadCnt += 1;
      }

      // Group into Site inside this SKU
      let siteObj = skuObj.sitesMap.get(siteCode);
      if (!siteObj) {
        const brVel = branchVelMap.get(`${sku}|${siteCode}`) || null;
        const sName = brVel?.siteName || invSiteDir[siteCode]?.siteName || siteCode;
        siteObj = {
          siteCode,
          siteName: sName,
          qty: 0,
          val: 0,
          siteTotalInvQty: brVel ? brVel.invQty : 0,
          maxAgingSite: -1,
          minAgingSite: Infinity,
          sumAgingSite: 0,
          earliestSiteIso: "9999-99-99",
          earliestSiteDate: "",
          latestSiteIso: "",
          latestSiteDate: "",
          s7d: brVel ? brVel.s7d : 0,
          s30d: brVel ? brVel.s30d : 0,
          s90d: brVel ? brVel.s90d : 0,
          s180d: brVel ? brVel.s180d : 0,
          serials: [],
        };
        skuObj.sitesMap.set(siteCode, siteObj);
      }

      siteObj.qty += 1;
      siteObj.val += val;
      siteObj.sumAgingSite += agingSite;
      if (agingSite > siteObj.maxAgingSite) siteObj.maxAgingSite = agingSite;
      if (agingSite < siteObj.minAgingSite) siteObj.minAgingSite = agingSite;
      if (lastDate && lastIso < siteObj.earliestSiteIso) {
        siteObj.earliestSiteIso = lastIso;
        siteObj.earliestSiteDate = lastDate;
      }
      if (lastDate && lastIso > siteObj.latestSiteIso) {
        siteObj.latestSiteIso = lastIso;
        siteObj.latestSiteDate = lastDate;
      }

      siteObj.serials.push({
        sn: r[SN_C.SN],
        siteCode,
        loc: snL.locations[r[SN_C.LOC]] || "—",
        binType: snL.binTypes[r[SN_C.BIN_TYPE]] || "—",
        binZone: snL.binZones[r[SN_C.BIN_ZONE]] || "—",
        supplier: snL.suppliers[r[SN_C.SUPPLIER]] || "—",
        badComp: badCompLbl,
        badSite: badSiteLbl,
        agingComp: r[SN_C.AGING_COMP],
        agingSite: r[SN_C.AGING_SITE],
        firstDate: firstDate || "—",
        lastDate: lastDate || "—",
        val,
      });
    }

    // Filter by Search query (matches SKU, Name, Brand, Subcat, Site, or Serial Number)
    let skuList = Array.from(skuMap.values());
    const q = bs.search;
    if (q) {
      skuList = skuList.filter((item) => {
        if (
          item.sku.toLowerCase().includes(q) ||
          item.name.toLowerCase().includes(q) ||
          item.brand.toLowerCase().includes(q) ||
          item.subcat.toLowerCase().includes(q)
        ) {
          return true;
        }
        for (const sObj of item.sitesMap.values()) {
          if (sObj.siteCode.toLowerCase().includes(q) || sObj.siteName.toLowerCase().includes(q)) return true;
          if (sObj.serials.some((sr) => sr.sn.toLowerCase().includes(q))) {
            bs.expandedSkus.add(item.sku);
            return true;
          }
        }
        return false;
      });
    }

    // Recompute summary KPIs from filtered SKU list
    skuList.forEach((item) => {
      totalBadSn += item.qty;
      totalBadVal += item.val;
      totalVeryBadSn += item.veryBadCnt;
      totalVeryBadVal += item.veryBadVal;
      totalOnlyBadSn += item.badCnt;
      totalOnlyBadVal += item.badVal;
      if (item.maxAgingComp > globalMaxAgingComp) globalMaxAgingComp = item.maxAgingComp;
      for (const sc of item.sitesMap.keys()) allSitesSet.add(sc);
    });

    const veryBadShare = totalBadVal > 0 ? ((totalVeryBadVal / totalBadVal) * 100).toFixed(1) : "0.0";
    const setTxt = (id, t) => { const el = document.getElementById(id); if (el) el.textContent = t; };
    setTxt("bsKpiSkus", `${fmtInt(skuList.length)} SKUs`);
    setTxt("bsKpiSkusSub", `${fmtInt(totalBadSn)} Serial • ${fmtInt(allSitesSet.size)} Site có tồn`);
    setTxt("bsKpiTotalVal", fmtCompactVnd(totalBadVal));
    setTxt("bsKpiTotalValSub", `Tổng SL: ${fmtInt(totalBadSn)} Serial tồn xấu`);
    setTxt("bsKpiVeryBadVal", fmtCompactVnd(totalVeryBadVal));
    setTxt("bsKpiVeryBadSub", `${fmtInt(totalVeryBadSn)} SN • ${veryBadShare}% tổng Bad Stock`);
    setTxt("bsKpiBadVal", fmtCompactVnd(totalOnlyBadVal));
    setTxt("bsKpiBadSub", `${fmtInt(totalOnlyBadSn)} SN Tồn xấu • Max tuổi Cty: ${fmtInt(globalMaxAgingComp)} ngày`);

    const insightEl = document.getElementById("bsInsightText");
    if (insightEl) {
      if (!skuList.length) {
        insightEl.textContent = "Không có SKU Tồn xấu / Tồn rất xấu nào khớp bộ lọc hiện tại.";
      } else {
        const zeroSale30Skus = skuList.filter((x) => x.s30d === 0).length;
        insightEl.textContent =
          `Phát hiện ${fmtInt(skuList.length)} SKU (${fmtInt(totalBadSn)} SN = ${fmtCompactVnd(totalBadVal)}) • Có ${fmtInt(zeroSale30Skus)}/${fmtInt(skuList.length)} SKU không phát sinh bán trong 30D`;
      }
    }

    // Sort SKU list
    const dir = bs.sortDir === "asc" ? 1 : -1;
    const colGetters = {
      sku: (x) => x.sku,
      qty: (x) => x.qty,
      val: (x) => x.val,
      agingComp: (x) => x.maxAgingComp,
      firstDate: (x) => x.earliestCompIso,
      s7d: (x) => x.s7d,
      s30d: (x) => x.s30d,
      s90d: (x) => x.s90d,
      s180d: (x) => x.s180d,
    };
    const getter = colGetters[bs.sortCol] || colGetters.qty;
    skuList.sort((a, b) => {
      const va = getter(a), vb = getter(b);
      if (typeof va === "string") {
        const cmp = va.localeCompare(vb);
        return cmp !== 0 ? cmp * dir : b.val - a.val;
      }
      return (va - vb) !== 0 ? (va - vb) * dir : b.val - a.val;
    });

    // Render Table Header
    const headCols = [
      { key: "sku", label: "SKU — Sản phẩm & Phân loại Tồn" },
      { key: "qty", label: "Số lượng (SN)", num: true },
      { key: "val", label: "Giá trị Bad Stock", num: true },
      { key: "agingComp", label: "Tuổi Cty", num: true },
      { key: "firstDate", label: "Ngày nhập Cty" },
      { key: "s7d", label: "Sức bán 7D", num: true },
      { key: "s30d", label: "Sức bán 30D", num: true },
      { key: "s90d", label: "Sức bán 90D", num: true },
      { key: "s180d", label: "Sức bán 180D", num: true },
    ];
    thead.innerHTML = `<tr>${headCols.map((c) => {
      const sorted = bs.sortCol === c.key;
      const arrow = sorted ? (bs.sortDir === "asc" ? " ▲" : " ▼") : "";
      return `<th class="${c.num ? "num" : ""}" data-bs-sort="${c.key}">${esc(c.label)}${arrow}</th>`;
    }).join("")}</tr>`;

    thead.querySelectorAll("th[data-bs-sort]").forEach((th) => {
      th.addEventListener("click", () => {
        const k = th.dataset.bsSort;
        if (bs.sortCol === k) bs.sortDir = bs.sortDir === "asc" ? "desc" : "asc";
        else {
          bs.sortCol = k;
          bs.sortDir = k === "firstDate" || k === "sku" ? "asc" : "desc";
        }
        renderBadStockView();
      });
    });

    // Pagination (25 SKUs / page)
    const totalPages = Math.max(1, Math.ceil(skuList.length / bs.pageSize));
    bs.page = Math.min(Math.max(1, bs.page), totalPages);
    const start = (bs.page - 1) * bs.pageSize;
    const pageItems = skuList.slice(start, start + bs.pageSize);

    setTxt(
      "bsTableCountInfo",
      skuList.length
        ? `Hiển thị ${fmtInt(start + 1)}–${fmtInt(Math.min(start + pageItems.length, skuList.length))} / ${fmtInt(skuList.length)} SKU (${fmtInt(totalBadSn)} Serial) • Nhấp vào dòng SKU để xổ bảng Pivot Serial & Site`
        : "Không có SKU nào khớp bộ lọc"
    );

    const pag = document.getElementById("bsTablePagination");
    if (pag) {
      pag.innerHTML = `
        <button class="page-btn" id="bsPrevP" ${bs.page <= 1 ? "disabled" : ""}>◀</button>
        <span class="mono" style="font-size:11px;color:var(--text-secondary)">Trang ${bs.page}/${totalPages}</span>
        <button class="page-btn" id="bsNextP" ${bs.page >= totalPages ? "disabled" : ""}>▶</button>`;
      pag.querySelector("#bsPrevP")?.addEventListener("click", () => {
        if (bs.page > 1) { bs.page--; renderBadStockView(); }
      });
      pag.querySelector("#bsNextP")?.addEventListener("click", () => {
        if (bs.page < totalPages) { bs.page++; renderBadStockView(); }
      });
    }

    const expAllBtn = document.getElementById("bsExpandAllBtn");
    if (expAllBtn) {
      const allPageExp = pageItems.length > 0 && pageItems.every((it) => bs.expandedSkus.has(it.sku));
      expAllBtn.textContent = allPageExp ? "⊟ Thu gọn trang" : "⊞ Mở rộng trang";
    }

    if (!pageItems.length) {
      tbody.innerHTML = `<tr><td colspan="9" class="muted" style="padding:26px;text-align:center">Không có SKU Tồn xấu / Tồn rất xấu nào khớp điều kiện lọc.</td></tr>`;
      bs.lastExport = { headers: [], rows: [], filename: "bad_stock_sku_serial_pivot.csv" };
      return;
    }

    const fmtVel = (v) => `<span class="bs-vel-num ${v > 0 ? "has-sale" : "zero-sale"}">${fmtInt(v)}</span>`;

    // Build rows HTML (Master SKU Row + Expandable Site/Serial Pivot Sub-table)
    let bodyHtml = "";
    pageItems.forEach((item) => {
      const isExp = bs.expandedSkus.has(item.sku);
      const avgAgeComp = item.qty > 0 ? Math.round(item.sumAgingComp / item.qty) : 0;
      const ageCompDisplay = item.qty > 1 && item.maxAgingComp !== item.minAgingComp
        ? `<div><span class="aging-tag old">${fmtInt(item.maxAgingComp)} ngày</span></div><div class="mono muted" style="font-size:10px">TB: ${fmtInt(avgAgeComp)}d (${fmtInt(item.minAgingComp)}–${fmtInt(item.maxAgingComp)}d)</div>`
        : `<span class="aging-tag ${item.maxAgingComp > 180 ? "old" : "mid"}">${fmtInt(item.maxAgingComp)} ngày</span>`;

      const dateCompDisplay = item.earliestCompDate
        ? (item.latestCompDate && item.latestCompDate !== item.earliestCompDate
            ? `<div class="mono"><strong>${esc(item.earliestCompDate)}</strong></div><div class="mono muted" style="font-size:10px">→ ${esc(item.latestCompDate)}</div>`
            : `<span class="mono"><strong>${esc(item.earliestCompDate)}</strong></span>`)
        : "—";

      const badBadges = [];
      if (item.veryBadCnt > 0) badBadges.push(`<span class="inv-badge bad-verybad">Tồn rất xấu: ${fmtInt(item.veryBadCnt)}</span>`);
      if (item.badCnt > 0) badBadges.push(`<span class="inv-badge bad-bad">Tồn xấu: ${fmtInt(item.badCnt)}</span>`);
      if (item.otherBadCnt > 0) badBadges.push(`<span class="inv-badge bad-long">Khác: ${fmtInt(item.otherBadCnt)}</span>`);

      bodyHtml += `
        <tr class="bs-sku-row ${isExp ? "expanded" : ""}" data-bs-sku="${esc(item.sku)}" title="Nhấp để ${isExp ? "thu gọn" : "xổ ra"} bảng Pivot chi tiết các Serial & Site của SKU ${esc(item.sku)}">
          <td>
            <div class="bs-sku-main-cell">
              <span class="bs-expand-icon">▶</span>
              <div class="bs-sku-info">
                <div class="bs-sku-top-line">
                  <span class="bs-sku-code">${esc(item.sku)}</span>
                  ${badBadges.join("")}
                  <span class="inv-badge ${statusBadgeClass(item.status)}">${esc(item.status)}</span>
                  <span class="inv-badge ${String(item.range).toLowerCase() === "yes" ? "range-yes" : "range-no"}">Range: ${esc(item.range)}</span>
                  <button type="button" class="bs-inspect-mini-btn" data-bs-open-lookup="${esc(item.sku)}" title="Mở hồ sơ Tra cứu 360° cho SKU ${esc(item.sku)}">🔍 360°</button>
                </div>
                <div class="bs-sku-name">${esc(item.name)}</div>
                <div class="bs-sku-meta">Brand: <strong>${esc(item.brand)}</strong> • Subcat 2: ${esc(item.subcat)}</div>
              </div>
            </div>
          </td>
          <td class="num">
            <div class="mono" style="font-size:13px;font-weight:800;color:#00E5FF">${fmtInt(item.qty)} SN</div>
            <div class="mono muted" style="font-size:10px">${item.compInvQty > 0 ? `/ Tổng tồn ${fmtInt(item.compInvQty)} • ` : ""}${item.sitesMap.size} Site</div>
          </td>
          <td class="num">
            <strong class="mono">${fmtInt(item.val)}</strong>
            <div class="mono muted" style="font-size:10px">${fmtCompactVnd(item.val)}</div>
          </td>
          <td class="num">${ageCompDisplay}</td>
          <td>${dateCompDisplay}</td>
          <td class="num">${fmtVel(item.s7d)}</td>
          <td class="num">${fmtVel(item.s30d)}</td>
          <td class="num">${fmtVel(item.s90d)}</td>
          <td class="num">${fmtVel(item.s180d)}</td>
        </tr>`;

      if (isExp) {
        const sortedSites = Array.from(item.sitesMap.values()).sort((a, b) => b.qty - a.qty || b.maxAgingSite - a.maxAgingSite);
        let pivotRowsHtml = "";

        sortedSites.forEach((sGroup) => {
          const avgSiteAge = sGroup.qty > 0 ? Math.round(sGroup.sumAgingSite / sGroup.qty) : 0;
          const siteAgeText = sGroup.qty > 1 && sGroup.maxAgingSite !== sGroup.minAgingSite
            ? `Max ${fmtInt(sGroup.maxAgingSite)}d (TB ${fmtInt(avgSiteAge)}d)`
            : `${fmtInt(sGroup.maxAgingSite)} ngày`;
          const siteDateText = sGroup.earliestSiteDate
            ? (sGroup.latestSiteDate && sGroup.latestSiteDate !== sGroup.earliestSiteDate
                ? `${sGroup.earliestSiteDate} → ${sGroup.latestSiteDate}`
                : sGroup.earliestSiteDate)
            : "—";

          // Level 2A: Site Pivot Group Header Row
          pivotRowsHtml += `
            <tr class="bs-site-group-row">
              <td>📍 Site: <span class="mono">${esc(sGroup.siteCode)}</span> — ${esc(sGroup.siteName)}</td>
              <td>Tổng hợp tại Site (${fmtInt(sGroup.qty)} Serial Bad Stock${sGroup.siteTotalInvQty ? ` / Tổng tồn Site: ${fmtInt(sGroup.siteTotalInvQty)}` : ""})</td>
              <td><span class="inv-badge other">${fmtInt(sGroup.qty)} SN tại ${esc(sGroup.siteCode)}</span></td>
              <td class="num mono" style="color:#00E5FF">${fmtInt(sGroup.qty)}</td>
              <td class="num mono">${fmtInt(sGroup.val)}</td>
              <td class="num mono"><span class="aging-tag old">${esc(siteAgeText)}</span></td>
              <td class="mono">${esc(siteDateText)}</td>
              <td class="num">${fmtVel(sGroup.s7d)}</td>
              <td class="num">${fmtVel(sGroup.s30d)}</td>
              <td class="num">${fmtVel(sGroup.s90d)}</td>
              <td class="num">${fmtVel(sGroup.s180d)}</td>
            </tr>`;

          // Level 2B: Individual Serial Rows within this Site
          const sortedSerials = [...sGroup.serials].sort((a, b) => b.agingSite - a.agingSite || b.agingComp - a.agingComp);
          sortedSerials.forEach((sr) => {
            const hlSn = q && sr.sn.toLowerCase().includes(q) ? "row-highlight" : "";
            const ageS = sr.agingSite >= 0 ? `${fmtInt(sr.agingSite)} ngày` : "—";
            const ageC = sr.agingComp >= 0 ? `${fmtInt(sr.agingComp)}d` : "—";
            pivotRowsHtml += `
              <tr class="bs-serial-sub-row ${hlSn}">
                <td class="bs-serial-indent mono">
                  <button type="button" class="link-sku-btn" data-bs-open-sn="${esc(sr.sn)}" data-bs-parent-sku="${esc(item.sku)}" title="Mở Tra cứu 360° cho Serial ${esc(sr.sn)}">${esc(sr.sn)}</button>
                </td>
                <td>
                  <span class="mono"><strong>${esc(sGroup.siteCode)}</strong></span> • BIN: <span class="mono">${esc(sr.loc)}</span>
                  <span class="inv-badge ${binBadgeClass(sr.binType)}">${esc(sr.binType)}</span>
                </td>
                <td>
                  <span class="inv-badge ${badStockBadgeClass(sr.badComp)}" title="Loại tồn Công ty">Cty: ${esc(sr.badComp)}</span>
                  <span class="inv-badge ${badStockBadgeClass(sr.badSite)}" title="Loại tồn Chi nhánh">Site: ${esc(sr.badSite)}</span>
                </td>
                <td class="num mono">1</td>
                <td class="num mono"><strong>${fmtInt(sr.val)}</strong></td>
                <td class="num">
                  <span class="aging-tag ${sr.agingSite > 180 ? "old" : "mid"}">${ageS}</span>
                  <span class="mono muted" style="font-size:10px;margin-left:4px">(Cty: ${ageC})</span>
                </td>
                <td class="mono">
                  <strong>${esc(sr.lastDate)}</strong>
                  <span class="muted" style="font-size:10px;margin-left:4px">(Cty: ${esc(sr.firstDate)})</span>
                </td>
                <td class="num">${fmtVel(sGroup.s7d)}</td>
                <td class="num">${fmtVel(sGroup.s30d)}</td>
                <td class="num">${fmtVel(sGroup.s90d)}</td>
                <td class="num">${fmtVel(sGroup.s180d)}</td>
              </tr>`;
          });
        });

        bodyHtml += `
          <tr class="bs-pivot-tr">
            <td colspan="9">
              <div class="bs-pivot-box">
                <div class="bs-pivot-header">
                  <div class="bs-pivot-title">
                    <span>↳ Bảng Pivot Chi tiết Serial &amp; Phân bổ theo Site — SKU <strong class="mono">${esc(item.sku)}</strong> (${fmtInt(item.qty)} Serial tại ${fmtInt(item.sitesMap.size)} Site)</span>
                  </div>
                  <span class="panel-hint">Sức bán 7D / 30D / 90D / 180D bên dưới là sức bán thực tế của SKU tại từng Site tương ứng</span>
                </div>
                <table class="bs-pivot-table">
                  <thead>
                    <tr>
                      <th>Site / Serial Number</th>
                      <th>Kho &amp; Vị trí BIN</th>
                      <th>Phân loại Bad Stock (Cty / Site)</th>
                      <th class="num">Số lượng</th>
                      <th class="num">Giá trị (VND)</th>
                      <th class="num">Tuổi Site (kèm Tuổi Cty)</th>
                      <th>Ngày nhập Site (kèm Nhập Cty)</th>
                      <th class="num">Bán Site 7D</th>
                      <th class="num">Bán Site 30D</th>
                      <th class="num">Bán Site 90D</th>
                      <th class="num">Bán Site 180D</th>
                    </tr>
                  </thead>
                  <tbody>${pivotRowsHtml}</tbody>
                </table>
              </div>
            </td>
          </tr>`;
      }
    });

    tbody.innerHTML = bodyHtml;

    // Bind row expand/collapse and 360° lookup links
    tbody.querySelectorAll("tr.bs-sku-row[data-bs-sku]").forEach((tr) => {
      tr.addEventListener("click", (e) => {
        if (e.target.closest("[data-bs-open-lookup]")) return;
        const sku = tr.dataset.bsSku;
        if (bs.expandedSkus.has(sku)) bs.expandedSkus.delete(sku);
        else bs.expandedSkus.add(sku);
        renderBadStockView();
      });
    });

    tbody.querySelectorAll("[data-bs-open-lookup]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        openSkuOrSerialInspector(btn.dataset.bsOpenLookup, "");
      });
    });

    tbody.querySelectorAll("[data-bs-open-sn]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        openSkuOrSerialInspector(btn.dataset.bsParentSku, btn.dataset.bsOpenSn);
      });
    });

    // Prepare comprehensive CSV export (flattened SKU + Site + Serial rows)
    const exportRows = [];
    skuList.forEach((item) => {
      const sortedSites = Array.from(item.sitesMap.values()).sort((a, b) => b.qty - a.qty);
      sortedSites.forEach((sGroup) => {
        sGroup.serials.forEach((sr) => {
          exportRows.push([
            item.sku,
            item.name,
            item.brand,
            item.subcat,
            item.status,
            item.range,
            item.qty,
            Math.round(item.val),
            item.maxAgingComp,
            item.earliestCompDate,
            item.s7d,
            item.s30d,
            item.s90d,
            item.s180d,
            sr.sn,
            sGroup.siteCode,
            sGroup.siteName,
            sr.loc,
            sr.binType,
            sr.badComp,
            sr.badSite,
            1,
            Math.round(sr.val),
            sr.agingSite,
            sr.lastDate,
            sGroup.s7d,
            sGroup.s30d,
            sGroup.s90d,
            sGroup.s180d,
          ]);
        });
      });
    });

    bs.lastExport = {
      headers: [
        "SKU", "Tên Sản phẩm", "Brand", "Subcat 2", "TT Mua", "Range",
        "Tổng SL Bad Stock (SKU)", "Tổng Giá trị Bad Stock (SKU)", "Max Tuổi Cty (Ngày)", "Ngày nhập Cty sớm nhất",
        "Sức bán Cty 7D", "Sức bán Cty 30D", "Sức bán Cty 90D", "Sức bán Cty 180D",
        "Serial Number", "Site Code", "Tên Site", "Vị trí BIN", "BIN Type",
        "Loại tồn (Cty)", "Loại tồn (Site)", "SL Serial", "Giá trị Serial (VND)",
        "Tuổi Site (Ngày)", "Ngày nhập Site",
        "Sức bán Site 7D", "Sức bán Site 30D", "Sức bán Site 90D", "Sức bán Site 180D",
      ],
      rows: exportRows,
      filename: `bad_stock_sku_serial_pivot_${new Date().toISOString().slice(0, 10)}.csv`,
    };
  }

  // =========================================================================
  // UPDATE DATA ENGINE: CLIENT-SIDE ZERO-PII EXCEL ETL + NETLIFY BLOBS SYNC
  // =========================================================================
  let toastTimer = null;
  function showToast(msg, isError = false) {
    const el = document.getElementById("toastNotice");
    if (!el) return;
    el.textContent = msg;
    el.classList.toggle("error", Boolean(isError));
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 4200);
  }

  function parseExcelDateJs(rawVal) {
    if (rawVal === null || rawVal === undefined) return null;
    if (rawVal instanceof Date && !isNaN(rawVal.getTime())) {
      return {
        y: rawVal.getFullYear(),
        m: rawVal.getMonth() + 1,
        d: rawVal.getDate(),
      };
    }
    const s = String(rawVal).trim();
    if (!s) return null;

    // Excel serial number (same logic as scripts/build_data.py)
    const num = Number(s);
    if (isFinite(num) && num >= 30000 && num <= 70000) {
      const dt = new Date(Date.UTC(1899, 11, 30) + Math.floor(num) * 86400000);
      return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
    }

    // YYYY-MM-DD or YYYY/MM/DD
    let m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (m) return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) };

    // DD.MM.YY or DD.MM.YYYY or DD/MM/YYYY
    m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
    if (m) {
      let a = Number(m[1]), b = Number(m[2]), y = Number(m[3]);
      if (y < 100) y += 2000;
      // If first number > 12 it is definitely DD/MM; otherwise assume DD/MM (VN/Excel export convention)
      let d = a, mo = b;
      if (b > 12 && a <= 12) { mo = a; d = b; }
      if (mo >= 1 && mo <= 12 && d >= 1 && d <= 31) return { y, m: mo, d };
    }
    return null;
  }

  function formatDateParts(p) {
    const yy = String(p.y).padStart(4, "0");
    const mm = String(p.m).padStart(2, "0");
    const dd = String(p.d).padStart(2, "0");
    return { iso: `${yy}-${mm}-${dd}`, month: `${yy}-${mm}` };
  }

  function getIsoWeekJs(y, m, d) {
    const dt = new Date(Date.UTC(y, m - 1, d));
    const dayNum = dt.getUTCDay() || 7;
    dt.setUTCDate(dt.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((dt - yearStart) / 86400000) + 1) / 7);
    return `${dt.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
  }

  function extractCatCodeJs(rawVal) {
    const s = String(rawVal ?? "").trim();
    const m = s.match(/^(NH\d+)/i);
    const code = m ? m[1].toUpperCase() : (s ? s.split("-")[0].trim().toUpperCase() : "KHÁC");
    return code === "NH03" ? "NH93" : code;
  }

  function cleanSubcatJs(val, code = "", name = "", cat3Code = "") {
    const s = String(val ?? "").trim();
    if (s) {
      const m = s.match(/^(NH\d+(?:-\d+)+)\s*-\s*(.+)$/i);
      if (m) return `${m[1].toUpperCase()}-${m[2].trim()}`;
      return s;
    }
    let c = String(code ?? "").trim().toUpperCase();
    const n = String(name ?? "").trim();
    if (!c && cat3Code) {
      const parts = String(cat3Code).trim().toUpperCase().split("-");
      if (parts.length >= 3) c = parts.slice(0, 3).join("-");
    }
    if (c && n) return `${c}-${n}`;
    return c || n || "Khác";
  }

  function parseNumericVal(v) {
    if (typeof v === "number") return isFinite(v) ? v : 0;
    if (v === null || v === undefined) return 0;
    const s = String(v).trim().replace(/,/g, "");
    if (!s) return 0;
    const n = Number(s);
    return isFinite(n) ? n : 0;
  }

  function findHeaderValue(recLower, candidates) {
    for (let i = 0; i < candidates.length; i++) {
      const val = recLower[candidates[i]];
      if (val !== undefined && val !== null && String(val).trim() !== "") return val;
    }
    return null;
  }

  function extractExistingRecords(payload) {
    if (!payload || !Array.isArray(payload.rows) || !payload.lookups) return [];
    const { rows, lookups, siteDirectory = {} } = payload;
    return rows.map((r) => {
      const site = lookups.sites[r[C.SITE]] || "UNKNOWN";
      const store = lookups.stores[r[C.STORE]] || site;
      const reg = lookups.regions[r[C.REGION]] || "";
      const ch = lookups.channels[r[C.CHANNEL]] || "Other";
      const rawReg = siteDirectory[site]?.rawRegion ?? (reg.startsWith("Non-Store") ? "" : reg);
      const skuLabel = lookups.skus[r[C.SKU]] || "";
      const dashIdx = skuLabel.indexOf(" — ");
      const skuCode = dashIdx >= 0 ? skuLabel.slice(0, dashIdx) : "";
      const skuName = dashIdx >= 0 ? skuLabel.slice(dashIdx + 3) : skuLabel;
      return {
        "report date": r[C.DATE],
        "sales site code": site,
        "store name": store,
        "region name": rawReg,
        "sales channel": ch,
        "subcat 2 (code - name)": lookups.subcats[r[C.SUBCAT]] || "Khác",
        "brand name": lookups.brands[r[C.BRAND]] || "Khác",
        "order type": lookups.orderTypes[r[C.ORDER_TYPE]] || "don_xuat_ban",
        "sku": skuCode,
        "sku name": skuName,
        "sales qty": r[C.QTY],
        "sales": r[C.SALES],
        "cogs": r[C.COGS],
        "gp": r[C.GP],
      };
    });
  }

  function buildPayloadFromRecords(rawRecords, sourceMeta) {
    const lookups = {
      categories: [],
      cats: [],
      sites: [],
      stores: [],
      regions: [],
      channels: [],
      subcats: [],
      brands: [],
      orderTypes: [],
      skus: ["Tổng hợp theo Nhóm/Site"],
      months: [],
    };
    const lookupMaps = {};
    Object.keys(lookups).forEach((k) => { lookupMaps[k] = new Map(); });

    const getIdx = (key, val) => {
      const m = lookupMaps[key];
      if (!m.has(val)) {
        m.set(val, lookups[key].length);
        lookups[key].push(val);
      }
      return m.get(val);
    };

    const cubeMap = new Map();
    const siteDirectory = {};
    let totSales = 0, totQty = 0, totCogs = 0, totGp = 0, validRows = 0;
    let minDate = null, maxDate = null;
    let bulkCount = 0, bulkSales = 0, bulkQty = 0;

    for (let i = 0; i < rawRecords.length; i++) {
      const rec = rawRecords[i];
      const rawDate = findHeaderValue(rec, ["report date", "report_date", "date", "ngày báo cáo"]);
      const dp = parseExcelDateJs(rawDate);
      if (!dp) continue;
      validRows++;

      const { iso: dateIso, month: monthStr } = formatDateParts(dp);
      if (!minDate || dateIso < minDate) minDate = dateIso;
      if (!maxDate || dateIso > maxDate) maxDate = dateIso;

      const site = String(findHeaderValue(rec, ["sales site code", "site code", "site"]) || "UNKNOWN").trim();
      const store = String(findHeaderValue(rec, ["store name", "store"]) || "").trim() || site;
      const rawRegion = String(findHeaderValue(rec, ["region name", "region"]) || "").trim();
      const channel = String(findHeaderValue(rec, ["sales channel", "channel"]) || "Other").trim();
      const region = rawRegion || `Non-Store (${channel})`;
      const rawCat = String(findHeaderValue(rec, ["cat name", "category"]) || "").trim();
      const subcat = cleanSubcatJs(findHeaderValue(rec, ["subcat 2 (code - name)", "subcat 2", "subcat"]) || "");
      const cat = extractCatCodeJs(rawCat || subcat);
      const brand = String(findHeaderValue(rec, ["brand name", "brand"]) || "Khác").trim();
      const orderType = String(findHeaderValue(rec, ["order type", "order_type"]) || "don_xuat_ban").trim();

      const qty = Math.round(parseNumericVal(findHeaderValue(rec, ["sales qty", "qty", "quantity"])));
      const sales = Math.round(parseNumericVal(findHeaderValue(rec, ["sales", "revenue", "doanh thu"])) * 100) / 100;
      const cogs = Math.round(parseNumericVal(findHeaderValue(rec, ["cogs", "giá vốn"])) * 100) / 100;
      const gp = Math.round(parseNumericVal(findHeaderValue(rec, ["gp", "gross profit", "lợi nhuận"])) * 100) / 100;

      totSales += sales;
      totQty += qty;
      totCogs += cogs;
      totGp += gp;

      const isBulk = Math.abs(qty) >= 100 ? 1 : 0;
      if (isBulk) {
        bulkCount++;
        bulkSales += sales;
        bulkQty += qty;
      }

      if (!siteDirectory[site]) {
        siteDirectory[site] = {
          siteCode: site,
          storeName: store,
          region,
          rawRegion,
          channel,
        };
      }

      const mIdx = getIdx("months", monthStr);
      const sIdx = getIdx("sites", site);
      getIdx("stores", store);
      const rIdx = getIdx("regions", region);
      const chIdx = getIdx("channels", channel);
      const catIdx = getIdx("categories", cat);
      const subIdx = getIdx("subcats", subcat);
      const bIdx = getIdx("brands", brand);
      const oIdx = getIdx("orderTypes", orderType);

      const cKey = `${mIdx}|${sIdx}|${rIdx}|${chIdx}|${catIdx}|${subIdx}|${bIdx}|${oIdx}|${isBulk}`;
      let agg = cubeMap.get(cKey);
      if (!agg) {
        agg = [mIdx, sIdx, rIdx, chIdx, catIdx, subIdx, bIdx, oIdx, isBulk, 0, 0, 0, 0, 0];
        cubeMap.set(cKey, agg);
      }
      agg[9] += qty;
      agg[10] += sales;
      agg[11] += cogs;
      agg[12] += gp;
      agg[13] += 1;
    }

    lookups.cats = lookups.categories;
    const salesCube = Array.from(cubeMap.values()).map((r) => {
      r[10] = Math.round(r[10]);
      r[11] = Math.round(r[11]);
      r[12] = Math.round(r[12]);
      return r;
    });

    const payload = {
      schemaVersion: 3,
      meta: {
        generatedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sources: sourceMeta,
        rowCount: validRows,
        cubeRowCount: salesCube.length,
        dateMin: minDate,
        dateMax: maxDate,
        totals: {
          sales: Math.round(totSales * 100) / 100,
          qty: totQty,
          cogs: Math.round(totCogs * 100) / 100,
          gp: Math.round(totGp * 100) / 100,
          gmPct: totSales ? Math.round((totGp / totSales) * 10000) / 100 : 0,
        },
        bulkOutliers: {
          thresholdQty: 100,
          rowCount: bulkCount,
          sales: Math.round(bulkSales * 100) / 100,
          qty: bulkQty,
        },
      },
      lookups,
      siteDirectory,
      salesCube,
    };
    return normalizePayloadOnLoad(payload);
  }

  function extractExistingInvRecords(invSection) {
    if (!invSection || !Array.isArray(invSection.rows) || !invSection.lookups) return [];
    const { rows, lookups } = invSection;
    return rows.map((r) => {
      const skuLabel = lookups.skus[r[INV_C.SKU]] || "";
      const dashIdx = skuLabel.indexOf(" — ");
      const skuCode = dashIdx >= 0 ? skuLabel.slice(0, dashIdx) : skuLabel;
      const skuName = dashIdx >= 0 ? skuLabel.slice(dashIdx + 3) : "";
      return {
        "sku": skuCode,
        "sku name": skuName,
        "site code": lookups.sites[r[INV_C.SITE]] || "UNKNOWN",
        "site name": lookups.siteNames[r[INV_C.SITE_NAME]] || "",
        "subcat 2 (code - name)": lookups.subcats[r[INV_C.SUBCAT]] || "Khác",
        "brand name": lookups.brands[r[INV_C.BRAND]] || "Khác",
        "bin code": lookups.binCodes[r[INV_C.BIN_CODE]] || "N/A",
        "bin type": lookups.binTypes[r[INV_C.BIN_TYPE]] || "Khác",
        "bin zone": lookups.binZones[r[INV_C.BIN_ZONE]] || "Khác",
        "purchase status": lookups.purchaseStatuses[r[INV_C.STATUS]] || "Normal",
        "last received date": r[INV_C.LAST_RECV] || null,
        "first received date": r[INV_C.FIRST_RECV] || null,
        "inventory qty": r[INV_C.QTY],
        "inventory": r[INV_C.VALUE],
        "included price protection & so si no condition": r[INV_C.NET_VALUE],
        "unit cost": r[INV_C.UNIT_COST],
        "listed price": r[INV_C.LISTED_PRICE],
        "min stock": r[INV_C.MIN_STOCK],
      };
    });
  }

  function parseNullableNumJs(v) {
    if (v === null || v === undefined) return null;
    if (typeof v === "number") return isFinite(v) ? Math.round(v * 100) / 100 : null;
    const s = String(v).trim().replace(/,/g, "");
    if (!s || /^(inf|-inf|nan|infinity|#div\/0!|#n\/a)$/i.test(s)) return null;
    const n = Number(s);
    return isFinite(n) ? Math.round(n * 100) / 100 : null;
  }

  function detectDatasetKindJs(headerSet, filename) {
    if (headerSet.has("report date")) return "sales";
    if (headerSet.has("bad stock company") || headerSet.has("bad stock site") || headerSet.has("aging company")) return "bad_stock";
    if (headerSet.has("serial number") && (headerSet.has("inv days since first received") || headerSet.has("initial import type") || headerSet.has("supplier short name"))) return "serial_details";
    if (headerSet.has("7d sales qty") && headerSet.has("site code")) return "branch_level";
    if (headerSet.has("7d sales qty")) return "sku_level";
    if (headerSet.has("subcat 3 (code - name)") || headerSet.has("has serial number") || headerSet.has("warranty period") || headerSet.has("latest quotation")) return "master_product";
    if (headerSet.has("bin code") || headerSet.has("inventory qty")) return "inv_details";
    const fn = (filename || "").toLowerCase();
    if (fn.includes("bad")) return "bad_stock";
    if (fn.includes("serial")) return "serial_details";
    if (fn.includes("branch")) return "branch_level";
    if (fn.includes("sku")) return "sku_level";
    if (fn.includes("master")) return "master_product";
    if (fn.includes("inv") || fn.includes("stock")) return "inv_details";
    return "sales";
  }

  function buildMasterProductsJs(rawRecords, sourceMeta) {
    if (!rawRecords.length) return { section: null, masterMap: new Map() };
    const lookups = { categories: [], cats: [], subcats: [], subcat3s: [], brands: [], listings: [], purchaseStatuses: [], ranges: [], promoAlerts: [] };
    const maps = {};
    Object.keys(lookups).forEach((k) => { maps[k] = new Map(); });
    const getIdx = (k, v) => { const m = maps[k]; if (!m.has(v)) { m.set(v, lookups[k].length); lookups[k].push(v); } return m.get(v); };

    const rows = [];
    const masterMap = new Map();
    const statusCounts = {}, rangeCounts = {};
    for (let i = 0; i < rawRecords.length; i++) {
      const rec = rawRecords[i];
      const sku = String(findHeaderValue(rec, ["sku"]) || "").trim();
      if (!sku) continue;
      const name = String(findHeaderValue(rec, ["sku name"]) || "").trim();
      const rawCat = String(findHeaderValue(rec, ["category"]) || "").trim();
      const subcat = cleanSubcatJs(findHeaderValue(rec, ["subcat 2 (code - name)", "subcat 2"]) || "");
      const cat = extractCatCodeJs(rawCat || subcat);
      const subcat3 = String(findHeaderValue(rec, ["subcat 3 (code - name)"]) || "").trim();
      const brand = String(findHeaderValue(rec, ["brand name"]) || "Khác").trim();
      const listing = String(findHeaderValue(rec, ["product listing"]) || "active").trim();
      const pstatus = String(findHeaderValue(rec, ["purchase status"]) || "Normal").trim();
      const rng = String(findHeaderValue(rec, ["range"]) || "No").trim() || "No";
      const hasSerial = String(findHeaderValue(rec, ["has serial number"]) || "").trim().toLowerCase() === "yes" ? 1 : 0;
      const promo = String(findHeaderValue(rec, ["promotion alert"]) || "").trim();
      const listed = Math.round(parseNumericVal(findHeaderValue(rec, ["listed price"])) * 100) / 100;
      const srPromo = Math.round(parseNumericVal(findHeaderValue(rec, ["sr min promotion price"])) * 100) / 100;
      const wcogs = Math.round(parseNumericVal(findHeaderValue(rec, ["w.cogs no vat"])) * 100) / 100;
      const lastPur = Math.round(parseNumericVal(findHeaderValue(rec, ["last pur price no vat"])) * 100) / 100;
      const latestQuote = Math.round(parseNumericVal(findHeaderValue(rec, ["latest quotation"])) * 100) / 100;
      const tempGp = Math.round(parseNumericVal(findHeaderValue(rec, ["temporary gp"])) * 100) / 100;
      const rawGm = parseNullableNumJs(findHeaderValue(rec, ["temporary gm"]));
      const tempGm = rawGm !== null ? Math.round(rawGm * 10000) / 100 : null;
      const invQty = Math.round(parseNumericVal(findHeaderValue(rec, ["inv qty"])));
      const invVal = Math.round(parseNumericVal(findHeaderValue(rec, ["inv"])) * 100) / 100;
      const sales30d = Math.round(parseNumericVal(findHeaderValue(rec, ["30d sales qty"])));
      const warrantyMo = Math.round(parseNumericVal(findHeaderValue(rec, ["warranty period"])));
      const warrantyNote = String(findHeaderValue(rec, ["warranty period note"]) || "").trim();

      statusCounts[pstatus] = (statusCounts[pstatus] || 0) + 1;
      rangeCounts[rng] = (rangeCounts[rng] || 0) + 1;
      masterMap.set(sku, { sku, name, cat, subcat, brand, listing, purchaseStatus: pstatus, range: rng });

      rows.push([
        sku, name, getIdx("categories", cat), getIdx("subcats", subcat), getIdx("subcat3s", subcat3), getIdx("brands", brand),
        getIdx("listings", listing), getIdx("purchaseStatuses", pstatus), getIdx("ranges", rng),
        hasSerial, getIdx("promoAlerts", promo), listed, srPromo, wcogs, lastPur, latestQuote,
        tempGp, tempGm, invQty, invVal, sales30d, warrantyMo, warrantyNote,
      ]);
    }
    lookups.cats = lookups.categories;
    return { section: { meta: { sources: sourceMeta, rowCount: rows.length, statusCounts, rangeCounts }, lookups, rows }, masterMap };
  }

  function buildSkuLevelJs(rawRecords, sourceMeta, masterMap) {
    if (!rawRecords.length) return null;
    const rows = [];
    let s7t = 0, s30t = 0, s90t = 0, s180t = 0, qT = 0, vT = 0;
    for (let i = 0; i < rawRecords.length; i++) {
      const rec = rawRecords[i];
      const sku = String(findHeaderValue(rec, ["sku"]) || "").trim();
      if (!sku) continue;
      const mp = masterMap.get(sku) || {};
      const subcat = cleanSubcatJs(findHeaderValue(rec, ["subcat 2 (code - name)"]) || "") || mp.subcat || "Khác";
      const cat = extractCatCodeJs(subcat !== "Khác" ? subcat : (mp.cat || "KHÁC"));
      const s7 = Math.round(parseNumericVal(findHeaderValue(rec, ["7d sales qty"])));
      const s30 = Math.round(parseNumericVal(findHeaderValue(rec, ["30d sales qty"])));
      const s90 = Math.round(parseNumericVal(findHeaderValue(rec, ["90d sales qty"])));
      const s180 = Math.round(parseNumericVal(findHeaderValue(rec, ["180d sales qty"])));
      const rawGm = parseNullableNumJs(findHeaderValue(rec, ["gm (%)"]));
      const gm = rawGm !== null ? Math.round(rawGm * 10000) / 100 : null;
      const sdays = parseNullableNumJs(findHeaderValue(rec, ["current s.days"]));
      const invQty = Math.round(parseNumericVal(findHeaderValue(rec, ["inv qty"])));
      const invVal = Math.round(parseNumericVal(findHeaderValue(rec, ["inv"])) * 100) / 100;
      const unitCost = Math.round(parseNumericVal(findHeaderValue(rec, ["unit cost"])) * 100) / 100;
      const listed = Math.round(parseNumericVal(findHeaderValue(rec, ["listed price"])) * 100) / 100;
      const pstatus = String(findHeaderValue(rec, ["purchase status"]) || mp.purchaseStatus || "Normal").trim();
      const rng = String(mp.range || "No").trim();
      s7t += s7; s30t += s30; s90t += s90; s180t += s180; qT += invQty; vT += invVal;
      rows.push([
        sku, String(findHeaderValue(rec, ["sku name"]) || mp.name || "").trim(),
        subcat,
        String(findHeaderValue(rec, ["brand name"]) || "Khác").trim(),
        pstatus, rng, s7, s30, s90, s180, gm, sdays, invQty, invVal, unitCost, listed, cat,
      ]);
    }
    rows.sort((a, b) => b[SKU_C.INV_VAL] - a[SKU_C.INV_VAL]);
    return {
      meta: { sources: sourceMeta, rowCount: rows.length, totals: { sales7d: s7t, sales30d: s30t, sales90d: s90t, sales180d: s180t, invQty: qT, invVal: Math.round(vT * 100) / 100 } },
      rows,
    };
  }

  function buildBranchLevelJs(rawRecords, sourceMeta) {
    if (!rawRecords.length) return null;
    const lookups = { sites: [], siteNames: [] };
    const maps = { sites: new Map(), siteNames: new Map() };
    const getIdx = (k, v) => { const m = maps[k]; if (!m.has(v)) { m.set(v, lookups[k].length); lookups[k].push(v); } return m.get(v); };
    const rows = [];
    for (let i = 0; i < rawRecords.length; i++) {
      const rec = rawRecords[i];
      const sku = String(findHeaderValue(rec, ["sku"]) || "").trim();
      if (!sku) continue;
      const site = String(findHeaderValue(rec, ["site code"]) || "UNKNOWN").trim();
      const siteName = String(findHeaderValue(rec, ["site name"]) || "").trim() || site;
      rows.push([
        sku, getIdx("sites", site), getIdx("siteNames", siteName),
        Math.round(parseNumericVal(findHeaderValue(rec, ["7d sales qty"]))),
        Math.round(parseNumericVal(findHeaderValue(rec, ["30d sales qty"]))),
        Math.round(parseNumericVal(findHeaderValue(rec, ["90d sales qty"]))),
        Math.round(parseNumericVal(findHeaderValue(rec, ["180d sales qty"]))),
        parseNullableNumJs(findHeaderValue(rec, ["current s.days"])),
        Math.round(parseNumericVal(findHeaderValue(rec, ["inv qty"]))),
        Math.round(parseNumericVal(findHeaderValue(rec, ["inv"])) * 100) / 100,
        Math.round(parseNumericVal(findHeaderValue(rec, ["unit cost"])) * 100) / 100,
      ]);
    }
    rows.sort((a, b) => b[BR_C.INV_VAL] - a[BR_C.INV_VAL]);
    return { meta: { sources: sourceMeta, rowCount: rows.length }, lookups, rows };
  }

  function buildSerialsAndBadStockJs(serialRaw, badRaw, serialSrc, badSrc, masterMap) {
    if (!serialRaw.length && !badRaw.length) return null;
    const badBySn = new Map();
    for (let i = 0; i < badRaw.length; i++) {
      const rec = badRaw[i];
      const sn = String(findHeaderValue(rec, ["serial number"]) || "").trim();
      if (!sn) continue;
      const dc = parseExcelDateJs(findHeaderValue(rec, ["date import company"]));
      const ds = parseExcelDateJs(findHeaderValue(rec, ["date import site"]));
      const sub2 = cleanSubcatJs("", findHeaderValue(rec, ["subcat 2 code"]), findHeaderValue(rec, ["subcat 2 name"]));
      const cat = extractCatCodeJs(findHeaderValue(rec, ["category code"]) || sub2);
      badBySn.set(sn, {
        sku: String(findHeaderValue(rec, ["sku"]) || "").trim(),
        skuName: String(findHeaderValue(rec, ["sku name"]) || "").trim(),
        site: String(findHeaderValue(rec, ["site code"]) || "UNKNOWN").trim(),
        cat,
        subcat: sub2,
        brand: String(findHeaderValue(rec, ["brand name"]) || "Khác").trim(),
        purchaseStatus: String(findHeaderValue(rec, ["purchase status"]) || "Normal").trim(),
        loc: String(findHeaderValue(rec, ["location code"]) || "N/A").trim(),
        binType: String(findHeaderValue(rec, ["bin type"]) || "Hàng bán mới tại kho").trim(),
        binZone: String(findHeaderValue(rec, ["bin zone"]) || "Khác").trim(),
        dateComp: dc ? formatDateParts(dc).iso : "",
        agingComp: Math.round(parseNumericVal(findHeaderValue(rec, ["aging company"]))),
        sdayComp: Math.round(parseNumericVal(findHeaderValue(rec, ["stock day company"]))),
        badComp: String(findHeaderValue(rec, ["bad stock company"]) || "Tồn thông thường").trim(),
        dateSite: ds ? formatDateParts(ds).iso : "",
        agingSite: Math.round(parseNumericVal(findHeaderValue(rec, ["aging site"]))),
        sdaySite: Math.round(parseNumericVal(findHeaderValue(rec, ["stock day site"]))),
        badSite: String(findHeaderValue(rec, ["bad stock site"]) || "Tồn thông thường").trim(),
        invVal: Math.round(parseNumericVal(findHeaderValue(rec, ["inventory"])) * 100) / 100,
      });
    }

    const lookups = {
      categories: [], cats: [], sites: [], subcats: [], brands: [], suppliers: [], locations: [], binTypes: [],
      binZones: [], importTypes: [], purchaseStatuses: [], ranges: [], badComp: [], badSite: [],
    };
    const maps = {};
    Object.keys(lookups).forEach((k) => { maps[k] = new Map(); });
    const getIdx = (k, v) => { const m = maps[k]; if (!m.has(v)) { m.set(v, lookups[k].length); lookups[k].push(v); } return m.get(v); };

    const rows = [];
    const seen = new Set();
    let totVal = 0, totNet = 0, clsCnt = 0, clsVal = 0, riskCnt = 0, riskVal = 0;

    for (let i = 0; i < serialRaw.length; i++) {
      const rec = serialRaw[i];
      const sn = String(findHeaderValue(rec, ["serial number"]) || "").trim();
      if (!sn) continue;
      seen.add(sn);
      const sku = String(findHeaderValue(rec, ["sku"]) || "").trim();
      const skuName = String(findHeaderValue(rec, ["sku name"]) || "").trim();
      const mp = masterMap.get(sku) || {};
      const bs = badBySn.get(sn) || null;
      const site = String(findHeaderValue(rec, ["site code"]) || (bs ? bs.site : "UNKNOWN")).trim();
      const cat3 = String(findHeaderValue(rec, ["category code"]) || "").trim();
      const sub2Name = String(findHeaderValue(rec, ["subcat 2 name"]) || "").trim();
      const subcat = (bs ? bs.subcat : "") || mp.subcat || cleanSubcatJs("", "", sub2Name, cat3);
      const cat = (bs ? bs.cat : "") || mp.cat || extractCatCodeJs(cat3 || subcat);
      const brand = String(findHeaderValue(rec, ["brand name"]) || mp.brand || "Khác").trim();
      const supplier = String(findHeaderValue(rec, ["supplier short name"]) || "").trim() || "Không rõ NCC";
      const loc = String(findHeaderValue(rec, ["location code"]) || "N/A").trim();
      const binType = String(findHeaderValue(rec, ["bin type"]) || (bs ? bs.binType : "Khác")).trim();
      const binZone = String(findHeaderValue(rec, ["bin zone"]) || (bs ? bs.binZone : "Khác")).trim();
      const impType = String(findHeaderValue(rec, ["initial import type"]) || "").trim() || "Khác";
      const pstatus = String((bs ? bs.purchaseStatus : "") || mp.purchaseStatus || "Normal").trim();
      const rng = String(mp.range || "No").trim() || "No";

      const fd = parseExcelDateJs(findHeaderValue(rec, ["first received date"]));
      const ld = parseExcelDateJs(findHeaderValue(rec, ["last received date"]));
      const dFirst = parseNullableNumJs(findHeaderValue(rec, ["inv days since first received"]));
      const dLast = parseNullableNumJs(findHeaderValue(rec, ["inv days since last received"]));
      const daysFirst = dFirst !== null ? Math.round(dFirst) : -1;
      const daysLast = dLast !== null ? Math.round(dLast) : -1;
      const invVal = Math.round(parseNumericVal(findHeaderValue(rec, ["inventory"])) * 100) / 100;
      let netVal = Math.round(parseNumericVal(findHeaderValue(rec, ["included price protection"])) * 100) / 100;
      if (netVal === 0 && invVal !== 0) netVal = invVal;
      const ppVal = Math.round(parseNumericVal(findHeaderValue(rec, ["price protection"])) * 100) / 100;

      const badComp = bs ? bs.badComp : `Không phân loại (${binType})`;
      const badSite = bs ? bs.badSite : `Không phân loại (${binType})`;
      totVal += invVal; totNet += netVal;
      if (bs) {
        clsCnt++; clsVal += invVal;
        if (badComp !== "Tồn thông thường") { riskCnt++; riskVal += invVal; }
      }

      rows.push([
        sn, sku, skuName, getIdx("sites", site), getIdx("subcats", subcat), getIdx("brands", brand),
        getIdx("suppliers", supplier), getIdx("locations", loc), getIdx("binTypes", binType),
        getIdx("binZones", binZone), getIdx("importTypes", impType), getIdx("purchaseStatuses", pstatus),
        getIdx("ranges", rng), fd ? formatDateParts(fd).iso : "", ld ? formatDateParts(ld).iso : "",
        daysFirst, daysLast, invVal, netVal, ppVal, bs ? 1 : 0,
        bs ? bs.agingComp : daysFirst, bs ? bs.agingSite : daysLast,
        bs ? bs.sdayComp : 0, bs ? bs.sdaySite : 0, getIdx("badComp", badComp), getIdx("badSite", badSite),
        getIdx("categories", cat),
      ]);
    }

    badBySn.forEach((bs, sn) => {
      if (seen.has(sn)) return;
      const mp = masterMap.get(bs.sku) || {};
      const rng = String(mp.range || "No").trim() || "No";
      totVal += bs.invVal; totNet += bs.invVal; clsCnt++; clsVal += bs.invVal;
      if (bs.badComp !== "Tồn thông thường") { riskCnt++; riskVal += bs.invVal; }
      rows.push([
        sn, bs.sku, bs.skuName, getIdx("sites", bs.site), getIdx("subcats", bs.subcat), getIdx("brands", bs.brand),
        getIdx("suppliers", "Không rõ NCC"), getIdx("locations", bs.loc), getIdx("binTypes", bs.binType),
        getIdx("binZones", bs.binZone), getIdx("importTypes", "Khác"), getIdx("purchaseStatuses", bs.purchaseStatus),
        getIdx("ranges", rng), bs.dateComp, bs.dateSite, bs.agingComp, bs.agingSite,
        bs.invVal, bs.invVal, 0, 1, bs.agingComp, bs.agingSite, bs.sdayComp, bs.sdaySite,
        getIdx("badComp", bs.badComp), getIdx("badSite", bs.badSite),
        getIdx("categories", bs.cat || mp.cat || extractCatCodeJs(bs.subcat)),
      ]);
    });

    lookups.cats = lookups.categories;
    rows.sort((a, b) => b[SN_C.INV_VAL] - a[SN_C.INV_VAL]);
    return {
      meta: {
        sources: serialSrc.concat(badSrc),
        rowCount: rows.length,
        classifiedCount: clsCnt,
        classifiedValue: Math.round(clsVal * 100) / 100,
        badRiskCount: riskCnt,
        badRiskValue: Math.round(riskVal * 100) / 100,
        totalValue: Math.round(totVal * 100) / 100,
        totalNetValue: Math.round(totNet * 100) / 100,
      },
      lookups,
      rows,
    };
  }

  function buildInventoryPayloadFromRecords(rawRecords, sourceMeta, masterMap = new Map()) {
    const lookups = {
      categories: [],
      cats: [],
      sites: [],
      siteNames: [],
      subcats: [],
      brands: [],
      binCodes: [],
      binTypes: [],
      binZones: [],
      purchaseStatuses: [],
      ranges: [],
      skus: [],
    };
    const lookupMaps = {};
    Object.keys(lookups).forEach((k) => { lookupMaps[k] = new Map(); });
    const getIdx = (key, val) => {
      const m = lookupMaps[key];
      if (!m.has(val)) {
        m.set(val, lookups[key].length);
        lookups[key].push(val);
      }
      return m.get(val);
    };

    let maxIso = "";
    for (let i = 0; i < rawRecords.length; i++) {
      const dp = parseExcelDateJs(findHeaderValue(rawRecords[i], ["last received date"]));
      if (dp) {
        const iso = formatDateParts(dp).iso;
        if (!maxIso || iso > maxIso) maxIso = iso;
      }
    }
    const snapshotIso = maxIso || new Date().toISOString().slice(0, 10);
    const [sy, sm, sd] = snapshotIso.split("-").map(Number);
    const snapshotUtcMs = Date.UTC(sy, sm - 1, sd);

    const compactRows = [];
    const siteDirectory = {};
    const uniqueSkus = new Set();
    let totQty = 0, totVal = 0, totNet = 0, totPpDone = 0, totPpProc = 0;
    let sellQty = 0, sellVal = 0, dmgQty = 0, dmgVal = 0, discQty = 0, discVal = 0;

    for (let i = 0; i < rawRecords.length; i++) {
      const rec = rawRecords[i];
      const skuCode = String(findHeaderValue(rec, ["sku", "sku code"]) || "").trim();
      if (!skuCode) continue;
      uniqueSkus.add(skuCode);
      const mp = masterMap.get(skuCode) || {};
      const skuName = String(findHeaderValue(rec, ["sku name", "product name"]) || "").trim();
      const skuLabel = skuName ? `${skuCode} — ${skuName}` : skuCode;

      const site = String(findHeaderValue(rec, ["site code", "sales site code", "site"]) || "UNKNOWN").trim();
      const siteName = String(findHeaderValue(rec, ["site name", "store name"]) || "").trim() || site;
      const rawSub = findHeaderValue(rec, ["subcat 2 (code - name)", "subcat 2", "subcat"]);
      const subcat = rawSub ? cleanSubcatJs(rawSub) : (mp.subcat || "Khác");
      const cat = subcat !== "Khác" ? extractCatCodeJs(subcat) : (mp.cat || "KHÁC");
      const brand = String(findHeaderValue(rec, ["brand name", "brand"]) || "Khác").trim();
      const binCode = String(findHeaderValue(rec, ["bin code"]) || "N/A").trim();
      const binType = String(findHeaderValue(rec, ["bin type"]) || "Khác").trim();
      const binZone = String(findHeaderValue(rec, ["bin zone"]) || "Khác").trim();
      const status = String(findHeaderValue(rec, ["purchase status"]) || mp.purchaseStatus || "Normal").trim();
      const rng = String(findHeaderValue(rec, ["range"]) || mp.range || "No").trim() || "No";

      const lastDp = parseExcelDateJs(findHeaderValue(rec, ["last received date"]));
      const firstDp = parseExcelDateJs(findHeaderValue(rec, ["first received date"]));
      const lastIso = lastDp ? formatDateParts(lastDp).iso : "";
      const firstIso = firstDp ? formatDateParts(firstDp).iso : "";
      let agingDays = -1;
      if (lastDp) agingDays = Math.max(0, Math.round((snapshotUtcMs - Date.UTC(lastDp.y, lastDp.m - 1, lastDp.d)) / 86400000));
      let agingFirst = agingDays;
      if (firstDp) agingFirst = Math.max(0, Math.round((snapshotUtcMs - Date.UTC(firstDp.y, firstDp.m - 1, firstDp.d)) / 86400000));

      const qty = Math.round(parseNumericVal(findHeaderValue(rec, ["inventory qty", "qty", "quantity"])));
      const invVal = Math.round(parseNumericVal(findHeaderValue(rec, ["inventory", "inventory value"])) * 100) / 100;
      let netVal = Math.round(parseNumericVal(findHeaderValue(rec, ["included price protection & so si no condition"])) * 100) / 100;
      if (netVal === 0 && invVal !== 0) netVal = invVal;
      let unitCost = Math.round(parseNumericVal(findHeaderValue(rec, ["unit cost", "weighted cogs novat"])) * 100) / 100;
      if (unitCost === 0 && qty > 0 && invVal > 0) unitCost = Math.round((invVal / qty) * 100) / 100;
      const listedPrice = Math.round(parseNumericVal(findHeaderValue(rec, ["listed price"])) * 100) / 100;
      const minStock = Math.round(parseNumericVal(findHeaderValue(rec, ["min stock"])));
      const ppDone = Math.round(parseNumericVal(findHeaderValue(rec, ["price protection & so si no condition completed"])) * 100) / 100;
      const ppProc = Math.round(parseNumericVal(findHeaderValue(rec, ["price protection & so si no condition in process"])) * 100) / 100;

      totQty += qty; totVal += invVal; totNet += netVal; totPpDone += ppDone; totPpProc += ppProc;
      const btLow = binType.toLowerCase();
      if (btLow.includes("bán mới")) { sellQty += qty; sellVal += invVal; }
      if (btLow.includes("hư hỏng")) { dmgQty += qty; dmgVal += invVal; }
      if (status.toLowerCase() === "discontinued") { discQty += qty; discVal += invVal; }
      if (!siteDirectory[site]) siteDirectory[site] = { siteCode: site, siteName };

      compactRows.push([
        getIdx("skus", skuLabel), getIdx("sites", site), getIdx("siteNames", siteName),
        getIdx("subcats", subcat), getIdx("brands", brand), getIdx("binCodes", binCode),
        getIdx("binTypes", binType), getIdx("binZones", binZone), getIdx("purchaseStatuses", status),
        lastIso, firstIso, agingDays, qty, invVal, netVal, unitCost, listedPrice, minStock,
        getIdx("ranges", rng), agingFirst, getIdx("categories", cat),
      ]);
    }

    lookups.cats = lookups.categories;
    compactRows.sort((a, b) => b[INV_C.VALUE] - a[INV_C.VALUE]);
    return {
      meta: {
        generatedAt: new Date().toISOString(),
        snapshotDate: snapshotIso,
        sources: sourceMeta,
        rowCount: compactRows.length,
        uniqueSkuCount: uniqueSkus.size,
        totals: {
          qty: totQty, value: Math.round(totVal * 100) / 100, netValue: Math.round(totNet * 100) / 100,
          avgUnitCost: totQty ? Math.round((totVal / totQty) * 100) / 100 : 0,
          priceProtectionCompleted: Math.round(totPpDone * 100) / 100,
          priceProtectionInProcess: Math.round(totPpProc * 100) / 100,
          sellableQty: sellQty, sellableValue: Math.round(sellVal * 100) / 100,
          damagedQty: dmgQty, damagedValue: Math.round(dmgVal * 100) / 100,
          discontinuedQty: discQty, discontinuedValue: Math.round(discVal * 100) / 100,
        },
      },
      lookups,
      siteDirectory,
      rows: compactRows,
    };
  }

  async function parseUploadedFiles(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) throw new Error("Chưa chọn file nào.");
    if (typeof XLSX === "undefined") {
      throw new Error("Thư viện đọc Excel (SheetJS) chưa tải xong. Kiểm tra kết nối mạng và thử lại.");
    }

    const buckets = { sales: [], inv_details: [], sku_level: [], branch_level: [], bad_stock: [], serial_details: [], master_product: [] };
    const sources = { sales: [], inv_details: [], sku_level: [], branch_level: [], bad_stock: [], serial_details: [], master_product: [] };

    for (let fIdx = 0; fIdx < files.length; fIdx++) {
      const file = files[fIdx];
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array", raw: true });
      let detectedKind = null;
      let fileRows = 0;

      wb.SheetNames.forEach((sheetName) => {
        const sheet = wb.Sheets[sheetName];
        if (!sheet) return;
        const rows2d = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: null });
        if (!rows2d || rows2d.length < 2) return;

        let headerRowIdx = 0;
        for (let r = 0; r < Math.min(10, rows2d.length); r++) {
          const joined = (rows2d[r] || []).map((v) => String(v || "").trim().toLowerCase());
          if (joined.includes("report date") || joined.includes("sku") || joined.includes("serial number")) {
            headerRowIdx = r;
            break;
          }
        }
        const headers = (rows2d[headerRowIdx] || []).map((h) => String(h || "").trim().toLowerCase());
        const kind = detectDatasetKindJs(new Set(headers.filter(Boolean)), file.name);
        detectedKind = kind;

        for (let r = headerRowIdx + 1; r < rows2d.length; r++) {
          const row = rows2d[r];
          if (!row || !row.length) continue;
          const firstCell = String(row[0] ?? "").trim();
          const firstLower = firstCell.toLowerCase();
          if (!firstCell || firstLower === "total" || firstLower.startsWith("applied filters")) continue;
          const rec = {};
          for (let c = 0; c < headers.length; c++) {
            const h = headers[c];
            if (h) rec[h] = c < row.length ? row[c] : null;
          }
          buckets[kind].push(rec);
          fileRows++;
        }
      });

      if (detectedKind && fileRows > 0) {
        sources[detectedKind].push({ file: file.name, sizeBytes: file.size, rows: fileRows, kind: detectedKind });
      }
    }

    const totalAny = Object.values(buckets).reduce((s, arr) => s + arr.length, 0);
    if (totalAny === 0) throw new Error("Không tìm thấy dòng dữ liệu hợp lệ nào trong thư mục gốc.");
    return { buckets, sources };
  }

  function showUpdateFeedback(msg, type = "info") {
    const el = document.getElementById("updateFeedback");
    if (!el) return;
    if (!msg) {
      el.classList.add("hidden");
      el.textContent = "";
      return;
    }
    el.className = `update-feedback ${type}`;
    el.textContent = msg;
    el.classList.remove("hidden");
  }

  function supportsDirectorySync() {
    return typeof window.showDirectoryPicker === "function" && window.isSecureContext;
  }

  function setSyncButtonsBusy(busy, label = "Đang đồng bộ...") {
    const topBtn = document.getElementById("autoSyncDataBtn");
    const topTxt = document.getElementById("autoSyncBtnText");
    const railBtn = document.getElementById("updateDataRailBtn");
    const modalSyncBtn = document.getElementById("syncNowFromModalBtn");
    if (topBtn) {
      topBtn.disabled = busy;
      topBtn.classList.toggle("is-syncing", busy);
    }
    if (topTxt) topTxt.textContent = busy ? label : "Update Data";
    if (railBtn) {
      railBtn.disabled = busy;
      railBtn.classList.toggle("is-syncing", busy);
    }
    if (modalSyncBtn) modalSyncBtn.disabled = busy;
  }

  async function refreshCloudStatus() {
    const dot = document.getElementById("cloudStatusDot");
    const txt = document.getElementById("cloudStatusText");
    const passRow = document.getElementById("passcodeRow");

    if (location.protocol !== "http:" && location.protocol !== "https:") {
      state.cloudAvailable = false;
      if (dot) dot.className = "status-dot local";
      if (txt) txt.textContent = "Đang chạy file cục bộ (Offline) — Mở website trên Netlify HTTPS để bật đồng bộ tự động từ thư mục gốc.";
      if (passRow) passRow.classList.add("hidden");
      return;
    }

    try {
      const res = await fetchWithTimeout("/api/report-data?meta=1", { cache: "no-store" }, 4000);
      const ct = res.headers.get("content-type") || "";
      if (res.ok && ct.includes("application/json")) {
        const info = await res.json();
        state.cloudAvailable = Boolean(info.cloudAvailable);
        state.cloudAuthRequired = Boolean(info.authRequired);
        if (dot) dot.className = "status-dot online";
        const lastInfo = info.exists && info.metadata?.updatedAt
          ? `Cập nhật gần nhất: ${formatIsoVn(info.metadata.updatedAt)} (${fmtInt(info.metadata.rowCount)} Sales${info.metadata.inventoryRows ? ` + ${fmtInt(info.metadata.inventoryRows)} Kho` : ""})`
          : "Đang dùng bản gốc GitHub — sẵn sàng đồng bộ Live";
        if (txt) txt.textContent = `☁ Netlify Cloud Live đã kết nối • ${lastInfo}`;
        if (passRow) passRow.classList.toggle("hidden", !state.cloudAuthRequired);
        return;
      }
    } catch {
      // ignore
    }

    state.cloudAvailable = false;
    if (dot) dot.className = "status-dot local";
    if (txt) txt.textContent = "Máy chủ hiện tại không có Netlify Function — dữ liệu đồng bộ sẽ lưu Local Cache.";
    if (passRow) passRow.classList.add("hidden");
  }

  async function refreshLinkedFolderUi() {
    const card = document.getElementById("sourceFolderCard");
    const title = document.getElementById("linkedFolderTitle");
    const sub = document.getElementById("linkedFolderSub");
    const linkBtn = document.getElementById("linkSourceFolderBtn");
    const linkLbl = document.getElementById("linkFolderBtnLabel");
    const syncNowBtn = document.getElementById("syncNowFromModalBtn");
    const unlinkBtn = document.getElementById("unlinkFolderBtn");
    if (!card || !title || !sub) return;

    if (!supportsDirectorySync()) {
      card.classList.remove("linked");
      title.textContent = "Trình duyệt chưa hỗ trợ liên kết thư mục tự động";
      sub.innerHTML = "Hãy mở <code>https://web-report-47sq.netlify.app/</code> bằng <strong>Chrome hoặc Edge</strong> trên máy tính để liên kết thư mục <code>D:\\Project_AI\\Website\\data</code>, hoặc dùng file <code>UPDATE_DATA.bat</code> trên PC.";
      if (linkBtn) linkBtn.classList.add("hidden");
      if (syncNowBtn) syncNowBtn.classList.add("hidden");
      if (unlinkBtn) unlinkBtn.classList.add("hidden");
      return;
    }

    if (linkBtn) linkBtn.classList.remove("hidden");
    const dirHandle = await idbGetSourceDir();
    if (dirHandle) {
      card.classList.add("linked");
      title.textContent = `✅ Đang liên kết thư mục gốc: "${dirHandle.name}/"`;
      sub.innerHTML = "Mỗi khi bạn cập nhật file Excel trong thư mục này, chỉ cần bấm nút <strong>Update Data</strong> ở góc trên là Web tự động đọc tất cả file <code>*.xlsx</code> và đồng bộ lên Cloud.";
      if (linkLbl) linkLbl.textContent = "📁 Đổi thư mục khác";
      if (syncNowBtn) syncNowBtn.classList.remove("hidden");
      if (unlinkBtn) unlinkBtn.classList.remove("hidden");
    } else {
      card.classList.remove("linked");
      title.textContent = "Chưa liên kết thư mục dữ liệu gốc";
      sub.innerHTML = "Bấm nút bên dưới và chọn thư mục <code>D:\\Project_AI\\Website\\data</code> <strong>1 lần duy nhất</strong>. Từ lần sau bấm <strong>Update Data</strong> sẽ tự động cập nhật ngay lập tức!";
      if (linkLbl) linkLbl.textContent = "📁 Liên kết thư mục gốc & Cập nhật ngay";
      if (syncNowBtn) syncNowBtn.classList.add("hidden");
      if (unlinkBtn) unlinkBtn.classList.add("hidden");
    }
  }

  function openUpdateModal() {
    const modal = document.getElementById("updateDataModal");
    if (!modal) return;
    showUpdateFeedback("", "info");
    const savedPass = sessionStorage.getItem("cyberpulse_update_key") || "";
    const passInput = document.getElementById("updatePasscodeInput");
    if (passInput && savedPass && !passInput.value) passInput.value = savedPass;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    refreshCloudStatus();
    refreshLinkedFolderUi();
  }

  function closeUpdateModal() {
    const modal = document.getElementById("updateDataModal");
    if (!modal) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
  }

  async function verifyDirReadPermission(dirHandle) {
    const opts = { mode: "read" };
    if ((await dirHandle.queryPermission(opts)) === "granted") return true;
    return (await dirHandle.requestPermission(opts)) === "granted";
  }

  async function readExcelFilesFromDirectory(dirHandle) {
    const files = [];
    for await (const [name, entry] of dirHandle.entries()) {
      if (entry.kind !== "file") continue;
      if (name.startsWith("~$") || name.startsWith(".")) continue;
      if (!/\.(xlsx|xls)$/i.test(name)) continue;
      files.push(await entry.getFile());
    }
    files.sort((a, b) => a.name.localeCompare(b.name));
    return files;
  }

  function makeCloudSafePayload(payload) {
    // Strip heavy in-memory arrays (unpacked rows, 17K masterProducts, 40K invSerials) when POSTing to Netlify Function (<5.8 MB limit)
    const slim = {
      schemaVersion: 3,
      taxonomy: payload.taxonomy,
      meta: payload.meta,
      lookups: payload.lookups,
      siteDirectory: payload.siteDirectory,
      salesCube: payload.salesCube,
      salesDaily: payload.salesDaily,
      storageReport: payload.storageReport,
      inventory: payload.inventory,
      invSkuLevel: payload.invSkuLevel,
      invBranchLevel: payload.invBranchLevel,
      invSerialCube: payload.invSerialCube,
      masterSummary: payload.masterSummary,
    };
    if (!slim.salesCube && payload.rows) {
      slim.rows = payload.rows;
    }
    return slim;
  }

  async function publishPayloadDirectly(payload) {
    // Re-check cloud availability if unknown
    if (!state.cloudAvailable && (location.protocol === "http:" || location.protocol === "https:")) {
      try {
        const probe = await fetchWithTimeout("/api/report-data?meta=1", { cache: "no-store" }, 3000);
        if (probe.ok && (probe.headers.get("content-type") || "").includes("application/json")) {
          const info = await probe.json();
          state.cloudAvailable = Boolean(info.cloudAvailable);
          state.cloudAuthRequired = Boolean(info.authRequired);
        }
      } catch {
        // ignore
      }
    }

    if (state.cloudAvailable) {
      const headers = { "Content-Type": "application/json" };
      const passInputVal = (document.getElementById("updatePasscodeInput")?.value || "").trim();
      const pass = passInputVal || (sessionStorage.getItem("cyberpulse_update_key") || "").trim();
      if (pass) {
        headers["x-update-key"] = pass;
        sessionStorage.setItem("cyberpulse_update_key", pass);
      }

      const slimPayload = makeCloudSafePayload(payload);
      const res = await fetch("/api/report-data", {
        method: "POST",
        headers,
        body: JSON.stringify(slimPayload),
      });
      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 401) {
          state.cloudAuthRequired = true;
          openUpdateModal();
          document.getElementById("passcodeRow")?.classList.remove("hidden");
          document.getElementById("updatePasscodeInput")?.focus();
          throw new Error("Cần nhập mã bảo vệ UPDATE_DATA_KEY để đồng bộ lên Web.");
        }
        throw new Error(body.error || `HTTP ${res.status}`);
      }

      if (body.metadata?.updatedAt) {
        payload.meta.updatedAt = body.metadata.updatedAt;
        state.cloudUpdatedAt = body.metadata.updatedAt;
      }
      await idbClearLatest();
      applyNewDataset(payload, "cloud");
      return "cloud";
    }

    await idbSetLatest(payload);
    applyNewDataset(payload, "local");
    return "local";
  }

  async function syncFromDirectoryHandle(dirHandle) {
    setSyncButtonsBusy(true, "Đang đồng bộ...");
    showUpdateFeedback(`Đang quét tất cả file Excel trong thư mục "${dirHandle.name}/"...`, "info");

    try {
      const granted = await verifyDirReadPermission(dirHandle);
      if (!granted) {
        throw new Error("Bạn chưa cấp quyền đọc thư mục dữ liệu gốc.");
      }

      const files = await readExcelFilesFromDirectory(dirHandle);
      if (!files.length) {
        throw new Error(`Không tìm thấy file .xlsx nào trong thư mục "${dirHandle.name}/".`);
      }

      const { buckets, sources } = await parseUploadedFiles(files);
      let nextPayload = null;

      if (buckets.sales.length > 0) {
        nextPayload = buildPayloadFromRecords(buckets.sales, sources.sales);
      } else if (state.raw) {
        nextPayload = {
          meta: { ...state.raw.meta, updatedAt: new Date().toISOString() },
          lookups: state.raw.lookups,
          siteDirectory: state.raw.siteDirectory,
          rows: state.raw.rows,
        };
      }

      if (!nextPayload || !Array.isArray(nextPayload.rows) || nextPayload.rows.length === 0) {
        throw new Error("Không tìm thấy dữ liệu Sales hợp lệ trong thư mục gốc.");
      }

      let masterMap = new Map();
      if (buckets.master_product.length > 0) {
        const mpRes = buildMasterProductsJs(buckets.master_product, sources.master_product);
        if (mpRes.section) nextPayload.masterProducts = mpRes.section;
        masterMap = mpRes.masterMap;
      } else if (state.raw?.masterProducts) {
        nextPayload.masterProducts = state.raw.masterProducts;
        const mpL = state.raw.masterProducts.lookups;
        state.raw.masterProducts.rows.forEach((r) => {
          masterMap.set(r[MP_C.SKU], {
            sku: r[MP_C.SKU],
            name: r[MP_C.NAME],
            subcat: mpL.subcats[r[MP_C.SUBCAT]],
            brand: mpL.brands[r[MP_C.BRAND]],
            purchaseStatus: mpL.purchaseStatuses[r[MP_C.STATUS]],
            range: mpL.ranges[r[MP_C.RANGE]],
          });
        });
      }

      if (buckets.inv_details.length > 0) {
        nextPayload.inventory = buildInventoryPayloadFromRecords(buckets.inv_details, sources.inv_details, masterMap);
      } else if (state.raw?.inventory) {
        nextPayload.inventory = state.raw.inventory;
      }

      if (buckets.sku_level.length > 0) {
        nextPayload.invSkuLevel = buildSkuLevelJs(buckets.sku_level, sources.sku_level, masterMap);
      } else if (state.raw?.invSkuLevel) {
        nextPayload.invSkuLevel = state.raw.invSkuLevel;
      }

      if (buckets.branch_level.length > 0) {
        nextPayload.invBranchLevel = buildBranchLevelJs(buckets.branch_level, sources.branch_level);
      } else if (state.raw?.invBranchLevel) {
        nextPayload.invBranchLevel = state.raw.invBranchLevel;
      }

      if (buckets.serial_details.length > 0 || buckets.bad_stock.length > 0) {
        nextPayload.invSerials = buildSerialsAndBadStockJs(
          buckets.serial_details, buckets.bad_stock, sources.serial_details, sources.bad_stock, masterMap
        );
      } else if (state.raw?.invSerials) {
        nextPayload.invSerials = state.raw.invSerials;
      }

      const mode = await publishPayloadDirectly(nextPayload);
      closeUpdateModal();

      const summaryParts = [];
      if (buckets.sales.length > 0) summaryParts.push(`Sales ${fmtInt(nextPayload.meta.rowCount)}`);
      if (buckets.inv_details.length > 0 && nextPayload.inventory) summaryParts.push(`Kho ${fmtInt(nextPayload.inventory.meta.rowCount)} BIN`);
      if (buckets.serial_details.length > 0 || buckets.bad_stock.length > 0) summaryParts.push(`Serial ${fmtInt(nextPayload.invSerials?.meta?.rowCount || 0)}`);
      if (buckets.master_product.length > 0) summaryParts.push(`Master ${fmtInt(nextPayload.masterProducts?.meta?.rowCount || 0)} SKU`);
      const destLabel = mode === "cloud" ? "☁ Web Live" : "💾 Local Cache";
      showToast(`✅ Tự động đồng bộ ${files.length} file từ "${dirHandle.name}/" → ${destLabel} | ${summaryParts.join(" • ")}`);
    } catch (err) {
      if (err && err.name === "AbortError") return;
      showUpdateFeedback(`Lỗi đồng bộ: ${err.message}`, "error");
      showToast(`Lỗi đồng bộ dữ liệu gốc: ${err.message}`, true);
    } finally {
      setSyncButtonsBusy(false);
    }
  }

  async function linkSourceFolderAndSync() {
    if (!supportsDirectorySync()) {
      showUpdateFeedback("Trình duyệt không hỗ trợ liên kết thư mục. Hãy dùng Chrome/Edge trên HTTPS Netlify.", "error");
      return;
    }
    try {
      const dirHandle = await window.showDirectoryPicker({
        id: "cyberpulse-source-data",
        mode: "read",
      });
      await idbSetSourceDir(dirHandle);
      await refreshLinkedFolderUi();
      await syncFromDirectoryHandle(dirHandle);
    } catch (err) {
      if (err && err.name === "AbortError") return;
      showUpdateFeedback(`Không thể liên kết thư mục: ${err.message}`, "error");
    }
  }

  async function runAutoUpdateFromSource() {
    // 1. If a source folder is already linked -> instant 1-click auto-sync (NO modal, NO file drag!)
    if (supportsDirectorySync()) {
      const dirHandle = await idbGetSourceDir();
      if (dirHandle) {
        await syncFromDirectoryHandle(dirHandle);
        return;
      }
      // First time on Chrome/Edge HTTPS: open 1-click source folder setup dialog
      openUpdateModal();
      return;
    }

    // 2. On other browsers / mobile (no local folder API): pull latest live data directly from Cloud
    await refreshFromCloud();
  }

  async function refreshFromCloud() {
    setSyncButtonsBusy(true, "Đang tải mới...");
    showUpdateFeedback("Đang kiểm tra dữ liệu mới nhất trên Web Cloud...", "info");
    try {
      const isHttp = location.protocol === "http:" || location.protocol === "https:";
      let fresh = null;
      let mode = "default";

      if (isHttp) {
        try {
          const res = await fetchWithTimeout(`/api/report-data?t=${Date.now()}`, { cache: "no-store" }, 5000);
          if (res.ok && (res.headers.get("content-type") || "").includes("application/json")) {
            const json = await res.json();
            if (isValidDataset(json)) {
              fresh = json;
              mode = "cloud";
            }
          }
        } catch {
          // fallback to static JSON
        }
        const res2 = await fetchWithTimeout(`./data/report_data.json?t=${Date.now()}`, { cache: "no-store" }, 5000).catch(() => null);
        if (res2 && res2.ok) {
          const baseJson = await res2.json().catch(() => null);
          if (isValidDataset(baseJson) && (!fresh || !shouldPreferOverride(fresh, baseJson))) {
            fresh = baseJson;
            mode = "default";
          }
        }
      } else {
        fresh = await loadBaselineData();
      }

      if (!isValidDataset(fresh)) {
        throw new Error("Không tải được dữ liệu mới từ máy chủ.");
      }

      applyNewDataset(fresh, mode);
      closeUpdateModal();
      const invPart = fresh.inventory?.meta ? ` + Kho ${fmtInt(fresh.inventory.meta.rowCount)} BIN` : "";
      showToast(`🔄 Đã tải dữ liệu mới nhất từ Web (${fmtInt(fresh.meta.rowCount)} Sales${invPart}).`);
    } catch (err) {
      showUpdateFeedback(`Lỗi tải dữ liệu từ Web: ${err.message}`, "error");
      showToast(`Lỗi tải dữ liệu: ${err.message}`, true);
    } finally {
      setSyncButtonsBusy(false);
    }
  }

  async function revertToDefaultData() {
    if (!confirm("Khôi phục về dữ liệu gốc trong GitHub? Bản cập nhật Cloud hiện tại sẽ bị xóa.")) return;
    showUpdateFeedback("Đang khôi phục dữ liệu gốc...", "info");

    try {
      if (state.cloudAvailable) {
        const headers = {};
        const pass = (document.getElementById("updatePasscodeInput")?.value || "").trim() ||
          (sessionStorage.getItem("cyberpulse_update_key") || "").trim();
        if (pass) headers["x-update-key"] = pass;

        const res = await fetch("/api/report-data", { method: "DELETE", headers });
        if (!res.ok && res.status !== 404) {
          const body = await res.json().catch(() => ({}));
          if (res.status === 401) {
            document.getElementById("passcodeRow")?.classList.remove("hidden");
          }
          throw new Error(body.error || `HTTP ${res.status}`);
        }
      }
      await idbClearLatest();
      const baseline = await loadBaselineData();
      applyNewDataset(baseline, "default");
      closeUpdateModal();
      showToast("↺ Đã khôi phục về dữ liệu gốc GitHub thành công.");
    } catch (err) {
      showUpdateFeedback(`Không thể khôi phục: ${err.message}`, "error");
    }
  }

  function bindUpdateModalEvents() {
    const autoSyncBtn = document.getElementById("autoSyncDataBtn");
    const openBtn = document.getElementById("openUpdateModalBtn");
    const railBtn = document.getElementById("updateDataRailBtn");
    const closeBtn = document.getElementById("closeUpdateModalBtn");
    const cancelBtn = document.getElementById("cancelUpdateModalBtn");
    const modal = document.getElementById("updateDataModal");
    const linkFolderBtn = document.getElementById("linkSourceFolderBtn");
    const syncNowBtn = document.getElementById("syncNowFromModalBtn");
    const unlinkBtn = document.getElementById("unlinkFolderBtn");
    const refreshCloudBtn = document.getElementById("refreshFromCloudBtn");
    const revertBtn = document.getElementById("revertDefaultDataBtn");
    const downloadJsonBtn = document.getElementById("downloadCurrentJsonBtn");

    if (autoSyncBtn) autoSyncBtn.addEventListener("click", runAutoUpdateFromSource);
    if (railBtn) railBtn.addEventListener("click", runAutoUpdateFromSource);
    if (openBtn) openBtn.addEventListener("click", openUpdateModal);
    if (closeBtn) closeBtn.addEventListener("click", closeUpdateModal);
    if (cancelBtn) cancelBtn.addEventListener("click", closeUpdateModal);

    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) closeUpdateModal();
      });
    }

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal && modal.classList.contains("open")) {
        closeUpdateModal();
      }
    });

    if (linkFolderBtn) linkFolderBtn.addEventListener("click", linkSourceFolderAndSync);
    if (syncNowBtn) {
      syncNowBtn.addEventListener("click", async () => {
        const dirHandle = await idbGetSourceDir();
        if (dirHandle) await syncFromDirectoryHandle(dirHandle);
        else await linkSourceFolderAndSync();
      });
    }
    if (unlinkBtn) {
      unlinkBtn.addEventListener("click", async () => {
        await idbClearSourceDir();
        await refreshLinkedFolderUi();
        showUpdateFeedback("Đã hủy liên kết thư mục gốc.", "info");
      });
    }
    if (refreshCloudBtn) refreshCloudBtn.addEventListener("click", refreshFromCloud);
    if (revertBtn) revertBtn.addEventListener("click", revertToDefaultData);

    if (downloadJsonBtn) {
      downloadJsonBtn.addEventListener("click", () => {
        if (!state.raw) return;
        const blob = new Blob([JSON.stringify(state.raw)], { type: "application/json;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "report_data.json";
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      });
    }
  }

  // =========================================================================
  // MULTI-COMPETITOR PRICE COMPARE (PHONG VŨ vs TGDD • CELLPHONES — OCGN)
  // =========================================================================
  function canonPcBrand(b) {
    const s = String(b || "").trim();
    const low = s.toLowerCase();
    if (low === "adata") return "Adata";
    if (low === "sandisk" || low === "sankdisk" || low === "san disk") return "SanDisk";
    if (low === "wd" || low === "western digital") return "WD";
    if (low === "lacie") return "LaCie";
    return s;
  }

  function normalizePriceComparePayload(payload) {
    if (!payload) return payload;
    (payload.matrixRows || []).forEach((r) => { r.pvBrand = canonPcBrand(r.pvBrand); });
    (payload.unmatchedRows || []).forEach((r) => { r.brand = canonPcBrand(r.brand); });
    return payload;
  }

  async function ensurePriceCompareLoaded() {
    const pc = state.priceCompare;
    if (pc.loaded || pc.loading) return;
    pc.loading = true;
    const insight = document.getElementById("pcInsightText");
    if (insight) insight.textContent = "Đang tải dữ liệu so sánh giá đa đối thủ...";
    try {
      const res = await fetch(`./data/price_compare_ocgn.json?t=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      pc.data = normalizePriceComparePayload(await res.json());
      pc.loaded = true;
      populatePriceCompareFilters();
      if (state.activeView === "pricecompare") renderPriceCompareView();
    } catch (err) {
      if (insight) insight.textContent = `Không tải được dữ liệu so sánh giá: ${err.message}`;
    } finally {
      pc.loading = false;
    }
  }

  function populatePriceCompareFilters() {
    const matrix = state.priceCompare.data?.matrixRows || [];
    const unmatched = state.priceCompare.data?.unmatchedRows || [];
    const brands = Array.from(new Set([
      ...matrix.map((r) => r.pvBrand),
      ...unmatched.map((r) => r.brand),
    ].filter(Boolean))).sort();
    const capOrder = ["128GB", "256GB", "500GB", "512GB", "1TB", "2TB", "4TB", "5TB", "8TB"];
    const caps = Array.from(new Set([
      ...matrix.map((r) => r.capacity),
      ...unmatched.map((r) => r.capacity),
    ].filter(Boolean))).sort((a, b) => {
      const ia = capOrder.indexOf(a);
      const ib = capOrder.indexOf(b);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a.localeCompare(b);
    });

    const brSel = document.getElementById("pcFilterBrand");
    if (brSel) {
      brSel.innerHTML = `<option value="">Tất cả Brand (${brands.length})</option>` +
        brands.map((b) => `<option value="${esc(b)}">${esc(b)}</option>`).join("");
    }
    const capSel = document.getElementById("pcFilterCap");
    if (capSel) {
      capSel.innerHTML = `<option value="">Dung lượng</option>` +
        caps.map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join("");
    }
  }

  function bindPriceCompareEvents() {
    const pc = state.priceCompare;
    document.getElementById("pcModeTabs")?.addEventListener("click", (e) => {
      const btn = e.target.closest(".seg-btn[data-val]");
      if (!btn) return;
      pc.mode = btn.dataset.val;
      document.querySelectorAll("#pcModeTabs .seg-btn").forEach((b) => b.classList.toggle("active", b === btn));
      document.getElementById("pcStatusTabs")?.classList.toggle("hidden", pc.mode === "unmatched");
      renderPriceCompareView();
    });
    document.getElementById("pcCompTabs")?.addEventListener("click", (e) => {
      const btn = e.target.closest(".seg-btn[data-val]");
      if (!btn) return;
      pc.compFilter = btn.dataset.val;
      document.querySelectorAll("#pcCompTabs .seg-btn").forEach((b) => b.classList.toggle("active", b === btn));
      renderPriceCompareView();
    });
    document.getElementById("pcStatusTabs")?.addEventListener("click", (e) => {
      const btn = e.target.closest(".seg-btn[data-val]");
      if (!btn) return;
      pc.status = btn.dataset.val;
      document.querySelectorAll("#pcStatusTabs .seg-btn").forEach((b) => b.classList.toggle("active", b === btn));
      renderPriceCompareView();
    });
    document.getElementById("pcFilterBrand")?.addEventListener("change", (e) => {
      pc.brand = e.target.value;
      renderPriceCompareView();
    });
    document.getElementById("pcFilterType")?.addEventListener("change", (e) => {
      pc.driveType = e.target.value;
      renderPriceCompareView();
    });
    document.getElementById("pcFilterCap")?.addEventListener("change", (e) => {
      pc.capacity = e.target.value;
      renderPriceCompareView();
    });
    document.getElementById("pcSearchInput")?.addEventListener("input", (e) => {
      pc.search = e.target.value.trim();
      renderPriceCompareView();
    });
    document.getElementById("pcResetBtn")?.addEventListener("click", () => {
      pc.mode = "matrix";
      pc.compFilter = "all";
      pc.status = "all";
      pc.brand = "";
      pc.driveType = "";
      pc.capacity = "";
      pc.search = "";
      pc.sortCol = "diffVsBestVnd";
      pc.sortDir = "desc";
      document.querySelectorAll("#pcModeTabs .seg-btn").forEach((b) => b.classList.toggle("active", b.dataset.val === "matrix"));
      document.querySelectorAll("#pcCompTabs .seg-btn").forEach((b) => b.classList.toggle("active", b.dataset.val === "all"));
      document.querySelectorAll("#pcStatusTabs .seg-btn").forEach((b) => b.classList.toggle("active", b.dataset.val === "all"));
      document.getElementById("pcStatusTabs")?.classList.remove("hidden");
      const br = document.getElementById("pcFilterBrand"); if (br) br.value = "";
      const tp = document.getElementById("pcFilterType"); if (tp) tp.value = "";
      const cp = document.getElementById("pcFilterCap"); if (cp) cp.value = "";
      const sr = document.getElementById("pcSearchInput"); if (sr) sr.value = "";
      renderPriceCompareView();
    });
    document.getElementById("pcExportCsvBtn")?.addEventListener("click", () => {
      const exp = pc.lastExport;
      if (exp && exp.rows.length) {
        downloadCsv(exp.filename, exp.headers, exp.rows);
        showToast(`⬇ Đã xuất ${exp.rows.length} dòng so sánh giá ra CSV.`);
      }
    });

    // Scan Price Modal & Anti-Block Warning
    const scanModal = document.getElementById("pcScanModal");
    const openScanModal = () => {
      if (!scanModal) return;
      const lastBar = document.getElementById("pcScanLastTimeInfo");
      const fb = document.getElementById("pcScanFeedback");
      if (fb) { fb.className = "update-feedback hidden"; fb.textContent = ""; }

      const scrapedAt = pc.data?.meta?.scrapedAt;
      if (lastBar) {
        if (scrapedAt) {
          const diffMin = Math.max(0, Math.round((Date.now() - new Date(scrapedAt).getTime()) / 60000));
          if (diffMin < 30) {
            lastBar.className = "pc-scan-last-bar is-recent-warn";
            lastBar.innerHTML = `⚠️ <strong>Vừa quét cách đây ${fmtInt(diffMin)} phút</strong> (${esc(formatIsoVn(scrapedAt))}) — Khuyến nghị đợi đủ <strong>30 – 60 phút</strong> trước khi quét lại để tránh bị đối thủ chặn IP.`;
          } else {
            lastBar.className = "pc-scan-last-bar";
            const hrs = diffMin >= 60 ? `${(diffMin / 60).toFixed(1)} giờ trước` : `${fmtInt(diffMin)} phút trước`;
            lastBar.innerHTML = `✅ <strong>Lần quét gần nhất:</strong> ${esc(formatIsoVn(scrapedAt))} (${esc(hrs)}) — An toàn để quét mới.`;
          }
        } else {
          lastBar.className = "pc-scan-last-bar";
          lastBar.textContent = "Lần quét gần nhất: Chưa xác định";
        }
      }
      scanModal.classList.add("open");
      scanModal.setAttribute("aria-hidden", "false");
    };
    const closeScanModal = () => {
      if (!scanModal) return;
      scanModal.classList.remove("open");
      scanModal.setAttribute("aria-hidden", "true");
    };

    document.getElementById("pcOpenScanModalBtn")?.addEventListener("click", openScanModal);
    document.getElementById("pcCloseScanModalBtn")?.addEventListener("click", closeScanModal);
    document.getElementById("pcCancelScanModalBtn")?.addEventListener("click", closeScanModal);
    scanModal?.addEventListener("click", (e) => {
      if (e.target === scanModal) closeScanModal();
    });

    document.getElementById("pcConfirmScanBtn")?.addEventListener("click", async () => {
      const btn = document.getElementById("pcConfirmScanBtn");
      const fb = document.getElementById("pcScanFeedback");
      if (!btn) return;
      btn.disabled = true;
      const origText = btn.textContent;
      btn.textContent = "⏳ Đang quét giá TGDD, CellphoneS & FPT Shop...";
      if (fb) {
        fb.className = "update-feedback info";
        fb.textContent = "Đang kết nối tuần tự với độ trễ an toàn tới Thế Giới Di Động, CellphoneS & FPT Shop (~12–20 giây)...";
      }
      try {
        const res = await fetch("/api/scan-prices", { method: "POST" });
        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          throw new Error("Máy chủ hiện tại là bản tĩnh (không có Python Local API). Hãy chạy bằng `python scripts/local_server.py` hoặc chạy lệnh `python scripts/scrape_tgdd_ocgn.py` tại máy.");
        }
        const body = await res.json();
        if (!res.ok || !body.ok) {
          throw new Error(body.error || `HTTP ${res.status}`);
        }
        pc.data = normalizePriceComparePayload(body.data);
        pc.loaded = true;
        populatePriceCompareFilters();
        renderPriceCompareView();
        closeScanModal();
        showToast("✅ Đã quét và cập nhật giá mới nhất từ TGDD, CellphoneS & FPT Shop!");
      } catch (err) {
        if (fb) {
          fb.className = "update-feedback error";
          fb.textContent = `Không thể quét trực tiếp: ${err.message}`;
        }
      } finally {
        btn.disabled = false;
        btn.textContent = origText;
      }
    });
  }

  function renderPriceCompareView() {
    const pc = state.priceCompare;
    if (!pc.loaded) {
      ensurePriceCompareLoaded();
      return;
    }
    const payload = pc.data || {};
    const meta = payload.meta || {};
    const compsMeta = meta.competitors || [
      { id: "tgdd", name: "Thế Giới Di Động", short: "TGDD", url: "https://www.thegioididong.com/o-cung-di-dong" },
      { id: "cps", name: "CellphoneS", short: "CPS", url: "https://cellphones.com.vn/phu-kien/o-cung-di-dong.html" },
      { id: "fpt", name: "FPT Shop", short: "FPT", url: "https://fptshop.com.vn/phu-kien/o-cung-di-dong" },
    ];
    const matrixAll = payload.matrixRows || [];
    const unmatchedAll = payload.unmatchedRows || [];

    // Populate the 3+ Source Data Telemetry Boxes (Phong Vũ SKU count + each competitor scanned count)
    const srcGrid = document.getElementById("pcSourceCardsGrid");
    if (srcGrid) {
      const pvPriced = meta.pvPricedCount || 0;
      const pvTotal = meta.pvTotalCount || 0;
      const pvCardHtml = `
        <div class="pc-source-card is-pv">
          <div class="pc-src-head">
            <span class="pc-src-badge is-pv">PHONG VŨ (PV)</span>
            <span class="pc-src-cat mono">NH11-01-07 • OCGN</span>
          </div>
          <div class="pc-src-val mono">${fmtInt(pvPriced)} SKU có giá</div>
          <div class="pc-src-sub">Tổng danh mục: <strong>${fmtInt(pvTotal)} SKU</strong> • Đã khớp đối thủ: <strong>${fmtInt(matrixAll.length)} SKU</strong></div>
        </div>`;
      const compCardsHtml = compsMeta.map((c) => {
        const host = String(c.url || "").replace(/^https?:\/\/(www\.)?/, "").split("/")[0] || c.short;
        return `
          <div class="pc-source-card is-${esc(c.id)}">
            <div class="pc-src-head">
              <span class="pc-src-badge is-${esc(c.id)}">${esc(c.name.toUpperCase())}</span>
              <a href="${esc(c.url)}" target="_blank" rel="noopener noreferrer" class="pc-src-link">${esc(host)} ↗</a>
            </div>
            <div class="pc-src-val mono">${fmtInt(c.totalCount || 0)} SKU quét được</div>
            <div class="pc-src-sub">Khớp mã PV: <strong>${fmtInt(c.matchedCount || 0)} SKU</strong> • Chưa khớp: <strong>${fmtInt(c.unmatchedCount || 0)} SP</strong></div>
          </div>`;
      }).join("");
      srcGrid.innerHTML = pvCardHtml + compCardsHtml;
    }

    const fmtDmy = (iso) => {
      const m = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
      return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
    };

    // Scoped matrix for KPIs (by Brand / Type / Cap)
    const scopedMatrix = matrixAll.filter((r) => {
      if (pc.brand && r.pvBrand !== pc.brand) return false;
      if (pc.driveType && r.driveType !== pc.driveType) return false;
      if (pc.capacity && r.capacity !== pc.capacity) return false;
      return true;
    });

    const higherAny = scopedMatrix.filter((r) => r.higherCount > 0);
    const winRows = scopedMatrix.filter((r) => r.higherCount === 0);
    const cheapestRows = scopedMatrix.filter((r) => r.position === "pv_cheapest");
    const equalRows = scopedMatrix.filter((r) => r.position === "pv_equal");
    const avgHigherDiff = higherAny.length
      ? Math.round(higherAny.reduce((s, r) => s + Math.max(0, r.diffVsBestVnd || 0), 0) / higherAny.length)
      : 0;

    // Per-competitor quick scorecard
    const compStats = compsMeta.map((cm) => {
      const sub = scopedMatrix.filter((r) => Boolean(r.competitors?.[cm.id]));
      const hi = sub.filter((r) => r.competitors[cm.id].diffVnd > 10000).length;
      const ch = sub.filter((r) => r.competitors[cm.id].diffVnd < -10000).length;
      const eq = sub.length - hi - ch;
      return { short: cm.short, total: sub.length, hi, ch, eq };
    });

    document.getElementById("pcKpiTotal").textContent = `${fmtInt(scopedMatrix.length)} SKU khớp`;
    document.getElementById("pcKpiTotalSub").textContent =
      compsMeta.map((c) => `${c.short}: ${fmtInt(c.matchedCount || 0)}/${fmtInt(c.totalCount || 0)}`).join(" • ");
    document.getElementById("pcKpiHigher").textContent = `${fmtInt(higherAny.length)} SKU`;
    document.getElementById("pcKpiHigherSub").textContent = higherAny.length
      ? `${((higherAny.length / Math.max(1, scopedMatrix.length)) * 100).toFixed(0)}% SKU khớp • Cao hơn TB +${fmtVndFull(avgHigherDiff)}`
      : "Không có SKU nào cao hơn thị trường";
    document.getElementById("pcKpiCheaper").textContent = `${fmtInt(winRows.length)} SKU`;
    document.getElementById("pcKpiCheaperSub").textContent = `${fmtInt(cheapestRows.length)} rẻ nhất • ${fmtInt(equalRows.length)} bằng giá`;
    document.getElementById("pcKpiOnlyTgdd").textContent = compStats.map((s) => `${s.short} ${s.hi}↑/${s.ch + s.eq}✓`).join(" • ");
    document.getElementById("pcKpiOnlyTgddSub").textContent = `SP đối thủ chưa khớp PV: ${fmtInt(unmatchedAll.length)} SP`;

    const insightEl = document.getElementById("pcInsightText");
    if (insightEl) {
      const linksHtml = compsMeta
        .map((c) => `<a href="${esc(c.url)}" target="_blank" rel="noopener noreferrer" class="pc-tgdd-link">${esc(c.name)} ↗</a>`)
        .join(" &nbsp;•&nbsp; ");
      insightEl.innerHTML =
        `Nguồn: ${linksHtml} • Cập nhật: <strong class="mono">${esc(formatIsoVn(meta.scrapedAt) || "—")}</strong>`;
    }

    // Active chips
    const chipsEl = document.getElementById("pcActiveChips");
    if (chipsEl) {
      const chips = [];
      if (pc.compFilter !== "all") chips.push(`Đối thủ: ${pc.compFilter === "both" ? "≥2 đối thủ" : pc.compFilter.toUpperCase()}`);
      if (pc.mode === "matrix" && pc.status !== "all") chips.push(pc.status === "pv_higher" ? "PV Cao hơn" : "PV Rẻ / Bằng");
      if (pc.brand) chips.push(`Brand: ${pc.brand}`);
      if (pc.driveType) chips.push(`Loại: ${pc.driveType}`);
      if (pc.capacity) chips.push(`Dung lượng: ${pc.capacity}`);
      if (pc.search) chips.push(`Tìm: "${pc.search}"`);
      chipsEl.innerHTML = chips.map((c) => `<span class="chip">${esc(c)}</span>`).join("");
    }

    const q = (pc.search || "").toLowerCase();
    const thead = document.getElementById("pcTableHead");
    const tbody = document.getElementById("pcTableBody");
    const titleEl = document.getElementById("pcTableTitle");
    const hintEl = document.getElementById("pcTableCountInfo");

    // -----------------------------------------------------------------------
    // MODE B: UNMATCHED COMPETITOR PRODUCTS (OPPORTUNITY / ASSORTMENT GAP)
    // -----------------------------------------------------------------------
    if (pc.mode === "unmatched") {
      if (titleEl) {
        titleEl.innerHTML = `Sản phẩm Đối thủ chưa khớp tại Phong Vũ <span class="badge-blue">CƠ HỘI MỞ RỘNG DANH MỤC</span>`;
      }
      const filteredU = unmatchedAll.filter((r) => {
        if (pc.compFilter !== "all" && pc.compFilter !== "both" && r.compId !== pc.compFilter) return false;
        if (pc.brand && r.brand !== pc.brand) return false;
        if (pc.driveType && r.driveType !== pc.driveType) return false;
        if (pc.capacity && r.capacity !== pc.capacity) return false;
        if (q) {
          const hay = `${r.compShort} ${r.name} ${r.brand} ${r.capacity} ${r.driveType}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });
      if (hintEl) hintEl.textContent = `Hiển thị ${fmtInt(filteredU.length)} / ${fmtInt(unmatchedAll.length)} sản phẩm đang bán tại đối thủ chưa khớp mã Phong Vũ`;

      if (thead) {
        thead.innerHTML = `
          <tr>
            <th>Đối thủ</th>
            <th class="pc-pv-col">Tên sản phẩm Đối thủ</th>
            <th>Brand</th>
            <th>Loại / Dung lượng</th>
            <th class="num">Giá bán (VAT)</th>
            <th class="num">Giá gốc / Giảm</th>
          </tr>`;
      }
      if (tbody) {
        if (!filteredU.length) {
          tbody.innerHTML = `<tr><td colspan="6" class="muted">Không có sản phẩm nào phù hợp với bộ lọc.</td></tr>`;
        } else {
          tbody.innerHTML = filteredU.map((r) => `
            <tr>
              <td><span class="pc-comp-pill is-${esc(r.compId)}">${esc(r.compShort)}</span></td>
              <td class="pc-pv-col">
                <a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer" class="pc-tgdd-link">${esc(r.name)} ↗</a>
              </td>
              <td><span class="inv-badge other">${esc(r.brand)}</span></td>
              <td>
                ${r.driveType && r.driveType !== "UNKNOWN" ? `<span class="inv-badge listing-active">${esc(r.driveType)}</span>` : ""}
                ${r.capacity ? `<span class="inv-badge normal">${esc(r.capacity)}</span>` : ""}
              </td>
              <td class="num mono"><strong>${r.price ? esc(fmtVndFull(r.price)) : "—"}</strong></td>
              <td class="num mono">
                ${r.oldPrice > r.price ? `<span class="pc-old-price">${esc(fmtVndFull(r.oldPrice))}</span> <span class="pc-disc-tag">-${r.discountPct}%</span>` : "—"}
              </td>
            </tr>`).join("");
        }
      }
      pc.lastExport = {
        headers: ["Competitor", "Product Name", "Brand", "Type", "Capacity", "Price", "Old Price", "Discount %", "URL"],
        rows: filteredU.map((r) => [r.compShort, r.name, r.brand, r.driveType, r.capacity, r.price, r.oldPrice, r.discountPct, r.url]),
        filename: `sp_doi_thu_chua_khop_ocgn_${new Date().toISOString().slice(0, 10)}.csv`,
      };
      return;
    }

    // -----------------------------------------------------------------------
    // MODE A: MULTI-COMPETITOR MATRIX (1 ROW = 1 PV SKU vs ALL COMPETITORS)
    // -----------------------------------------------------------------------
    if (titleEl) {
      titleEl.innerHTML = `Ma trận So Sánh Giá — Phong Vũ vs ${compsMeta.map((c) => esc(c.short)).join(" • ")} <span class="badge-blue">NH11-01-07 Ổ CỨNG GẮN NGOÀI</span>`;
    }

    const filteredM = scopedMatrix.filter((r) => {
      if (pc.compFilter === "both" && r.compCount < 2) return false;
      if (pc.compFilter !== "all" && pc.compFilter !== "both" && !r.competitors?.[pc.compFilter]) return false;
      if (pc.status === "pv_higher" && r.higherCount === 0) return false;
      if (pc.status === "pv_win" && r.higherCount > 0) return false;
      if (q) {
        const compNames = Object.values(r.competitors || {}).map((c) => c.name).join(" ");
        const hay = `${r.pvSku} ${r.pvName} ${r.pvBrand} ${r.capacity} ${r.driveType} ${compNames}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const dir = pc.sortDir === "asc" ? 1 : -1;
    filteredM.sort((a, b) => {
      const col = pc.sortCol;
      if (col === "pvName") return dir * a.pvName.localeCompare(b.pvName);
      if (col === "pvPrice") return dir * ((a.pvPrice || 0) - (b.pvPrice || 0));
      if (compsMeta.some((c) => c.id === col)) {
        return dir * ((a.competitors?.[col]?.price || 0) - (b.competitors?.[col]?.price || 0));
      }
      if (col === "diffVsBestPct") return dir * ((a.diffVsBestPct || 0) - (b.diffVsBestPct || 0));
      if (col === "pvInvQty") return dir * ((a.pvInvQty || 0) - (b.pvInvQty || 0));
      return dir * ((a.diffVsBestVnd || 0) - (b.diffVsBestVnd || 0));
    });

    if (hintEl) {
      hintEl.textContent = `Hiển thị ${fmtInt(filteredM.length)} / ${fmtInt(matrixAll.length)} SKU Phong Vũ khớp đối thủ • Click mã SKU để mở hồ sơ 360° hoặc click giá đối thủ để mở link trực tiếp`;
    }

    if (thead) {
      const cols = [
        { key: "pvName", label: "Sản phẩm Phong Vũ (SKU & Tên SP)", cls: "pc-pv-col" },
        { key: "pvPrice", label: "Giá PV Hiện tại", cls: "num" },
        ...compsMeta.map((c) => ({ key: c.id, label: c.name, cls: "num pc-comp-col" })),
        { key: "diffVsBestVnd", label: "PV vs Giá Thấp Nhất", cls: "num" },
        { key: "diffVsBestPct", label: "Vị thế Giá PV", cls: "" },
        { key: "pvInvQty", label: "Tồn / 30D PV", cls: "num" },
      ];
      thead.innerHTML = `<tr>${cols.map((c) => {
        const arrow = pc.sortCol === c.key ? (pc.sortDir === "asc" ? " ▲" : " ▼") : "";
        return `<th class="${c.cls} sortable" data-pc-sort="${c.key}">${esc(c.label)}${arrow}</th>`;
      }).join("")}</tr>`;
      thead.querySelectorAll("th[data-pc-sort]").forEach((th) => {
        th.addEventListener("click", () => {
          const k = th.dataset.pcSort;
          if (pc.sortCol === k) pc.sortDir = pc.sortDir === "asc" ? "desc" : "asc";
          else { pc.sortCol = k; pc.sortDir = k === "pvName" ? "asc" : "desc"; }
          renderPriceCompareView();
        });
      });
    }

    const renderCompCell = (offer, compShort, isBest) => {
      if (!offer) return `<td class="num pc-comp-col pc-empty-cell">—</td>`;
      const sign = offer.diffVnd > 0 ? "+" : "";
      const deltaCls = offer.diffVnd > 10000 ? "pc-diff-pos" : offer.diffVnd < -10000 ? "pc-diff-neg" : "pc-diff-eq";
      const deltaText = Math.abs(offer.diffVnd) <= 10000
        ? "Bằng giá"
        : `PV ${sign}${fmtCompactVnd(offer.diffVnd)} (${sign}${offer.diffPct.toFixed(1)}%)`;
      return `
        <td class="num pc-comp-col ${isBest ? "pc-is-best-comp" : ""}">
          <div class="pc-comp-price-line mono">
            <a href="${esc(offer.url)}" target="_blank" rel="noopener noreferrer" class="pc-comp-price-link" title="${esc(offer.name)} — Click để mở trang ${esc(compShort)}">
              <strong>${esc(fmtVndFull(offer.price))}</strong> ↗
            </a>
          </div>
          ${offer.oldPrice > offer.price
            ? `<div class="pc-old-price mono">${esc(fmtVndFull(offer.oldPrice))} <span class="pc-disc-tag">-${offer.discountPct}%</span></div>`
            : ""}
          <div class="pc-comp-delta mono ${deltaCls}">${esc(deltaText)}</div>
        </td>`;
    };

    if (tbody) {
      if (!filteredM.length) {
        tbody.innerHTML = `<tr><td colspan="${5 + compsMeta.length}" class="muted">Không có SKU nào phù hợp với bộ lọc hiện tại.</td></tr>`;
      } else {
        tbody.innerHTML = filteredM.map((r) => {
          const posBadge = {
            pv_higher_all: `<span class="inv-badge bad-verybad">🚨 Cao hơn tất cả</span>`,
            pv_higher_some: `<span class="inv-badge bad-bad">⚠️ Cao hơn 1 đối thủ</span>`,
            pv_cheapest: `<span class="inv-badge bad-normal">🏆 PV Rẻ nhất</span>`,
            pv_equal: `<span class="inv-badge listing-active">⚖️ Bằng giá TT</span>`,
          }[r.position] || `<span class="inv-badge other">—</span>`;

          const bestSign = r.diffVsBestVnd > 0 ? "+" : "";
          const bestCls = r.diffVsBestVnd > 10000 ? "pc-diff-pos" : r.diffVsBestVnd < -10000 ? "pc-diff-neg" : "pc-diff-eq";
          const bestCompShort = (compsMeta.find((c) => c.id === r.bestCompId)?.short || r.bestCompId || "").toUpperCase();
          const pvPromoNoteHtml = r.pvIsPromo && r.pvNormalPrice > 0
            ? `<div class="pc-old-price">${esc(fmtVndFull(r.pvNormalPrice))} <span class="pc-disc-tag">Giá KM</span></div>`
            : "";
          const pvUpcomingHtml = r.pvPriceState === "upcoming" && r.pvNewPrice > 0
            ? `<div class="pc-pv-sub">📅 ${fmtDmy(r.pvActiveDate)} → ${esc(fmtVndFull(r.pvNewPrice))}</div>`
            : "";

          return `
            <tr>
              <td class="pc-pv-col">
                <div class="pc-pv-head">
                  <button type="button" class="link-sku-btn" data-pc-jump-sku="${esc(r.pvSku)}">${esc(r.pvSku)}</button>
                  <span class="inv-badge other">${esc(r.pvBrand)}</span>
                  ${r.driveType && r.driveType !== "UNKNOWN" ? `<span class="inv-badge listing-active">${esc(r.driveType)}</span>` : ""}
                  ${r.capacity ? `<span class="inv-badge normal">${esc(r.capacity)}</span>` : ""}
                  <span class="inv-badge ${statusBadgeClass(r.pvStatus)}">${esc(r.pvStatus || "Normal")}</span>
                </div>
                <div class="pc-pv-name-wrap">${esc(r.pvName)}</div>
              </td>
              <td class="num mono pc-pv-price-cell">
                <div><strong>${esc(fmtVndFull(r.pvPrice))}</strong></div>
                ${pvPromoNoteHtml}
                ${pvUpcomingHtml}
              </td>
              ${compsMeta.map((c) => renderCompCell(r.competitors?.[c.id], c.short, r.bestCompId === c.id && r.compCount > 1)).join("")}
              <td class="num mono ${bestCls}">
                <div><strong>${bestSign}${esc(fmtVndFull(r.diffVsBestVnd))}</strong></div>
                <div class="pc-best-sub">${bestSign}${r.diffVsBestPct.toFixed(1)}% vs ${esc(bestCompShort)}</div>
              </td>
              <td>${posBadge}</td>
              <td class="num mono">
                <div style="color:#00E5FF"><strong>${fmtInt(r.pvInvQty)}</strong> tồn</div>
                <div class="pc-vel-sub" style="color:#12D37A">${fmtInt(r.pvS30d)} / 30D</div>
              </td>
            </tr>`;
        }).join("");

        tbody.querySelectorAll("[data-pc-jump-sku]").forEach((btn) => {
          btn.addEventListener("click", async () => {
            const sku = btn.dataset.pcJumpSku;
            if (!sku) return;
            switchView("lookup");
            if (!state.shardsLoaded) await ensureLookupShardsLoaded();
            const inp = document.getElementById("lookupSearchInput");
            if (inp) inp.value = sku;
            renderLookupProfile(sku, "", false);
          });
        });
      }
    }

    pc.lastExport = {
      headers: [
        "PV SKU", "PV Name", "Brand", "Type", "Capacity", "PV Status", "PV Price",
        ...compsMeta.flatMap((c) => [`${c.short} Price`, `${c.short} Diff VND`, `${c.short} URL`]),
        "Best Comp", "Best Comp Price", "PV vs Best VND", "PV vs Best %", "Position", "PV Inv QTY", "PV 30D Sales",
      ],
      rows: filteredM.map((r) => [
        r.pvSku, r.pvName, r.pvBrand, r.driveType, r.capacity, r.pvStatus, r.pvPrice,
        ...compsMeta.flatMap((c) => {
          const o = r.competitors?.[c.id];
          return o ? [o.price, o.diffVnd, o.url] : ["", "", ""];
        }),
        r.bestCompId.toUpperCase(), r.bestCompPrice, r.diffVsBestVnd, r.diffVsBestPct, r.position, r.pvInvQty, r.pvS30d,
      ]),
      filename: `ma_tran_so_sanh_gia_ocgn_${new Date().toISOString().slice(0, 10)}.csv`,
    };
  }

  document.addEventListener("DOMContentLoaded", init);
})();
