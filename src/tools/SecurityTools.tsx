import { useMemo, useState, type ReactNode } from "react";
import { useI18n } from "@/i18n";
import { downloadFile } from "@/lib/download";
import { decodeJwt, type JwtClaimSummary } from "@/lib/jwt";
import {
  CopyButton,
  ToolNotice,
  ToolPage,
  ToolPanel,
  ToolTextArea,
} from "@/components/ToolUI";
import { OutputActions } from "@/components/OutputActions";
import { ToolExamples } from "@/components/ToolSupport";
import { toolStyles } from "@/components/toolStyles";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SAMPLE_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjEyMyJ9.eyJzdWIiOiJ0b29sbWQiLCJpc3MiOiJ0b29sbWQiLCJhdWQiOiJodHRwczovL3Rvb2xtZC5wYWdlcy5kZXYiLCJleHAiOjQxMDI0NDQ4MDAsIm5iZiI6MTcwMDAwMDAwMCwiaWF0IjoxNzAwMDAwMDAwfQ.placeholder";

const JWT_SAMPLES = [
  {
    label: "HS256 active",
    description: "Standard issued-at, expires in 2100",
    value:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0b29sbWQiLCJpc3MiOiJ0b29sbWQiLCJhdWQiOiJ0b29sbWQiLCJleHAiOjQxMDI0NDQ4MDAsIm5iZiI6MTcwMDAwMDAwMCwiaWF0IjoxNzAwMDAwMDAwfQ.signature",
  },
  {
    label: "Expired",
    description: "Expired in 2020",
    value:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0b29sbWQiLCJleHAiOjE1OTM0OTYwMDB9.signature",
  },
  {
    label: "None alg",
    description: "alg=none, header only",
    value:
      "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJ0b29sbWQiLCJleHAiOjQxMDI0NDQ4MDB9.",
  },
];

export function JwtDecoderTool() {
  const { t } = useI18n();
  const [value, setValue] = useState(SAMPLE_JWT);
  const [clockSkewSeconds, setClockSkewSeconds] = useState(0);
  const result = useMemo(() => decodeJwt(value, clockSkewSeconds), [
    clockSkewSeconds,
    value,
  ]);
  const headerText = result.ok ? JSON.stringify(result.header, null, 2) : "";
  const payloadText = result.ok ? JSON.stringify(result.payload, null, 2) : "";
  return (
    <ToolPage slug="jwt-decoder">
      <ToolPanel
        title="JWT token"
        actions={
          <OutputActions
            onReset={() => {
              setValue(SAMPLE_JWT);
              setClockSkewSeconds(0);
            }}
            onClear={() => setValue("")}
            onCopy={async () => {
              await navigator.clipboard.writeText(value);
            }}
          />
        }
      >
        <ToolTextArea
          value={value}
          onChange={setValue}
          ariaLabel="JWT token"
          rows={6}
        />
        <ToolExamples
          className="mt-3"
          examples={JWT_SAMPLES}
          onSelect={setValue}
        />
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field
            label="Clock skew (seconds)"
            hint="Positive: treat future timestamps as already valid. Negative: tighten expiry."
          >
            <Input
              type="number"
              value={clockSkewSeconds}
              onChange={(event) => setClockSkewSeconds(Number(event.target.value) || 0)}
              className="h-9 font-mono"
            />
          </Field>
        </div>
        <ToolNotice variant="warning" className="mt-3">
          {t("jwtUnverified")}
        </ToolNotice>
      </ToolPanel>
      {result.ok ? (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <ToolPanel title="Header" actions={<CopyButton value={headerText} />}>
              <pre className={toolStyles.codeOutput}>{headerText}</pre>
            </ToolPanel>
            <ToolPanel title="Payload" actions={<CopyButton value={payloadText} />}>
              <pre className={toolStyles.codeOutput}>{payloadText}</pre>
            </ToolPanel>
          </div>
          <ToolPanel title="Claim summary">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {result.claims.length === 0 ? (
                <p className="font-mono text-xs text-muted-foreground">
                  No standard claims in this payload.
                </p>
              ) : (
                result.claims.map((claim) => <ClaimCard key={claim.key} claim={claim} />)
              )}
            </div>
          </ToolPanel>
          <ToolPanel
            title="Signature"
            actions={<CopyButton value={result.signature || ""} />}
          >
            <code className="block break-all rounded-md border border-border bg-muted/30 p-3 font-mono text-xs text-foreground">
              {result.signature || "(empty signature)"}
            </code>
            <Button
              size="sm"
              variant="outline"
              className="mt-3"
              onClick={() =>
                downloadFile(
                  "jwt.json",
                  JSON.stringify({ header: result.header, payload: result.payload }, null, 2),
                  "application/json;charset=utf-8",
                )
              }
            >
              Download decoded JSON
            </Button>
          </ToolPanel>
        </>
      ) : (
        <ToolPanel title="Result">
          <ToolNotice variant="error">
            <strong className="font-semibold capitalize">{result.stage}:</strong>{" "}
            {result.error}
          </ToolNotice>
        </ToolPanel>
      )}
    </ToolPage>
  );
}

function ClaimCard({ claim }: { claim: JwtClaimSummary }) {
  return (
    <div className="rounded-md border border-border bg-card p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
          {claim.key}
        </span>
        <StatusBadge status={claim.status} />
      </div>
      <p className="mt-1 font-mono text-sm text-foreground break-all">
        {claim.value}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: JwtClaimSummary["status"] }) {
  const map = {
    ok: "bg-emerald-200 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200",
    expired: "bg-destructive/10 text-destructive",
    inactive: "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200",
    info: "bg-muted text-muted-foreground",
  } as const;
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold uppercase",
        map[status],
      )}
    >
      {status}
    </span>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
