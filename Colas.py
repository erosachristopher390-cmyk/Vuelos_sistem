import sys
from typing import Dict, List, Optional, Tuple


class ErrorConsistencia(Exception):
    pass


class Vuelo:
    def __init__(self, codigo: str, destino: str, hora_llegada: int, prioridad: str = "Normal") -> None:
        self.codigo: str = codigo
        self.destino: str = destino
        self.hora_llegada: int = hora_llegada
        self.prioridad: str = prioridad

    def __str__(self) -> str:
        return f"{self.codigo} | Destino: {self.destino} | Llegada: {self.hora_llegada} | Prioridad: {self.prioridad}"


class ColaCircular:
    def __init__(self, capacidad: int) -> None:
        if capacidad <= 0:
            raise ValueError("La capacidad debe ser un entero positivo.")
        self.capacidad: int = capacidad
        self.elementos: List[Optional[Vuelo]] = [None] * capacidad
        self.frente: int = 0
        self.final: int = -1
        self.cantidad: int = 0
        self.nota_circular: str = ""

    def esta_vacia(self) -> bool:
        return self.cantidad == 0

    def esta_llena(self) -> bool:
        return self.cantidad == self.capacidad

    def encolar(self, vuelo: Vuelo) -> bool:
        self.nota_circular = ""
        if self.esta_llena():
            return False
        indice_anterior = self.final
        self.final = (self.final + 1) % self.capacidad
        self.elementos[self.final] = vuelo
        self.cantidad += 1
        if self.final == 0 and indice_anterior == self.capacidad - 1:
            self.nota_circular = (
                f"El índice final dio la vuelta al inicio del arreglo: "
                f"({indice_anterior} + 1) % {self.capacidad} = 0"
            )
        return True

    def desencolar(self) -> Optional[Vuelo]:
        self.nota_circular = ""
        if self.esta_vacia():
            return None
        vuelo = self.elementos[self.frente]
        self.elementos[self.frente] = None
        indice_anterior = self.frente
        self.frente = (self.frente + 1) % self.capacidad
        self.cantidad -= 1
        if self.frente == 0 and indice_anterior == self.capacidad - 1:
            self.nota_circular = (
                f"El índice frente dio la vuelta al inicio del arreglo: "
                f"({indice_anterior} + 1) % {self.capacidad} = 0"
            )
        return vuelo

    def ver_frente(self) -> Optional[Vuelo]:
        if self.esta_vacia():
            return None
        return self.elementos[self.frente]

    def obtener_cantidad(self) -> int:
        return self.cantidad

    def obtener_vuelos(self) -> List[Vuelo]:
        vuelos: List[Vuelo] = []
        for desplazamiento in range(self.cantidad):
            indice = (self.frente + desplazamiento) % self.capacidad
            vuelos.append(self.elementos[indice])
        return vuelos

    def texto_final(self) -> str:
        if self.final < 0:
            return "ninguno"
        return str(self.final)

    def texto_celda(self, indice: int) -> str:
        vuelo = self.elementos[indice]
        if vuelo is None:
            return "[---]"
        return f"[{vuelo.codigo}]"

    def marca(self, indice: int, objetivo: int) -> str:
        if not self.esta_vacia() and indice == objetivo:
            return "^"
        return ""

    def construir_lineas(self) -> List[str]:
        ancho = 9
        fila_indices = ""
        fila_arreglo = ""
        fila_frente = ""
        fila_final = ""
        for indice in range(self.capacidad):
            fila_indices += f"{indice:^{ancho}}"
            fila_arreglo += f"{self.texto_celda(indice):^{ancho}}"
            fila_frente += f"{self.marca(indice, self.frente):^{ancho}}"
            fila_final += f"{self.marca(indice, self.final):^{ancho}}"
        lineas = [
            "Índice:   " + fila_indices.rstrip(),
            "Arreglo:  " + fila_arreglo.rstrip(),
            "Frente:   " + fila_frente.rstrip(),
            "Final:    " + fila_final.rstrip(),
        ]
        lineas.append(
            f"Frente = {self.frente} | Final = {self.texto_final()} | Cantidad = {self.cantidad}"
        )
        if self.esta_vacia():
            orden = "(cola vacía)"
        else:
            orden = " -> ".join(vuelo.codigo for vuelo in self.obtener_vuelos())
        lineas.append(f"Orden FIFO: {orden}")
        if self.esta_llena():
            lineas.append("Espacios disponibles: 0 (COLA LLENA: no puede aceptar otro vuelo)")
        else:
            proxima = (self.final + 1) % self.capacidad
            lineas.append(
                f"Espacios disponibles: {self.capacidad - self.cantidad} "
                f"(próxima inserción en el índice {proxima})"
            )
        return lineas

    def mostrar_estado(self) -> None:
        for linea in self.construir_lineas():
            print(linea)


class Pista:
    def __init__(self, numero: int, capacidad: int) -> None:
        self.numero: int = numero
        self.nombre: str = f"Pista {numero}"
        self.cola: ColaCircular = ColaCircular(capacidad)
        self.despegados: List[Vuelo] = []
        self.total_recibidos: int = 0

    def recibir_vuelo(self, vuelo: Vuelo) -> bool:
        recibido = self.cola.encolar(vuelo)
        if recibido:
            self.total_recibidos += 1
        return recibido

    def despegar_siguiente(self) -> Optional[Vuelo]:
        vuelo = self.cola.desencolar()
        if vuelo is not None:
            self.despegados.append(vuelo)
        return vuelo

    def cantidad_en_espera(self) -> int:
        return self.cola.obtener_cantidad()

    def tiene_espacio(self) -> bool:
        return not self.cola.esta_llena()

    def resumen_arreglo(self) -> str:
        celdas = " ".join(self.cola.texto_celda(i) for i in range(self.cola.capacidad))
        return (
            f"{self.nombre}: {celdas} | frente = {self.cola.frente} | "
            f"final = {self.cola.texto_final()} | cantidad = {self.cola.cantidad}"
        )

    def mostrar_estado(self) -> None:
        print(f"{self.nombre.upper()} | Ocupación: {self.cantidad_en_espera()}/{self.cola.capacidad}")
        self.cola.mostrar_estado()


class Aeropuerto:
    def __init__(self, numero_pistas: int, capacidad_por_pista: int, total_esperado: int = 15) -> None:
        if numero_pistas <= 0 or capacidad_por_pista <= 0:
            raise ValueError("El número de pistas y la capacidad deben ser enteros positivos.")
        self.numero_pistas: int = numero_pistas
        self.capacidad_por_pista: int = capacidad_por_pista
        self.total_esperado: int = total_esperado
        self.pistas: List[Pista] = [Pista(i + 1, capacidad_por_pista) for i in range(numero_pistas)]
        self.lista_espera: List[Vuelo] = []
        self.registro_recibidos: List[Vuelo] = []
        self.registro_asignados: List[Vuelo] = []
        self.registro_despegados: List[Vuelo] = []
        self.asignaciones: Dict[str, int] = {}

    def describir_ocupacion(self) -> str:
        partes = [
            f"{pista.nombre} = {pista.cantidad_en_espera()}/{pista.cola.capacidad}"
            for pista in self.pistas
        ]
        return ", ".join(partes)

    def seleccionar_pista_disponible(self) -> Optional[Pista]:
        elegida: Optional[Pista] = None
        for pista in self.pistas:
            if not pista.tiene_espacio():
                continue
            if elegida is None or pista.cantidad_en_espera() < elegida.cantidad_en_espera():
                elegida = pista
        return elegida

    def explicar_seleccion(self, pista: Pista) -> str:
        minimo = pista.cantidad_en_espera()
        empatadas = [
            otra for otra in self.pistas
            if otra.tiene_espacio() and otra.cantidad_en_espera() == minimo
        ]
        if len(empatadas) > 1:
            nombres = ", ".join(otra.nombre for otra in empatadas)
            return (
                f"tiene la menor cantidad de vuelos en espera ({minimo}); "
                f"hay empate entre {nombres} y gana la de número más bajo"
            )
        return f"tiene la menor cantidad de vuelos en espera ({minimo}) entre las pistas con espacio"

    def recibir_vuelo(self, vuelo: Vuelo) -> None:
        if any(recibido.codigo == vuelo.codigo for recibido in self.registro_recibidos):
            raise ErrorConsistencia(f"El vuelo {vuelo.codigo} ya fue recibido anteriormente.")
        self.registro_recibidos.append(vuelo)
        print(f"Vuelos en espera por pista: {self.describir_ocupacion()}")
        if self.lista_espera:
            print("Ya hay vuelos en la lista de espera general: el vuelo nuevo se forma detrás de ellos (FIFO).")
            self.lista_espera.append(vuelo)
            self.procesar_lista_espera()
        elif not self.asignar_vuelo(vuelo):
            self.lista_espera.append(vuelo)
        if vuelo in self.lista_espera:
            posicion = self.lista_espera.index(vuelo) + 1
            print(
                f"Todas las pistas están llenas: el vuelo {vuelo.codigo} pasa a la "
                f"lista de espera general (posición {posicion})."
            )

    def asignar_vuelo(self, vuelo: Vuelo) -> bool:
        if vuelo in self.registro_despegados:
            raise ErrorConsistencia(f"El vuelo {vuelo.codigo} ya despegó y no puede asignarse de nuevo.")
        if vuelo.codigo in self.asignaciones:
            raise ErrorConsistencia(f"El vuelo {vuelo.codigo} ya está asignado a una pista.")
        pista = self.seleccionar_pista_disponible()
        if pista is None:
            return False
        explicacion = self.explicar_seleccion(pista)
        if not pista.recibir_vuelo(vuelo):
            raise ErrorConsistencia(f"La {pista.nombre} rechazó el vuelo {vuelo.codigo} estando disponible.")
        self.asignaciones[vuelo.codigo] = pista.numero
        self.registro_asignados.append(vuelo)
        print(f"Se selecciona la {pista.nombre}: {explicacion}.")
        print(f"El vuelo {vuelo.codigo} se agrega al final de la cola circular de la {pista.nombre}.")
        if pista.cola.nota_circular:
            print(f">>> {pista.cola.nota_circular}")
        return True

    def procesar_lista_espera(self) -> int:
        movidos = 0
        while self.lista_espera and self.seleccionar_pista_disponible() is not None:
            vuelo = self.lista_espera.pop(0)
            print(f"El vuelo {vuelo.codigo} sale de la lista de espera general (era el primero de la fila).")
            self.asignar_vuelo(vuelo)
            movidos += 1
        return movidos

    def despegar_vuelo(self, numero_pista: int) -> Optional[Vuelo]:
        if numero_pista < 1 or numero_pista > len(self.pistas):
            print(f"La pista {numero_pista} no existe. Pistas válidas: 1 a {len(self.pistas)}. No se modificó el estado.")
            return None
        pista = self.pistas[numero_pista - 1]
        if pista.cola.esta_vacia():
            print(f"La {pista.nombre} no tiene vuelos en espera. No se modificó el estado.")
            return None
        vuelo = pista.despegar_siguiente()
        if vuelo is None or vuelo in self.registro_despegados:
            raise ErrorConsistencia("Se intentó registrar un despegue inválido o duplicado.")
        self.registro_despegados.append(vuelo)
        print(f"DESPEGUE: el vuelo {vuelo.codigo} (destino {vuelo.destino}) despega de la {pista.nombre}.")
        if pista.cola.nota_circular:
            print(f">>> {pista.cola.nota_circular}")
        if self.lista_espera:
            print("Se liberó un espacio: se procesa la lista de espera general.")
            self.procesar_lista_espera()
        return vuelo

    def hay_vuelos_pendientes(self) -> bool:
        return bool(self.lista_espera) or any(not pista.cola.esta_vacia() for pista in self.pistas)

    def obtener_pendientes_en_pistas(self) -> int:
        return sum(pista.cantidad_en_espera() for pista in self.pistas)

    def mostrar_estado_pistas(self) -> None:
        print("=" * 57)
        print("ESTADO DE LAS PISTAS DEL AEROPUERTO".center(57))
        print("=" * 57)
        for pista in self.pistas:
            print()
            pista.mostrar_estado()
        print()

    def mostrar_resumen_compacto(self) -> None:
        print("-" * 57)
        for pista in self.pistas:
            print(pista.resumen_arreglo())
        self.mostrar_lista_espera()

    def mostrar_lista_espera(self) -> None:
        if self.lista_espera:
            codigos = " -> ".join(vuelo.codigo for vuelo in self.lista_espera)
            print(f"LISTA DE ESPERA GENERAL (FIFO, {len(self.lista_espera)} vuelos): {codigos}")
        else:
            print("LISTA DE ESPERA GENERAL (FIFO): vacía")

    def mostrar_estado_general(self) -> None:
        print("=" * 57)
        print("ESTADO GENERAL DEL AEROPUERTO".center(57))
        print("=" * 57)
        print(f"Vuelos recibidos: {len(self.registro_recibidos)}")
        print(f"En pistas: {self.obtener_pendientes_en_pistas()} | En lista de espera: {len(self.lista_espera)} | Despegados: {len(self.registro_despegados)}")
        print()
        for pista in self.pistas:
            vuelos = pista.cola.obtener_vuelos()
            orden = " -> ".join(vuelo.codigo for vuelo in vuelos) if vuelos else "(sin vuelos)"
            print(f"{pista.nombre}: ocupación {pista.cantidad_en_espera()}/{pista.cola.capacidad} | salida: {orden}")
        print()
        self.mostrar_lista_espera()
        if self.registro_despegados:
            codigos = ", ".join(vuelo.codigo for vuelo in self.registro_despegados)
            print(f"Vuelos despegados (en orden cronológico de la simulación): {codigos}")
        else:
            print("Vuelos despegados: ninguno todavía")

    @staticmethod
    def esta_ordenado(vuelos: List[Vuelo]) -> bool:
        return all(vuelos[i].hora_llegada < vuelos[i + 1].hora_llegada for i in range(len(vuelos) - 1))

    def validar_consistencia(self) -> None:
        codigos_recibidos = [vuelo.codigo for vuelo in self.registro_recibidos]
        if len(set(codigos_recibidos)) != len(codigos_recibidos):
            raise ErrorConsistencia("Existen códigos de vuelo repetidos en el registro de recibidos.")
        if len(codigos_recibidos) != self.total_esperado:
            raise ErrorConsistencia(
                f"Se recibieron {len(codigos_recibidos)} vuelos y se esperaban {self.total_esperado}."
            )
        codigos_en_pistas: List[str] = []
        for pista in self.pistas:
            cola = pista.cola
            ocupados = sum(1 for elemento in cola.elementos if elemento is not None)
            if cola.cantidad > cola.capacidad or ocupados != cola.cantidad:
                raise ErrorConsistencia(f"La cola de la {pista.nombre} está en un estado inconsistente.")
            vuelos_pista = cola.obtener_vuelos()
            if not self.esta_ordenado(vuelos_pista):
                raise ErrorConsistencia(f"Se rompió el orden FIFO en la {pista.nombre}.")
            if not self.esta_ordenado(pista.despegados):
                raise ErrorConsistencia(f"Los despegues de la {pista.nombre} no respetaron el orden FIFO.")
            codigos_en_pistas.extend(vuelo.codigo for vuelo in vuelos_pista)
        if not self.esta_ordenado(self.lista_espera):
            raise ErrorConsistencia("Se rompió el orden FIFO en la lista de espera general.")
        codigos_espera = [vuelo.codigo for vuelo in self.lista_espera]
        codigos_despegados = [vuelo.codigo for vuelo in self.registro_despegados]
        todos = codigos_en_pistas + codigos_espera + codigos_despegados
        if len(set(todos)) != len(todos):
            raise ErrorConsistencia("Hay vuelos duplicados entre pistas, lista de espera y despegues.")
        if set(todos) != set(codigos_recibidos):
            raise ErrorConsistencia("Hay vuelos perdidos: la suma de ubicaciones no coincide con los recibidos.")

    def mostrar_estadisticas(self) -> None:
        recibidos = len(self.registro_recibidos)
        despegados = len(self.registro_despegados)
        en_pistas = self.obtener_pendientes_en_pistas()
        en_espera = len(self.lista_espera)
        utilizadas = sum(1 for pista in self.pistas if pista.total_recibidos > 0)
        porcentaje = (despegados / recibidos * 100) if recibidos else 0.0
        print("=" * 57)
        print("ESTADÍSTICAS DE LA SIMULACIÓN".center(57))
        print("=" * 57)
        print(f"Total de vuelos recibidos: {recibidos} (esperado: {self.total_esperado})")
        print(f"Total de vuelos que despegaron: {despegados}")
        print(f"Total de vuelos pendientes en pistas: {en_pistas}")
        print(f"Total de vuelos en la lista de espera general: {en_espera}")
        print(f"Número de pistas utilizadas: {utilizadas} de {len(self.pistas)}")
        for pista in self.pistas:
            print(f"  {pista.nombre}: {len(pista.despegados)} vuelos despegaron")
        print(f"Porcentaje de vuelos completados: {porcentaje:.1f}%")
        try:
            self.validar_consistencia()
            print("Validación de consistencia: CORRECTA (sin pérdidas, duplicados ni desbordes)")
            if despegados == self.total_esperado and en_pistas == 0 and en_espera == 0:
                print("Todos los vuelos fueron procesados correctamente: SÍ")
            else:
                print("Todos los vuelos fueron procesados correctamente: AÚN NO (hay vuelos pendientes)")
        except ErrorConsistencia as error:
            print(f"ERROR DE CONSISTENCIA: {error}")

    def despegar_automaticamente(self, detallado: bool) -> None:
        print("POLÍTICA AUTOMÁTICA: las pistas operan en paralelo. En cada ronda despega el")
        print("primer vuelo de cada pista que tenga vuelos, de la Pista 1 a la última. Después de")
        print("cada despegue se procesa la lista de espera. No existe un único orden global de")
        print("despegue: solo se garantiza el orden FIFO dentro de cada pista y de la lista de espera.")
        ronda = 0
        while self.hay_vuelos_pendientes():
            ronda += 1
            print()
            print("=" * 10 + f" RONDA {ronda} " + "=" * 10)
            despegaron = 0
            for pista in self.pistas:
                if pista.cola.esta_vacia():
                    continue
                self.despegar_vuelo(pista.numero)
                despegaron += 1
                if detallado:
                    self.mostrar_estado_pistas()
                    self.mostrar_lista_espera()
                else:
                    self.mostrar_resumen_compacto()
            if despegaron == 0:
                raise ErrorConsistencia("Hay vuelos en la lista de espera pero ninguna pista puede despegar.")
        print()
        print(f"Sistema vacío después de {ronda} rondas.")


def solicitar_entero_positivo(mensaje: str, predeterminado: int) -> int:
    while True:
        texto = input(f"{mensaje} [predeterminado {predeterminado}]: ").strip()
        if texto == "":
            return predeterminado
        try:
            valor = int(texto)
        except ValueError:
            print("Valor inválido: escriba un número entero positivo.")
            continue
        if valor <= 0:
            print("Valor inválido: el número debe ser mayor que cero.")
            continue
        return valor


class Simulacion:
    DESTINOS: List[str] = [
        "Cancún", "Guadalajara", "Monterrey", "Ciudad de México", "Tijuana",
        "Mérida", "Oaxaca", "Puebla", "Veracruz", "Chihuahua",
        "Madrid", "Bogotá", "Miami", "Houston", "Toronto",
    ]
    PRIORIDADES: List[str] = ["Normal", "Alta", "Normal", "Baja", "Normal"]

    def __init__(self, aeropuerto: Aeropuerto, total_vuelos: int = 15) -> None:
        self.aeropuerto: Aeropuerto = aeropuerto
        self.vuelos: List[Vuelo] = self.generar_vuelos(total_vuelos)

    @staticmethod
    def generar_vuelos(total: int) -> List[Vuelo]:
        vuelos: List[Vuelo] = []
        for posicion in range(total):
            vuelos.append(
                Vuelo(
                    codigo=f"MX{101 + posicion}",
                    destino=Simulacion.DESTINOS[posicion % len(Simulacion.DESTINOS)],
                    hora_llegada=posicion + 1,
                    prioridad=Simulacion.PRIORIDADES[posicion % len(Simulacion.PRIORIDADES)],
                )
            )
        return vuelos

    def ejecutar_llegadas(self) -> None:
        print()
        print("FASE 1: LLEGADA DE VUELOS")
        total = len(self.vuelos)
        for numero, vuelo in enumerate(self.vuelos, start=1):
            print()
            print("=" * 57)
            print(f"EVENTO {numero} de {total} - LLEGADA DE VUELO")
            print("=" * 57)
            print(f"Vuelo: {vuelo}")
            self.aeropuerto.recibir_vuelo(vuelo)
            print()
            self.aeropuerto.mostrar_estado_pistas()
            self.aeropuerto.mostrar_lista_espera()

    def demostrar_despegue_inicial(self) -> None:
        print()
        print("FASE 2: SIMULACIÓN DE DESPEGUES")
        print()
        self.aeropuerto.mostrar_estado_general()
        print()
        print("Demostración: despega el primer vuelo de la Pista 1 y se reasigna la lista de espera.")
        vuelo = self.aeropuerto.despegar_vuelo(1)
        if vuelo is not None:
            print()
            self.aeropuerto.mostrar_estado_pistas()
            self.aeropuerto.mostrar_lista_espera()

    def mostrar_menu(self) -> None:
        print()
        print("=" * 57)
        print("MENÚ PRINCIPAL".center(57))
        print("=" * 57)
        print("1. Mostrar estado del aeropuerto")
        print("2. Mostrar estado detallado de las colas circulares")
        print("3. Despegar un vuelo de una pista específica")
        print("4. Procesar la lista de espera general")
        print("5. Ejecutar todos los despegues automáticamente")
        print("6. Mostrar estadísticas")
        print("7. Salir")

    def opcion_despegar(self) -> None:
        texto = input(f"Número de pista (1-{len(self.aeropuerto.pistas)}): ").strip()
        try:
            numero = int(texto)
        except ValueError:
            print("Entrada inválida: escriba un número entero. No se modificó el estado.")
            return
        vuelo = self.aeropuerto.despegar_vuelo(numero)
        if vuelo is not None:
            print()
            self.aeropuerto.mostrar_estado_pistas()
            self.aeropuerto.mostrar_lista_espera()

    def opcion_procesar_espera(self) -> None:
        if not self.aeropuerto.lista_espera:
            print("La lista de espera general está vacía. No hay nada que procesar.")
            return
        movidos = self.aeropuerto.procesar_lista_espera()
        if movidos == 0:
            print("Todas las pistas siguen llenas: ningún vuelo puede salir de la lista de espera.")
            return
        print()
        self.aeropuerto.mostrar_estado_pistas()
        self.aeropuerto.mostrar_lista_espera()

    def opcion_automatica(self) -> None:
        if not self.aeropuerto.hay_vuelos_pendientes():
            print("No hay vuelos pendientes: el sistema ya está vacío.")
            return
        respuesta = input("¿Mostrar las tablas completas después de cada despegue? (s/n) [n]: ").strip().lower()
        self.aeropuerto.despegar_automaticamente(respuesta in ("s", "si", "sí"))
        print()
        self.aeropuerto.mostrar_estado_general()
        print()
        self.aeropuerto.mostrar_estadisticas()

    def ejecutar_menu(self) -> None:
        while True:
            self.mostrar_menu()
            opcion = input("Seleccione una opción (1-7): ").strip()
            print()
            if opcion == "1":
                self.aeropuerto.mostrar_estado_general()
            elif opcion == "2":
                self.aeropuerto.mostrar_estado_pistas()
                self.aeropuerto.mostrar_lista_espera()
            elif opcion == "3":
                self.opcion_despegar()
            elif opcion == "4":
                self.opcion_procesar_espera()
            elif opcion == "5":
                self.opcion_automatica()
            elif opcion == "6":
                self.aeropuerto.mostrar_estadisticas()
            elif opcion == "7":
                print("FASE 3: FINALIZACIÓN")
                self.aeropuerto.mostrar_estadisticas()
                print()
                print("Fin de la simulación.")
                break
            else:
                print("Opción inválida: elija un número del 1 al 7.")

    def ejecutar(self) -> None:
        self.ejecutar_llegadas()
        self.demostrar_despegue_inicial()
        self.ejecutar_menu()


def principal() -> None:
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except (AttributeError, ValueError):
        pass
    print("=" * 57)
    print("SISTEMA DE GESTIÓN DE VUELOS - COLAS CIRCULARES".center(57))
    print("=" * 57)
    try:
        numero_pistas = solicitar_entero_positivo("Número de pistas disponibles", 3)
        capacidad = solicitar_entero_positivo("Capacidad de cada cola circular", 3)
        aeropuerto = Aeropuerto(numero_pistas, capacidad, 15)
        simulacion = Simulacion(aeropuerto, 15)
        simulacion.ejecutar()
    except (KeyboardInterrupt, EOFError):
        print()
        print("Programa finalizado por el usuario.")
    except ErrorConsistencia as error:
        print(f"Error de consistencia: {error}")


if __name__ == "__main__":
    principal()