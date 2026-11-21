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

  // Compact row column indexes
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

  const state = {
    raw: null,
    dataSourceMode: "default",    // cloud | local | default
    cloudAvailable: false,
    cloudAuthRequired: false,
    cloudUpdatedAt: "",
    updateMode: "replace",        // replace | merge
    pendingPayload: null,
    pendingRawRecords: null,
    pendingSources: [],
    monthsAll: [],
    activeView: "dashboard",
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

  // --- LOCAL INDEXEDDB CACHE (FALLBACK WHEN RUNNING OFFLINE / FILE://) ---
  const IDB_NAME = "cyberpulse_sales_db";
  const IDB_STORE = "datasets";
  const IDB_KEY = "latest";

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

  async function idbGetLatest() {
    try {
      const db = await openLocalDb();
      return await new Promise((resolve) => {
        const tx = db.transaction(IDB_STORE, "readonly");
        const req = tx.objectStore(IDB_STORE).get(IDB_KEY);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  async function idbSetLatest(payload) {
    try {
      const db = await openLocalDb();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(IDB_STORE, "readwrite");
        tx.objectStore(IDB_STORE).put(payload, IDB_KEY);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      return true;
    } catch {
      return false;
    }
  }

  async function idbClearLatest() {
    try {
      const db = await openLocalDb();
      await new Promise((resolve) => {
        const tx = db.transaction(IDB_STORE, "readwrite");
        tx.objectStore(IDB_STORE).delete(IDB_KEY);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    } catch {
      // ignore
    }
  }

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

    initMeta();
    populateFilters();
    initCharts();
    bindEvents();
    bindUpdateModalEvents();
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
    const { meta, lookups } = state.raw;
    const files = (meta.sources || []).map((s) => s.file).join(", ");
    const updatedTag = meta.updatedAt ? ` • Cập nhật: ${formatIsoVn(meta.updatedAt)}` : "";
    document.getElementById("footerSource").textContent =
      `Source: ${files || "Sale_Revenue_Detail.xlsx"} • ${fmtInt(meta.rowCount)} rows (${meta.dateMin} → ${meta.dateMax})${updatedTag}`;

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

    initMeta();
    populateFilters();

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

  function bindEvents() {
    // Blue Rail Navigation
    document.getElementById("railMenu").addEventListener("click", (e) => {
      const btn = e.target.closest(".rail-item[data-view]");
      if (!btn) return;
      const view = btn.dataset.view;
      state.activeView = view;

      document.querySelectorAll("#railMenu .rail-item").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      document.querySelectorAll(".view-pane").forEach((p) => p.classList.remove("active"));
      const pane = document.getElementById(`view-${view}`);
      if (pane) pane.classList.add("active");

      renderActiveView(getFilteredRows(false), state.clickedMonth ? getFilteredRows(true) : getFilteredRows(false));
      setTimeout(() => {
        Object.values(charts).forEach((ch) => ch && ch.resize());
      }, 30);
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

    document.getElementById("resetFiltersBtn").addEventListener("click", resetFilters);

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

    renderSidebar(filtered);
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
    }
  }

  // =========================================================================
  // 1. LEFT KPI & GAUGE SIDEBAR (MATCHING REFERENCE)
  // =========================================================================
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

    // Text updates
    document.getElementById("sidebarSalesShareTag").textContent = `${fmtPct(salesShare)} tổng`;
    document.getElementById("gaugeGmValue").textContent = fmtPct(gm);
    document.getElementById("gaugeGpPill").textContent = `GP ${fmtCompactVnd(gp)}`;
    document.getElementById("statSalesVal").textContent = fmtCompactVnd(sales);
    document.getElementById("statCogsVal").textContent = fmtCompactVnd(cogs);
    document.getElementById("barSalesFill").style.width = `${Math.max(4, Math.min(100, salesShare))}%`;
    document.getElementById("barCogsFill").style.width = `${Math.max(4, cogsRatio)}%`;

    document.getElementById("statQtyHeader").textContent = `${fmtInt(qty)} QTY`;
    document.getElementById("gaugeFulfillVal").textContent = fmtPct(fulfillRate);
    document.getElementById("gaugeQtyPill").textContent = `${fmtInt(qty)} units`;

    document.getElementById("mAvgMonthSales").textContent = fmtCompactVnd(avgMonthSales);
    document.getElementById("mAvgMonthSalesSub").textContent = `${months.size} tháng`;
    document.getElementById("mAvgMonthQty").textContent = fmtInt(avgMonthQty);
    document.getElementById("mAvgMonthQtySub").textContent = "sp / tháng";
    document.getElementById("mAsp").textContent = fmtCompactVnd(asp);
    document.getElementById("mTotalGp").textContent = fmtCompactVnd(gp);
    document.getElementById("mTotalGpPct").textContent = `GM ${fmtPct(gm)}`;

    document.getElementById("mActiveSites").textContent = fmtInt(sites.size);
    document.getElementById("mActiveSitesSub").textContent = `/ ${lookups.sites.length} sites`;
    document.getElementById("mActiveRegions").textContent = fmtInt(regions.size);
    document.getElementById("mExportRows").textContent = fmtInt(exportRows);
    document.getElementById("mExportPct").textContent = fmtPct(fulfillRate);
    document.getElementById("mReturnRows").textContent = fmtInt(returnRows);
    document.getElementById("mReturnPct").textContent = totalRows ? fmtPct((returnRows / totalRows) * 100) : "0.0%";

    // Gauge 1: Circular Segmented Tick Ring (scaled to 35% benchmark so 27.7% fills ~79% like reference)
    if (charts.gaugeRing) {
      const ringPct = Math.max(0, Math.min(100, (gm / 35) * 100));
      charts.gaugeRing.setOption({
        series: [
          // Outer radial ticks
          {
            type: "gauge",
            startAngle: 90,
            endAngle: -270,
            radius: "96%",
            min: 0,
            max: 100,
            splitNumber: 12,
            pointer: { show: false },
            axisLine: { show: false },
            axisTick: {
              distance: -6,
              length: 7,
              splitNumber: 5,
              lineStyle: { color: "rgba(255,255,255,0.16)", width: 1.5 },
            },
            splitLine: { show: false },
            axisLabel: { show: false },
            detail: { show: false },
          },
          // Inner glowing blue progress ring
          {
            type: "gauge",
            startAngle: 90,
            endAngle: -270,
            radius: "80%",
            min: 0,
            max: 100,
            pointer: { show: false },
            progress: {
              show: true,
              overlap: false,
              roundCap: true,
              clip: false,
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 1, 1, [
                  { offset: 0, color: "#1D7AFC" },
                  { offset: 1, color: "#12D37A" },
                ]),
                shadowBlur: 10,
                shadowColor: "rgba(29, 122, 252, 0.5)",
              },
            },
            axisLine: {
              lineStyle: { width: 7, color: [[1, "rgba(255,255,255,0.08)"]] },
            },
            splitLine: { show: false },
            axisTick: { show: false },
            axisLabel: { show: false },
            detail: { show: false },
            data: [{ value: ringPct }],
          },
        ],
      });
    }

    // Gauge 2: Semi-Circle Blue Arc (matching Handle Rate 90.2%)
    if (charts.gaugeSemi) {
      charts.gaugeSemi.setOption({
        series: [
          {
            type: "gauge",
            startAngle: 180,
            endAngle: 0,
            center: ["50%", "84%"],
            radius: "136%",
            min: 0,
            max: 100,
            pointer: { show: false },
            progress: {
              show: true,
              width: 20,
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                  { offset: 0, color: "#0D63D9" },
                  { offset: 1, color: "#2196F3" },
                ]),
              },
            },
            axisLine: {
              lineStyle: { width: 20, color: [[1, "#252A34"]] },
            },
            axisTick: { show: false },
            splitLine: {
              show: true,
              distance: -20,
              length: 20,
              lineStyle: { color: "rgba(255,255,255,0.22)", width: 1.5 },
            },
            splitNumber: 5,
            axisLabel: {
              show: true,
              distance: -32,
              color: "#8492A6",
              fontFamily: "JetBrains Mono",
              fontSize: 9,
              formatter: (v) => (v === 0 || v === 80 || v === 100 ? `${v}%` : ""),
            },
            detail: { show: false },
            data: [{ value: Number(fulfillRate.toFixed(1)) }],
          },
        ],
      });
    }
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

  async function parseUploadedFiles(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) throw new Error("Chưa chọn file nào.");

    // Direct JSON upload shortcut (single report_data.json)
    if (files.length === 1 && files[0].name.toLowerCase().endsWith(".json")) {
      const text = await files[0].text();
      const parsed = JSON.parse(text);
      if (!parsed || !Array.isArray(parsed.rows) || !parsed.lookups || !parsed.meta) {
        throw new Error("File JSON không đúng định dạng report_data.json chuẩn.");
      }
      return { directPayload: parsed, rawRecords: null, sources: [{ file: files[0].name, sizeBytes: files[0].size, rows: parsed.rows.length }] };
    }

    if (typeof XLSX === "undefined") {
      throw new Error("Thư viện đọc Excel (SheetJS) chưa tải xong. Kiểm tra kết nối mạng và thử lại.");
    }

    const allRecords = [];
    const sources = [];

    for (let fIdx = 0; fIdx < files.length; fIdx++) {
      const file = files[fIdx];
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array", raw: true });
      let fileRowCount = 0;

      wb.SheetNames.forEach((sheetName) => {
        const sheet = wb.Sheets[sheetName];
        if (!sheet) return;
        const rows2d = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: null });
        if (!rows2d || rows2d.length < 2) return;

        // Locate header row (first row containing "report date" or non-empty headers)
        let headerRowIdx = 0;
        for (let r = 0; r < Math.min(10, rows2d.length); r++) {
          const joined = (rows2d[r] || []).map((v) => String(v || "").trim().toLowerCase());
          if (joined.includes("report date") || joined.includes("sales site code")) {
            headerRowIdx = r;
            break;
          }
        }

        const headers = (rows2d[headerRowIdx] || []).map((h) => String(h || "").trim().toLowerCase());
        for (let r = headerRowIdx + 1; r < rows2d.length; r++) {
          const row = rows2d[r];
          if (!row || !row.length) continue;
          const firstCell = String(row[0] ?? "").trim();
          const firstLower = firstCell.toLowerCase();
          if (!firstCell || firstLower === "total" || firstLower.startsWith("applied filters")) {
            continue;
          }
          const rec = {};
          for (let c = 0; c < headers.length; c++) {
            const h = headers[c];
            if (h) rec[h] = c < row.length ? row[c] : null;
          }
          allRecords.push(rec);
          fileRowCount++;
        }
      });

      sources.push({ file: file.name, sizeBytes: file.size, rows: fileRowCount });
    }

    if (allRecords.length === 0) {
      throw new Error("Không tìm thấy dòng dữ liệu hợp lệ nào. Kiểm tra cột Report Date, Sales, Sales QTY.");
    }

    return { directPayload: null, rawRecords: allRecords, sources };
  }

  function rebuildPendingPayload() {
    if (!state.pendingRawRecords && !state.pendingPayload) return;

    if (state.pendingRawRecords) {
      let recordsToBuild = state.pendingRawRecords;
      let sourcesToBuild = [...state.pendingSources];

      if (state.updateMode === "merge" && state.raw) {
        const existingRecs = extractExistingRecords(state.raw);
        recordsToBuild = existingRecs.concat(state.pendingRawRecords);
        const existingSources = (state.raw.meta?.sources || []).map((s) => ({ ...s }));
        sourcesToBuild = existingSources.concat(state.pendingSources);
      }

      state.pendingPayload = buildPayloadFromRecords(recordsToBuild, sourcesToBuild);
    }

    if (!state.pendingPayload || state.pendingPayload.rows.length === 0) {
      showUpdateFeedback("Không đọc được dòng dữ liệu hợp lệ nào (kiểm tra định dạng cột Report Date).", "error");
      document.getElementById("updatePreviewCard").classList.add("hidden");
      document.getElementById("publishUpdateBtn").disabled = true;
      return;
    }

    renderUpdatePreview(state.pendingPayload);
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

  function renderUpdatePreview(payload) {
    const card = document.getElementById("updatePreviewCard");
    const cur = state.raw?.meta;
    const next = payload.meta;

    const filesStr = (next.sources || []).map((s) => s.file).join(" + ");
    document.getElementById("previewFileNames").textContent = filesStr;
    document.getElementById("pvRows").textContent = `${fmtInt(next.rowCount)} dòng`;
    document.getElementById("pvDateRange").textContent = `${next.dateMin || "?"} → ${next.dateMax || "?"}`;
    const monthsSet = new Set(payload.rows.map((r) => r[C.MONTH]));
    document.getElementById("pvMonthsCount").textContent = `${monthsSet.size} tháng`;
    document.getElementById("pvSales").textContent = fmtCompactVnd(next.totals.sales);
    document.getElementById("pvQty").textContent = `${fmtInt(next.totals.qty)} units`;
    document.getElementById("pvGp").textContent = fmtCompactVnd(next.totals.gp);
    document.getElementById("pvGm").textContent = `GM ${fmtPct(next.totals.gmPct)}`;
    document.getElementById("pvCoverage").textContent = `${payload.lookups.sites.length} Sites • ${payload.lookups.regions.length} Regions`;

    const setDelta = (id, diff, formatter) => {
      const el = document.getElementById(id);
      if (!el || !cur) return;
      const sign = diff > 0 ? "+" : "";
      el.textContent = diff === 0 ? "Không đổi so với hiện tại" : `${sign}${formatter(diff)} so với hiện tại`;
      el.classList.toggle("neg", diff < 0);
    };

    if (cur) {
      setDelta("pvRowsDelta", next.rowCount - cur.rowCount, (v) => `${fmtInt(v)} dòng`);
      setDelta("pvSalesDelta", next.totals.sales - cur.totals.sales, (v) => fmtCompactVnd(v));
      setDelta("pvQtyDelta", next.totals.qty - cur.totals.qty, (v) => `${fmtInt(v)} units`);
    }

    card.classList.remove("hidden");
    document.getElementById("publishUpdateBtn").disabled = false;
    document.getElementById("downloadParsedJsonBtn").classList.remove("hidden");
  }

  async function refreshCloudStatus() {
    const dot = document.getElementById("cloudStatusDot");
    const txt = document.getElementById("cloudStatusText");
    const passRow = document.getElementById("passcodeRow");
    const pubLbl = document.getElementById("publishBtnLabel");

    if (location.protocol !== "http:" && location.protocol !== "https:") {
      state.cloudAvailable = false;
      dot.className = "status-dot local";
      txt.textContent = "Đang chạy file cục bộ (Offline) — Dữ liệu mới sẽ lưu vào trình duyệt này và cho phép tải file JSON.";
      pubLbl.textContent = "💾 Cập nhật báo cáo (Local)";
      passRow.classList.add("hidden");
      return;
    }

    try {
      const res = await fetchWithTimeout("/api/report-data?meta=1", { cache: "no-store" }, 4000);
      const ct = res.headers.get("content-type") || "";
      if (res.ok && ct.includes("application/json")) {
        const info = await res.json();
        state.cloudAvailable = Boolean(info.cloudAvailable);
        state.cloudAuthRequired = Boolean(info.authRequired);
        dot.className = "status-dot online";
        const lastInfo = info.exists && info.metadata?.updatedAt
          ? `Lần cập nhật gần nhất: ${formatIsoVn(info.metadata.updatedAt)} (${fmtInt(info.metadata.rowCount)} dòng)`
          : "Đang dùng dữ liệu gốc từ GitHub — sẵn sàng nhận dữ liệu mới";
        txt.textContent = `☁ Netlify Cloud Live đã kết nối • ${lastInfo}`;
        pubLbl.textContent = "☁ Cập nhật lên Web (Live)";
        passRow.classList.toggle("hidden", !state.cloudAuthRequired);
        return;
      }
    } catch {
      // ignore
    }

    state.cloudAvailable = false;
    dot.className = "status-dot local";
    txt.textContent = "Máy chủ hiện tại không có Netlify Function — Dữ liệu mới sẽ lưu trên trình duyệt này (Local Cache).";
    pubLbl.textContent = "💾 Cập nhật báo cáo (Local)";
    passRow.classList.add("hidden");
  }

  function openUpdateModal() {
    const modal = document.getElementById("updateDataModal");
    if (!modal) return;
    state.pendingPayload = null;
    state.pendingRawRecords = null;
    state.pendingSources = [];
    document.getElementById("excelFileInput").value = "";
    document.getElementById("updatePreviewCard").classList.add("hidden");
    document.getElementById("downloadParsedJsonBtn").classList.add("hidden");
    document.getElementById("publishUpdateBtn").disabled = true;
    showUpdateFeedback("", "info");
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    refreshCloudStatus();
  }

  function closeUpdateModal() {
    const modal = document.getElementById("updateDataModal");
    if (!modal) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
  }

  async function handleFilesSelected(files) {
    if (!files || !files.length) return;
    showUpdateFeedback(`Đang phân tích ${files.length} file và lọc bỏ thông tin cá nhân (Zero-PII)...`, "info");
    document.getElementById("publishUpdateBtn").disabled = true;

    try {
      const res = await parseUploadedFiles(files);
      state.pendingSources = res.sources;
      if (res.directPayload) {
        state.pendingRawRecords = null;
        state.pendingPayload = res.directPayload;
      } else {
        state.pendingRawRecords = res.rawRecords;
        state.pendingPayload = null;
      }
      rebuildPendingPayload();
      if (state.pendingPayload && state.pendingPayload.rows.length > 0) {
        showUpdateFeedback(
          `Đã đọc thành công ${fmtInt(state.pendingPayload.rows.length)} giao dịch (Zero-PII). Kiểm tra số liệu bên dưới và bấm "Cập nhật lên Web".`,
          "success"
        );
      }
    } catch (err) {
      state.pendingPayload = null;
      state.pendingRawRecords = null;
      document.getElementById("updatePreviewCard").classList.add("hidden");
      showUpdateFeedback(`Lỗi đọc file: ${err.message}`, "error");
    }
  }

  async function publishPendingUpdate() {
    if (!state.pendingPayload) return;
    const btn = document.getElementById("publishUpdateBtn");
    const lbl = document.getElementById("publishBtnLabel");
    const origText = lbl.textContent;
    btn.disabled = true;
    lbl.textContent = "Đang đồng bộ lên Web...";

    try {
      if (state.cloudAvailable) {
        const headers = { "Content-Type": "application/json" };
        const pass = (document.getElementById("updatePasscodeInput")?.value || "").trim();
        if (pass) headers["x-update-key"] = pass;

        const res = await fetch("/api/report-data", {
          method: "POST",
          headers,
          body: JSON.stringify(state.pendingPayload),
        });
        const body = await res.json().catch(() => ({}));

        if (!res.ok) {
          if (res.status === 401) {
            state.cloudAuthRequired = true;
            document.getElementById("passcodeRow").classList.remove("hidden");
            document.getElementById("updatePasscodeInput").focus();
          }
          throw new Error(body.error || `HTTP ${res.status}`);
        }

        // Update timestamp from server metadata and clear stale local cache
        if (body.metadata?.updatedAt) {
          state.pendingPayload.meta.updatedAt = body.metadata.updatedAt;
          state.cloudUpdatedAt = body.metadata.updatedAt;
        }
        await idbClearLatest();
        applyNewDataset(state.pendingPayload, "cloud");
        closeUpdateModal();
        showToast(`☁ Đã cập nhật ${fmtInt(state.pendingPayload.rows.length)} dòng lên Web Live! Mọi người mở link sẽ thấy số liệu mới ngay.`);
      } else {
        await idbSetLatest(state.pendingPayload);
        applyNewDataset(state.pendingPayload, "local");
        closeUpdateModal();
        showToast(`💾 Đã cập nhật ${fmtInt(state.pendingPayload.rows.length)} dòng trên trình duyệt (Local Cache).`);
      }
    } catch (err) {
      showUpdateFeedback(`Không thể cập nhật: ${err.message}`, "error");
      showToast(`Lỗi cập nhật: ${err.message}`, true);
    } finally {
      btn.disabled = false;
      lbl.textContent = origText;
    }
  }

  async function revertToDefaultData() {
    if (!confirm("Khôi phục về dữ liệu gốc trong GitHub? Dữ liệu đã upload lên Web sẽ bị xóa.")) return;
    showUpdateFeedback("Đang khôi phục dữ liệu gốc...", "info");

    try {
      if (state.cloudAvailable) {
        const headers = {};
        const pass = (document.getElementById("updatePasscodeInput")?.value || "").trim();
        if (pass) headers["x-update-key"] = pass;

        const res = await fetch("/api/report-data", { method: "DELETE", headers });
        if (!res.ok && res.status !== 404) {
          const body = await res.json().catch(() => ({}));
          if (res.status === 401) {
            document.getElementById("passcodeRow").classList.remove("hidden");
          }
          throw new Error(body.error || `HTTP ${res.status}`);
        }
      }
      await idbClearLatest();
      const baseline = await loadBaselineData();
      applyNewDataset(baseline, "default");
      closeUpdateModal();
      showToast("↺ Đã khôi phục về dữ liệu gốc thành công.");
    } catch (err) {
      showUpdateFeedback(`Không thể khôi phục: ${err.message}`, "error");
    }
  }

  function bindUpdateModalEvents() {
    const openBtn = document.getElementById("openUpdateModalBtn");
    const railBtn = document.getElementById("updateDataRailBtn");
    const closeBtn = document.getElementById("closeUpdateModalBtn");
    const cancelBtn = document.getElementById("cancelUpdateModalBtn");
    const modal = document.getElementById("updateDataModal");
    const dropzone = document.getElementById("excelDropzone");
    const fileInput = document.getElementById("excelFileInput");
    const publishBtn = document.getElementById("publishUpdateBtn");
    const revertBtn = document.getElementById("revertDefaultDataBtn");
    const downloadJsonBtn = document.getElementById("downloadParsedJsonBtn");
    const modeGroup = document.getElementById("updateModeGroup");

    if (openBtn) openBtn.addEventListener("click", openUpdateModal);
    if (railBtn) railBtn.addEventListener("click", openUpdateModal);
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

    if (modeGroup) {
      modeGroup.addEventListener("click", (e) => {
        const btn = e.target.closest(".seg-btn");
        if (!btn) return;
        modeGroup.querySelectorAll(".seg-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        state.updateMode = btn.dataset.val || "replace";
        if (state.pendingRawRecords) rebuildPendingPayload();
      });
    }

    if (dropzone && fileInput) {
      dropzone.addEventListener("click", () => fileInput.click());
      dropzone.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          fileInput.click();
        }
      });
      dropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropzone.classList.add("dragover");
      });
      dropzone.addEventListener("dragleave", () => dropzone.classList.remove("dragover"));
      dropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropzone.classList.remove("dragover");
        if (e.dataTransfer?.files?.length) handleFilesSelected(e.dataTransfer.files);
      });
      fileInput.addEventListener("change", (e) => {
        if (e.target.files?.length) handleFilesSelected(e.target.files);
      });
    }

    if (publishBtn) publishBtn.addEventListener("click", publishPendingUpdate);
    if (revertBtn) revertBtn.addEventListener("click", revertToDefaultData);

    if (downloadJsonBtn) {
      downloadJsonBtn.addEventListener("click", () => {
        if (!state.pendingPayload) return;
        const blob = new Blob([JSON.stringify(state.pendingPayload)], { type: "application/json;charset=utf-8" });
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
