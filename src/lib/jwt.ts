import { z } from "zod";

const headerSchema = z.object({ alg: z.string(), typ: z.string().optional() });

export interface JwtDecodeResult {
  ok: true;
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
  rawHeader: string;
  rawPayload: string;
  claims: JwtClaimSummary[];
}

export interface JwtDecodeError {
  ok: false;
  error: string;
  stage: "format" | "base64" | "json" | "header" | "payload";
}

export interface JwtClaimSummary {
  key: string;
  value: string;
  status: "ok" | "expired" | "inactive" | "info";
}

export function decodeJwt(
  token: string,
  clockSkewSeconds = 0,
): JwtDecodeResult | JwtDecodeError {
  const trimmed = token.trim();
  if (!trimmed) {
    return { ok: false, error: "Empty token", stage: "format" };
  }
  const parts = trimmed.split(".");
  if (parts.length !== 3) {
    return {
      ok: false,
      error: `Expected 3 segments, got ${parts.length}`,
      stage: "format",
    };
  }
  const [headerB64, payloadB64, signature] = parts;
  const rawHeader = safeBase64UrlDecode(headerB64);
  if (rawHeader === null) {
    return { ok: false, error: "Header is not valid Base64URL", stage: "base64" };
  }
  const rawPayload = safeBase64UrlDecode(payloadB64);
  if (rawPayload === null) {
    return { ok: false, error: "Payload is not valid Base64URL", stage: "base64" };
  }
  let header: Record<string, unknown>;
  let payload: Record<string, unknown>;
  try {
    header = JSON.parse(rawHeader);
    const parsed = headerSchema.safeParse(header);
    if (!parsed.success) {
      return { ok: false, error: "Header missing alg", stage: "header" };
    }
  } catch {
    return { ok: false, error: "Header is not valid JSON", stage: "json" };
  }
  try {
    payload = JSON.parse(rawPayload);
  } catch {
    return { ok: false, error: "Payload is not valid JSON", stage: "json" };
  }
  const claims = summarizeClaims(payload, clockSkewSeconds);
  return {
    ok: true,
    header,
    payload,
    signature,
    rawHeader,
    rawPayload,
    claims,
  };
}

function safeBase64UrlDecode(value: string): string | null {
  if (!value) return "";
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  try {
    if (typeof atob === "function") {
      return decodeURIComponent(
        atob(padded + pad)
          .split("")
          .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, "0")}`)
          .join(""),
      );
    }
  } catch {
    return null;
  }
  return null;
}

function summarizeClaims(
  payload: Record<string, unknown>,
  clockSkew: number,
): JwtClaimSummary[] {
  const claims: JwtClaimSummary[] = [];
  const now = Math.floor(Date.now() / 1000) + clockSkew;
  if (typeof payload.iat === "number") {
    claims.push({
      key: "iat",
      value: formatDate(new Date(payload.iat * 1000)),
      status: "info",
    });
  }
  if (typeof payload.nbf === "number") {
    claims.push({
      key: "nbf",
      value: formatDate(new Date(payload.nbf * 1000)),
      status: payload.nbf <= now ? "ok" : "inactive",
    });
  }
  if (typeof payload.exp === "number") {
    claims.push({
      key: "exp",
      value: formatDate(new Date(payload.exp * 1000)),
      status: payload.exp >= now ? "ok" : "expired",
    });
  }
  for (const key of ["iss", "aud", "sub", "jti"]) {
    if (payload[key] !== undefined) {
      claims.push({
        key,
        value: String(payload[key]),
        status: "info",
      });
    }
  }
  return claims;
}

function formatDate(date: Date): string {
  if (Number.isNaN(date.getTime())) return "—";
  return date.toISOString();
}
