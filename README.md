# 🛬 Vuelos_sistem - Sistema de Gestión de Vuelos

Aplicación web interactiva y visual desarrollada con **Next.js**, **TypeScript** y **Tailwind CSS**, que simula la gestión de despegues y aterrizajes en pistas de un aeropuerto utilizando **Colas Circulares**, **Round-Robin** para desempates y control dinámico de pistas.

---

## 🚀 Características Principales

1. **Colas Circulares con Visualización Completa**:
   - Representación gráfica de cada celda del arreglo.
   - Punteros dinámicos de **Frente ($F$)** y **Final ($R$)**.
   - Garantía de orden FIFO y detección de desbordes o estados vacíos.

2. **Mecanismo de Desempate con Round-Robin**:
   - Evita la saturación constante de una sola pista cuando varias tienen la misma cantidad mínima de vuelos.
   - Distribuye equitativamente las nuevas asignaciones entre las pistas empatadas rotando el turno de selección.

3. **Activar y Desactivar Pistas**:
   - Cada pista cuenta con un interruptor para activarse o desactivarse.
   - Al desactivar una pista, sus vuelos en espera se reasignan inmediatamente al frente de la lista de espera general y se distribuyen a las pistas activas disponibles.

4. **Gestión de Prioridad de Pistas**:
   - Panel interactivo para reordenar la jerarquía de pistas (▲ / ▼), influyendo en el desempate.

5. **Prioridad de Vuelos y Registro Detallado**:
   - Niveles de prioridad: Alta (rojo), Normal (verde), Baja (azul).
   - Bitácora de eventos en tiempo real (llegadas, asignaciones, despegues, activaciones, desactivaciones y rotación Round-Robin).
   - Panel de estadísticas completas.

---

## 🛠️ Tecnologías Utilizadas

- **Framework**: Next.js 16 (App Router)
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **Código Base Python**: Incluido como referencia (`Colas.py`)

---

## 💻 Instalación y Ejecución Local

1. Instalar dependencias:
   ```bash
   npm install
   ```

2. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```

3. Abrir en el navegador:
   ```
   http://localhost:3000
   ```
