// ============================================================
// Tipos e interfaces para el Sistema de Gestión de Vuelos
// ============================================================

export type Prioridad = "Alta" | "Normal" | "Baja";

export interface Vuelo {
  codigo: string;
  destino: string;
  horaLlegada: number;
  prioridad: Prioridad;
}

export interface CeldaCola {
  indice: number;
  vuelo: Vuelo | null;
  esFrente: boolean;
  esFinal: boolean;
}

export interface EstadoCola {
  capacidad: number;
  frente: number;
  final: number;
  cantidad: number;
  celdas: CeldaCola[];
  ordenFIFO: string[];
  espaciosDisponibles: number;
  estaLlena: boolean;
  estaVacia: boolean;
}

export interface EstadoPista {
  numero: number;
  nombre: string;
  activa: boolean;
  cola: EstadoCola;
  despegados: Vuelo[];
  totalRecibidos: number;
}

export interface EventoLog {
  id: number;
  timestamp: number;
  tipo: "llegada" | "asignacion" | "despegue" | "espera" | "desactivacion" | "activacion" | "reasignacion" | "round-robin";
  mensaje: string;
  detalle?: string;
}

export interface EstadoAeropuerto {
  pistas: EstadoPista[];
  listaEspera: Vuelo[];
  registroRecibidos: Vuelo[];
  registroAsignados: Vuelo[];
  registroDespegados: Vuelo[];
  eventos: EventoLog[];
  roundRobinIndex: number;
  prioridadPistas: number[];
}

export interface Estadisticas {
  totalRecibidos: number;
  totalDespegados: number;
  totalEnPistas: number;
  totalEnEspera: number;
  pistasUtilizadas: number;
  totalPistas: number;
  porcentajeCompletado: number;
  despeguesPorPista: { nombre: string; despegues: number }[];
  pistasActivas: number;
  pistasInactivas: number;
}
