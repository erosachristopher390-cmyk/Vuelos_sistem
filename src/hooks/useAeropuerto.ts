"use client";
import { useState, useCallback, useRef } from "react";
import { Aeropuerto, generarVuelos } from "../lib/aeropuerto";
import type { EstadoAeropuerto, Estadisticas, Vuelo } from "../lib/types";

export interface UseAeropuerto {
  estado: EstadoAeropuerto | null;
  estadisticas: Estadisticas | null;
  iniciar: (pistas: number, capacidad: number, vuelos: number) => void;
  agregarVuelo: (vuelo: Vuelo) => void;
  agregarVueloAleatorio: () => void;
  despacharVuelo: (numeroPista: number) => Vuelo | null;
  desactivarPista: (numeroPista: number) => void;
  activarPista: (numeroPista: number) => void;
  despacharAutomatico: () => void;
  procesarEspera: () => void;
  setPrioridadPistas: (orden: number[]) => void;
  resetear: () => void;
  iniciado: boolean;
  config: { pistas: number; capacidad: number; vuelos: number } | null;
}

export function useAeropuerto(): UseAeropuerto {
  const aeropuertoRef = useRef<Aeropuerto | null>(null);
  const [estado, setEstado] = useState<EstadoAeropuerto | null>(null);
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [iniciado, setIniciado] = useState(false);
  const [config, setConfig] = useState<{ pistas: number; capacidad: number; vuelos: number } | null>(null);
  const vueloCounterRef = useRef(0);

  const refresh = useCallback(() => {
    if (!aeropuertoRef.current) return;
    setEstado(aeropuertoRef.current.obtenerEstado());
    setEstadisticas(aeropuertoRef.current.obtenerEstadisticas());
  }, []);

  const iniciar = useCallback((pistas: number, capacidad: number, totalVuelos: number) => {
    const aeropuerto = new Aeropuerto(pistas, capacidad);
    aeropuertoRef.current = aeropuerto;

    const vuelos = generarVuelos(totalVuelos);
    for (const vuelo of vuelos) {
      aeropuerto.recibirVuelo(vuelo);
    }

    vueloCounterRef.current = totalVuelos;
    setConfig({ pistas, capacidad, vuelos: totalVuelos });
    setIniciado(true);
    setEstado(aeropuerto.obtenerEstado());
    setEstadisticas(aeropuerto.obtenerEstadisticas());
  }, []);

  const agregarVuelo = useCallback((vuelo: Vuelo) => {
    if (!aeropuertoRef.current) return;
    aeropuertoRef.current.recibirVuelo(vuelo);
    refresh();
  }, [refresh]);

  const agregarVueloAleatorio = useCallback(() => {
    if (!aeropuertoRef.current) return;
    vueloCounterRef.current++;
    const destinos = [
      "Cancún", "Guadalajara", "Monterrey", "CDMX", "Tijuana",
      "Mérida", "Oaxaca", "Puebla", "Veracruz", "Chihuahua",
      "Madrid", "Bogotá", "Miami", "Houston", "Toronto",
    ];
    const prioridades: Array<"Alta" | "Normal" | "Baja"> = ["Normal", "Alta", "Baja"];
    const num = vueloCounterRef.current;
    const vuelo: Vuelo = {
      codigo: `MX${100 + num}`,
      destino: destinos[Math.floor(Math.random() * destinos.length)],
      horaLlegada: num,
      prioridad: prioridades[Math.floor(Math.random() * prioridades.length)],
    };
    aeropuertoRef.current.recibirVuelo(vuelo);
    refresh();
  }, [refresh]);

  const despacharVuelo = useCallback((numeroPista: number): Vuelo | null => {
    if (!aeropuertoRef.current) return null;
    const vuelo = aeropuertoRef.current.despegarVuelo(numeroPista);
    refresh();
    return vuelo;
  }, [refresh]);

  const desactivarPista = useCallback((numeroPista: number) => {
    if (!aeropuertoRef.current) return;
    aeropuertoRef.current.desactivarPista(numeroPista);
    refresh();
  }, [refresh]);

  const activarPista = useCallback((numeroPista: number) => {
    if (!aeropuertoRef.current) return;
    aeropuertoRef.current.activarPista(numeroPista);
    refresh();
  }, [refresh]);

  const despacharAutomatico = useCallback(() => {
    if (!aeropuertoRef.current) return;
    aeropuertoRef.current.despegarAutomatico();
    refresh();
  }, [refresh]);

  const procesarEspera = useCallback(() => {
    if (!aeropuertoRef.current) return;
    aeropuertoRef.current.procesarListaEspera();
    refresh();
  }, [refresh]);

  const setPrioridadPistas = useCallback((orden: number[]) => {
    if (!aeropuertoRef.current) return;
    aeropuertoRef.current.setPrioridadPistas(orden);
    refresh();
  }, [refresh]);

  const resetear = useCallback(() => {
    aeropuertoRef.current = null;
    setEstado(null);
    setEstadisticas(null);
    setIniciado(false);
    setConfig(null);
    vueloCounterRef.current = 0;
  }, []);

  return {
    estado,
    estadisticas,
    iniciar,
    agregarVuelo,
    agregarVueloAleatorio,
    despacharVuelo,
    desactivarPista,
    activarPista,
    despacharAutomatico,
    procesarEspera,
    setPrioridadPistas,
    resetear,
    iniciado,
    config,
  };
}
