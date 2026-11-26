import { getStore } from "@netlify/blobs";
import type { Config, Context } from "@netlify/functions";
import { gunzipSync } from "node:zlib";

const BLOB_KEY = "latest-v3-storage";
const PRICE_BLOB_KEY = "latest-price-compare-ocgn";
const MAX_PAYLOAD_BYTES = 15_000_000; // Allow up to 15 MB uncompressed JSON (POST body itself can be gzip-compressed ~2 MB)

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
  rows?: unknown[][];
  salesCube?: unknown[][];
  salesDaily?: unknown[][];
  schemaVersion?: number;
  taxonomy?: unknown;
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
  masterProducts?: { meta?: { rowCount?: number }; rows?: unknown[][] };
  masterSummary?: { meta?: { rowCount?: number }; rows?: unknown[][] };
  invSkuLevel?: { meta?: { rowCount?: number }; rows?: unknown[][] };
  invBranchLevel?: { meta?: { rowCount?: number }; rows?: unknown[][] };
  invSerials?: { meta?: { rowCount?: number }; rows?: unknown[][] };
  invSerialCube?: { meta?: { totalSerials?: number; cubeRows?: number }; rows?: unknown[][] };
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
    "regions",
    "channels",
    "subcats",
    "brands",
    "orderTypes",
  ] as const;
  for (const k of reqLookups) {
    if (!Array.isArray(p.lookups[k])) {
      return { valid: false, error: `Thiếu danh mục lookups.${k}.` };
    }
  }
  if (!p.siteDirectory || typeof p.siteDirectory !== "object") {
    return { valid: false, error: "Thiếu siteDirectory." };
  }
  const hasCube = Array.isArray(p.salesCube) && p.salesCube.length > 0;
  const hasRows = Array.isArray(p.rows) && p.rows.length > 0;
  if (!hasCube && !hasRows) {
    return { valid: false, error: "Dữ liệu salesCube/rows rỗng — cần ít nhất 1 giao dịch hợp lệ." };
  }
  return { valid: true };
}

export default async (req: Request, context: Context) => {
  const url = new URL(req.url);
  const store = getReportStore(context);
  const authRequired = Boolean((Netlify.env.get("UPDATE_DATA_KEY") || "").trim());
  const isPriceCompare = url.searchParams.get("type") === "price-compare";

  // GET /api/report-data or GET /api/report-data?meta=1 or GET /api/report-data?type=price-compare
  if (req.method === "GET") {
    try {
      if (isPriceCompare) {
        const pEntry = await store.getWithMetadata(PRICE_BLOB_KEY, { type: "text", consistency: "strong" });
        if (pEntry === null) {
          return jsonResponse({ exists: false }, 404);
        }
        return new Response(pEntry.data as string, {
          status: 200,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-store, no-cache, must-revalidate",
            "X-Data-Source": "netlify-blobs",
          },
        });
      }
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
      const contentEncoding = (req.headers.get("content-encoding") || "").toLowerCase();
      let rawText = "";
      if (contentEncoding === "gzip") {
        const ab = await req.arrayBuffer();
        if (!ab || ab.byteLength === 0) {
          return jsonResponse({ ok: false, error: "Body trống." }, 400);
        }
        rawText = gunzipSync(Buffer.from(ab)).toString("utf-8");
      } else {
        rawText = await req.text();
      }
      if (!rawText) {
        return jsonResponse({ ok: false, error: "Body trống." }, 400);
      }
      if (new TextEncoder().encode(rawText).byteLength > MAX_PAYLOAD_BYTES) {
        return jsonResponse(
          {
            ok: false,
            error: "File dữ liệu sau xử lý vượt quá giới hạn 15 MB.",
          },
          413
        );
      }

      if (isPriceCompare) {
        const parsedPc = JSON.parse(rawText);
        const updatedAt = new Date().toISOString();
        await store.set(PRICE_BLOB_KEY, JSON.stringify(parsedPc), { metadata: { updatedAt } });
        return jsonResponse({ ok: true, source: "netlify-blobs", updatedAt });
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
        rowCount: parsed.meta.rowCount || (parsed.salesCube?.length ?? parsed.rows?.length ?? 0),
        inventoryRows: Array.isArray(parsed.inventory?.rows) ? parsed.inventory.rows.length : 0,
        serialRows: parsed.invSerialCube?.meta?.totalSerials ?? (Array.isArray(parsed.invSerials?.rows) ? parsed.invSerials.rows.length : 0),
        masterRows: parsed.masterSummary?.meta?.rowCount ?? (Array.isArray(parsed.masterProducts?.rows) ? parsed.masterProducts.rows.length : 0),
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
