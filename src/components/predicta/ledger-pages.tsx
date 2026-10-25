import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Banner, Foot, Pager, Stat, TableWrap, td, th } from "@/components/predicta/bits";
import { METRICS_BUNDLE, RANKING } from "@/lib/predicta/catalog";
import { FROZEN_V11 } from "@/lib/predicta/parameters";
import { useOps } from "@/lib/predicta/store";

interface HistGame {
  date: string;
  aa: string;
  ha: string;
  ot: string;
  proj_home: number;
  proj_away: number;
  proj_total: number;
  proj_margin: number;
  p_home: number;
  p_away: number;
  pick: string;
  p_pick: number;
  conf: string;
  unc: string;
  home_pts: number;
  away_pts: number;
  winner: string;
  hit: boolean;
  players_out_home: string[];
  players_out_away: string[];
  players_questionable_home: string[];
  players_questionable_away: string[];
  availability_timestamp: string;
  availability_unverified: boolean;
  r_home: number;
  r_away: number;
}

interface PlayerRow {
  date: string;
  team: string;
  player: string;
  status: string;
  reason: string;
}

const CHART = { accent: "#d6a15a", bone: "#e8eadf", line: "#2e3128", muted: "#9aa392" };

export function gameKey(g: { date: string; aa: string; ha: string }) {
  return `${g.date}_${g.aa}_${g.ha}`;
}

export function Numeros() {
  const m = METRICS_BUNDLE.metrics;
  const cuts = [
    ["Todos", m],
    ["Pick local", METRICS_BUNDLE.cuts.local],
    ["Pick visita", METRICS_BUNDLE.cuts.visita],
    ["Prórroga", METRICS_BUNDLE.cuts.prorroga],
    ["Confianza fuerte", METRICS_BUNDLE.cuts.fuerte],
    ["Confianza neutra", METRICS_BUNDLE.cuts.neutra],
  ] as const;
  return (
    <div className="space-y-4">
      <h1 className="text-3xl">Números</h1>
      <p className="text-sm leading-relaxed text-muted">
        2025-26 es el histórico congelado. No se recalcula. 2026-27 todavía no tiene partidos jugados en este sistema: no hay accuracy operativa.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat k="Analizados" v={m.n} sub={`${m.correct} aciertos · ${m.n - m.correct} errores`} />
        <Stat k="Accuracy" v={`${m.acc}%`} sub={`local ${METRICS_BUNDLE.cuts.local.acc}% · visita ${METRICS_BUNDLE.cuts.visita.acc}%`} />
        <Stat k="Brier" v={m.brier} sub={`log loss ${m.logloss}`} />
        <Stat k="MAE" v={m.mae_pts} sub={`margen ${m.mae_margin} · total ${m.mae_total}`} />
      </div>
      <Banner>
        El registro v1.1 guarda log loss {FROZEN_V11.logloss}. El prompt maestro lo cita como 0.6030, la misma cifra a tres decimales. No se reescribió.
      </Banner>
      <TableWrap>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={th}>Corte</th>
              <th className={th}>N</th>
              <th className={th}>Accuracy</th>
              <th className={th}>Brier</th>
              <th className={th}>Log loss</th>
            </tr>
          </thead>
          <tbody>
            {cuts.map(([label, row]) => (
              <tr key={label}>
                <td className={td}>{label}</td>
                <td className={td}>{row.n}</td>
                <td className={td}>{row.acc}%</td>
                <td className={td}>{row.brier}</td>
                <td className={td}>{row.logloss}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
      <h2 className="text-2xl">Calibración</h2>
      <div className="h-64 rounded-lg border border-line bg-card p-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={METRICS_BUNDLE.cal}>
            <CartesianGrid stroke={CHART.line} vertical={false} />
            <XAxis dataKey="label" stroke={CHART.muted} fontSize={12} />
            <YAxis stroke={CHART.muted} fontSize={12} />
            <Tooltip contentStyle={{ background: "#141612", border: "1px solid #2e3128", color: "#e8eadf" }} />
            <Bar dataKey="p" name="Probabilidad" fill={CHART.accent} />
            <Bar dataKey="real" name="Real" fill={CHART.bone} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <HistTable />
      <Foot />
    </div>
  );
}

function HistTable() {
  const [games, setGames] = useState<HistGame[] | null>(null);
  const [q, setQ] = useState("");
  const [hit, setHit] = useState("");
  const [page, setPage] = useState(0);
  useEffect(() => {
    let on = true;
    import("@/data/games-2025.json").then((mod) => {
      if (on) setGames(mod.default as HistGame[]);
    });
    return () => {
      on = false;
    };
  }, []);
  const rows = useMemo(() => {
    if (!games) return [];
    return games.filter((g) => {
      if (q && !`${g.date} ${g.aa} ${g.ha}`.toLowerCase().includes(q.trim().toLowerCase())) return false;
      if (hit === "1" && !g.hit) return false;
      if (hit === "0" && g.hit) return false;
      return true;
    });
  }, [games, q, hit]);
  if (!games) return <p className="text-sm text-muted">Cargando histórico congelado…</p>;
  const pages = Math.max(1, Math.ceil(rows.length / 40));
  const safe = Math.min(page, pages - 1);
  const slice = rows.slice(safe * 40, safe * 40 + 40);
  return (
    <section className="space-y-3">
      <h2 className="text-2xl">2025-26 congelada</h2>
      <div className="flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => {
            setPage(0);
            setQ(e.target.value);
          }}
          placeholder="Equipo o fecha"
          className="h-11 rounded-lg border border-line bg-card px-3 text-sm"
        />
        <select
          value={hit}
          onChange={(e) => {
            setPage(0);
            setHit(e.target.value);
          }}
          className="h-11 rounded-lg border border-line bg-card px-3 text-sm"
        >
          <option value="">Acierto o error</option>
          <option value="1">Acierto</option>
          <option value="0">Error</option>
        </select>
      </div>
      <Pager page={safe} pages={pages} total={rows.length} onPrev={() => setPage((p) => Math.max(0, p - 1))} onNext={() => setPage((p) => p + 1)} />
      <TableWrap>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={th}>Fecha</th>
              <th className={th}>Visitante</th>
              <th className={th}>Local</th>
              <th className={th}>Pick</th>
              <th className={th}>Proyección</th>
              <th className={th}>Real</th>
              <th className={th}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {slice.map((g) => (
              <tr key={gameKey(g)}>
                <td className={td}>
                  <Link to="/historico/$key" params={{ key: gameKey(g) }} className="underline">
                    {g.date}
                  </Link>
                </td>
                <td className={td}>{g.aa}</td>
                <td className={td}>{g.ha}</td>
                <td className={td}>{g.pick}</td>
                <td className={td}>
                  {g.proj_away}-{g.proj_home}
                </td>
                <td className={td}>
                  {g.away_pts}-{g.home_pts}
                  {g.ot ? ` ${g.ot}` : ""}
                </td>
                <td className={g.hit ? `${td} text-good` : `${td} text-bad`}>{g.hit ? "Acierto" : "Error"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
    </section>
  );
}

export function Historico({ id }: { id: string }) {
  const [game, setGame] = useState<HistGame | null | undefined>(undefined);
  useEffect(() => {
    import("@/data/games-2025.json").then((mod) => {
      const rows = mod.default as HistGame[];
      setGame(rows.find((g) => gameKey(g) === id) ?? null);
    });
  }, [id]);
  if (game === undefined) return <p className="text-sm text-muted">Cargando partido histórico…</p>;
  if (!game) return <Banner tone="bad">Ese partido no está en la base 2025-26.</Banner>;
  return (
    <div className="space-y-4">
      <p className="text-xs tracking-widest text-muted uppercase">Histórico congelado · no operativo</p>
      <h1 className="text-3xl">
        {game.aa} @ {game.ha}
      </h1>
      <p className="text-sm text-muted">
        {game.date} · hora histórica no disponible · pick {game.pick} {game.p_pick}% · {game.conf} · {game.unc}
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat k="Proyección" v={`${game.proj_away}-${game.proj_home}`} sub={`margen ${game.proj_margin} · total ${game.proj_total}`} />
        <Stat k="Real" v={`${game.away_pts}-${game.home_pts}`} sub={game.hit ? "Acierto" : "Error"} />
        <Stat k="Rating previo" v={`${game.r_away} / ${game.r_home}`} sub="visita / local" />
      </div>
      <Banner>Disponibilidad informativa. No entró al marcador. Timestamp {game.availability_timestamp || "no verificado"}.</Banner>
      <div className="grid gap-3 sm:grid-cols-2">
        <article className="rounded-lg border border-line bg-card p-4 text-sm text-muted">
          <h2 className="text-xl text-bone">Out local</h2>
          <p className="mt-2">{game.players_out_home.join(", ") || "Ninguno en el registro"}</p>
          <p className="mt-2">Questionable: {game.players_questionable_home.join(", ") || "ninguno"}</p>
        </article>
        <article className="rounded-lg border border-line bg-card p-4 text-sm text-muted">
          <h2 className="text-xl text-bone">Out visita</h2>
          <p className="mt-2">{game.players_out_away.join(", ") || "Ninguno en el registro"}</p>
          <p className="mt-2">Questionable: {game.players_questionable_away.join(", ") || "ninguno"}</p>
        </article>
      </div>
      <Foot />
    </div>
  );
}

export function Equipos() {
  const ratings = useOps((s) => s.ratings);
  return (
    <div className="space-y-4">
      <h1 className="text-3xl">Equipos</h1>
      <p className="text-sm text-muted">Cierre 2025-26. No es un ranking externo. El operativo 2026-27 arranca 0-0 con ese rating y solo entra al motor cuando el partido se procesa.</p>
      <TableWrap>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={th}></th>
              <th className={th}>Equipo</th>
              <th className={th}>W</th>
              <th className={th}>L</th>
              <th className={th}>Rating</th>
              <th className={th}>Off</th>
              <th className={th}>Def</th>
              <th className={th}>Net</th>
              <th className={th}>Pace</th>
              <th className={th}>Forma</th>
              <th className={th}>Ops 26-27</th>
            </tr>
          </thead>
          <tbody>
            {RANKING.map((t, i) => {
              const live = ratings[t.abbr];
              return (
                <tr key={t.abbr}>
                  <td className={td}>{i + 1}</td>
                  <td className={td}>{t.team}</td>
                  <td className={td}>{t.w}</td>
                  <td className={td}>{t.l}</td>
                  <td className={td}>{t.rating}</td>
                  <td className={td}>{t.ortg}</td>
                  <td className={td}>{t.drtg}</td>
                  <td className={td}>{t.nrtg}</td>
                  <td className={td}>{t.pace}</td>
                  <td className={td}>{t.form}</td>
                  <td className={td}>{live ? `${live.w}-${live.l} · ${live.rating}` : "—"}</td>
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

export function Jugadores() {
  const layer = METRICS_BUNDLE.layer;
  const [rows, setRows] = useState<PlayerRow[] | null>(null);
  const [q, setQ] = useState("");
  useEffect(() => {
    import("@/data/player-log.json").then((mod) => setRows(mod.default as PlayerRow[]));
  }, []);
  const shown = (rows ?? []).filter((r) => !q || `${r.player} ${r.team} ${r.date}`.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 80);
  return (
    <div className="space-y-4">
      <h1 className="text-3xl">Jugadores</h1>
      <Banner>Capa de información. No entra al motor. Questionable no es out. Minutos e impacto = NO DISPONIBLE, no cero.</Banner>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat k="Con reporte" v={layer.verified_games} sub="de 1230 · falta 2025-12-11" />
        <Stat k="Cobertura" v={`${layer.coverage}%`} sub={`${layer.players} jugadores`} />
        <Stat k="Questionable" v={layer.questionable} sub="estado original" />
        <Stat k="Impacto" v="NOT VALIDATED" sub="impact_applied = false" />
      </div>
      <TableWrap>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={th}>Estado</th>
              <th className={th}>Filas</th>
              <th className={th}>Uso en motor</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={td}>OUT</td>
              <td className={td}>{layer.out}</td>
              <td className={td}>No</td>
            </tr>
            <tr>
              <td className={td}>QUESTIONABLE</td>
              <td className={td}>{layer.questionable}</td>
              <td className={td}>No</td>
            </tr>
            <tr>
              <td className={td}>DOUBTFUL</td>
              <td className={td}>{layer.doubtful}</td>
              <td className={td}>No</td>
            </tr>
            <tr>
              <td className={td}>PROBABLE</td>
              <td className={td}>{layer.probable}</td>
              <td className={td}>No</td>
            </tr>
            <tr>
              <td className={td}>Minutos / returning</td>
              <td className={td}>NOT AVAILABLE</td>
              <td className={td}>No</td>
            </tr>
          </tbody>
        </table>
      </TableWrap>
      <p className="text-sm text-muted">Índice con motivo entregado en el registro: {rows?.length ?? "…"} filas. Los agregados de arriba son el conteo auditado, no una lista inventada.</p>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Jugador o equipo" className="h-11 rounded-lg border border-line bg-card px-3 text-sm" />
      <TableWrap>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={th}>Fecha</th>
              <th className={th}>Equipo</th>
              <th className={th}>Jugador</th>
              <th className={th}>Estado</th>
              <th className={th}>Motivo</th>
              <th className={th}>Min</th>
              <th className={th}>Impacto</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={`${r.date}-${r.team}-${r.player}-${r.status}`}>
                <td className={td}>{r.date}</td>
                <td className={td}>{r.team}</td>
                <td className={td}>{r.player}</td>
                <td className={td}>{r.status}</td>
                <td className={`${td} whitespace-normal`}>{r.reason}</td>
                <td className={td}>NO DISPONIBLE</td>
                <td className={td}>NO DISPONIBLE</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
      <Foot />
    </div>
  );
}
