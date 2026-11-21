import { getStore } from "@netlify/blobs";
import type { Config, Context } from "@netlify/functions";

const BLOB_KEY = "latest";
const MAX_PAYLOAD_BYTES = 5_500_000; // Keep safely under Netlify 6 MB buffered payload limit

interface ReportPayload {
  meta: {
    generatedAt?: string;
    updatedAt?: string;
    sources?: Array<{ file: string; sizeBytes?: number; rows?: number }>;
    rowCount: number;
    dateMin?: string | null;
    dateMax?: string | null;
    totals?: {
      sales: number;
      qty: number;
      cogs: number;
      gp: number;
      gmPct: number;
    };
    bulkOutliers?: {
      thresholdQty: number;
      rowCount: number;
      sales: number;
      qty: number;
    };
    columns?: string[];
  };
  lookups: {
    sites: string[];
    stores: string[];
    regions: string[];
    channels: string[];
    subcats: string[];
    brands: string[];
    orderTypes: string[];
    skus: string[];
  };
  siteDirectory: Record<string, unknown>;
  rows: unknown[][];
  inventory?: {
    meta?: {
      rowCount?: number;
      snapshotDate?: string;
      sources?: Array<{ file: string; sizeBytes?: number; rows?: number }>;
      totals?: { qty?: number; value?: number };
    };
    lookups?: Record<string, string[]>;
    siteDirectory?: Record<string, unknown>;
    rows?: unknown[][];
  };
}

function getReportStore(context: Context) {
  // Isolate production data from Deploy Previews / branch deploys
  const deployCtx = context.deploy?.context || "production";
  const storeName =
    deployCtx === "production"
      ? "sales-report-data"
      : `sales-report-data-${deployCtx.replace(/[^a-z0-9-]/gi, "-").slice(0, 32)}`;
  return getStore({ name: storeName, consistency: "strong" });
}

function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function checkAuth(req: Request): { ok: boolean; authRequired: boolean } {
  const configuredKey = (Netlify.env.get("UPDATE_DATA_KEY") || "").trim();
  if (!configuredKey) {
    return { ok: true, authRequired: false };
  }
  const provided = (req.headers.get("x-update-key") || "").trim();
  if (!provided) {
    return { ok: false, authRequired: true };
  }
  return { ok: constantTimeEquals(provided, configuredKey), authRequired: true };
}

function jsonResponse(body: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      ...extraHeaders,
    },
  });
}

function validatePayload(data: unknown): { valid: boolean; error?: string } {
  if (!data || typeof data !== "object") {
    return { valid: false, error: "Payload phải là JSON object hợp lệ." };
  }
  const p = data as Partial<ReportPayload>;
  if (!p.meta || typeof p.meta !== "object") {
    return { valid: false, error: "Thiếu trường meta." };
  }
  if (!p.lookups || typeof p.lookups !== "object") {
    return { valid: false, error: "Thiếu bảng lookups." };
  }
  const reqLookups = [
    "sites",
    "stores",
    "regions",
    "channels",
    "subcats",
    "brands",
    "orderTypes",
    "skus",
  ] as const;
  for (const k of reqLookups) {
    if (!Array.isArray(p.lookups[k])) {
      return { valid: false, error: `Thiếu danh mục lookups.${k}.` };
    }
  }
  if (!p.siteDirectory || typeof p.siteDirectory !== "object") {
    return { valid: false, error: "Thiếu siteDirectory." };
  }
  if (!Array.isArray(p.rows) || p.rows.length === 0) {
    return { valid: false, error: "Dữ liệu rows rỗng — cần ít nhất 1 giao dịch hợp lệ." };
  }
  const firstRow = p.rows[0];
  if (!Array.isArray(firstRow) || firstRow.length < 15) {
    return { valid: false, error: "Cấu trúc dòng dữ liệu không khớp 15 cột chuẩn." };
  }
  return { valid: true };
}

export default async (req: Request, context: Context) => {
  const url = new URL(req.url);
  const store = getReportStore(context);
  const authRequired = Boolean((Netlify.env.get("UPDATE_DATA_KEY") || "").trim());

  // GET /api/report-data or GET /api/report-data?meta=1
  if (req.method === "GET") {
    try {
      if (url.searchParams.get("meta") === "1") {
        const metaEntry = await store.getMetadata(BLOB_KEY, { consistency: "strong" });
        return jsonResponse({
          ok: true,
          cloudAvailable: true,
          exists: metaEntry !== null,
          authRequired,
          metadata: metaEntry ? metaEntry.metadata : null,
        });
      }

      const entry = await store.getWithMetadata(BLOB_KEY, {
        type: "text",
        consistency: "strong",
      });
      if (entry === null) {
        return jsonResponse(
          { exists: false, authRequired, message: "Chưa có dữ liệu cloud, dùng dữ liệu gốc." },
          404
        );
      }

      const meta = (entry.metadata || {}) as Record<string, string | number>;
      return new Response(entry.data as string, {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store, no-cache, must-revalidate",
          "X-Data-Source": "netlify-blobs",
          "X-Data-Updated-At": String(meta.updatedAt || ""),
          "X-Auth-Required": authRequired ? "1" : "0",
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[report-data GET]", msg);
      return jsonResponse({ ok: false, error: `Lỗi đọc dữ liệu cloud: ${msg}` }, 500);
    }
  }

  // POST /api/report-data — Save new cleaned JSON dataset to Netlify Blobs
  if (req.method === "POST") {
    const auth = checkAuth(req);
    if (!auth.ok) {
      return jsonResponse(
        { ok: false, authRequired: true, error: "Mã bảo vệ (Passcode) không đúng hoặc chưa nhập." },
        401
      );
    }

    try {
      const rawText = await req.text();
      if (!rawText) {
        return jsonResponse({ ok: false, error: "Body trống." }, 400);
      }
      if (new TextEncoder().encode(rawText).byteLength > MAX_PAYLOAD_BYTES) {
        return jsonResponse(
          {
            ok: false,
            error: "File dữ liệu sau xử lý vượt quá giới hạn 5.5 MB của Netlify Function.",
          },
          413
        );
      }

      let parsed: ReportPayload;
      try {
        parsed = JSON.parse(rawText) as ReportPayload;
      } catch {
        return jsonResponse({ ok: false, error: "JSON không hợp lệ." }, 400);
      }

      const check = validatePayload(parsed);
      if (!check.valid) {
        return jsonResponse({ ok: false, error: check.error }, 400);
      }

      const updatedAt = new Date().toISOString();
      parsed.meta.updatedAt = updatedAt;
      parsed.meta.generatedAt = updatedAt;

      const sourceNames = [
        ...(parsed.meta.sources || []).map((s) => s.file),
        ...(parsed.inventory?.meta?.sources || []).map((s) => s.file),
      ]
        .filter(Boolean)
        .join(", ")
        .slice(0, 200);

      const metadata = {
        updatedAt,
        rowCount: parsed.rows.length,
        inventoryRows: Array.isArray(parsed.inventory?.rows) ? parsed.inventory.rows.length : 0,
        dateMin: String(parsed.meta.dateMin || ""),
        dateMax: String(parsed.meta.dateMax || ""),
        sources: sourceNames || "Uploaded Excel",
        totalSales: Math.round(parsed.meta.totals?.sales || 0),
        totalQty: Math.round(parsed.meta.totals?.qty || 0),
      };

      await store.set(BLOB_KEY, JSON.stringify(parsed), { metadata });

      return jsonResponse({
        ok: true,
        source: "netlify-blobs",
        metadata,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[report-data POST]", msg);
      return jsonResponse({ ok: false, error: `Lỗi lưu dữ liệu cloud: ${msg}` }, 500);
    }
  }

  // DELETE /api/report-data — Revert back to repo static baseline data
  if (req.method === "DELETE") {
    const auth = checkAuth(req);
    if (!auth.ok) {
      return jsonResponse(
        { ok: false, authRequired: true, error: "Mã bảo vệ (Passcode) không đúng hoặc chưa nhập." },
        401
      );
    }
    try {
      await store.delete(BLOB_KEY);
      return jsonResponse({ ok: true, reverted: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[report-data DELETE]", msg);
      return jsonResponse({ ok: false, error: `Lỗi khôi phục dữ liệu: ${msg}` }, 500);
    }
  }

  return jsonResponse({ ok: false, error: "Method not allowed" }, 405);
};

export const config: Config = {
  path: "/api/report-data",
  method: ["GET", "POST", "DELETE"],
};
