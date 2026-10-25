import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Banner, Foot, Pager, Pill, Stat, statusTone, TableWrap, td, th } from "@/components/predicta/bits";
import { Button } from "@/components/ui/button";
import { FROZEN_V11, SCHEDULE_CONTRACT } from "@/lib/predicta/parameters";
import { gamesOnDate, METRICS_BUNDLE, SEASON, teamName } from "@/lib/predicta/catalog";
import { monthLabel, niceDate } from "@/lib/predicta/format";
import { checkCompletedGames, overlayOf, productionCounts } from "@/lib/predicta/orchestrator";
import { useOps } from "@/lib/predicta/store";
import { addDays } from "@/lib/predicta/time";

export function Portada() {
  const state = useOps();
  const counts = productionCounts(state);
  const next = SEASON.find((g) => !overlayOf(state, g.id).frozen) ?? SEASON[0];
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-5">
        <section className="rounded-lg border border-line bg-card p-5 lg:col-span-3">
          <Pill tone="accent">MOTOR v1.1 VALIDADO</Pill>
          <h1 className="mt-3 text-4xl">PREDICTA NBA</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
            {state.realPredictionsEnabled
              ? `Producción abierta. 2025-26 sigue congelada. 2026-27 se predice partido por partido, solo el día operativo (hora Este). Scheduler ${state.schedulerEnabled ? "encendido: avanza ese día solo" : "apagado"}.`
              : "Producción cerrada. Ningún partido 2026-27 recibe predicción."}
          </p>
        </section>
        <section className="rounded-lg border border-line bg-card p-5 lg:col-span-2">
          <div className="text-xs tracking-widest text-muted uppercase">Estado 2026-27</div>
          <div className="mt-2 font-display text-4xl">{counts.predictions}</div>
          <p className="text-sm text-muted">predicciones reales</p>
          <p className="mt-3 text-sm text-muted">
            Congeladas {counts.frozen} · finalizados {counts.finals} · actualizados {counts.updates}
          </p>
          <p className="mt-3 text-sm text-bone">{state.realPredictionsEnabled ? "PRODUCCIÓN ABIERTA" : "PRODUCCIÓN CERRADA"}</p>
        </section>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat k="Histórica" v="2025-26" sub={`${FROZEN_V11.n} partidos`} />
        <Stat k="Accuracy" v={`${FROZEN_V11.acc}%`} sub={`Brier ${FROZEN_V11.brier}`} />
        <Stat k="Log loss" v={FROZEN_V11.logloss} sub={`MAE pts ${FROZEN_V11.maePts}`} />
        <Stat k="Calendario" v={SCHEDULE_CONTRACT.defined} sub={`${SCHEDULE_CONTRACT.pendingOfficial} pendientes · no inventados`} />
      </div>
      <Banner>
        Próximo partido sin predicción congelada: {next.date} {next.time} {next.timezone} · {teamName(next.aa)} @ {teamName(next.ha)} · {next.id}. No es una predicción.
      </Banner>
      <Foot />
    </div>
  );
}

export function Hoy() {
  const viewDate = useOps((s) => s.viewDate);
  const setViewDate = useOps((s) => s.setViewDate);
  const processSelectedDay = useOps((s) => s.processSelectedDay);
  const overlays = useOps((s) => s.overlays);
  const live = useOps((s) => s.realPredictionsEnabled);
  const games = gamesOnDate(viewDate);
  const bucket = (status: string) => games.filter((g) => (overlays[g.id]?.status ?? "PROGRAMADO") === status).length;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl">Hoy</h1>
          <p className="text-sm text-muted capitalize">{niceDate(viewDate)} · hora de calendario Este</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="date"
            value={viewDate}
            onChange={(e) => e.target.value && setViewDate(e.target.value)}
            className="h-11 rounded-lg border border-line bg-card px-3 text-sm"
          />
          <Button type="button" onClick={() => setViewDate(addDays(viewDate, -1))}>
            Ayer
          </Button>
          <Button type="button" tone="solid" onClick={() => setViewDate("2026-10-20")}>
            Apertura
          </Button>
          <Button type="button" onClick={() => setViewDate(addDays(viewDate, 1))}>
            Mañana
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat k="Programados" v={games.length} sub="en esta fecha" />
        <Stat k="Pendientes de predicción" v={bucket("PROGRAMADO") + bucket("DATOS_ACTUALIZADOS") + bucket("PREDICCIÓN_PENDIENTE")} />
        <Stat k="Generadas" v={bucket("PREDICCIÓN_GENERADA")} />
        <Stat k="Congeladas" v={bucket("PREDICCIÓN_CONGELADA")} />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat k="En espera" v={bucket("EN_ESPERA_RESULTADO")} />
        <Stat k="Finalizados" v={bucket("FINALIZADO")} />
        <Stat k="Actualizados" v={bucket("ACTUALIZADO")} />
        <Stat k="Auditados" v={bucket("AUDITADO")} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" tone="solid" onClick={processSelectedDay}>
          Procesar este día
        </Button>
        <p className="max-w-xl text-sm leading-relaxed text-muted">
          {live
            ? "Cada partido avanza un solo estado. No se crea una predicción diaria única."
            : "Producción cerrada: el proceso queda en seco. Ningún partido 2026-27 recibe predicción."}
        </p>
      </div>
      <div className="flex gap-2 overflow-x-auto">
        {Array.from({ length: 7 }, (_, i) => addDays(viewDate, i)).map((d) => (
          <button key={d} type="button" onClick={() => setViewDate(d)} className="h-11 shrink-0 rounded-full border border-line px-3 text-sm">
            {d.slice(5)} · {gamesOnDate(d).length}
          </button>
        ))}
      </div>
      {games.length === 0 ? (
        <Banner>No hay partidos en el calendario oficial para esta fecha. La apertura registrada es el 20 de octubre de 2026.</Banner>
      ) : (
        <div className="grid gap-3">
          {games.map((g) => {
            const ov = overlays[g.id];
            const status = ov?.status ?? "PROGRAMADO";
            const pred = ov?.frozen ?? ov?.prediction;
            return (
              <Link key={g.id} to="/partido/$gameId" params={{ gameId: g.id }} className="rounded-lg border border-line bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-display text-2xl">
                    {g.aa} @ {g.ha}
                  </p>
                  <Pill tone={statusTone(status)}>{status}</Pill>
                </div>
                <p className="mt-1 text-sm text-muted">
                  {g.time} {g.timezone} · {g.arena} · {g.id}
                </p>
                <p className="mt-2 text-sm text-bone">
                  {pred ? `Pick ${pred.pick} · ${pred.p_pick}% · margen ${pred.projected_margin} · ${ov?.frozen ? "congelada" : "no congelada"}` : "Sin predicción"}
                </p>
              </Link>
            );
          })}
        </div>
      )}
      <Foot />
    </div>
  );
}

export function Calendario() {
  const setViewDate = useOps((s) => s.setViewDate);
  const months = useMemo(() => {
    const map = new Map<string, Map<string, number>>();
    for (const g of SEASON) {
      const ym = g.date.slice(0, 7);
      if (!map.has(ym)) map.set(ym, new Map());
      const days = map.get(ym)!;
      days.set(g.date, (days.get(g.date) ?? 0) + 1);
    }
    return [...map.entries()];
  }, []);
  return (
    <div className="space-y-4">
      <h1 className="text-3xl">Calendario</h1>
      <Banner>
        Temporada regular {SCHEDULE_CONTRACT.coverage}. {SCHEDULE_CONTRACT.defined} partidos definidos, {SCHEDULE_CONTRACT.pendingOfficial} pendientes de definición oficial (NBA Cup). No se inventaron. Pretemporada: no.
      </Banner>
      {months.map(([ym, days]) => (
        <section key={ym} className="space-y-2">
          <h2 className="text-2xl capitalize">{monthLabel(ym)}</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {[...days.entries()].map(([date, n]) => (
              <Link
                key={date}
                to="/hoy"
                onClick={() => setViewDate(date)}
                className="rounded-lg border border-line bg-card px-3 py-3"
              >
                <div className="text-sm text-bone">{date.slice(8)}</div>
                <div className="text-xs text-muted">{n} partidos</div>
              </Link>
            ))}
          </div>
        </section>
      ))}
      <Foot />
    </div>
  );
}

export function Predicciones() {
  const overlays = useOps((s) => s.overlays);
  const live = useOps((s) => s.realPredictionsEnabled);
  const rows = SEASON.filter((g) => overlays[g.id]?.prediction || overlays[g.id]?.frozen);
  const next = SEASON.find((g) => !overlays[g.id]?.frozen);
  const opener = SEASON[0];
  return (
    <div className="space-y-4">
      <h1 className="text-3xl">Predicciones</h1>
      {rows.length === 0 ? (
        <div className="rounded-lg border border-line bg-card p-5">
          <div className="text-xs tracking-widest text-muted uppercase">2026-27</div>
          <p className="mt-2 font-display text-3xl">{live ? "Producción abierta. 0 predicciones oficiales." : "0 predicciones generadas."}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {live
              ? `No se adelantan. Cada partido se escribe el día del tip, hora Este, y se congela solo en los últimos 90 minutos. La apertura es ${opener.date}: ${opener.aa} @ ${opener.ha}.`
              : `Un partido sin predicción no se muestra aquí.${next ? ` El próximo pendiente es ${next.date} ${next.aa} @ ${next.ha}.` : ""}`}
          </p>
        </div>
      ) : (
        <TableWrap>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={th}>Partido</th>
                <th className={th}>Pick</th>
                <th className={th}>Prob</th>
                <th className={th}>Margen</th>
                <th className={th}>Total</th>
                <th className={th}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((g) => {
                const ov = overlays[g.id];
                const p = ov.frozen ?? ov.prediction!;
                return (
                  <tr key={g.id}>
                    <td className={td}>
                      <Link to="/partido/$gameId" params={{ gameId: g.id }} className="underline">
                        {g.date} {g.aa}@{g.ha}
                      </Link>
                    </td>
                    <td className={td}>{p.pick}</td>
                    <td className={td}>{p.p_pick}%</td>
                    <td className={td}>{p.projected_margin}</td>
                    <td className={td}>{p.projected_total}</td>
                    <td className={td}>{ov.frozen ? "CONGELADA" : ov.status}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableWrap>
      )}
      <Foot />
    </div>
  );
}

export function Partidos() {
  const overlays = useOps((s) => s.overlays);
  const [q, setQ] = useState("");
  const [st, setSt] = useState("");
  const [page, setPage] = useState(0);
  const rows = SEASON.filter((g) => {
    const blob = `${g.date} ${g.aa} ${g.ha} ${g.arena}`.toLowerCase();
    if (q && !blob.includes(q.trim().toLowerCase())) return false;
    const status = overlays[g.id]?.status ?? "PROGRAMADO";
    if (st && status !== st) return false;
    return true;
  });
  const pages = Math.max(1, Math.ceil(rows.length / 40));
  const safe = Math.min(page, pages - 1);
  const slice = rows.slice(safe * 40, safe * 40 + 40);
  return (
    <div className="space-y-4">
      <h1 className="text-3xl">Partidos</h1>
      <p className="text-sm text-muted">Temporada operativa 2026-27. Cada fila es un expediente. El histórico 2025-26 está en Números.</p>
      <div className="flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => {
            setPage(0);
            setQ(e.target.value);
          }}
          placeholder="Equipo, fecha o arena"
          className="h-11 rounded-lg border border-line bg-card px-3 text-sm"
        />
        <select
          value={st}
          onChange={(e) => {
            setPage(0);
            setSt(e.target.value);
          }}
          className="h-11 rounded-lg border border-line bg-card px-3 text-sm"
        >
          <option value="">Estado</option>
          {["PROGRAMADO", "DATOS_ACTUALIZADOS", "PREDICCIÓN_PENDIENTE", "PREDICCIÓN_GENERADA", "PREDICCIÓN_CONGELADA", "EN_ESPERA_RESULTADO", "FINALIZADO", "ACTUALIZADO", "AUDITADO", "ERROR"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      <Pager page={safe} pages={pages} total={rows.length} onPrev={() => setPage((p) => Math.max(0, p - 1))} onNext={() => setPage((p) => p + 1)} />
      <TableWrap>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={th}>Fecha</th>
              <th className={th}>Hora</th>
              <th className={th}>Visitante</th>
              <th className={th}>Local</th>
              <th className={th}>Estado</th>
              <th className={th}>Predicción</th>
            </tr>
          </thead>
          <tbody>
            {slice.map((g) => {
              const ov = overlays[g.id];
              return (
                <tr key={g.id}>
                  <td className={td}>{g.date}</td>
                  <td className={td}>
                    {g.time} {g.timezone}
                  </td>
                  <td className={td}>{g.aa}</td>
                  <td className={td}>{g.ha}</td>
                  <td className={td}>{ov?.status ?? "PROGRAMADO"}</td>
                  <td className={td}>
                    <Link to="/partido/$gameId" params={{ gameId: g.id }} className="underline">
                      {ov?.frozen ? "Congelada" : ov?.prediction ? "Generada" : "Abrir expediente"}
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableWrap>
      <Foot />
    </div>
  );
}

export function Partido({ gameId }: { gameId: string }) {
  const game = SEASON.find((g) => g.id === gameId);
  const ov = useOps((s) => s.overlays[gameId]);
  const ratings = useOps((s) => s.ratings);
  const auditAll = useOps((s) => s.audit);
  const audit = auditAll.filter((a) => a.gameId === gameId);
  const live = useOps((s) => s.realPredictionsEnabled);
  const step = useOps((s) => s.step);
  const freeze = useOps((s) => s.freeze);
  const revise = useOps((s) => s.revise);
  const saveResult = useOps((s) => s.saveResult);
  const [homePts, setHomePts] = useState("");
  const [awayPts, setAwayPts] = useState("");
  const [source, setSource] = useState("");
  const [msg, setMsg] = useState("");
  if (!game) return <Banner tone="bad">Partido no definido. No se inventa.</Banner>;
  const status = ov?.status ?? "PROGRAMADO";
  const pred = ov?.frozen ?? ov?.prediction;
  const home = ratings[game.ha];
  const away = ratings[game.aa];
  const log = audit.slice(-12).reverse();
  return (
    <div className="space-y-4">
      <p className="text-xs tracking-widest text-muted uppercase">{game.id}</p>
      <h1 className="text-3xl">
        {teamName(game.aa)} @ {teamName(game.ha)}
      </h1>
      <div className="flex flex-wrap gap-2">
        <Pill tone={statusTone(status)}>{status}</Pill>
        <Pill>{game.neutral ? "Neutral" : "Localía aplicada en el motor"}</Pill>
      </div>
      <section className="grid gap-3 sm:grid-cols-2">
        <article className="rounded-lg border border-line bg-card p-4 text-sm leading-relaxed">
          <h2 className="text-xl">Identificación</h2>
          <p className="mt-2 text-muted">
            {game.date} · {game.time} {game.timezone}
            <br />
            {game.arena}
            <br />
            {game.season}
            {game.notes ? ` · ${game.notes}` : ""}
          </p>
        </article>
        <article className="rounded-lg border border-line bg-card p-4 text-sm leading-relaxed">
          <h2 className="text-xl">Disponibilidad</h2>
          <p className="mt-2 text-muted">
            Out, questionable, doubtful, probable, minutos e impacto: NOT AVAILABLE / NOT VALIDATED. Questionable no es out. No se imputan minutos. Revisiones registradas: {ov?.info.length ?? 0}.
          </p>
        </article>
      </section>
      <section className="grid gap-3 sm:grid-cols-2">
        <article className="rounded-lg border border-line bg-card p-4 text-sm">
          <h2 className="text-xl">Estado previo · {game.ha}</h2>
          <p className="mt-2 text-muted">
            Rating {home?.rating} · Off {home?.ortg} · Def {home?.drtg} · Pace {home?.pace} · Forma {home?.form} · {home?.w}-{home?.l} · {home?.source}
          </p>
        </article>
        <article className="rounded-lg border border-line bg-card p-4 text-sm">
          <h2 className="text-xl">Estado previo · {game.aa}</h2>
          <p className="mt-2 text-muted">
            Rating {away?.rating} · Off {away?.ortg} · Def {away?.drtg} · Pace {away?.pace} · Forma {away?.form} · {away?.w}-{away?.l} · {away?.source}
          </p>
        </article>
      </section>
      <Banner>
        Rest NOT VALIDATED (n≥25, tope ±1.5, residual no recuperado). Travel NOT VALIDATED (tope ±0.6, distancias no inventadas). Four Factors NOT VALIDATED: no entran al marcador. Mercado: información y auditoría, no modifica el motor.
      </Banner>
      <section className="rounded-lg border border-line bg-card p-4">
        <h2 className="text-xl">Predicción y freeze</h2>
        {pred ? (
          <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat k="Local" v={pred.projected_home} sub={`${pred.p_home}%`} />
            <Stat k="Visita" v={pred.projected_away} sub={`${pred.p_away}%`} />
            <Stat k="Pick" v={pred.pick} sub={`${pred.confidence} · ${pred.uncertainty}`} />
            <Stat k="Margen / total" v={pred.projected_margin} sub={`total ${pred.projected_total}`} />
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted">Sin predicción. El calendario no genera una sola.</p>
        )}
        <p className="mt-3 text-xs text-muted">
          {pred ? `${pred.engine_mark} · ${pred.model_version} · corte ${pred.cutoff} · snapshot v${pred.snapshot_version} · lookahead ${pred.lookahead_status}` : "LOCAL FALLBACK — NO SOURCE OF TRUTH"}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" disabled={!live} onClick={() => step(game.id)}>
            Siguiente paso
          </Button>
          <Button type="button" disabled={!live || status !== "PREDICCIÓN_GENERADA"} onClick={() => freeze(game.id)}>
            Congelar
          </Button>
          <Button type="button" disabled={!live || !!ov?.frozen} onClick={() => revise(game.id)}>
            Registrar revisión
          </Button>
        </div>
        {!live ? <p className="mt-2 text-sm text-muted">Controles apagados mientras la producción está cerrada.</p> : null}
      </section>
      <section className="rounded-lg border border-line bg-card p-4 text-sm">
        <h2 className="text-xl">Resultado</h2>
        {ov?.result ? (
          <p className="mt-2 text-muted">
            {ov.result.away_pts}-{ov.result.home_pts} · ganador {ov.result.winner} · fuente {ov.result.source}
          </p>
        ) : (
          <p className="mt-2 text-muted">NO DISPONIBLE. checkCompletedGames no inventa marcador.</p>
        )}
        {ov?.auditMath ? (
          <p className="mt-2 text-muted">
            Error puntos {ov.auditMath.pts_error} · margen {ov.auditMath.margin_error} · total {ov.auditMath.total_error} · {ov.auditMath.hit ? "acierto" : "error"} · Brier {ov.auditMath.brier} · log loss {ov.auditMath.logloss}
          </p>
        ) : null}
        {status === "EN_ESPERA_RESULTADO" && live ? (
          <form
            className="mt-3 flex flex-wrap gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const err = saveResult(game.id, Number(homePts), Number(awayPts), source);
              setMsg(err ?? "Resultado registrado.");
            }}
          >
            <input value={awayPts} onChange={(e) => setAwayPts(e.target.value)} placeholder="Puntos visita" className="h-11 w-32 rounded-lg border border-line bg-ink px-3 text-sm" />
            <input value={homePts} onChange={(e) => setHomePts(e.target.value)} placeholder="Puntos local" className="h-11 w-32 rounded-lg border border-line bg-ink px-3 text-sm" />
            <input value={source} onChange={(e) => setSource(e.target.value)} placeholder="Fuente oficial" className="h-11 min-w-40 flex-1 rounded-lg border border-line bg-ink px-3 text-sm" />
            <Button type="submit" tone="solid">
              Cargar resultado
            </Button>
          </form>
        ) : null}
        {msg ? <p className="mt-2 text-sm text-accent">{msg}</p> : null}
      </section>
      <section>
        <h2 className="text-xl">Audit log</h2>
        {log.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Sin acciones sobre este partido.</p>
        ) : (
          <TableWrap>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={th}>Hora</th>
                  <th className={th}>Acción</th>
                  <th className={th}>De</th>
                  <th className={th}>A</th>
                  <th className={th}>Resultado</th>
                </tr>
              </thead>
              <tbody>
                {log.map((a) => (
                  <tr key={a.id}>
                    <td className={td}>{a.timestamp.replace("T", " ").slice(0, 19)}</td>
                    <td className={td}>{a.action}</td>
                    <td className={td}>{a.from}</td>
                    <td className={td}>{a.to}</td>
                    <td className={td}>{a.result}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </section>
      <Foot />
    </div>
  );
}

export function Auditoria() {
  const report = useOps((s) => s.sandboxReport);
  const live = useOps((s) => s.realPredictionsEnabled);
  const scheduled = useOps((s) => s.schedulerEnabled);
  const m = METRICS_BUNDLE.metrics;
  const rows: [string, string, string][] = [
    ["Integridad histórica", "PASS", `${m.n} partidos. Accuracy ${m.acc}. No recalculada.`],
    ["Look-ahead", report?.lookaheadPass && report.lookaheadRejectedWinner ? "PASS" : "PENDIENTE", "Sandbox: limpio PASS, contaminado REJECTED."],
    ["Freeze duplicado", report?.secondFreeze === "REJECTED_ALREADY_FROZEN" ? "PASS" : "PENDIENTE", report?.secondFreeze ?? ""],
    ["Update no reescribe freeze", report?.frozenIntact ? "PASS" : "PENDIENTE", "La predicción congelada queda intacta."],
    ["Player impact", "NOT VALIDATED", "No entra al marcador. impact_applied = false."],
    ["Expected minutes", "NOT AVAILABLE", "No imputados."],
    ["Rest / travel", "NOT VALIDATED", "Topes documentados. Residual y distancias no recuperados."],
    ["Calendario 2026-27", "WARN", "1200 definidos. 30 pendientes. Pretemporada no incluida."],
    [
      "Producción",
      live ? "ABIERTA" : "CERRADA",
      live ? "Predicciones reales habilitadas." : "Predicciones reales apagadas.",
    ],
    [
      "Scheduler",
      scheduled ? "ON" : "OFF",
      scheduled
        ? "Automático con la página abierta. 3 h en general, 60 min en las últimas 6 h, 30 min en la ventana crítica y postpartido. Un estado por partido y por ciclo."
        : "Apagado. No toca partidos.",
    ],
    ["Sandbox", report?.purged ? "PASS" : "PENDIENTE", report?.note ?? ""],
  ];
  return (
    <div className="space-y-4">
      <h1 className="text-3xl">Auditoría</h1>
      <p className="text-sm text-muted">Controles del mismo motor. No es una comparación pública de versiones.</p>
      <TableWrap>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={th}>Control</th>
              <th className={th}>Estado</th>
              <th className={th}>Nota</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([a, b, c]) => (
              <tr key={a}>
                <td className={td}>{a}</td>
                <td className={td}>{b}</td>
                <td className={`${td} whitespace-normal`}>{c}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
      <Foot />
    </div>
  );
}

export function Sistema() {
  const state = useOps();
  const counts = productionCounts(state);
  const [arm, setArm] = useState(false);
  const report = state.sandboxReport;
  const flags = report
    ? [
        ["Ciclo", report.ran],
        ["Look-ahead limpio", report.lookaheadPass],
        ["Rechaza ganador", report.lookaheadRejectedWinner],
        ["Rechaza puntos", report.lookaheadRejectedPoints],
        ["Rechaza resultado", report.lookaheadRejectedResult],
        ["Rechaza posterior", report.lookaheadRejectedPost],
        ["Predicción", report.prediction],
        ["Freeze", report.freeze],
        ["Segundo freeze", report.secondFreeze === "REJECTED_ALREADY_FROZEN"],
        ["Update", report.update],
        ["Freeze intacto", report.frozenIntact],
        ["Persistencia", report.persist],
        ["Reinicio", report.restart],
        ["Aislamiento", report.isolation],
        ["Purgado", report.purged],
        ["Ratings reales intactos", report.ratingsUntouched],
        ["Predicciones reales", report.realPredictions === 0],
      ]
    : [];
  return (
    <div className="space-y-4">
      <h1 className="text-3xl">Sistema</h1>
      <Banner>
        LOCAL FALLBACK — NO SOURCE OF TRUTH. build_predicta.py y build_v11.py no están en el paquete. La matemática usada es la recuperada del motor embebido auditado, sin parámetros nuevos. Four Factors, rest, travel y ventanas de eficiencia no se inventan: quedan NOT VALIDATED y fuera del marcador. Tras el partido solo se actualiza el rating con builderUpdate.
      </Banner>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat k="Predicciones" v={counts.predictions} />
        <Stat k="Congeladas" v={counts.frozen} />
        <Stat k="Finalizados" v={counts.finals} />
        <Stat k="Actualizados" v={counts.updates} />
      </div>
      <section className="rounded-lg border border-line bg-card p-4">
        <h2 className="text-xl">Activación manual</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Producción {state.realPredictionsEnabled ? "abierta" : "cerrada"}. Scheduler {state.schedulerEnabled ? "encendido y automático" : "apagado"}. Cada ciclo avanza un solo estado por partido, y solo si ese día ya es el día operativo.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {state.realPredictionsEnabled ? (
            <Button type="button" tone="solid" onClick={() => state.enableProduction(false)}>
              Cerrar producción
            </Button>
          ) : arm ? (
            <Button type="button" tone="solid" onClick={() => state.enableProduction(true)}>
              Confirmar apertura
            </Button>
          ) : (
            <Button type="button" onClick={() => setArm(true)}>
              Preparar apertura
            </Button>
          )}
          <Button type="button" disabled={!state.realPredictionsEnabled} onClick={() => state.enableScheduler(!state.schedulerEnabled)}>
            {state.schedulerEnabled ? "Apagar scheduler" : "Encender scheduler"}
          </Button>
        </div>
      </section>
      <section>
        <h2 className="text-xl">Sandbox descartado</h2>
        <p className="mt-2 text-sm text-muted">{report?.note ?? "Ejecutando…"}</p>
        <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
          {flags.map(([k, ok]) => (
            <div key={String(k)} className="rounded-lg border border-line bg-card px-3 py-2 text-sm">
              <span className={ok ? "text-good" : "text-bad"}>{ok ? "PASS" : "FAIL"}</span>
              <span className="ml-2 text-muted">{k}</span>
            </div>
          ))}
        </div>
      </section>
      <Foot />
    </div>
  );
}

export function Scheduler() {
  const enabled = useOps((s) => s.schedulerEnabled);
  const live = useOps((s) => s.realPredictionsEnabled);
  const log = useOps((s) => s.schedulerLog);
  const overlays = useOps((s) => s.overlays);
  const tick = useOps((s) => s.tick);
  const waiting = checkCompletedGames({ ...useOps.getState(), overlays });
  return (
    <div className="space-y-4">
      <h1 className="text-3xl">Scheduler</h1>
      <Banner>
        {enabled
          ? "Scheduler encendido. Con la página abierta revisa solo el día operativo (hora Este) y avanza cada partido un estado: cada 3 horas, cada 60 minutos en las últimas 6 horas, y cada 30 minutos en los últimos 90 minutos o mientras falte el resultado."
          : "Scheduler apagado. No corre solo."}{" "}
        No recalcula 2025-26 ni reabre un freeze. No adelanta partidos de otro día. Predicciones reales: {live ? "abiertas" : "cerradas"}.
      </Banner>
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat k="Scheduler" v={enabled ? "ON" : "OFF"} />
        <Stat k="Predicciones reales" v={live ? "ON" : "OFF"} />
        <Stat k="Resultados en espera" v={waiting.length} sub="fuente NOT AVAILABLE" />
      </div>
      <Button type="button" tone="solid" onClick={() => tick(true)}>
        Ejecutar tick ahora
      </Button>
      <p className="text-sm text-muted">
        {enabled ? "El ciclo automático ya corre. Este botón fuerza uno ahora." : "Apagado: el tick solo deja constancia y no toca partidos."}
      </p>
      <TableWrap>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={th}>Hora</th>
              <th className={th}>Nota</th>
            </tr>
          </thead>
          <tbody>
            {log.length === 0 ? (
              <tr>
                <td className={td} colSpan={2}>
                  Sin ticks.
                </td>
              </tr>
            ) : (
              [...log].reverse().slice(0, 20).map((row, i) => (
                <tr key={`${row.timestamp}-${i}`}>
                  <td className={td}>{row.timestamp.replace("T", " ").slice(0, 19)}</td>
                  <td className={`${td} whitespace-normal`}>{row.note}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableWrap>
      <Foot />
    </div>
  );
}
