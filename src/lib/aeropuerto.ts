// ============================================================
// Motor de simulación del aeropuerto — Cola Circular + Pistas
// Incluye: activar/desactivar pistas, Round-Robin, prioridades
// ============================================================

import {
  Vuelo,
  Prioridad,
  CeldaCola,
  EstadoCola,
  EstadoPista,
  EventoLog,
  EstadoAeropuerto,
  Estadisticas,
} from "./types";

// ─── Cola Circular ──────────────────────────────────────────

class ColaCircular {
  capacidad: number;
  elementos: (Vuelo | null)[];
  frente: number;
  final: number;
  cantidad: number;

  constructor(capacidad: number) {
    if (capacidad <= 0) throw new Error("La capacidad debe ser un entero positivo.");
    this.capacidad = capacidad;
    this.elementos = new Array(capacidad).fill(null);
    this.frente = 0;
    this.final = -1;
    this.cantidad = 0;
  }

  estaVacia(): boolean {
    return this.cantidad === 0;
  }

  estaLlena(): boolean {
    return this.cantidad === this.capacidad;
  }

  encolar(vuelo: Vuelo): boolean {
    if (this.estaLlena()) return false;
    this.final = (this.final + 1) % this.capacidad;
    this.elementos[this.final] = vuelo;
    this.cantidad++;
    return true;
  }

  desencolar(): Vuelo | null {
    if (this.estaVacia()) return null;
    const vuelo = this.elementos[this.frente];
    this.elementos[this.frente] = null;
    this.frente = (this.frente + 1) % this.capacidad;
    this.cantidad--;
    return vuelo;
  }

  obtenerVuelos(): Vuelo[] {
    const vuelos: Vuelo[] = [];
    for (let i = 0; i < this.cantidad; i++) {
      const idx = (this.frente + i) % this.capacidad;
      const v = this.elementos[idx];
      if (v) vuelos.push(v);
    }
    return vuelos;
  }

  obtenerEstado(): EstadoCola {
    const celdas: CeldaCola[] = [];
    for (let i = 0; i < this.capacidad; i++) {
      celdas.push({
        indice: i,
        vuelo: this.elementos[i],
        esFrente: !this.estaVacia() && i === this.frente,
        esFinal: !this.estaVacia() && i === this.final,
      });
    }
    return {
      capacidad: this.capacidad,
      frente: this.frente,
      final: this.final,
      cantidad: this.cantidad,
      celdas,
      ordenFIFO: this.obtenerVuelos().map((v) => v.codigo),
      espaciosDisponibles: this.capacidad - this.cantidad,
      estaLlena: this.estaLlena(),
      estaVacia: this.estaVacia(),
    };
  }
}

// ─── Pista ──────────────────────────────────────────────────

class Pista {
  numero: number;
  nombre: string;
  cola: ColaCircular;
  despegados: Vuelo[];
  totalRecibidos: number;
  activa: boolean;

  constructor(numero: number, capacidad: number) {
    this.numero = numero;
    this.nombre = `Pista ${numero}`;
    this.cola = new ColaCircular(capacidad);
    this.despegados = [];
    this.totalRecibidos = 0;
    this.activa = true;
  }

  recibirVuelo(vuelo: Vuelo): boolean {
    if (!this.activa) return false;
    const recibido = this.cola.encolar(vuelo);
    if (recibido) this.totalRecibidos++;
    return recibido;
  }

  despegarSiguiente(): Vuelo | null {
    const vuelo = this.cola.desencolar();
    if (vuelo) this.despegados.push(vuelo);
    return vuelo;
  }

  cantidadEnEspera(): number {
    return this.cola.cantidad;
  }

  tieneEspacio(): boolean {
    return this.activa && !this.cola.estaLlena();
  }

  obtenerEstado(): EstadoPista {
    return {
      numero: this.numero,
      nombre: this.nombre,
      activa: this.activa,
      cola: this.cola.obtenerEstado(),
      despegados: [...this.despegados],
      totalRecibidos: this.totalRecibidos,
    };
  }
}

// ─── Aeropuerto (Motor principal) ───────────────────────────

export class Aeropuerto {
  pistas: Pista[];
  listaEspera: Vuelo[];
  registroRecibidos: Vuelo[];
  registroAsignados: Vuelo[];
  registroDespegados: Vuelo[];
  asignaciones: Map<string, number>;
  eventos: EventoLog[];
  private eventoId: number;
  private roundRobinIndex: number;
  private prioridadPistas: number[];
  numeroPistas: number;
  capacidadPorPista: number;

  constructor(numeroPistas: number, capacidadPorPista: number) {
    if (numeroPistas <= 0 || capacidadPorPista <= 0) {
      throw new Error("El número de pistas y la capacidad deben ser enteros positivos.");
    }
    this.numeroPistas = numeroPistas;
    this.capacidadPorPista = capacidadPorPista;
    this.pistas = [];
    for (let i = 0; i < numeroPistas; i++) {
      this.pistas.push(new Pista(i + 1, capacidadPorPista));
    }
    this.listaEspera = [];
    this.registroRecibidos = [];
    this.registroAsignados = [];
    this.registroDespegados = [];
    this.asignaciones = new Map();
    this.eventos = [];
    this.eventoId = 0;
    this.roundRobinIndex = 0;
    // Prioridad por defecto: todas las pistas con igual prioridad
    this.prioridadPistas = this.pistas.map((_, i) => i + 1);
  }

  // ── Logging ─────────────────────────────────────────────

  private log(
    tipo: EventoLog["tipo"],
    mensaje: string,
    detalle?: string
  ): void {
    this.eventos.push({
      id: ++this.eventoId,
      timestamp: Date.now(),
      tipo,
      mensaje,
      detalle,
    });
  }

  // ── Round-Robin con desempate ────────────────────────────

  private seleccionarPistaRoundRobin(): Pista | null {
    // 1. Filtrar pistas activas con espacio
    const disponibles = this.pistas.filter((p) => p.tieneEspacio());
    if (disponibles.length === 0) return null;

    // 2. Encontrar la cantidad mínima de vuelos en espera
    const minimo = Math.min(...disponibles.map((p) => p.cantidadEnEspera()));

    // 3. Filtrar las que tienen la cantidad mínima (candidatas empatadas)
    const empatadas = disponibles.filter((p) => p.cantidadEnEspera() === minimo);

    if (empatadas.length === 1) {
      return empatadas[0];
    }

    // 4. DESEMPATE con Round-Robin: rotar entre las empatadas
    // Ordenar las empatadas por prioridad de pista
    const ordenadas = empatadas.sort((a, b) => {
      const prioA = this.prioridadPistas.indexOf(a.numero);
      const prioB = this.prioridadPistas.indexOf(b.numero);
      return prioA - prioB;
    });

    // Usar roundRobinIndex para seleccionar de forma justa
    const idx = this.roundRobinIndex % ordenadas.length;
    const elegida = ordenadas[idx];
    this.roundRobinIndex++;

    const nombres = empatadas.map((p) => p.nombre).join(", ");
    this.log(
      "round-robin",
      `Desempate Round-Robin entre ${nombres}: se selecciona ${elegida.nombre}`,
      `Índice RR: ${this.roundRobinIndex - 1} → selección posición ${idx}`
    );

    return elegida;
  }

  // ── Asignación de vuelos ─────────────────────────────────

  recibirVuelo(vuelo: Vuelo): void {
    if (this.registroRecibidos.some((v) => v.codigo === vuelo.codigo)) {
      throw new Error(`El vuelo ${vuelo.codigo} ya fue recibido anteriormente.`);
    }
    this.registroRecibidos.push(vuelo);
    this.log("llegada", `Vuelo ${vuelo.codigo} llegó al aeropuerto`, `Destino: ${vuelo.destino} | Prioridad: ${vuelo.prioridad}`);

    if (this.listaEspera.length > 0) {
      this.listaEspera.push(vuelo);
      this.log("espera", `Vuelo ${vuelo.codigo} agregado a lista de espera (hay vuelos esperando antes)`);
      this.procesarListaEspera();
    } else if (!this.asignarVuelo(vuelo)) {
      this.listaEspera.push(vuelo);
      this.log("espera", `Vuelo ${vuelo.codigo} agregado a lista de espera (todas las pistas llenas)`);
    }
  }

  private asignarVuelo(vuelo: Vuelo): boolean {
    if (this.asignaciones.has(vuelo.codigo)) return false;

    const pista = this.seleccionarPistaRoundRobin();
    if (!pista) return false;

    if (!pista.recibirVuelo(vuelo)) return false;

    this.asignaciones.set(vuelo.codigo, pista.numero);
    this.registroAsignados.push(vuelo);
    this.log(
      "asignacion",
      `Vuelo ${vuelo.codigo} asignado a ${pista.nombre}`,
      `Ocupación: ${pista.cantidadEnEspera()}/${pista.cola.capacidad}`
    );
    return true;
  }

  procesarListaEspera(): number {
    let movidos = 0;
    while (this.listaEspera.length > 0 && this.seleccionarPistaRoundRobin() !== null) {
      const vuelo = this.listaEspera.shift()!;
      this.log("espera", `Vuelo ${vuelo.codigo} sale de la lista de espera`);
      this.asignarVuelo(vuelo);
      movidos++;
    }
    return movidos;
  }

  // ── Despegue ────────────────────────────────────────────

  despegarVuelo(numeroPista: number): Vuelo | null {
    if (numeroPista < 1 || numeroPista > this.pistas.length) return null;
    const pista = this.pistas[numeroPista - 1];
    if (!pista.activa) {
      this.log("despegue", `No se puede despegar de ${pista.nombre}: está desactivada`);
      return null;
    }
    if (pista.cola.estaVacia()) return null;

    const vuelo = pista.despegarSiguiente();
    if (!vuelo) return null;

    this.registroDespegados.push(vuelo);
    this.asignaciones.delete(vuelo.codigo);
    this.log(
      "despegue",
      `DESPEGUE: Vuelo ${vuelo.codigo} despegó de ${pista.nombre}`,
      `Destino: ${vuelo.destino}`
    );

    if (this.listaEspera.length > 0) {
      this.procesarListaEspera();
    }

    return vuelo;
  }

  // ── Activar / Desactivar Pistas ──────────────────────────

  desactivarPista(numeroPista: number): Vuelo[] {
    if (numeroPista < 1 || numeroPista > this.pistas.length) return [];
    const pista = this.pistas[numeroPista - 1];
    if (!pista.activa) return [];

    pista.activa = false;
    const vuelosReasignados: Vuelo[] = [];

    // Extraer todos los vuelos de la pista desactivada
    while (!pista.cola.estaVacia()) {
      const vuelo = pista.cola.desencolar();
      if (vuelo) {
        this.asignaciones.delete(vuelo.codigo);
        vuelosReasignados.push(vuelo);
      }
    }

    this.log(
      "desactivacion",
      `${pista.nombre} DESACTIVADA`,
      `${vuelosReasignados.length} vuelos reasignados a lista de espera`
    );

    // Agregar vuelos al frente de la lista de espera (tienen prioridad)
    this.listaEspera = [...vuelosReasignados, ...this.listaEspera];

    // Intentar reasignar desde la lista de espera
    if (this.listaEspera.length > 0) {
      const movidos = this.procesarListaEspera();
      if (movidos > 0) {
        this.log(
          "reasignacion",
          `${movidos} vuelos reasignados desde lista de espera tras desactivar ${pista.nombre}`
        );
      }
    }

    return vuelosReasignados;
  }

  activarPista(numeroPista: number): void {
    if (numeroPista < 1 || numeroPista > this.pistas.length) return;
    const pista = this.pistas[numeroPista - 1];
    if (pista.activa) return;

    pista.activa = true;
    this.log("activacion", `${pista.nombre} ACTIVADA`);

    // Intentar asignar vuelos de la lista de espera
    if (this.listaEspera.length > 0) {
      const movidos = this.procesarListaEspera();
      if (movidos > 0) {
        this.log(
          "reasignacion",
          `${movidos} vuelos de la lista de espera asignados a ${pista.nombre} tras activarla`
        );
      }
    }
  }

  // ── Prioridad de pistas ──────────────────────────────────

  setPrioridadPistas(orden: number[]): void {
    this.prioridadPistas = [...orden];
    this.log(
      "round-robin",
      `Prioridad de pistas actualizada: ${orden.map((n) => `Pista ${n}`).join(" → ")}`
    );
  }

  getPrioridadPistas(): number[] {
    return [...this.prioridadPistas];
  }

  // ── Despegue automático ──────────────────────────────────

  despegarAutomatico(): { rondas: number; despegues: Vuelo[] } {
    const despegues: Vuelo[] = [];
    let rondas = 0;
    while (this.hayVuelosPendientes()) {
      rondas++;
      let despechoEnRonda = false;
      for (const pista of this.pistas) {
        if (!pista.activa || pista.cola.estaVacia()) continue;
        const vuelo = this.despegarVuelo(pista.numero);
        if (vuelo) {
          despegues.push(vuelo);
          despechoEnRonda = true;
        }
      }
      if (!despechoEnRonda) break;
    }
    return { rondas, despegues };
  }

  hayVuelosPendientes(): boolean {
    return (
      this.listaEspera.length > 0 ||
      this.pistas.some((p) => !p.cola.estaVacia())
    );
  }

  // ── Estado y estadísticas ────────────────────────────────

  obtenerEstado(): EstadoAeropuerto {
    return {
      pistas: this.pistas.map((p) => p.obtenerEstado()),
      listaEspera: [...this.listaEspera],
      registroRecibidos: [...this.registroRecibidos],
      registroAsignados: [...this.registroAsignados],
      registroDespegados: [...this.registroDespegados],
      eventos: [...this.eventos],
      roundRobinIndex: this.roundRobinIndex,
      prioridadPistas: [...this.prioridadPistas],
    };
  }

  obtenerEstadisticas(): Estadisticas {
    const totalRecibidos = this.registroRecibidos.length;
    const totalDespegados = this.registroDespegados.length;
    const totalEnPistas = this.pistas.reduce((s, p) => s + p.cantidadEnEspera(), 0);
    const totalEnEspera = this.listaEspera.length;
    const pistasUtilizadas = this.pistas.filter((p) => p.totalRecibidos > 0).length;
    const pistasActivas = this.pistas.filter((p) => p.activa).length;

    return {
      totalRecibidos,
      totalDespegados,
      totalEnPistas,
      totalEnEspera,
      pistasUtilizadas,
      totalPistas: this.pistas.length,
      porcentajeCompletado: totalRecibidos > 0 ? (totalDespegados / totalRecibidos) * 100 : 0,
      despeguesPorPista: this.pistas.map((p) => ({
        nombre: p.nombre,
        despegues: p.despegados.length,
      })),
      pistasActivas,
      pistasInactivas: this.pistas.length - pistasActivas,
    };
  }
}

// ─── Generador de vuelos ──────────────────────────────────

const DESTINOS = [
  "Cancún", "Guadalajara", "Monterrey", "CDMX", "Tijuana",
  "Mérida", "Oaxaca", "Puebla", "Veracruz", "Chihuahua",
  "Madrid", "Bogotá", "Miami", "Houston", "Toronto",
];

const PRIORIDADES: Prioridad[] = ["Normal", "Alta", "Normal", "Baja", "Normal"];

export function generarVuelos(total: number): Vuelo[] {
  const vuelos: Vuelo[] = [];
  for (let i = 0; i < total; i++) {
    vuelos.push({
      codigo: `MX${101 + i}`,
      destino: DESTINOS[i % DESTINOS.length],
      horaLlegada: i + 1,
      prioridad: PRIORIDADES[i % PRIORIDADES.length],
    });
  }
  return vuelos;
}
