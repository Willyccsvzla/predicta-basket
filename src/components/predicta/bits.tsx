import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Mark() {
  return (
    <svg viewBox="0 0 240 68" className="h-12 w-44" aria-label="PREDICTA NBA">
      <ellipse cx="120" cy="34" rx="112" ry="29" className="fill-surface stroke-accent" strokeWidth="1.6" />
      <text x="120" y="31" textAnchor="middle" className="fill-bone" fontFamily="Georgia, serif" fontSize="18" letterSpacing="3">
        PREDICTA
      </text>
      <text x="120" y="48" textAnchor="middle" className="fill-accent" fontFamily="Georgia, serif" fontSize="11" letterSpacing="4">
        NBA
      </text>
    </svg>
  );
}

export function Stat({ k, v, sub }: { k: string; v: ReactNode; sub?: string }) {
  return (
    <div className="rounded-lg border border-line bg-card p-4">
      <div className="text-xs tracking-widest text-muted uppercase">{k}</div>
      <div className="mt-2 font-display text-3xl text-bone">{v}</div>
      {sub ? <p className="mt-1 text-sm leading-relaxed text-muted">{sub}</p> : null}
    </div>
  );
}

export function Banner({ children, tone = "accent" }: { children: ReactNode; tone?: "accent" | "bad" }) {
  return (
    <div className={cn("border-l-4 bg-surface px-4 py-3 text-sm leading-relaxed text-bone", tone === "bad" ? "border-bad" : "border-accent")}>
      {children}
    </div>
  );
}

export function Pill({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "accent" | "good" | "bad" }) {
  const map = {
    muted: "border-line text-muted",
    accent: "border-accent text-accent",
    good: "border-good text-good",
    bad: "border-bad text-bad",
  };
  return <span className={cn("inline-flex items-center rounded-full border px-2 py-1 text-xs tracking-wide", map[tone])}>{children}</span>;
}

export function statusTone(status: string): "muted" | "accent" | "good" | "bad" {
  if (status === "ERROR") return "bad";
  if (status === "AUDITADO" || status === "ACTUALIZADO" || status === "FINALIZADO") return "good";
  if (status === "PREDICCIÓN_CONGELADA" || status === "PREDICCIÓN_GENERADA") return "accent";
  return "muted";
}

export function Field(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn("h-11 rounded-lg border border-line bg-card px-3 text-sm text-bone outline-none placeholder:text-muted", props.className)}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={cn("h-11 rounded-lg border border-line bg-card px-3 text-sm text-bone outline-none", props.className)} />
  );
}

export function TableWrap({ children }: { children: ReactNode }) {
  return <div className="max-h-[40rem] overflow-auto rounded-lg border border-line">{children}</div>;
}

export const th = "sticky top-0 bg-surface px-3 py-2 text-left text-xs tracking-widest text-muted uppercase";
export const td = "border-t border-line px-3 py-2 text-sm whitespace-nowrap";

export function Foot() {
  return (
    <p className="mt-8 border-t border-line pt-4 text-xs leading-relaxed text-muted">
      PREDICTA NBA — Resultados estadísticos referenciales. Los datos y cálculos dependen de las fuentes disponibles y pueden estar sujetos a errores humanos, errores de registro o limitaciones de datos. Este documento no constituye garantía de resultados futuros. El motor embebido es LOCAL FALLBACK — NO SOURCE OF TRUTH.
    </p>
  );
}

export function Pager({
  page,
  pages,
  total,
  onPrev,
  onNext,
}: {
  page: number;
  pages: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" className="h-11 rounded-lg border border-line px-4 text-sm" onClick={onPrev} disabled={page <= 0}>
        Anterior
      </button>
      <span className="text-sm text-muted">
        {total} filas · página {page + 1} de {pages}
      </span>
      <button type="button" className="h-11 rounded-lg border border-line px-4 text-sm" onClick={onNext} disabled={page + 1 >= pages}>
        Siguiente
      </button>
    </div>
  );
}
