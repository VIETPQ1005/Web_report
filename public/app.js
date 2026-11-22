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
  };

  // Master Product column indexes
  const MP_C = {
    SKU: 0, NAME: 1, SUBCAT: 2, SUBCAT3: 3, BRAND: 4, LISTING: 5, STATUS: 6,
    RANGE: 7, HAS_SERIAL: 8, PROMO: 9, LISTED_PRICE: 10, SR_PROMO: 11,
    WCOGS: 12, LAST_PUR: 13, LATEST_QUOTE: 14, TEMP_GP: 15, TEMP_GM: 16,
    INV_QTY: 17, INV_VAL: 18, SALES_30D: 19, WARRANTY_MO: 20, WARRANTY_NOTE: 21,
  };

  // SKU Level (7D/30D/90D/180D) column indexes
  const SKU_C = {
    SKU: 0, NAME: 1, SUBCAT: 2, BRAND: 3, STATUS: 4, RANGE: 5,
    S7D: 6, S30D: 7, S90D: 8, S180D: 9, GM: 10, SDAYS: 11,
    INV_QTY: 12, INV_VAL: 13, UNIT_COST: 14, LISTED_PRICE: 15,
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
    BAD_COMP: 25, BAD_SITE: 26,
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
      idxMaster: new Map(),
      idxSkuVel: new Map(),
      idxBranches: new Map(),
      idxBins: new Map(),
      idxSerialsBySku: new Map(),
      idxSerialBySn: new Map(),
      idxSalesBySku: new Map(),
      lastExport: { headers: [], rows: [], filename: "sku_profile.csv" },
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
    // Deep views controls
    deepGranularity: "month",
    deepMode: "sales_qty",
    siteChartView: "bar",         // bar | treemap | scatter
    siteChartSort: "sales",       // sales | qty | gm
    driverDim: "subcat",          // subcat | brand
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
    invBadStock: null,
    invStatusRange: null,
    invSite: null,
    invBin: null,
    invAging: null,
    invCat: null,
    lookupVelocity: null,
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
  const IDB_KEY = "latest";
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

  async function loadBaselineData() {
    if (window.REPORT_DATA && Array.isArray(window.REPORT_DATA.rows)) {
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

  // --- INIT ---
  async function init() {
    const isHttp = location.protocol === "http:" || location.protocol === "https:";
    let loaded = null;
    let sourceMode = "default";

    // 1. Prefer live cloud dataset on Netlify Blobs when served over HTTP/HTTPS
    if (isHttp) {
      try {
        const res = await fetchWithTimeout("/api/report-data", { cache: "no-store" }, 4500);
        if (res.ok) {
          const ct = res.headers.get("content-type") || "";
          if (ct.includes("application/json")) {
            const json = await res.json();
            if (json && Array.isArray(json.rows) && json.rows.length > 0) {
              loaded = json;
              sourceMode = "cloud";
              state.cloudAvailable = true;
              state.cloudAuthRequired = res.headers.get("x-auth-required") === "1";
              state.cloudUpdatedAt = res.headers.get("x-data-updated-at") || json.meta?.updatedAt || "";
            }
          }
        } else if (res.status === 404) {
          // API is live, just no cloud upload yet
          try {
            const body = await res.json();
            state.cloudAvailable = true;
            state.cloudAuthRequired = Boolean(body?.authRequired);
          } catch {
            // Static host returning HTML 404
          }
        }
      } catch {
        // Offline or local dev without Netlify Functions
      }
    }

    // 2. Fallback to browser-saved local override (IndexedDB)
    if (!loaded) {
      const localCached = await idbGetLatest();
      if (localCached && Array.isArray(localCached.rows) && localCached.rows.length > 0) {
        loaded = localCached;
        sourceMode = "local";
      }
    }

    // 3. Fallback to bundled baseline dataset
    if (!loaded) {
      try {
        loaded = await loadBaselineData();
        sourceMode = "default";
      } catch (err) {
        document.getElementById("insightText").textContent =
          `Lỗi tải dữ liệu (${err.message}). Hãy chạy lại python scripts/build_data.py hoặc bấm Update Data.`;
        return;
      }
    }

    state.raw = loaded;
    state.dataSourceMode = sourceMode;

    buildLookupIndexes();
    initMeta();
    populateFilters();
    populateInventoryFilters();
    initCharts();
    bindEvents();
    bindInventoryEvents();
    bindLookupEvents();
    bindUpdateModalEvents();
    renderLookupQuickPicks();
    renderAll();
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
    if (invSnTab && state.raw.invSerials?.meta) {
      invSnTab.textContent = `Serial & Bad Stock (${fmtInt(state.raw.invSerials.meta.rowCount)})`;
    }
    const invVelTab = document.getElementById("invVelocityTabBtn");
    if (invVelTab && state.raw.invSkuLevel?.meta) {
      invVelTab.textContent = `Bán 7D–180D (${fmtInt(state.raw.invSkuLevel.meta.rowCount)})`;
    }
    const invMpTab = document.getElementById("invMasterTabBtn");
    if (invMpTab && state.raw.masterProducts?.meta) {
      invMpTab.textContent = `Master (${fmtInt(state.raw.masterProducts.meta.rowCount)})`;
    }
    const invSiteTag = document.getElementById("invSiteCountTag");
    if (invSiteTag && inventory?.lookups) {
      invSiteTag.textContent = `${inventory.lookups.sites.length} KHO`;
    }
  }

  function applyNewDataset(payload, sourceMode) {
    state.raw = payload;
    state.dataSourceMode = sourceMode;
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
    populateFilters();
    populateInventoryFilters();
    resetInvFilters(false);
    renderLookupQuickPicks();
    if (state.lookup.selectedSku) {
      renderLookupProfile(state.lookup.selectedSku, state.lookup.selectedSerial);
    }

    document.getElementById("filterRegion").value = "";
    document.getElementById("filterSite").value = "";
    document.getElementById("filterChannel").value = "";
    document.getElementById("filterOrderType").value = "";
    document.getElementById("excludeBulkToggle").checked = false;
    document.getElementById("storeRegionsOnlyToggle").checked = false;

    renderAll();
  }

  function populateFilters() {
    const { lookups, rows, siteDirectory } = state.raw;

    state.monthsAll = Array.from(new Set(rows.map((r) => r[C.MONTH]))).sort();
    state.monthFrom = state.monthsAll[0] || "";
    state.monthTo = state.monthsAll[state.monthsAll.length - 1] || "";

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

    const regEl = document.getElementById("filterRegion");
    regEl.innerHTML = `<option value="">Tất cả Region (${lookups.regions.length})</option>`;
    [...lookups.regions]
      .sort((a, b) => {
        const an = a.startsWith("Non-Store"), bn = b.startsWith("Non-Store");
        if (an !== bn) return an ? 1 : -1;
        return a.localeCompare(b);
      })
      .forEach((r) => regEl.add(new Option(r, r)));

    const siteEl = document.getElementById("filterSite");
    siteEl.innerHTML = `<option value="">Tất cả Site Code (${lookups.sites.length})</option>`;
    [...lookups.sites].sort().forEach((code) => {
      const info = siteDirectory[code];
      const lbl = info && info.storeName !== code ? `${code} — ${info.storeName}` : code;
      siteEl.add(new Option(lbl, code));
    });

    const chEl = document.getElementById("filterChannel");
    chEl.innerHTML = `<option value="">Tất cả Channel</option>`;
    [...lookups.channels].sort().forEach((ch) => chEl.add(new Option(ch, ch)));
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

    // Cross-filter click listeners
    charts.hero.on("click", (params) => {
      if (state.heroMode === "region_grouped" && params.seriesName) {
        toggleRegionFilter(params.seriesName);
        return;
      }
      if (state.heroGranularity === "month" && params.name) {
        const m = params.name.startsWith("20") ? params.name : "";
        if (m) {
          state.clickedMonth = state.clickedMonth === m ? "" : m;
          state.tablePage = 1;
          renderAll();
        }
      }
    });

    charts.trend.on("click", (params) => {
      if (params.name && params.name.startsWith("20")) {
        state.clickedMonth = state.clickedMonth === params.name ? "" : params.name;
        state.tablePage = 1;
        renderAll();
      }
    });

    charts.deepMonthly.on("click", (params) => {
      if (state.deepGranularity === "month" && params.name) {
        state.clickedMonth = state.clickedMonth === params.name ? "" : params.name;
        renderAll();
      }
    });

    charts.deepSite.on("click", (params) => {
      const sc = params.data?.siteCode || params.name;
      if (sc) toggleSiteFilter(sc);
    });

    charts.deepRegionPie.on("click", (params) => {
      if (params.name) toggleRegionFilter(params.name);
    });

    charts.deepRegionStack.on("click", (params) => {
      if (params.seriesName) toggleRegionFilter(params.seriesName);
    });

    charts.deepChannel.on("click", (params) => {
      if (!params.name) return;
      state.channel = state.channel === params.name ? "" : params.name;
      document.getElementById("filterChannel").value = state.channel;
      renderAll();
    });

    // Inventory cross-filter clicks
    charts.invBadStock.on("click", (params) => {
      if (!params.name) return;
      state.inv.badStock = state.inv.badStock === params.name ? "" : params.name;
      const el = document.getElementById("invFilterBadStock");
      if (el) el.value = state.inv.badStock;
      state.inv.tablePage = 1;
      renderInventoryView();
    });

    charts.invStatusRange.on("click", (params) => {
      if (!params.name) return;
      if (state.inv.statusDim === "range_inv") {
        state.inv.range = state.inv.range === params.name ? "" : params.name;
        const el = document.getElementById("invFilterRange");
        if (el) el.value = state.inv.range;
      } else {
        state.inv.status = state.inv.status === params.name ? "" : params.name;
        const el = document.getElementById("invFilterStatus");
        if (el) el.value = state.inv.status;
      }
      state.inv.tablePage = 1;
      renderInventoryView();
    });

    charts.invSite.on("click", (params) => {
      const code = params.name;
      if (!code) return;
      state.inv.site = state.inv.site === code ? "" : code;
      document.getElementById("invFilterSite").value = state.inv.site;
      state.inv.tablePage = 1;
      renderInventoryView();
    });

    charts.invBin.on("click", (params) => {
      if (!params.name) return;
      if (state.inv.binDim === "binType") {
        state.inv.binType = state.inv.binType === params.name ? "" : params.name;
        document.getElementById("invFilterBinType").value = state.inv.binType;
      } else {
        state.inv.binZone = state.inv.binZone === params.name ? "" : params.name;
        document.getElementById("invFilterBinZone").value = state.inv.binZone;
      }
      state.inv.tablePage = 1;
      renderInventoryView();
    });

    charts.invAging.on("click", (params) => {
      const b = AGING_BUCKETS.find((x) => x.label === params.name);
      if (!b) return;
      state.inv.agingBucket = state.inv.agingBucket === b.key ? "" : b.key;
      state.inv.tablePage = 1;
      renderInventoryView();
    });

    charts.invCat.on("click", (params) => {
      if (!params.name) return;
      if (state.inv.catDim === "subcat") {
        state.inv.subcat = state.inv.subcat === params.name ? "" : params.name;
        document.getElementById("invFilterSubcat").value = state.inv.subcat;
      } else {
        state.inv.brand = state.inv.brand === params.name ? "" : params.name;
        document.getElementById("invFilterBrand").value = state.inv.brand;
      }
      state.inv.tablePage = 1;
      renderInventoryView();
    });

    window.addEventListener("resize", () => {
      Object.values(charts).forEach((ch) => ch && ch.resize());
    });
  }

  function toggleRegionFilter(reg) {
    state.region = state.region === reg ? "" : reg;
    document.getElementById("filterRegion").value = state.region;
    state.tablePage = 1;
    renderAll();
  }

  function toggleSiteFilter(siteCode) {
    state.site = state.site === siteCode ? "" : siteCode;
    document.getElementById("filterSite").value = state.site;
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

    const isInvOrLookup = view === "inventory" || view === "lookup";
    document.getElementById("appShell")?.classList.toggle("hide-sidebar", view === "lookup");
    document.getElementById("salesTopFilters")?.classList.toggle("hidden", isInvOrLookup);
    document.getElementById("salesDatePickerBox")?.classList.toggle("hidden", isInvOrLookup);
    document.getElementById("activeChipsBar")?.classList.toggle("hidden", isInvOrLookup);
    document.getElementById("invTopBanner")?.classList.toggle("hidden", !isInvOrLookup);

    const bannerTitle = document.getElementById("invTopBannerTitle");
    if (bannerTitle) {
      bannerTitle.textContent = view === "lookup"
        ? "🔍 TRA CỨU 360° SKU & SERIAL NUMBER"
        : "📦 BÁO CÁO TỒN KHO & BAD STOCK";
    }
    document.getElementById("jumpToLookupBtn")?.classList.toggle("hidden", view === "lookup");

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

    // Global filters
    document.getElementById("filterRegion").addEventListener("change", (e) => {
      state.region = e.target.value; state.tablePage = 1; renderAll();
    });
    document.getElementById("filterSite").addEventListener("change", (e) => {
      state.site = e.target.value; state.tablePage = 1; renderAll();
    });
    document.getElementById("filterChannel").addEventListener("change", (e) => {
      state.channel = e.target.value; state.tablePage = 1; renderAll();
    });
    document.getElementById("filterOrderType").addEventListener("change", (e) => {
      state.orderType = e.target.value; state.tablePage = 1; renderAll();
    });
    document.getElementById("filterMonthFrom").addEventListener("change", (e) => {
      state.monthFrom = e.target.value;
      if (state.monthFrom > state.monthTo) {
        state.monthTo = state.monthFrom;
        document.getElementById("filterMonthTo").value = state.monthTo;
      }
      state.clickedMonth = ""; state.tablePage = 1; renderAll();
    });
    document.getElementById("filterMonthTo").addEventListener("change", (e) => {
      state.monthTo = e.target.value;
      if (state.monthTo < state.monthFrom) {
        state.monthFrom = state.monthTo;
        document.getElementById("filterMonthFrom").value = state.monthFrom;
      }
      state.clickedMonth = ""; state.tablePage = 1; renderAll();
    });

    document.getElementById("excludeBulkToggle").addEventListener("change", (e) => {
      state.excludeBulk = e.target.checked; state.tablePage = 1; renderAll();
    });
    document.getElementById("storeRegionsOnlyToggle").addEventListener("change", (e) => {
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
    bindSeg("driverDimGroup", (v) => {
      state.driverDim = v;
      renderDeepChannelAndDriver(getFilteredRows(false));
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
    state.monthFrom = state.monthsAll[0] || "";
    state.monthTo = state.monthsAll[state.monthsAll.length - 1] || "";
    state.tablePage = 1;

    document.getElementById("filterRegion").value = "";
    document.getElementById("filterSite").value = "";
    document.getElementById("filterChannel").value = "";
    document.getElementById("filterOrderType").value = "";
    document.getElementById("filterMonthFrom").value = state.monthFrom;
    document.getElementById("filterMonthTo").value = state.monthTo;
    document.getElementById("excludeBulkToggle").checked = false;
    document.getElementById("storeRegionsOnlyToggle").checked = false;
    renderAll();
  }

  // --- FILTER ENGINE ---
  function getFilteredRows(ignoreClickedMonth = false) {
    const { rows, lookups } = state.raw;
    const regIdx = state.region ? lookups.regions.indexOf(state.region) : -1;
    const siteIdx = state.site ? lookups.sites.indexOf(state.site) : -1;
    const chIdx = state.channel ? lookups.channels.indexOf(state.channel) : -1;
    const otIdx = state.orderType ? lookups.orderTypes.indexOf(state.orderType) : -1;

    const storeRegSet = new Set();
    if (state.storeRegionsOnly) {
      lookups.regions.forEach((n, idx) => { if (!n.startsWith("Non-Store")) storeRegSet.add(idx); });
    }

    const out = [];
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (state.monthFrom && r[C.MONTH] < state.monthFrom) continue;
      if (state.monthTo && r[C.MONTH] > state.monthTo) continue;
      if (!ignoreClickedMonth && state.clickedMonth && r[C.MONTH] !== state.clickedMonth) continue;
      if (regIdx !== -1 && r[C.REGION] !== regIdx) continue;
      if (siteIdx !== -1 && r[C.SITE] !== siteIdx) continue;
      if (chIdx !== -1 && r[C.CHANNEL] !== chIdx) continue;
      if (otIdx !== -1 && r[C.ORDER_TYPE] !== otIdx) continue;
      if (state.excludeBulk && Math.abs(r[C.QTY]) >= 100) continue;
      if (state.storeRegionsOnly && !storeRegSet.has(r[C.REGION])) continue;
      out.push(r);
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
      renderSiteRankList(filtered);
      renderRegionModality(filtered);
      renderTrendChart(filteredTime);
    } else if (state.activeView === "monthly") {
      renderDeepMonthly(filteredTime);
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
    } else if (state.activeView === "lookup") {
      if (state.lookup.selectedSku) {
        renderLookupProfile(state.lookup.selectedSku, state.lookup.selectedSerial);
      }
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

    if (charts.gaugeRing) {
      const ringPct = Math.max(0, Math.min(100, spec.g1Pct));
      charts.gaugeRing.setOption({
        series: [
          {
            type: "gauge", startAngle: 90, endAngle: -270, radius: "96%", min: 0, max: 100, splitNumber: 12,
            pointer: { show: false }, axisLine: { show: false },
            axisTick: { distance: -6, length: 7, splitNumber: 5, lineStyle: { color: "rgba(255,255,255,0.16)", width: 1.5 } },
            splitLine: { show: false }, axisLabel: { show: false }, detail: { show: false },
          },
          {
            type: "gauge", startAngle: 90, endAngle: -270, radius: "80%", min: 0, max: 100, pointer: { show: false },
            progress: {
              show: true, overlap: false, roundCap: true, clip: false,
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 1, 1, [
                  { offset: 0, color: spec.g1ColorA || "#1D7AFC" },
                  { offset: 1, color: spec.g1ColorB || "#12D37A" },
                ]),
                shadowBlur: 10, shadowColor: "rgba(29, 122, 252, 0.5)",
              },
            },
            axisLine: { lineStyle: { width: 7, color: [[1, "rgba(255,255,255,0.08)"]] } },
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
                { offset: 0, color: spec.g2ColorA || "#0D63D9" },
                { offset: 1, color: spec.g2ColorB || "#2196F3" },
              ]),
            },
          },
          axisLine: { lineStyle: { width: 20, color: [[1, "#252A34"]] } },
          axisTick: { show: false },
          splitLine: { show: true, distance: -20, length: 20, lineStyle: { color: "rgba(255,255,255,0.22)", width: 1.5 } },
          splitNumber: 5,
          axisLabel: {
            show: true, distance: -32, color: "#8492A6", fontFamily: "JetBrains Mono", fontSize: 9,
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
    if (v === "lookup") return; // Sidebar hidden on Tra cứu SKU/SN
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

    rows.forEach((r) => {
      const val = r[INV_C.VALUE], qty = r[INV_C.QTY];
      totVal += val; totQty += qty; skus.add(r[INV_C.SKU]); sites.add(r[INV_C.SITE]);
      const bt = (lookups.binTypes[r[INV_C.BIN_TYPE]] || "").toLowerCase();
      if (bt.includes("bán mới")) { sellVal += val; sellQty += qty; }
      if (bt.includes("hư hỏng")) { dmgVal += val; dmgQty += qty; }
      if ((lookups.purchaseStatuses[r[INV_C.STATUS]] || "").toLowerCase() === "discontinued") { discVal += val; discQty += qty; }
      const d = state.inv.agingBasis === "first" && r.length > INV_C.AGING_FIRST ? r[INV_C.AGING_FIRST] : r[INV_C.AGING];
      if (d > 365) { age365Val += val; age365Qty += qty; }
    });

    let healthyCnt = 0, clsCnt = 0, badRiskCnt = 0, badRiskVal = 0;
    if (state.raw.invSerials) {
      const snL = state.raw.invSerials.lookups;
      const badCol = state.inv.badScope === "site" ? SN_C.BAD_SITE : SN_C.BAD_COMP;
      const badL = state.inv.badScope === "site" ? snL.badSite : snL.badComp;
      serialRows.forEach((sr) => {
        if (!sr[SN_C.IN_BAD_FILE]) return;
        clsCnt++;
        if (badL[sr[badCol]] === "Tồn thông thường") healthyCnt++;
        else { badRiskCnt++; badRiskVal += sr[SN_C.INV_VAL]; }
      });
    }

    const sellPct = totVal > 0 ? (sellVal / totVal) * 100 : 0;
    const dmgPct = totVal > 0 ? (dmgVal / totVal) * 100 : 0;
    const shareAll = inv.meta?.totals?.value ? (totVal / inv.meta.totals.value) * 100 : 100;
    const healthyPct = clsCnt > 0 ? (healthyCnt / clsCnt) * 100 : 0;
    const vel30d = state.raw.invSkuLevel?.meta?.totals?.sales30d || 0;
    const mpCount = state.raw.masterProducts?.meta?.rowCount || 0;

    applySidebarSpec({
      title: "Tồn Kho",
      g1Label: "Tỷ lệ Hàng Bán Mới",
      g1Tag: `${fmtPct(shareAll)} tổng kho`,
      g1Big: fmtPct(sellPct),
      g1Pill: `Bán mới ${fmtCompactVnd(sellVal)}`,
      g1Pct: sellPct,
      bar1Label: "Tổng Giá trị Tồn",
      bar1Val: fmtCompactVnd(totVal),
      bar1Pct: shareAll,
      bar2Label: "Hàng Hư Hỏng",
      bar2Val: fmtCompactVnd(dmgVal),
      bar2Pct: dmgPct,
      g2Label: "Tỷ lệ Tồn Thông Thường",
      g2Tag: `${fmtInt(clsCnt)} SN phân loại`,
      g2Big: fmtPct(healthyPct),
      g2Pill: `${fmtInt(badRiskCnt)} SN Bad Stock`,
      g2PillNeg: badRiskCnt > 0,
      g2Pct: healthyPct,
      metrics: [
        { l: "Tổng SL Tồn", v: `${fmtInt(totQty)} qty`, s: `${fmtInt(serialRows.length)} Serial`, cls: "neutral" },
        { l: "Bad Stock Rủi ro", v: fmtCompactVnd(badRiskVal), s: `${fmtInt(badRiskCnt)} SN chậm/xấu`, cls: "neg" },
        { l: "Tồn > 365 ngày", v: fmtCompactVnd(age365Val), s: `${fmtInt(age365Qty)} units`, cls: "neg" },
        { l: "Discontinued", v: fmtCompactVnd(discVal), s: `${fmtInt(discQty)} units`, cls: "neutral" },
      ],
      insets: [
        { l: "Số Kho (Sites)", v: fmtInt(sites.size), s: `/ ${lookups.sites.length} kho`, cls: "pos" },
        { l: "Unique SKUs", v: fmtInt(skus.size), s: `${fmtInt(rows.length)} BIN`, cls: "pos" },
        { l: "Bán 30D (SKU)", v: fmtInt(vel30d), s: "units / 30D", cls: "pos" },
        { l: "Master SKUs", v: fmtInt(mpCount), s: "danh mục gốc", cls: "neutral" },
      ],
    });
  }

  function renderSidebarMonthly(rows) {
    const byM = new Map(), weeks = new Set(), days = new Set();
    let totSales = 0, totQty = 0, totGp = 0, bulkCnt = 0;
    rows.forEach((r) => {
      const m = r[C.MONTH];
      const cur = byM.get(m) || { sales: 0, qty: 0 };
      cur.sales += r[C.SALES]; cur.qty += r[C.QTY];
      byM.set(m, cur);
      weeks.add(r[C.WEEK]); days.add(r[C.DATE]);
      totSales += r[C.SALES]; totQty += r[C.QTY]; totGp += r[C.GP];
      if (Math.abs(r[C.QTY]) >= 100) bulkCnt++;
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

    const top5Sales = list.slice(0, 5).reduce((a, b) => a + b.sales, 0);
    const top5Share = totSales > 0 ? (top5Sales / totSales) * 100 : 0;
    const top1 = list[0] || { code: "—", sales: 0 };
    const top2 = list[1] || { code: "—", sales: 0 };
    const profCnt = list.filter((s) => s.gp > 0).length;
    const profRate = list.length ? (profCnt / list.length) * 100 : 0;
    const byGm = [...list].filter((s) => s.sales > 0).sort((a, b) => b.gm - a.gm);
    const bestGm = byGm[0] || { code: "—", gm: 0 };
    const worstGm = byGm[byGm.length - 1] || { code: "—", gm: 0 };
    const storeCnt = list.filter((s) => s.isStore).length;

    applySidebarSpec({
      title: "Site Code",
      g1Label: "Tỷ trọng Top 5 Sites",
      g1Tag: `${list.length} active sites`,
      g1Big: fmtPct(top5Share),
      g1Pill: `Top 5: ${fmtCompactVnd(top5Sales)}`,
      g1Pct: top5Share,
      bar1Label: `#1 ${top1.code}`,
      bar1Val: fmtCompactVnd(top1.sales),
      bar1Pct: totSales > 0 ? (top1.sales / totSales) * 100 : 0,
      bar2Label: `#2 ${top2.code}`,
      bar2Val: fmtCompactVnd(top2.sales),
      bar2Pct: totSales > 0 ? (top2.sales / totSales) * 100 : 0,
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
    const top1Share = totSales > 0 ? (top1.sales / totSales) * 100 : 0;
    const storeGm = storeSales > 0 ? (storeGp / storeSales) * 100 : 0;
    const storeRegCnt = list.filter((x) => !x.reg.startsWith("Non-Store")).length;

    applySidebarSpec({
      title: "Region Report",
      g1Label: `Tỷ trọng #1 (${shortRegionLabel(top1.reg)})`,
      g1Tag: `${list.length} vùng lọc`,
      g1Big: fmtPct(top1Share),
      g1Pill: fmtCompactVnd(top1.sales),
      g1Pct: top1Share,
      bar1Label: "Khối 5 Region CH",
      bar1Val: fmtCompactVnd(storeSales),
      bar1Pct: totSales > 0 ? (storeSales / totSales) * 100 : 0,
      bar2Label: "Khối Non-Store",
      bar2Val: fmtCompactVnd(nonSales),
      bar2Pct: totSales > 0 ? (nonSales / totSales) * 100 : 0,
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
    const byCh = new Map(), bySub = new Map(), byBr = new Map(), skus = new Set();
    let totSales = 0, totQty = 0;
    rows.forEach((r) => {
      const ch = lookups.channels[r[C.CHANNEL]], sub = lookups.subcats[r[C.SUBCAT]], br = lookups.brands[r[C.BRAND]];
      byCh.set(ch, (byCh.get(ch) || 0) + r[C.SALES]);
      bySub.set(sub, (bySub.get(sub) || 0) + r[C.SALES]);
      byBr.set(br, (byBr.get(br) || 0) + r[C.SALES]);
      skus.add(r[C.SKU]);
      totSales += r[C.SALES]; totQty += r[C.QTY];
    });
    const chList = Array.from(byCh.entries()).sort((a, b) => b[1] - a[1]);
    const subList = Array.from(bySub.entries()).sort((a, b) => b[1] - a[1]);
    const brList = Array.from(byBr.entries()).sort((a, b) => b[1] - a[1]);

    const topCh = chList[0] || ["—", 0];
    const topSub = subList[0] || ["—", 0];
    const topBr1 = brList[0] || ["—", 0];
    const topBr2 = brList[1] || ["—", 0];
    const topChShare = totSales > 0 ? (topCh[1] / totSales) * 100 : 0;
    const top3BrSales = brList.slice(0, 3).reduce((s, x) => s + x[1], 0);
    const top3BrShare = totSales > 0 ? (top3BrSales / totSales) * 100 : 0;

    applySidebarSpec({
      title: "Channel & Brand",
      g1Label: `Top Channel (${topCh[0]})`,
      g1Tag: `${chList.length} kênh bán`,
      g1Big: fmtPct(topChShare),
      g1Pill: fmtCompactVnd(topCh[1]),
      g1Pct: topChShare,
      bar1Label: `Kênh #1: ${topCh[0]}`,
      bar1Val: fmtCompactVnd(topCh[1]),
      bar1Pct: topChShare,
      bar2Label: `Nhóm #1: ${topSub[0].slice(0, 18)}`,
      bar2Val: fmtCompactVnd(topSub[1]),
      bar2Pct: totSales > 0 ? (topSub[1] / totSales) * 100 : 0,
      g2Label: "Tỷ trọng Top 3 Brands",
      g2Tag: `${brList.length} brands`,
      g2Big: fmtPct(top3BrShare),
      g2Pill: fmtCompactVnd(top3BrSales),
      g2Pct: top3BrShare,
      metrics: [
        { l: "Top #1 Brand", v: topBr1[0].slice(0, 12), s: fmtCompactVnd(topBr1[1]), cls: "pos" },
        { l: "Top #2 Brand", v: topBr2[0].slice(0, 12), s: fmtCompactVnd(topBr2[1]), cls: "neutral" },
        { l: "Top #1 Subcat", v: fmtCompactVnd(topSub[1]), s: topSub[0].slice(0, 14), cls: "pos" },
        { l: "Giá bán TB (ASP)", v: fmtCompactVnd(totQty ? totSales / totQty : 0), s: "VND / unit", cls: "neutral" },
      ],
      insets: [
        { l: "Channels", v: fmtInt(chList.length), s: "kênh phân phối", cls: "pos" },
        { l: "Subcat 2", v: fmtInt(subList.length), s: "nhóm hàng", cls: "pos" },
        { l: "Brands", v: fmtInt(brList.length), s: "thương hiệu", cls: "pos" },
        { l: "Unique SKUs", v: fmtInt(skus.size), s: "mã phát sinh", cls: "neutral" },
      ],
    });
  }

  function renderSidebarLedger(rows) {
    const { meta, lookups } = state.raw;
    const retIdx = lookups.orderTypes.indexOf("don_nhap_hoan_ban");
    let expRows = 0, retRows = 0, expSales = 0, retSales = 0, totSales = 0, totGp = 0, totQty = 0;
    const sites = new Set(), skus = new Set();
    rows.forEach((r) => {
      totSales += r[C.SALES]; totGp += r[C.GP]; totQty += r[C.QTY];
      sites.add(r[C.SITE]); skus.add(r[C.SKU]);
      if (r[C.ORDER_TYPE] === retIdx) { retRows++; retSales += Math.abs(r[C.SALES]); }
      else { expRows++; expSales += r[C.SALES]; }
    });
    const expRate = rows.length ? (expRows / rows.length) * 100 : 0;
    const filterShare = meta.rowCount ? (rows.length / meta.rowCount) * 100 : 0;

    applySidebarSpec({
      title: "Data Ledger",
      g1Label: "Tỷ lệ Đơn Xuất Bán",
      g1Tag: `${fmtInt(rows.length)} dòng`,
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
        { l: "Tổng dòng lọc", v: fmtInt(rows.length), s: `/ ${fmtInt(meta.rowCount)}`, cls: "pos" },
        { l: "Tổng Sales (Lọc)", v: fmtCompactVnd(totSales), s: "doanh thu thuần", cls: "pos" },
        { l: "Tổng GP (Lọc)", v: fmtCompactVnd(totGp), s: `GM ${totSales ? fmtPct((totGp / totSales) * 100) : "0%"}`, cls: "pos" },
        { l: "Tổng QTY (Lọc)", v: fmtInt(totQty), s: "units thuần", cls: "neutral" },
      ],
      insets: [
        { l: "Đơn Xuất bán", v: fmtInt(expRows), s: fmtPct(expRate), cls: "pos" },
        { l: "Đơn Hoàn bán", v: fmtInt(retRows), s: rows.length ? fmtPct((retRows / rows.length) * 100) : "0%", cls: "neg" },
        { l: "Active Sites", v: fmtInt(sites.size), s: "điểm bán", cls: "pos" },
        { l: "Unique SKUs", v: fmtInt(skus.size), s: "mã hàng", cls: "neutral" },
      ],
    });
  }

  function renderSidebar(rows) {
    const { meta, lookups } = state.raw;
    let sales = 0, qty = 0, cogs = 0, gp = 0, exportRows = 0, returnRows = 0;
    const sites = new Set(), regions = new Set(), months = new Set();
    const retIdx = lookups.orderTypes.indexOf("don_nhap_hoan_ban");

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      sales += r[C.SALES];
      qty += r[C.QTY];
      cogs += r[C.COGS];
      gp += r[C.GP];
      if (r[C.ORDER_TYPE] === retIdx) returnRows++;
      else exportRows++;
      sites.add(r[C.SITE]);
      regions.add(r[C.REGION]);
      months.add(r[C.MONTH]);
    }

    const totalRows = rows.length;
    const gm = sales !== 0 ? (gp / sales) * 100 : 0;
    const fulfillRate = totalRows > 0 ? (exportRows / totalRows) * 100 : 0;
    const salesShare = meta.totals.sales ? (sales / meta.totals.sales) * 100 : 0;
    const cogsRatio = sales > 0 ? Math.min(100, (cogs / sales) * 100) : 0;
    const avgMonthSales = months.size > 0 ? sales / months.size : 0;
    const avgMonthQty = months.size > 0 ? qty / months.size : 0;
    const asp = qty !== 0 ? sales / qty : 0;

    applySidebarSpec({
      title: "Dashboard",
      g1Label: "Gross Margin & Revenue",
      g1Tag: `${fmtPct(salesShare)} tổng`,
      g1Big: fmtPct(gm),
      g1Pill: `GP ${fmtCompactVnd(gp)}`,
      g1Pct: (gm / 35) * 100,
      bar1Label: "Total Sales",
      bar1Val: fmtCompactVnd(sales),
      bar1Pct: salesShare,
      bar2Label: "COGS (Giá vốn)",
      bar2Val: fmtCompactVnd(cogs),
      bar2Pct: cogsRatio,
      g2Label: "Net Export Rate",
      g2Tag: `${fmtInt(qty)} QTY`,
      g2Big: fmtPct(fulfillRate),
      g2Pill: `${fmtInt(qty)} units`,
      g2Pct: fulfillRate,
      metrics: [
        { l: "TB Sales / Tháng", v: fmtCompactVnd(avgMonthSales), s: `${months.size} tháng`, cls: "pos" },
        { l: "TB Qty / Tháng", v: fmtInt(avgMonthQty), s: "sp / tháng", cls: "pos" },
        { l: "Giá bán TB (ASP)", v: fmtCompactVnd(asp), s: "VND / unit", cls: "neutral" },
        { l: "Tổng Lợi nhuận", v: fmtCompactVnd(gp), s: `GM ${fmtPct(gm)}`, cls: "pos" },
      ],
      insets: [
        { l: "Active Sites", v: fmtInt(sites.size), s: `/ ${lookups.sites.length} sites`, cls: "pos" },
        { l: "Active Regions", v: fmtInt(regions.size), s: "vùng lọc", cls: "pos" },
        { l: "Đơn Xuất bán", v: fmtInt(exportRows), s: fmtPct(fulfillRate), cls: "pos" },
        { l: "Đơn Hoàn bán", v: fmtInt(returnRows), s: totalRows ? fmtPct((returnRows / totalRows) * 100) : "0.0%", cls: "neg" },
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

    if (state.clickedMonth) add(`Month: ${state.clickedMonth}`, "", () => { state.clickedMonth = ""; renderAll(); });
    if (state.region) add(`Region: ${state.region}`, "", () => toggleRegionFilter(state.region));
    if (state.site) add(`Site: ${state.site}`, "", () => toggleSiteFilter(state.site));
    if (state.channel) add(`Channel: ${state.channel}`, "", () => {
      state.channel = ""; document.getElementById("filterChannel").value = ""; renderAll();
    });
    if (state.orderType) add(state.orderType === "don_xuat_ban" ? "Xuất bán" : "Hoàn bán", "amber", () => {
      state.orderType = ""; document.getElementById("filterOrderType").value = ""; renderAll();
    });
    if (state.excludeBulk) add("Ẩn đơn sỉ (≥100 Qty)", "amber", () => {
      state.excludeBulk = false; document.getElementById("excludeBulkToggle").checked = false; renderAll();
    });
    if (state.storeRegionsOnly) add("Chỉ 5 Region CH", "amber", () => {
      state.storeRegionsOnly = false; document.getElementById("storeRegionsOnlyToggle").checked = false; renderAll();
    });

    wrap.innerHTML = "";
    if (chips.length === 0) {
      wrap.innerHTML = `<span class="chip muted-chip">Toàn bộ dữ liệu • ${fmtInt(rows.length)} dòng</span>`;
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
      insightEl.textContent = "Không có dữ liệu khớp bộ lọc — bấm Reset bên trái.";
      return;
    }

    const byMonth = new Map();
    rows.forEach((r) => byMonth.set(r[C.MONTH], (byMonth.get(r[C.MONTH]) || 0) + r[C.SALES]));
    let peakM = "", peakS = -Infinity;
    byMonth.forEach((v, k) => { if (v > peakS) { peakS = v; peakM = k; } });

    let bulkInPeak = 0, bulkQtyInPeak = 0;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][C.MONTH] === peakM && Math.abs(rows[i][C.QTY]) >= 100) {
        bulkInPeak++;
        bulkQtyInPeak += rows[i][C.QTY];
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
  function renderHeroChart(rows) {
    if (!charts.hero) return;
    if (rows.length === 0) {
      charts.hero.clear();
      charts.hero.setOption(emptyOption("Không có dữ liệu khớp bộ lọc"));
      return;
    }

    const { lookups } = state.raw;
    const bucketCol =
      state.heroGranularity === "day" ? C.DATE :
      state.heroGranularity === "week" ? C.WEEK : C.MONTH;

    if (state.heroMode === "region_grouped") {
      // Exact multi-colored grouped vertical bars matching the reference's Dialogue Volume!
      const buckets = Array.from(new Set(rows.map((r) => r[bucketCol]))).sort();
      const regTotals = new Map();
      const mat = new Map();

      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const b = r[bucketCol];
        const reg = lookups.regions[r[C.REGION]];
        regTotals.set(reg, (regTotals.get(reg) || 0) + r[C.SALES]);
        const key = `${reg}__${b}`;
        mat.set(key, (mat.get(key) || 0) + r[C.SALES]);
      }

      const regs = Array.from(regTotals.entries()).sort((a, b) => b[1] - a[1]).map(([k]) => k);
      const series = regs.map((reg, idx) => ({
        name: reg,
        type: "bar",
        barGap: "18%",
        barMaxWidth: 14,
        itemStyle: {
          color: REGION_COLORS[reg] || FALLBACK_COLORS[idx % FALLBACK_COLORS.length],
          borderRadius: [2, 2, 0, 0],
        },
        data: buckets.map((b) => Math.round(mat.get(`${reg}__${b}`) || 0)),
      }));

      charts.hero.setOption({
        backgroundColor: "transparent",
        tooltip: {
          trigger: "axis",
          axisPointer: { type: "shadow" },
          backgroundColor: COLORS.tooltipBg,
          borderColor: COLORS.tooltipBorder,
          textStyle: { color: "#F1F5F9", fontSize: 12 },
          valueFormatter: (v) => fmtVndFull(v),
        },
        legend: {
          bottom: 0,
          icon: "circle",
          itemWidth: 8,
          itemHeight: 8,
          textStyle: { color: "#94A3B8", fontSize: 11 },
          formatter: (n) => shortRegionLabel(n),
        },
        grid: { left: 54, right: 16, top: 14, bottom: 48 },
        xAxis: {
          type: "category",
          data: buckets,
          axisLine: { lineStyle: { color: COLORS.axisLine } },
          axisLabel: { color: "#CBD5E1", fontFamily: "JetBrains Mono", fontSize: 10.5 },
        },
        yAxis: {
          type: "value",
          axisLabel: { color: COLORS.axisLabel, fontFamily: "JetBrains Mono", fontSize: 10.5, formatter: fmtAxisVnd },
          splitLine: { lineStyle: { color: COLORS.gridLine } },
        },
        series,
      }, true);
      return;
    }

    // Sales + Qty OR Sales + GP
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
      const sel = state.heroGranularity === "month" && state.clickedMonth === k;
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

    const isGp = state.heroMode === "sales_gp";
    const series = isGp
      ? [
          { name: "Sales (VND)", type: "bar", barMaxWidth: 26, data: salesBars },
          {
            name: "Gross Profit (GP)",
            type: "bar",
            barMaxWidth: 26,
            data: keys.map((k) => Math.round(map.get(k).gp)),
            itemStyle: { color: COLORS.emerald, borderRadius: [3, 3, 0, 0] },
          },
        ]
      : [
          {
            name: "Sales (VND)",
            type: "bar",
            yAxisIndex: 0,
            barMaxWidth: 34,
            data: salesBars,
            label: {
              show: keys.length <= 13,
              position: "top",
              color: "#CBD5E1",
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
            itemStyle: { color: COLORS.amber, borderColor: "#0E1014", borderWidth: 1.5 },
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
        textStyle: { color: "#94A3B8", fontSize: 11 },
      },
      grid: { left: 54, right: isGp ? 20 : 54, top: 24, bottom: 44 },
      xAxis: {
        type: "category",
        data: keys,
        axisLine: { lineStyle: { color: COLORS.axisLine } },
        axisLabel: { color: "#CBD5E1", fontFamily: "JetBrains Mono", fontSize: 10.5 },
      },
      yAxis: isGp
        ? {
            type: "value",
            axisLabel: { color: COLORS.axisLabel, fontFamily: "JetBrains Mono", fontSize: 10.5, formatter: fmtAxisVnd },
            splitLine: { lineStyle: { color: COLORS.gridLine } },
          }
        : [
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

    container.innerHTML = top
      .map((d, idx) => {
        const gmClamp = Math.max(0, Math.min(100, d.gm));
        const ringDeg = Math.round((Math.min(50, gmClamp) / 50) * 360);
        const sPct = Math.max(3, Math.min(100, (Math.abs(d.sales) / maxSales) * 100));
        const qPct = Math.max(3, Math.min(100, (Math.abs(d.qty) / maxQty) * 100));
        const title = d.storeName !== d.siteCode ? `${d.siteCode} — ${d.storeName}` : d.siteCode;
        const selectedCls = state.site === d.siteCode ? "selected" : "";

        return `
        <div class="rank-row ${selectedCls}" data-site="${esc(d.siteCode)}">
          <div class="rank-idx">${idx + 1}</div>
          <div class="rank-ring" style="background: conic-gradient(#1D7AFC 0deg ${ringDeg}deg, #2A313D ${ringDeg}deg 360deg)">
            <div class="rank-ring-inner">${Math.round(gmClamp)}%</div>
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
      el.addEventListener("click", () => toggleSiteFilter(el.dataset.site));
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
        const activeCls = state.region === d.region ? "active" : "";
        return `
        <div class="reg-mod-item ${activeCls}" data-reg="${esc(d.region)}" title="Click để lọc Region ${esc(d.region)} (Sales: ${fmtVndFull(d.sales)} | Qty: ${fmtInt(d.qty)})">
          <div class="reg-mod-val">${fmtVal(d[metric])}</div>
          <div class="reg-mod-label">
            <span class="reg-dot" style="background:${color}"></span>
            <span>${esc(shortRegionLabel(d.region))}</span>
          </div>
        </div>`;
      })
      .join("");

    barEl.querySelectorAll("[data-reg]").forEach((el) => {
      el.addEventListener("click", () => toggleRegionFilter(el.dataset.reg));
    });
    gridEl.querySelectorAll("[data-reg]").forEach((el) => {
      el.addEventListener("click", () => toggleRegionFilter(el.dataset.reg));
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
        textStyle: { color: "#94A3B8", fontSize: 11 },
      },
      grid: { left: 48, right: 16, top: 14, bottom: 42 },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: months,
        axisLine: { lineStyle: { color: COLORS.axisLine } },
        axisLabel: {
          color: "#94A3B8",
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
  // 7. DEEP VIEWS (BLUE RAIL PAGES 2–6)
  // =========================================================================
  function renderDeepMonthly(rows) {
    if (!charts.deepMonthly) return;
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
        legend: { top: 0, textStyle: { color: "#CBD5E1" } },
        grid: { left: 58, right: 24, top: 36, bottom: 70 },
        xAxis: { type: "category", data: keys, axisLabel: { color: "#CBD5E1", fontFamily: "JetBrains Mono" } },
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
      legend: { top: 0, textStyle: { color: "#CBD5E1" } },
      grid: { left: 62, right: 62, top: 38, bottom: 70 },
      xAxis: { type: "category", data: keys, axisLabel: { color: "#CBD5E1", fontFamily: "JetBrains Mono" } },
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
        yAxis: { type: "category", data: rev.map((d) => d.siteCode), axisLabel: { color: "#E2E8F0", fontFamily: "JetBrains Mono", fontSize: 11 } },
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
            color: "#CBD5E1",
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
            itemStyle: { color: REGION_COLORS[d.region] || COLORS.blue, borderColor: "#0E1014", borderWidth: 2 },
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
          label: { show: true, position: "top", color: "#CBD5E1", fontFamily: "JetBrains Mono", fontSize: 10, formatter: (p) => p.data.siteCode },
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

    charts.deepRegionPie.setOption({
      tooltip: { trigger: "item", backgroundColor: COLORS.tooltipBg, borderColor: COLORS.tooltipBorder, textStyle: { color: "#F1F5F9" }, valueFormatter: fmtVndFull },
      legend: { bottom: 0, textStyle: { color: "#94A3B8", fontSize: 11 } },
      series: [{
        type: "pie",
        radius: ["48%", "74%"],
        center: ["50%", "44%"],
        label: { color: "#E2E8F0", formatter: "{b}\n{d}%" },
        data: regs.map(([name, val], i) => ({
          name,
          value: Math.round(val),
          itemStyle: { color: REGION_COLORS[name] || FALLBACK_COLORS[i % FALLBACK_COLORS.length], borderColor: "#15181D", borderWidth: 2 },
        })),
      }],
    }, true);

    charts.deepRegionStack.setOption({
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, backgroundColor: COLORS.tooltipBg, borderColor: COLORS.tooltipBorder, textStyle: { color: "#F1F5F9" }, valueFormatter: fmtVndFull },
      legend: { bottom: 0, type: "scroll", textStyle: { color: "#94A3B8", fontSize: 11 } },
      grid: { left: 56, right: 16, top: 18, bottom: 54 },
      xAxis: { type: "category", data: months, axisLabel: { color: "#CBD5E1", fontFamily: "JetBrains Mono", fontSize: 10.5 } },
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
    const { lookups } = state.raw;

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
      xAxis: { type: "category", data: chList.map((d) => d.name), axisLabel: { color: "#E2E8F0", fontFamily: "JetBrains Mono" } },
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
      yAxis: { type: "category", data: topDr.map(([n]) => n), axisLabel: { color: "#E2E8F0", width: 164, overflow: "truncate" } },
      series: [{
        type: "bar",
        barMaxWidth: 20,
        data: topDr.map(([, v]) => Math.round(v)),
        itemStyle: { color: COLORS.emerald, borderRadius: [0, 3, 3, 0] },
        label: { show: true, position: "right", color: "#CBD5E1", fontFamily: "JetBrains Mono", fontSize: 10, formatter: (p) => fmtCompactVnd(p.value) },
      }],
    }, true);
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

    tbody.querySelectorAll("[data-sc]").forEach((tr) => tr.addEventListener("click", () => toggleSiteFilter(tr.dataset.sc)));
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
    tbody.querySelectorAll("[data-reg]").forEach((tr) => tr.addEventListener("click", () => toggleRegionFilter(tr.dataset.reg)));

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
    let filtered = rows;
    if (state.tableSearch) {
      const q = state.tableSearch;
      filtered = rows.filter((r) =>
        r[C.DATE].includes(q) ||
        lookups.sites[r[C.SITE]].toLowerCase().includes(q) ||
        lookups.stores[r[C.STORE]].toLowerCase().includes(q) ||
        lookups.regions[r[C.REGION]].toLowerCase().includes(q) ||
        lookups.skus[r[C.SKU]].toLowerCase().includes(q)
      );
    }

    const colIdx = { date: C.DATE, site: C.SITE, region: C.REGION, qty: C.QTY, sales: C.SALES, gp: C.GP }[state.tableSortCol] ?? C.DATE;
    const dir = state.tableSortDir === "asc" ? 1 : -1;
    const sorted = [...filtered].sort((a, b) => (typeof a[colIdx] === "string" ? a[colIdx].localeCompare(b[colIdx]) * dir : (a[colIdx] - b[colIdx]) * dir));

    const totalPages = Math.max(1, Math.ceil(sorted.length / state.tablePageSize));
    state.tablePage = Math.min(state.tablePage, totalPages);
    const start = (state.tablePage - 1) * state.tablePageSize;
    const pageRows = sorted.slice(start, start + state.tablePageSize);

    renderHead([
      { key: "date", label: "Report Date" },
      { key: "site", label: "Site Code" },
      { key: "store", label: "Store", nosort: true },
      { key: "region", label: "Region" },
      { key: "sku", label: "SKU — Sản phẩm", nosort: true },
      { key: "qty", label: "Qty", num: true },
      { key: "sales", label: "Sales (VND)", num: true },
      { key: "gp", label: "GP (VND)", num: true },
    ]);

    document.getElementById("tableBody").innerHTML = pageRows
      .map((r) => `
      <tr>
        <td class="mono">${r[C.DATE]}</td>
        <td class="mono"><strong>${esc(lookups.sites[r[C.SITE]])}</strong></td>
        <td>${esc(lookups.stores[r[C.STORE]])}</td>
        <td><span class="tag-pill">${esc(lookups.regions[r[C.REGION]])}</span></td>
        <td class="sku-cell" title="${esc(lookups.skus[r[C.SKU]])}">${esc(lookups.skus[r[C.SKU]])}</td>
        <td class="num" style="color:#F59E0B">${fmtInt(r[C.QTY])}</td>
        <td class="num">${fmtInt(r[C.SALES])}</td>
        <td class="num" style="color:#12D37A">${fmtInt(r[C.GP])}</td>
      </tr>`)
      .join("");

    document.getElementById("tableCountInfo").textContent =
      `Hiển thị ${fmtInt(start + 1)}–${fmtInt(Math.min(start + pageRows.length, sorted.length))} / ${fmtInt(sorted.length)} giao dịch`;

    const pag = document.getElementById("tablePagination");
    pag.innerHTML = `
      <button class="page-btn" id="prevP" ${state.tablePage <= 1 ? "disabled" : ""}>◀</button>
      <span class="mono" style="font-size:11px;color:#94A3B8">Trang ${state.tablePage}/${totalPages}</span>
      <button class="page-btn" id="nextP" ${state.tablePage >= totalPages ? "disabled" : ""}>▶</button>`;
    pag.querySelector("#prevP").addEventListener("click", () => { if (state.tablePage > 1) { state.tablePage--; renderRawTable(rows); } });
    pag.querySelector("#nextP").addEventListener("click", () => { if (state.tablePage < totalPages) { state.tablePage++; renderRawTable(rows); } });

    state.lastTableExport = {
      headers: ["Report Date", "Month", "Sales Site Code", "Store Name", "Region Name", "Channel", "SKU", "Sales QTY", "Sales", "COGS", "GP"],
      rows: sorted.map((r) => [
        r[C.DATE], r[C.MONTH], lookups.sites[r[C.SITE]], lookups.stores[r[C.STORE]],
        lookups.regions[r[C.REGION]], lookups.channels[r[C.CHANNEL]], lookups.skus[r[C.SKU]],
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
    const sn = state.raw?.invSerials;
    const fill = (id, allLabel, items, labelFn = (x) => x) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.innerHTML = `<option value="">${allLabel}</option>`;
      items.forEach((v) => el.add(new Option(labelFn(v), v)));
    };

    const statusSet = new Set([
      ...(inv?.lookups?.purchaseStatuses || []),
      ...(mp?.lookups?.purchaseStatuses || []),
    ]);
    fill("invFilterStatus", `Tất cả TT Mua (${statusSet.size})`, [...statusSet].sort());

    const rangeSet = new Set([
      ...(inv?.lookups?.ranges || ["No"]),
      ...(mp?.lookups?.ranges || []),
    ]);
    fill("invFilterRange", `Tất cả Range (${rangeSet.size})`, [...rangeSet].sort());

    const badSet = new Set([
      ...BAD_STOCK_ORDER,
      ...(sn?.lookups?.badComp || []),
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
      fill("invFilterSubcat", "Tất cả Subcat 2", []);
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
    fill("invFilterSubcat", `Tất cả Subcat 2 (${lookups.subcats.length})`, [...lookups.subcats].sort());
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
    setVal("invFilterSubcat", "");
    setVal("invFilterBrand", "");
    setVal("invFilterStatus", "");
    setVal("invFilterRange", "");
    setVal("invFilterBadStock", "");
    setVal("invTableSearchInput", "");
    setChk("invSellableOnlyToggle", false);
    setChk("invDamagedOnlyToggle", false);

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
    onSelect("invFilterSubcat", "subcat");
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

  function getFilteredSerialRows() {
    const sn = state.raw?.invSerials;
    if (!sn || !Array.isArray(sn.rows)) return [];
    const { rows, lookups } = sn;
    const iv = state.inv;

    const siteIdx = iv.site ? lookups.sites.indexOf(iv.site) : -1;
    const btIdx = iv.binType ? lookups.binTypes.indexOf(iv.binType) : -1;
    const bzIdx = iv.binZone ? lookups.binZones.indexOf(iv.binZone) : -1;
    const scIdx = iv.subcat ? lookups.subcats.indexOf(iv.subcat) : -1;
    const brIdx = iv.brand ? lookups.brands.indexOf(iv.brand) : -1;
    const stIdx = iv.status ? lookups.purchaseStatuses.indexOf(iv.status) : -1;
    const rngIdx = iv.range ? (lookups.ranges || []).indexOf(iv.range) : -1;
    const badCol = iv.badScope === "site" ? SN_C.BAD_SITE : SN_C.BAD_COMP;
    const badLookup = iv.badScope === "site" ? lookups.badSite : lookups.badComp;
    const badIdx = iv.badStock ? badLookup.indexOf(iv.badStock) : -1;
    const agingObj = iv.agingBucket ? AGING_BUCKETS.find((b) => b.key === iv.agingBucket) : null;
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
      if (iv.site && r[SN_C.SITE] !== siteIdx) continue;
      if (iv.binType && r[SN_C.BIN_TYPE] !== btIdx) continue;
      if (iv.binZone && r[SN_C.BIN_ZONE] !== bzIdx) continue;
      if (iv.subcat && r[SN_C.SUBCAT] !== scIdx) continue;
      if (iv.brand && r[SN_C.BRAND] !== brIdx) continue;
      if (iv.status && r[SN_C.STATUS] !== stIdx) continue;
      if (iv.range && r[SN_C.RANGE] !== rngIdx) continue;
      if (iv.badStock && r[badCol] !== badIdx) continue;
      if (iv.sellableOnly && !sellableSet.has(r[SN_C.BIN_TYPE])) continue;
      if (iv.damagedOnly && !damagedSet.has(r[SN_C.BIN_TYPE])) continue;
      if (agingObj && !agingObj.test(r[agingCol])) continue;
      out.push(r);
    }
    return out;
  }

  function getFilteredInvRows() {
    const inv = state.raw?.inventory;
    if (!inv || !Array.isArray(inv.rows)) return [];
    const { rows, lookups } = inv;
    const iv = state.inv;

    const siteIdx = iv.site ? lookups.sites.indexOf(iv.site) : -1;
    const btIdx = iv.binType ? lookups.binTypes.indexOf(iv.binType) : -1;
    const bzIdx = iv.binZone ? lookups.binZones.indexOf(iv.binZone) : -1;
    const scIdx = iv.subcat ? lookups.subcats.indexOf(iv.subcat) : -1;
    const brIdx = iv.brand ? lookups.brands.indexOf(iv.brand) : -1;
    const stIdx = iv.status ? lookups.purchaseStatuses.indexOf(iv.status) : -1;
    const rngIdx = iv.range ? (lookups.ranges || []).indexOf(iv.range) : -1;
    const agingObj = iv.agingBucket ? AGING_BUCKETS.find((b) => b.key === iv.agingBucket) : null;

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
      if (iv.site && r[INV_C.SITE] !== siteIdx) continue;
      if (iv.binType && r[INV_C.BIN_TYPE] !== btIdx) continue;
      if (iv.binZone && r[INV_C.BIN_ZONE] !== bzIdx) continue;
      if (iv.subcat && r[INV_C.SUBCAT] !== scIdx) continue;
      if (iv.brand && r[INV_C.BRAND] !== brIdx) continue;
      if (iv.status && r[INV_C.STATUS] !== stIdx) continue;
      if (iv.range && r[INV_C.RANGE] !== rngIdx) continue;
      if (iv.sellableOnly && !sellableIdxSet.has(r[INV_C.BIN_TYPE])) continue;
      if (iv.damagedOnly && !damagedIdxSet.has(r[INV_C.BIN_TYPE])) continue;
      if (agingObj) {
        const d = iv.agingBasis === "first" && r.length > INV_C.AGING_FIRST ? r[INV_C.AGING_FIRST] : r[INV_C.AGING];
        if (!agingObj.test(d)) continue;
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

    let badRiskVal = 0, badRiskCnt = 0, classifiedCnt = 0;
    if (state.raw.invSerials) {
      const snL = state.raw.invSerials.lookups;
      const badCol = state.inv.badScope === "site" ? SN_C.BAD_SITE : SN_C.BAD_COMP;
      const badL = state.inv.badScope === "site" ? snL.badSite : snL.badComp;
      serialRows.forEach((sr) => {
        if (sr[SN_C.IN_BAD_FILE]) {
          classifiedCnt++;
          if (badL[sr[badCol]] !== "Tồn thông thường") {
            badRiskCnt++;
            badRiskVal += sr[SN_C.INV_VAL];
          }
        }
      });
    }

    const pct = (part) => (totalVal > 0 ? fmtPct((part / totalVal) * 100) : "0.0%");
    const avgCost = totalQty > 0 ? totalVal / totalQty : 0;

    document.getElementById("invKpiValue").textContent = fmtCompactVnd(totalVal);
    document.getElementById("invKpiValueSub").textContent = `Net PP: ${fmtCompactVnd(totalNet)} • TB ${fmtCompactVnd(avgCost)}`;
    document.getElementById("invKpiQty").textContent = `${fmtInt(totalQty)} units`;
    document.getElementById("invKpiQtySub").textContent = `${fmtInt(serialRows.length)} SN • ${fmtInt(skuSet.size)} SKU • ${fmtInt(siteSet.size)} kho`;
    document.getElementById("invKpiSellable").textContent = fmtCompactVnd(sellVal);
    document.getElementById("invKpiSellableSub").textContent = `${pct(sellVal)} • ${fmtInt(sellQty)} units`;
    document.getElementById("invKpiBadStock").textContent = fmtCompactVnd(badRiskVal);
    document.getElementById("invKpiBadStockSub").textContent = `${fmtInt(badRiskCnt)} SN rủi ro / ${fmtInt(classifiedCnt)} SN phân loại`;
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

    if (iv.status) add(`TT Mua: ${iv.status}`, "amber", () => { iv.status = ""; document.getElementById("invFilterStatus").value = ""; renderInventoryView(); });
    if (iv.range) add(`Range: ${iv.range}`, "", () => { iv.range = ""; document.getElementById("invFilterRange").value = ""; renderInventoryView(); });
    if (iv.badStock) add(`Loại tồn: ${iv.badStock}`, "amber", () => { iv.badStock = ""; document.getElementById("invFilterBadStock").value = ""; renderInventoryView(); });
    if (iv.agingBucket) {
      const b = AGING_BUCKETS.find((x) => x.key === iv.agingBucket);
      add(`Tuổi tồn: ${b ? b.label : iv.agingBucket}`, "amber", () => { iv.agingBucket = ""; renderInventoryView(); });
    }
    if (iv.site) add(`Kho: ${iv.site}`, "", () => { iv.site = ""; document.getElementById("invFilterSite").value = ""; renderInventoryView(); });
    if (iv.binType) add(`BIN Type: ${iv.binType}`, "", () => { iv.binType = ""; document.getElementById("invFilterBinType").value = ""; renderInventoryView(); });
    if (iv.binZone) add(`BIN Zone: ${iv.binZone}`, "", () => { iv.binZone = ""; document.getElementById("invFilterBinZone").value = ""; renderInventoryView(); });
    if (iv.subcat) add(`Subcat: ${iv.subcat}`, "", () => { iv.subcat = ""; document.getElementById("invFilterSubcat").value = ""; renderInventoryView(); });
    if (iv.brand) add(`Brand: ${iv.brand}`, "", () => { iv.brand = ""; document.getElementById("invFilterBrand").value = ""; renderInventoryView(); });
    if (iv.sellableOnly) add("Chỉ hàng bán mới", "", () => { iv.sellableOnly = false; document.getElementById("invSellableOnlyToggle").checked = false; renderInventoryView(); });
    if (iv.damagedOnly) add("Chỉ hàng hư hỏng", "amber", () => { iv.damagedOnly = false; document.getElementById("invDamagedOnlyToggle").checked = false; renderInventoryView(); });

    wrap.innerHTML = "";
    if (!chips.length) {
      wrap.innerHTML = `<span class="chip muted-chip">Toàn bộ tồn kho • ${fmtInt(rows.length)} BIN • ${fmtInt(serialRows.length)} Serial</span>`;
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
    if (!rows.length && !serialRows.length) {
      insightEl.textContent = "Không có dữ liệu khớp bộ lọc — bấm Reset Kho.";
      return;
    }
    const { lookups } = state.raw.inventory;
    let totVal = 0, dmgVal = 0;
    rows.forEach((r) => {
      totVal += r[INV_C.VALUE];
      if ((lookups.binTypes[r[INV_C.BIN_TYPE]] || "").toLowerCase().includes("hư hỏng")) dmgVal += r[INV_C.VALUE];
    });
    let veryBadVal = 0, veryBadCnt = 0;
    if (state.raw.invSerials) {
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
    const sn = state.raw?.invSerials;
    if (!sn || !serialRows.length) {
      charts.invBadStock.clear();
      charts.invBadStock.setOption(emptyOption("Chưa có dữ liệu Bad Stock / Serial khớp bộ lọc"));
      return;
    }

    const iv = state.inv;
    const isSite = iv.badScope === "site";
    const isQty = iv.badMetric === "qty";
    const onlyClassified = iv.badFilter === "classified";
    const badCol = isSite ? SN_C.BAD_SITE : SN_C.BAD_COMP;
    const badL = isSite ? sn.lookups.badSite : sn.lookups.badComp;

    const map = new Map();
    if (onlyClassified) {
      BAD_STOCK_ORDER.forEach((k) => map.set(k, { val: 0, qty: 0 }));
    }

    serialRows.forEach((sr) => {
      if (onlyClassified && !sr[SN_C.IN_BAD_FILE]) return;
      const label = badL[sr[badCol]] || "Khác";
      if (!map.has(label)) map.set(label, { val: 0, qty: 0 });
      const cur = map.get(label);
      cur.val += sr[SN_C.INV_VAL];
      cur.qty += 1;
    });

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
        axisLabel: { color: "#CBD5E1", fontSize: 10.5, interval: 0, width: 95, overflow: "truncate" },
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
          color: "#CBD5E1",
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
            opacity: iv.badStock && iv.badStock !== name ? 0.35 : 0.94,
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

    if (iv.statusDim === "status_master" && state.raw.masterProducts) {
      const mp = state.raw.masterProducts;
      const map = new Map();
      mp.rows.forEach((r) => {
        const st = mp.lookups.purchaseStatuses[r[MP_C.STATUS]] || "Khác";
        const cur = map.get(st) || { val: 0, qty: 0, count: 0 };
        cur.val += r[MP_C.INV_VAL];
        cur.qty += r[MP_C.INV_QTY];
        cur.count += 1;
        map.set(st, cur);
      });
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
        axisLabel: { color: "#CBD5E1", fontSize: 11 },
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
          color: "#CBD5E1",
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
            color: (p) => (p.name === state.inv.site ? "#00E5FF" : "#1D7AFC"),
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
        textStyle: { color: "#94A3B8", fontSize: 10.5 },
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
        textStyle: { color: "#94A3B8", fontSize: 10.5 },
      },
      series: [{
        type: "pie",
        radius: ["48%", "74%"],
        center: ["50%", "44%"],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 4, borderColor: "#15181D", borderWidth: 2 },
        label: {
          show: true,
          color: "#CBD5E1",
          fontSize: 10.5,
          formatter: (p) => (p.percent >= 4 ? `${p.percent}%` : ""),
        },
        data: items,
      }],
    });
  }

  function renderInvAgingChart(rows, serialRows = []) {
    if (!charts.invAging) return;
    const useSerials = state.raw?.invSerials && serialRows.length > 0;
    if (!useSerials && !rows.length) {
      charts.invAging.clear();
      charts.invAging.setOption(emptyOption("Không có dữ liệu tuổi tồn"));
      return;
    }

    const basisFirst = state.inv.agingBasis === "first";
    const agg = AGING_BUCKETS.map((b) => ({ ...b, val: 0, qty: 0, count: 0 }));

    if (useSerials) {
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
            opacity: state.inv.agingBucket && state.inv.agingBucket !== b.key ? 0.35 : 0.92,
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
      legend: { bottom: 0, textStyle: { color: "#94A3B8", fontSize: 10.5 } },
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
          color: "#CBD5E1",
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
          color: "#94A3B8",
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
        document.getElementById("invTableBody").innerHTML = `<tr><td colspan="10" class="muted">Chưa có dữ liệu Serial / Bad Stock.</td></tr>`;
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
        if (iv.status && r[SKU_C.STATUS] !== iv.status) return false;
        if (iv.range && r[SKU_C.RANGE] !== iv.range) return false;
        if (iv.subcat && r[SKU_C.SUBCAT] !== iv.subcat) return false;
        if (iv.brand && r[SKU_C.BRAND] !== iv.brand) return false;
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

    // TAB 5: MASTER PRODUCT CATALOG (4,068 SKUs)
    if (iv.tableTab === "master") {
      const mp = state.raw?.masterProducts;
      if (!mp) {
        document.getElementById("invTableBody").innerHTML = `<tr><td colspan="9" class="muted">Chưa có dữ liệu Master Product.</td></tr>`;
        return;
      }
      const mpL = mp.lookups;
      let list = mp.rows.filter((r) => {
        if (iv.status && mpL.purchaseStatuses[r[MP_C.STATUS]] !== iv.status) return false;
        if (iv.range && mpL.ranges[r[MP_C.RANGE]] !== iv.range) return false;
        if (iv.subcat && mpL.subcats[r[MP_C.SUBCAT]] !== iv.subcat) return false;
        if (iv.brand && mpL.brands[r[MP_C.BRAND]] !== iv.brand) return false;
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
        tr.addEventListener("click", () => {
          iv.site = iv.site === tr.dataset.invSite ? "" : tr.dataset.invSite;
          document.getElementById("invFilterSite").value = iv.site;
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
      { key: "aging", label: "Tuổi tồn", num: true },
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
      const age = iv.agingBasis === "first" && r.length > INV_C.AGING_FIRST ? r[INV_C.AGING_FIRST] : r[INV_C.AGING];
      const ageCls = age < 0 ? "" : age <= 90 ? "fresh" : age <= 180 ? "mid" : "old";
      const ageTxt = age < 0 ? "—" : `${fmtInt(age)} ngày`;
      return `
        <tr>
          <td class="mono" title="${esc(lookups.siteNames[r[INV_C.SITE_NAME]])}"><strong>${esc(lookups.sites[r[INV_C.SITE]])}</strong></td>
          <td class="sku-cell" title="${esc(skuLbl)}">
            <button type="button" class="link-sku-btn" data-open-sku="${esc(skuCode)}">${esc(skuCode)}</button>${esc(skuRest)}
          </td>
          <td class="mono">${esc(lookups.binCodes[r[INV_C.BIN_CODE]])}</td>
          <td><span class="inv-badge ${binBadgeClass(bt)}">${esc(bt)}</span></td>
          <td><span class="inv-badge ${statusBadgeClass(st)}">${esc(st)}</span></td>
          <td class="num"><span class="aging-tag ${ageCls}">${ageTxt}</span></td>
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
    if (state.raw.rows && state.raw.lookups) {
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
  }

  function renderLookupQuickPicks() {
    const wrap = document.getElementById("lookupQuickPicks");
    if (!wrap || !state.raw) return;
    const picks = [];

    // Top 2 SKUs by 30D sales velocity
    if (state.raw.invSkuLevel?.rows?.length) {
      const byVel = [...state.raw.invSkuLevel.rows].sort((a, b) => b[SKU_C.S30D] - a[SKU_C.S30D]).slice(0, 2);
      byVel.forEach((r) => picks.push({ label: `🔥 SKU ${r[SKU_C.SKU]} (${r[SKU_C.S30D]} bán/30D)`, sku: r[SKU_C.SKU], sn: "" }));
    }
    // 1 Very Bad Stock Serial
    if (state.raw.invSerials?.rows?.length) {
      const snL = state.raw.invSerials.lookups;
      const veryBad = state.raw.invSerials.rows.find((r) => snL.badComp[r[SN_C.BAD_COMP]] === "Tồn rất xấu");
      if (veryBad) picks.push({ label: `🚨 Serial Rất xấu: ${veryBad[SN_C.SN]}`, sku: veryBad[SN_C.SKU], sn: veryBad[SN_C.SN] });
      const normalSn = state.raw.invSerials.rows.find((r) => snL.badComp[r[SN_C.BAD_COMP]] === "Tồn thông thường");
      if (normalSn) picks.push({ label: `🏷️ Serial: ${normalSn[SN_C.SN]}`, sku: normalSn[SN_C.SKU], sn: normalSn[SN_C.SN] });
    }
    // 1 Market Shortage SKU from Master Product
    if (state.raw.masterProducts?.rows?.length) {
      const mpL = state.raw.masterProducts.lookups;
      const ms = state.raw.masterProducts.rows.find((r) => mpL.purchaseStatuses[r[MP_C.STATUS]] === "Market Shortage");
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
    const results = [];
    const seenKeys = new Set();

    // 1. Exact or partial Serial matches first (high precision)
    if (state.raw?.invSerials?.rows) {
      const snL = state.raw.invSerials.lookups;
      for (let i = 0; i < state.raw.invSerials.rows.length; i++) {
        const r = state.raw.invSerials.rows[i];
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

    // 2. SKU / Name matches across Master Product (4,068 SKUs)
    if (state.raw?.masterProducts?.rows) {
      const mpL = state.raw.masterProducts.lookups;
      for (let i = 0; i < state.raw.masterProducts.rows.length; i++) {
        const r = state.raw.masterProducts.rows[i];
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

  function renderLookupProfile(skuCode, serialNum = "") {
    const lk = state.lookup;
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
    document.getElementById("lkSkuRangeBadge").textContent = `Range: ${rng}`;
    document.getElementById("lkSkuListingBadge").textContent = `Listing: ${listing}`;
    document.getElementById("lkSkuSerialFlag").textContent = hasSerial || `${serialRows.length} Serial`;
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

    // 4. PRICING & MARGIN STRIP
    const listedP = (mpRow ? mpRow[MP_C.LISTED_PRICE] : 0) || (velRow ? velRow[SKU_C.LISTED_PRICE] : 0);
    const unitCost = (velRow ? velRow[SKU_C.UNIT_COST] : 0) || (binRows[0]?.[INV_C.UNIT_COST] || 0);
    const wcogs = mpRow ? mpRow[MP_C.WCOGS] : 0;
    const lastPur = mpRow ? mpRow[MP_C.LAST_PUR] : 0;
    const latestQ = mpRow ? mpRow[MP_C.LATEST_QUOTE] : 0;
    const tempGm = mpRow && mpRow[MP_C.TEMP_GM] !== null ? `${mpRow[MP_C.TEMP_GM].toFixed(1)}%` : "—";
    const priceItems = [
      ["Giá niêm yết (Listed)", listedP ? fmtVndFull(listedP) : "—"],
      ["Unit Cost tồn kho", unitCost ? fmtVndFull(unitCost) : "—"],
      ["W.COGS No VAT", wcogs ? fmtVndFull(wcogs) : "—"],
      ["Giá nhập gần nhất", lastPur ? fmtVndFull(lastPur) : "—"],
      ["Báo giá mới nhất", latestQ ? fmtVndFull(latestQ) : "—"],
      ["Temporary GM (%)", tempGm],
    ];
    document.getElementById("lkPriceStrip").innerHTML = priceItems.map(([l, v]) => `
      <div class="lookup-kv">
        <span class="lookup-kv-lbl">${esc(l)}</span>
        <span class="lookup-kv-val mono">${esc(v)}</span>
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
        legend: { bottom: 0, textStyle: { color: "#94A3B8", fontSize: 10.5 } },
        grid: { top: 20, left: 44, right: 44, bottom: 38 },
        xAxis: {
          type: "category",
          data: periods,
          axisLine: { lineStyle: { color: COLORS.axisLine } },
          axisLabel: { color: "#CBD5E1", fontSize: 11 },
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

    // 7. SERIAL & BAD STOCK TABLE FOR THIS SKU
    document.getElementById("lkSerialListInfo").textContent = `${fmtInt(serialRows.length)} Serial đang tồn (${fmtInt(badSnCount)} Bad Stock rủi ro)`;
    const snBody = document.getElementById("lkSerialTableBody");
    if (serialRows.length && snL) {
      const sortedSn = [...serialRows].sort((a, b) => {
        if (serialNum && a[SN_C.SN].toLowerCase() === serialNum.toLowerCase()) return -1;
        if (serialNum && b[SN_C.SN].toLowerCase() === serialNum.toLowerCase()) return 1;
        return b[SN_C.AGING_COMP] - a[SN_C.AGING_COMP];
      });
      snBody.innerHTML = sortedSn.map((r) => {
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
        b.addEventListener("click", () => renderLookupProfile(skuCode, b.dataset.snFocus));
      });
    } else {
      snBody.innerHTML = `<tr><td colspan="12" class="muted">Không có Serial nào đang tồn cho SKU này.</td></tr>`;
    }

    // 8. BIN-LEVEL TABLE (Inventory_Details)
    document.getElementById("lkBinListInfo").textContent = `${fmtInt(binRows.length)} dòng vị trí BIN`;
    const binBody = document.getElementById("lkBinTableBody");
    if (binRows.length && invL) {
      binBody.innerHTML = binRows.map((r) => {
        const bt = invL.binTypes[r[INV_C.BIN_TYPE]];
        return `
          <tr>
            <td class="mono"><strong>${esc(invL.sites[r[INV_C.SITE]])}</strong></td>
            <td>${esc(invL.siteNames[r[INV_C.SITE_NAME]])}</td>
            <td class="mono">${esc(invL.binCodes[r[INV_C.BIN_CODE]])}</td>
            <td><span class="inv-badge ${binBadgeClass(bt)}">${esc(bt)}</span></td>
            <td>${esc(invL.binZones[r[INV_C.BIN_ZONE]])}</td>
            <td class="mono">${esc(r[INV_C.LAST_RECV] || "—")}</td>
            <td class="num">${fmtInt(r[INV_C.MIN_STOCK])}</td>
            <td class="num" style="color:#00E5FF">${fmtInt(r[INV_C.QTY])}</td>
            <td class="num">${fmtInt(r[INV_C.UNIT_COST])}</td>
            <td class="num"><strong>${fmtInt(r[INV_C.VALUE])}</strong></td>
          </tr>`;
      }).join("");
    } else {
      binBody.innerHTML = `<tr><td colspan="10" class="muted">Không có dòng tồn BIN nào trong Inventory_Details.</td></tr>`;
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

  function cleanSubcatJs(val) {
    const s = String(val ?? "").trim();
    if (!s) return "Khác";
    const m = s.match(/^NH\d+(?:-\d+)+-(.+)$/);
    return m ? m[1].trim() : s;
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
      sites: [],
      stores: [],
      regions: [],
      channels: [],
      subcats: [],
      brands: [],
      orderTypes: [],
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

    const compactRows = [];
    const siteDirectory = {};
    let totSales = 0, totQty = 0, totCogs = 0, totGp = 0;
    let minDate = null, maxDate = null;
    let bulkCount = 0, bulkSales = 0, bulkQty = 0;

    for (let i = 0; i < rawRecords.length; i++) {
      const rec = rawRecords[i];
      const rawDate = findHeaderValue(rec, ["report date", "report_date", "date", "ngày báo cáo"]);
      const dp = parseExcelDateJs(rawDate);
      if (!dp) continue;

      const { iso: dateIso, month: monthStr } = formatDateParts(dp);
      if (!minDate || dateIso < minDate) minDate = dateIso;
      if (!maxDate || dateIso > maxDate) maxDate = dateIso;
      const weekStr = getIsoWeekJs(dp.y, dp.m, dp.d);

      const site = String(findHeaderValue(rec, ["sales site code", "site code", "site"]) || "UNKNOWN").trim();
      const store = String(findHeaderValue(rec, ["store name", "store"]) || "").trim() || site;
      const rawRegion = String(findHeaderValue(rec, ["region name", "region"]) || "").trim();
      const channel = String(findHeaderValue(rec, ["sales channel", "channel"]) || "Other").trim();
      const region = rawRegion || `Non-Store (${channel})`;
      const subcat = cleanSubcatJs(findHeaderValue(rec, ["subcat 2 (code - name)", "subcat 2", "subcat"]) || "");
      const brand = String(findHeaderValue(rec, ["brand name", "brand"]) || "Khác").trim();
      const orderType = String(findHeaderValue(rec, ["order type", "order_type"]) || "don_xuat_ban").trim();
      const skuCode = String(findHeaderValue(rec, ["sku", "sku code"]) || "").trim();
      const skuName = String(findHeaderValue(rec, ["sku name", "product name"]) || "").trim();
      const skuLabel = skuCode ? (skuName ? `${skuCode} — ${skuName}` : skuCode) : skuName;

      const qty = Math.round(parseNumericVal(findHeaderValue(rec, ["sales qty", "qty", "quantity"])));
      const sales = Math.round(parseNumericVal(findHeaderValue(rec, ["sales", "revenue", "doanh thu"])) * 100) / 100;
      const cogs = Math.round(parseNumericVal(findHeaderValue(rec, ["cogs", "giá vốn"])) * 100) / 100;
      const gp = Math.round(parseNumericVal(findHeaderValue(rec, ["gp", "gross profit", "lợi nhuận"])) * 100) / 100;

      totSales += sales;
      totQty += qty;
      totCogs += cogs;
      totGp += gp;

      if (Math.abs(qty) >= 100) {
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

      compactRows.push([
        dateIso,
        monthStr,
        weekStr,
        getIdx("sites", site),
        getIdx("stores", store),
        getIdx("regions", region),
        getIdx("channels", channel),
        getIdx("subcats", subcat),
        getIdx("brands", brand),
        getIdx("orderTypes", orderType),
        getIdx("skus", skuLabel),
        qty,
        sales,
        cogs,
        gp,
      ]);
    }

    compactRows.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));

    return {
      meta: {
        generatedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sources: sourceMeta,
        rowCount: compactRows.length,
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
        columns: [
          "date", "month", "week", "siteIdx", "storeIdx", "regionIdx",
          "channelIdx", "subcatIdx", "brandIdx", "orderTypeIdx", "skuIdx",
          "qty", "sales", "cogs", "gp",
        ],
      },
      lookups,
      siteDirectory,
      rows: compactRows,
    };
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
    const lookups = { subcats: [], subcat3s: [], brands: [], listings: [], purchaseStatuses: [], ranges: [], promoAlerts: [] };
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
      const subcat = cleanSubcatJs(findHeaderValue(rec, ["subcat 2 (code - name)", "subcat 2"]) || "");
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
      masterMap.set(sku, { sku, name, subcat, brand, listing, purchaseStatus: pstatus, range: rng });

      rows.push([
        sku, name, getIdx("subcats", subcat), getIdx("subcat3s", subcat3), getIdx("brands", brand),
        getIdx("listings", listing), getIdx("purchaseStatuses", pstatus), getIdx("ranges", rng),
        hasSerial, getIdx("promoAlerts", promo), listed, srPromo, wcogs, lastPur, latestQuote,
        tempGp, tempGm, invQty, invVal, sales30d, warrantyMo, warrantyNote,
      ]);
    }
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
        cleanSubcatJs(findHeaderValue(rec, ["subcat 2 (code - name)"]) || ""),
        String(findHeaderValue(rec, ["brand name"]) || "Khác").trim(),
        pstatus, rng, s7, s30, s90, s180, gm, sdays, invQty, invVal, unitCost, listed,
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
      badBySn.set(sn, {
        sku: String(findHeaderValue(rec, ["sku"]) || "").trim(),
        skuName: String(findHeaderValue(rec, ["sku name"]) || "").trim(),
        site: String(findHeaderValue(rec, ["site code"]) || "UNKNOWN").trim(),
        subcat: String(findHeaderValue(rec, ["subcat 2 name"]) || "Khác").trim(),
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
      sites: [], subcats: [], brands: [], suppliers: [], locations: [], binTypes: [],
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
      const subcat = String(findHeaderValue(rec, ["subcat 2 name"]) || mp.subcat || "Khác").trim();
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
      ]);
    });

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
      const subcat = cleanSubcatJs(findHeaderValue(rec, ["subcat 2 (code - name)", "subcat 2", "subcat"]) || "");
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
        getIdx("ranges", rng), agingFirst,
      ]);
    }

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

      const res = await fetch("/api/report-data", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
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
            if (json && Array.isArray(json.rows) && json.rows.length > 0) {
              fresh = json;
              mode = "cloud";
            }
          }
        } catch {
          // fallback to static JSON
        }
        if (!fresh) {
          const res2 = await fetchWithTimeout(`./data/report_data.json?t=${Date.now()}`, { cache: "no-store" }, 5000);
          if (res2.ok) {
            fresh = await res2.json();
            mode = "default";
          }
        }
      } else {
        fresh = await loadBaselineData();
      }

      if (!fresh || !Array.isArray(fresh.rows)) {
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

  document.addEventListener("DOMContentLoaded", init);
})();
