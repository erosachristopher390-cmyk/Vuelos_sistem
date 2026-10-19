"use client";

import { useState } from "react";
import { useAeropuerto } from "../hooks/useAeropuerto";
import type { EstadoPista, EventoLog, Vuelo, Prioridad } from "../lib/types";

// ─── Colores y utilidades ──────────────────────────────────

function prioridadColor(p: string): string {
  switch (p) {
    case "Alta": return "text-red-400 bg-red-950/40 border-red-700";
    case "Baja": return "text-blue-400 bg-blue-950/40 border-blue-700";
    default: return "text-emerald-400 bg-emerald-950/40 border-emerald-700";
  }
}

function prioridadBadge(p: string): string {
  switch (p) {
    case "Alta": return "bg-red-500/20 text-red-300 border border-red-500/30";
    case "Baja": return "bg-blue-500/20 text-blue-300 border border-blue-500/30";
    default: return "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30";
  }
}

function eventoColor(tipo: EventoLog["tipo"]): string {
  switch (tipo) {
    case "llegada": return "border-l-sky-400";
    case "asignacion": return "border-l-emerald-400";
    case "despegue": return "border-l-amber-400";
    case "espera": return "border-l-orange-400";
    case "desactivacion": return "border-l-red-400";
    case "activacion": return "border-l-green-400";
    case "reasignacion": return "border-l-purple-400";
    case "round-robin": return "border-l-cyan-400";
    default: return "border-l-gray-400";
  }
}

function eventoIcon(tipo: EventoLog["tipo"]): string {
  switch (tipo) {
    case "llegada": return "✈️";
    case "asignacion": return "📌";
    case "despegue": return "🛫";
    case "espera": return "⏳";
    case "desactivacion": return "🚫";
    case "activacion": return "✅";
    case "reasignacion": return "🔄";
    case "round-robin": return "🔁";
    default: return "📋";
  }
}

// ─── Componente: Configuración Inicial ──────────────────────

function ConfigPanel({ onIniciar }: { onIniciar: (p: number, c: number, v: number) => void }) {
  const [pistas, setPistas] = useState(3);
  const [capacidad, setCapacidad] = useState(3);
  const [vuelos, setVuelos] = useState(15);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 p-4">
      <div className="bg-gray-900/80 backdrop-blur-md border border-gray-700/50 rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🛬</div>
          <h1 className="text-3xl font-bold text-white mb-2">Sistema de Vuelos</h1>
          <p className="text-gray-400 text-sm">Colas Circulares — Gestión de Pistas</p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Número de pistas
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={pistas}
              onChange={(e) => setPistas(Math.max(1, Math.min(10, +e.target.value)))}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Capacidad por pista (cola circular)
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={capacidad}
              onChange={(e) => setCapacidad(Math.max(1, Math.min(20, +e.target.value)))}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Total de vuelos iniciales
            </label>
            <input
              type="number"
              min={1}
              max={50}
              value={vuelos}
              onChange={(e) => setVuelos(Math.max(1, Math.min(50, +e.target.value)))}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all outline-none"
            />
          </div>
          <button
            onClick={() => onIniciar(pistas, capacidad, vuelos)}
            className="w-full bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-lg shadow-sky-900/30 hover:shadow-sky-800/40 cursor-pointer"
          >
            🚀 Iniciar Simulación
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Componente: Celda de Cola Circular ─────────────────────

function CeldaColaVisual({
  vuelo,
  indice,
  esFrente,
  esFinal,
}: {
  vuelo: Vuelo | null;
  indice: number;
  esFrente: boolean;
  esFinal: boolean;
}) {
  let border = "border-gray-700";
  let bg = "bg-gray-800/50";
  if (vuelo) {
    bg = "bg-sky-900/40";
    border = "border-sky-600/50";
  }
  if (esFrente && esFinal && vuelo) {
    border = "border-amber-400 ring-1 ring-amber-400/30";
  } else if (esFrente) {
    border = "border-green-400 ring-1 ring-green-400/30";
  } else if (esFinal && vuelo) {
    border = "border-orange-400 ring-1 ring-orange-400/30";
  }

  return (
    <div className={`relative flex flex-col items-center min-w-[70px]`}>
      <span className="text-[10px] text-gray-500 mb-1">idx {indice}</span>
      <div
        className={`${bg} ${border} border rounded-lg px-2.5 py-2 text-center transition-all duration-300`}
      >
        {vuelo ? (
          <div>
            <div className="text-xs font-bold text-white">{vuelo.codigo}</div>
            <div className="text-[10px] text-gray-400">{vuelo.destino}</div>
          </div>
        ) : (
          <div className="text-xs text-gray-600">---</div>
        )}
      </div>
      <div className="flex gap-1 mt-1">
        {esFrente && <span className="text-[9px] px-1 rounded bg-green-800/60 text-green-300">F</span>}
        {esFinal && vuelo && <span className="text-[9px] px-1 rounded bg-orange-800/60 text-orange-300">R</span>}
      </div>
    </div>
  );
}

// ─── Componente: Tarjeta de Pista ───────────────────────────

function PistaCard({
  pista,
  onDespegar,
  onToggle,
}: {
  pista: EstadoPista;
  onDespegar: () => void;
  onToggle: () => void;
}) {
  const ocupacion = pista.cola.cantidad;
  const cap = pista.cola.capacidad;
  const porcent = cap > 0 ? (ocupacion / cap) * 100 : 0;

  let barColor = "bg-emerald-500";
  if (porcent >= 80) barColor = "bg-red-500";
  else if (porcent >= 50) barColor = "bg-amber-500";

  return (
    <div
      className={`rounded-xl border p-4 transition-all duration-300 ${
        pista.activa
          ? "bg-gray-900/60 border-gray-700/60 hover:border-gray-600"
          : "bg-red-950/20 border-red-800/40 opacity-75"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${pista.activa ? "bg-green-400 animate-pulse" : "bg-red-500"}`} />
          <h3 className="text-lg font-bold text-white">{pista.nombre}</h3>
          {!pista.activa && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-800/60 text-red-300 font-medium">
              INACTIVA
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onToggle}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              pista.activa
                ? "bg-red-800/40 hover:bg-red-700/60 text-red-300 border border-red-700/50"
                : "bg-green-800/40 hover:bg-green-700/60 text-green-300 border border-green-700/50"
            }`}
          >
            {pista.activa ? "🚫 Desactivar" : "✅ Activar"}
          </button>
          <button
            onClick={onDespegar}
            disabled={!pista.activa || pista.cola.estaVacia}
            className="text-xs px-3 py-1.5 rounded-lg font-medium bg-amber-800/40 hover:bg-amber-700/60 text-amber-300 border border-amber-700/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            🛫 Despegar
          </button>
        </div>
      </div>

      {/* Barra de ocupación */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Ocupación</span>
          <span>{ocupacion}/{cap}</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full ${barColor} rounded-full transition-all duration-500`}
            style={{ width: `${porcent}%` }}
          />
        </div>
      </div>

      {/* Cola circular visual */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
        {pista.cola.celdas.map((celda) => (
          <CeldaColaVisual
            key={celda.indice}
            vuelo={celda.vuelo}
            indice={celda.indice}
            esFrente={celda.esFrente}
            esFinal={celda.esFinal}
          />
        ))}
      </div>

      {/* Info técnica */}
      <div className="mt-2 flex gap-3 text-[10px] text-gray-500">
        <span>Frente: {pista.cola.frente}</span>
        <span>Final: {pista.cola.final < 0 ? "—" : pista.cola.final}</span>
        <span>FIFO: {pista.cola.ordenFIFO.length > 0 ? pista.cola.ordenFIFO.join(" → ") : "(vacía)"}</span>
      </div>

      {/* Despegados */}
      {pista.despegados.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-800">
          <span className="text-[10px] text-gray-500">
            Despegados ({pista.despegados.length}): {pista.despegados.map((v) => v.codigo).join(", ")}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Componente: Lista de espera ────────────────────────────

function ListaEspera({ vuelos }: { vuelos: Vuelo[] }) {
  return (
    <div className="bg-gray-900/60 border border-gray-700/60 rounded-xl p-4">
      <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
        ⏳ Lista de Espera General
        <span className="text-sm font-normal text-gray-400">
          ({vuelos.length} vuelos)
        </span>
      </h3>
      {vuelos.length === 0 ? (
        <p className="text-sm text-gray-500 italic">Sin vuelos en espera</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {vuelos.map((v, i) => (
            <div
              key={v.codigo}
              className={`${prioridadColor(v.prioridad)} border rounded-lg px-3 py-1.5 text-xs`}
            >
              <span className="font-bold">{i + 1}.</span> {v.codigo}
              <span className="opacity-60 ml-1">→ {v.destino}</span>
              <span className={`ml-1.5 inline-block px-1 rounded text-[9px] ${prioridadBadge(v.prioridad)}`}>
                {v.prioridad}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Componente: Panel de Prioridad de Pistas ───────────────

function PrioridadPanel({
  prioridades,
  totalPistas,
  onUpdate,
}: {
  prioridades: number[];
  totalPistas: number;
  onUpdate: (orden: number[]) => void;
}) {
  const [orden, setOrden] = useState(prioridades);

  const moverArriba = (idx: number) => {
    if (idx === 0) return;
    const nuevo = [...orden];
    [nuevo[idx - 1], nuevo[idx]] = [nuevo[idx], nuevo[idx - 1]];
    setOrden(nuevo);
    onUpdate(nuevo);
  };

  const moverAbajo = (idx: number) => {
    if (idx >= orden.length - 1) return;
    const nuevo = [...orden];
    [nuevo[idx], nuevo[idx + 1]] = [nuevo[idx + 1], nuevo[idx]];
    setOrden(nuevo);
    onUpdate(nuevo);
  };

  return (
    <div className="bg-gray-900/60 border border-gray-700/60 rounded-xl p-4">
      <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
        🏆 Prioridad de Pistas
      </h3>
      <p className="text-xs text-gray-500 mb-3">
        Arrastra las pistas para definir el orden de preferencia en el desempate Round-Robin.
      </p>
      <div className="space-y-1.5">
        {orden.map((num, idx) => (
          <div
            key={num}
            className="flex items-center gap-2 bg-gray-800/60 border border-gray-700/50 rounded-lg px-3 py-2"
          >
            <span className="text-xs font-bold text-gray-400 w-5">#{idx + 1}</span>
            <span className="text-sm text-white flex-1">Pista {num}</span>
            <button
              onClick={() => moverArriba(idx)}
              disabled={idx === 0}
              className="text-xs px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed transition-all"
            >
              ▲
            </button>
            <button
              onClick={() => moverAbajo(idx)}
              disabled={idx >= orden.length - 1}
              className="text-xs px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed transition-all"
            >
              ▼
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Componente: Panel de Agregar Vuelo Manual ──────────────

function AgregarVueloPanel({
  onAgregar,
  onAleatorio,
}: {
  onAgregar: (vuelo: Vuelo) => void;
  onAleatorio: () => void;
}) {
  const [codigo, setCodigo] = useState("");
  const [destino, setDestino] = useState("Cancún");
  const [prioridad, setPrioridad] = useState<Prioridad>("Normal");

  const destinos = [
    "Cancún", "Guadalajara", "Monterrey", "CDMX", "Tijuana",
    "Mérida", "Oaxaca", "Puebla", "Veracruz", "Chihuahua",
    "Madrid", "Bogotá", "Miami", "Houston", "Toronto",
  ];

  const handleSubmit = () => {
    if (!codigo.trim()) return;
    onAgregar({
      codigo: codigo.trim().toUpperCase(),
      destino,
      horaLlegada: Date.now(),
      prioridad,
    });
    setCodigo("");
  };

  return (
    <div className="bg-gray-900/60 border border-gray-700/60 rounded-xl p-4">
      <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
        ✈️ Agregar Vuelo
      </h3>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Código</label>
          <input
            type="text"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="MX200"
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Destino</label>
          <select
            value={destino}
            onChange={(e) => setDestino(e.target.value)}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-sky-500"
          >
            {destinos.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="mb-3">
        <label className="block text-xs text-gray-400 mb-1">Prioridad</label>
        <div className="flex gap-2">
          {(["Alta", "Normal", "Baja"] as Prioridad[]).map((p) => (
            <button
              key={p}
              onClick={() => setPrioridad(p)}
              className={`flex-1 text-xs py-2 rounded-lg border transition-all cursor-pointer ${
                prioridad === p
                  ? prioridadColor(p) + " font-bold"
                  : "bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={!codigo.trim()}
          className="flex-1 bg-sky-700 hover:bg-sky-600 text-white text-sm py-2 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          ➕ Agregar Manual
        </button>
        <button
          onClick={onAleatorio}
          className="flex-1 bg-purple-800/60 hover:bg-purple-700/60 text-purple-300 text-sm py-2 rounded-lg border border-purple-700/50 transition-all cursor-pointer"
        >
          🎲 Aleatorio
        </button>
      </div>
    </div>
  );
}

// ─── Componente: Estadísticas ───────────────────────────────

function EstadisticasPanel({ stats }: { stats: import("../lib/types").Estadisticas }) {
  return (
    <div className="bg-gray-900/60 border border-gray-700/60 rounded-xl p-4">
      <h3 className="text-lg font-bold text-white mb-3">📊 Estadísticas</h3>
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Recibidos" value={stats.totalRecibidos} icon="✈️" />
        <Stat label="Despegados" value={stats.totalDespegados} icon="🛫" />
        <Stat label="En pistas" value={stats.totalEnPistas} icon="🛬" />
        <Stat label="En espera" value={stats.totalEnEspera} icon="⏳" />
        <Stat label="Pistas activas" value={stats.pistasActivas} icon="✅" />
        <Stat label="Pistas inactivas" value={stats.pistasInactivas} icon="🚫" />
      </div>
      <div className="mt-3 pt-3 border-t border-gray-800">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Completado</span>
          <span>{stats.porcentajeCompletado.toFixed(1)}%</span>
        </div>
        <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-sky-500 rounded-full transition-all duration-500"
            style={{ width: `${stats.porcentajeCompletado}%` }}
          />
        </div>
      </div>
      <div className="mt-3 space-y-1">
        {stats.despeguesPorPista.map((d) => (
          <div key={d.nombre} className="flex justify-between text-xs">
            <span className="text-gray-400">{d.nombre}</span>
            <span className="text-white font-medium">{d.despegues} despegues</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="bg-gray-800/50 rounded-lg px-3 py-2.5 text-center">
      <div className="text-lg">{icon}</div>
      <div className="text-xl font-bold text-white">{value}</div>
      <div className="text-[10px] text-gray-400">{label}</div>
    </div>
  );
}

// ─── Componente: Log de eventos ─────────────────────────────

function EventLog({ eventos }: { eventos: EventoLog[] }) {
  const ultimos = eventos.slice(-30).reverse();
  return (
    <div className="bg-gray-900/60 border border-gray-700/60 rounded-xl p-4 max-h-[400px] overflow-y-auto">
      <h3 className="text-lg font-bold text-white mb-3 sticky top-0 bg-gray-900/90 py-1">
        📋 Log de Eventos ({eventos.length})
      </h3>
      {ultimos.length === 0 ? (
        <p className="text-sm text-gray-500 italic">Sin eventos</p>
      ) : (
        <div className="space-y-1.5">
          {ultimos.map((ev) => (
            <div
              key={ev.id}
              className={`border-l-2 ${eventoColor(ev.tipo)} pl-3 py-1`}
            >
              <div className="flex items-start gap-2">
                <span className="text-xs">{eventoIcon(ev.tipo)}</span>
                <div>
                  <p className="text-xs text-gray-200">{ev.mensaje}</p>
                  {ev.detalle && (
                    <p className="text-[10px] text-gray-500 mt-0.5">{ev.detalle}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Componente: Vuelos Despegados ──────────────────────────

function VuelosDespegados({ vuelos }: { vuelos: Vuelo[] }) {
  if (vuelos.length === 0) return null;
  return (
    <div className="bg-gray-900/60 border border-gray-700/60 rounded-xl p-4">
      <h3 className="text-lg font-bold text-white mb-3">
        🛫 Vuelos Despegados ({vuelos.length})
      </h3>
      <div className="flex flex-wrap gap-1.5">
        {vuelos.map((v) => (
          <span
            key={v.codigo}
            className="text-xs px-2 py-1 rounded bg-amber-900/30 border border-amber-700/30 text-amber-300"
          >
            {v.codigo} → {v.destino}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Componente: Round-Robin Info ────────────────────────────

function RoundRobinInfo({ index }: { index: number }) {
  return (
    <div className="bg-cyan-950/30 border border-cyan-700/40 rounded-xl p-4">
      <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
        🔁 Desempate Round-Robin
      </h3>
      <p className="text-xs text-gray-400 mt-1">
        Cuando dos o más pistas tienen la misma cantidad de vuelos, el sistema usa Round-Robin
        para distribuir equitativamente. No se favorece siempre a la misma pista.
      </p>
      <div className="mt-2 text-xs text-cyan-400">
        Índice actual: <span className="font-bold">{index}</span>
      </div>
    </div>
  );
}

// ─── Página Principal ───────────────────────────────────────

export default function Dashboard() {
  const airport = useAeropuerto();
  const [tab, setTab] = useState<"pistas" | "eventos" | "stats">("pistas");

  if (!airport.iniciado || !airport.estado || !airport.estadisticas) {
    return <ConfigPanel onIniciar={(p, c, v) => airport.iniciar(p, c, v)} />;
  }

  const { estado, estadisticas } = airport;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 text-white">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🛬</span>
            <div>
              <h1 className="text-lg font-bold">Sistema de Gestión de Vuelos</h1>
              <p className="text-[10px] text-gray-500">
                {airport.config?.pistas} pistas · {airport.config?.capacidad} cap. · Round-Robin activo
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => airport.despacharAutomatico()}
              disabled={!estado.pistas.some((p) => p.activa && !p.cola.estaVacia)}
              className="text-xs px-4 py-2 rounded-lg bg-amber-700/60 hover:bg-amber-600/60 text-amber-200 border border-amber-600/50 transition-all disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
            >
              ⚡ Auto-Despegue
            </button>
            <button
              onClick={() => airport.procesarEspera()}
              disabled={estado.listaEspera.length === 0}
              className="text-xs px-4 py-2 rounded-lg bg-purple-700/60 hover:bg-purple-600/60 text-purple-200 border border-purple-600/50 transition-all disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
            >
              📤 Procesar Espera
            </button>
            <button
              onClick={() => airport.resetear()}
              className="text-xs px-4 py-2 rounded-lg bg-gray-700/60 hover:bg-gray-600/60 text-gray-300 border border-gray-600/50 transition-all cursor-pointer"
            >
              🔄 Reiniciar
            </button>
          </div>
        </div>
      </header>

      {/* ── Tabs ───────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 pt-4">
        <div className="flex gap-1 bg-gray-900/60 rounded-lg p-1 w-fit mb-4">
          {([
            ["pistas", "🛤️ Pistas"],
            ["eventos", "📋 Eventos"],
            ["stats", "📊 Estadísticas"],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`text-sm px-4 py-2 rounded-md transition-all cursor-pointer ${
                tab === key
                  ? "bg-sky-700 text-white shadow"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        {tab === "pistas" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Columna principal: Pistas */}
            <div className="lg:col-span-2 space-y-4">
              {estado.pistas.map((pista) => (
                <PistaCard
                  key={pista.numero}
                  pista={pista}
                  onDespegar={() => airport.despacharVuelo(pista.numero)}
                  onToggle={() =>
                    pista.activa
                      ? airport.desactivarPista(pista.numero)
                      : airport.activarPista(pista.numero)
                  }
                />
              ))}

              <ListaEspera vuelos={estado.listaEspera} />
              <VuelosDespegados vuelos={estado.registroDespegados} />
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <AgregarVueloPanel
                onAgregar={(v) => airport.agregarVuelo(v)}
                onAleatorio={() => airport.agregarVueloAleatorio()}
              />
              <PrioridadPanel
                prioridades={estado.prioridadPistas}
                totalPistas={estado.pistas.length}
                onUpdate={(orden) => airport.setPrioridadPistas(orden)}
              />
              <RoundRobinInfo index={estado.roundRobinIndex} />
              <EstadisticasPanel stats={estadisticas} />
            </div>
          </div>
        )}

        {tab === "eventos" && (
          <EventLog eventos={estado.eventos} />
        )}

        {tab === "stats" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <EstadisticasPanel stats={estadisticas} />
            <VuelosDespegados vuelos={estado.registroDespegados} />
            <div className="md:col-span-2">
              <EventLog eventos={estado.eventos} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
