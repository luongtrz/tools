import { useMemo, useState } from "react";
import { literal, useI18n } from "../i18n";
import {
  CopyButton,
  ToolButton,
  ToolNotice,
  ToolPage,
  ToolPanel,
  ToolTextArea,
} from "../components/ToolUI";
import { toolStyles } from "../components/toolStyles";

const SAMPLE_JWT =
  "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJ0b29sbWQiLCJleHAiOjQxMDI0NDQ4MDB9.";

export function UrlCodecTool() {
  const { language, t } = useI18n();
  const [value, setValue] = useState("https://toolmd.pages.dev/md2pdf/?mode=quick view");
  const [direction, setDirection] = useState<"encode" | "decode">("encode");
  const result = useMemo((): { output: string; error: string } => {
    if (!value.trim()) return { output: "", error: t("emptyInput") };
    try {
      return {
        output:
          direction === "encode"
            ? encodeURIComponent(value)
            : decodeURIComponent(value.replace(/\+/g, " ")),
        error: "",
      };
    } catch {
      return { output: "", error: t("invalidUrlEncoding") };
    }
  }, [direction, t, value]);

  return (
    <ToolPage slug="url-codec">
      <ToolPanel
        title="URL Encode / Decode"
        description="Convert URL components locally without sending them anywhere."
        actions={
          <ToolButton
            variant="quiet"
            onClick={() => {
              setValue("https://toolmd.pages.dev/md2pdf/?mode=quick view");
              setDirection("encode");
            }}
          >
            {t("reset")}
          </ToolButton>
        }
      >
        <div className={toolStyles.segmented}>
          <button
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${direction === "encode" ? "bg-white text-[#f2633d] shadow-sm dark:bg-slate-900" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"}`}
            type="button"
            onClick={() => setDirection("encode")}
          >
            {literal("Encode URL", language)}
          </button>
          <button
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${direction === "decode" ? "bg-white text-[#f2633d] shadow-sm dark:bg-slate-900" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"}`}
            type="button"
            onClick={() => setDirection("decode")}
          >
            {literal("Decode URL", language)}
          </button>
        </div>
        <ToolTextArea
          value={value}
          onChange={setValue}
          ariaLabel="URL input"
          rows={12}
        />
        <div className="mt-5 flex items-start gap-3">
          {result.error ? (
            <ToolNotice variant="error">{result.error}</ToolNotice>
          ) : (
            <pre className={`${toolStyles.codeOutput} min-w-0 flex-1`}>
              {result.output}
            </pre>
          )}
          <CopyButton value={result.output} />
        </div>
      </ToolPanel>
    </ToolPage>
  );
}

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

interface DecodedJwt {
  header: unknown;
  payload: unknown;
  signature: string;
}

function decodeJwt(value: string): DecodedJwt {
  const parts = value.trim().split(".");
  if (parts.length !== 3) throw new Error("JWT must contain three segments.");
  return {
    header: JSON.parse(decodeBase64Url(parts[0])),
    payload: JSON.parse(decodeBase64Url(parts[1])),
    signature: parts[2],
  };
}

function expirationFrom(payload: unknown): number | null {
  if (typeof payload !== "object" || payload === null || !("exp" in payload)) {
    return null;
  }
  const expiration = payload.exp;
  return typeof expiration === "number" && Number.isFinite(expiration)
    ? expiration
    : null;
}

export function JwtDecoderTool() {
  const { language, t } = useI18n();
  const [value, setValue] = useState(SAMPLE_JWT);
  const result = useMemo((): { decoded: DecodedJwt | null; error: string } => {
    if (!value.trim()) return { decoded: null, error: t("emptyInput") };
    try {
      return { decoded: decodeJwt(value), error: "" };
    } catch {
      return { decoded: null, error: t("invalidJwt") };
    }
  }, [t, value]);
  const expiration = result.decoded ? expirationFrom(result.decoded.payload) : null;
  const expirationDate = expiration !== null ? new Date(expiration * 1000) : null;
  const expirationLabel = expirationDate
    ? expirationDate.toLocaleString(language === "vi" ? "vi-VN" : "en-US")
    : "";
  const payloadText = result.decoded
    ? JSON.stringify(result.decoded.payload, null, 2)
    : "";
  const headerText = result.decoded
    ? JSON.stringify(result.decoded.header, null, 2)
    : "";

  return (
    <ToolPage slug="jwt-decoder">
      <ToolPanel
        title="JWT Decoder"
        description="Decode a JWT header and payload locally. The signature is not verified."
        actions={
          <ToolButton variant="quiet" onClick={() => setValue(SAMPLE_JWT)}>
            {t("reset")}
          </ToolButton>
        }
      >
        <ToolTextArea
          value={value}
          onChange={setValue}
          ariaLabel="JWT token"
          rows={9}
        />
        <div className="mt-5">
          <ToolNotice variant="warning">{t("jwtUnverified")}</ToolNotice>
        </div>
      </ToolPanel>

      {result.error ? (
        <ToolPanel title="JWT result">
          <ToolNotice variant="error">{result.error}</ToolNotice>
        </ToolPanel>
      ) : result.decoded ? (
        <>
          <div className={toolStyles.splitLayout}>
            <ToolPanel title="JWT header" actions={<CopyButton value={headerText} />}>
              <pre className={toolStyles.codeOutput}>{headerText}</pre>
            </ToolPanel>
            <ToolPanel title="JWT payload" actions={<CopyButton value={payloadText} />}>
              <pre className={toolStyles.codeOutput}>{payloadText}</pre>
            </ToolPanel>
          </div>
          <ToolPanel title="JWT status">
            <div className="flex flex-wrap items-center gap-3 font-mono text-sm text-slate-600 dark:text-slate-300">
              <span className="rounded-lg bg-amber-50 px-3 py-2 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                {expirationDate
                  ? expirationDate.getTime() < Date.now()
                    ? t("jwtExpired")
                    : t("jwtActive")
                  : t("jwtNoExpiration")}
              </span>
              {expirationLabel && <span>{t("jwtExpiration", { value: expirationLabel })}</span>}
            </div>
            <div className="mt-4 flex items-start gap-3">
              <code className={`${toolStyles.codeOutput} min-h-0 min-w-0 flex-1 break-all`}>
                {result.decoded.signature || "(empty signature)"}
              </code>
              <CopyButton value={result.decoded.signature} />
            </div>
          </ToolPanel>
        </>
      ) : null}
    </ToolPage>
  );
}
