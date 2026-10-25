import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, type ReactNode } from "react";
import { Mark, Pill } from "@/components/predicta/bits";
import { useOps } from "@/lib/predicta/store";
import { cn } from "@/lib/utils";

const NAV = [
  ["/", "Portada"],
  ["/hoy", "Hoy"],
  ["/calendario", "Calendario"],
  ["/predicciones", "Predicciones"],
  ["/partidos", "Partidos"],
  ["/numeros", "Números"],
  ["/equipos", "Equipos"],
  ["/jugadores", "Jugadores"],
  ["/auditoria", "Auditoría"],
  ["/sistema", "Sistema"],
  ["/scheduler", "Scheduler"],
] as const;

export function Shell({ children }: { children: ReactNode }) {
  const hydrate = useOps((s) => s.hydrate);
  const ready = useOps((s) => s.ready);
  const live = useOps((s) => s.realPredictionsEnabled);
  const scheduled = useOps((s) => s.schedulerEnabled);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const once = useRef(false);
  useEffect(() => {
    if (once.current) return;
    once.current = true;
    hydrate();
  }, [hydrate]);
  useEffect(() => {
    if (!ready || !live || !scheduled) return;
    const run = () => useOps.getState().tick(false);
    run();
    const id = window.setInterval(run, 60_000);
    return () => window.clearInterval(id);
  }, [ready, live, scheduled]);

  return (
    <div className="min-h-screen bg-ink text-bone">
      <header className="sticky top-0 z-20 border-b border-line bg-ink/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-3">
            <Mark />
            <span className="sr-only">PREDICTA NBA</span>
          </Link>
          <div className="min-w-0 flex-1">
            <p className="font-display text-xl">PREDICTA NBA</p>
            <p className="text-sm text-muted">Orquestador operativo · motor v1.1 · no es una casa de apuestas</p>
          </div>
          <Pill tone={!ready ? "muted" : live ? "bad" : "accent"}>{!ready ? "CARGANDO" : live ? "PRODUCCIÓN ABIERTA" : "PRODUCCIÓN CERRADA"}</Pill>
          <Pill tone={!ready ? "muted" : scheduled ? "accent" : "muted"}>{!ready ? "…" : scheduled ? "SCHEDULER ON" : "SCHEDULER OFF"}</Pill>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 pb-3" aria-label="Secciones">
          {NAV.map(([href, label]) => {
            const on = href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                to={href}
                className={cn(
                  "inline-flex h-11 shrink-0 items-center rounded-full border px-3 text-sm",
                  on ? "border-bone bg-bone text-ink" : "border-line text-muted",
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
