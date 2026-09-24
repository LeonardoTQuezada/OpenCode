# SPEC 01 — Cuatro fantasmas con IA clásica

> **Estado:** Aprobado
> **Depende de:** Ninguna (primera spec del proyecto).
> **Fecha:** 2026-09-24
> **Objetivo:** Añadir 4 fantasmas con comportamiento propio (perseguidor agresivo, emboscador, flanqueador y tímido), fases scatter/chase, velocidad propia y salida por turnos desde la pen.

## Por qué existe esta spec

El juego tiene hoy 2 fantasmas (`hunter` y `random`) definidos en `GHOST_STARTS` y decididos en `decideGhost()` de `game.js`. El usuario pidió «cuatro patas más», que se interpreta como los 4 fantasmas clásicos del arcade: cada uno con una IA distinta, uno persiguiendo agresivamente y con salida escalonada desde la pen, como en el juego original. El módulo de dibujo ya define 4 colores clásicos, lo que confirma la dirección.

## Alcance

**Entra:**

- Sustituir `hunter`/`random` por 4 kinds: `chaser` (agresivo, rojo), `ambusher` (rosa), `flanker` (cian) y `shy` (naranja).
- Heurística de decisión por objetivo en cada cruce (greedy Manhattan, como el `hunter` actual).
- Fases alternas `scatter`/`chase` con agenda de duraciones.
- Velocidad propia por fantasma, como fracción unitaria de celda/frame para conservar la alineación.
- Esquina de dispersión propia por fantasma.
- Salida por turnos desde la pen con condiciones de liberación por fantasma (tiempo o dots comidos).
- Colores por `kind` en `render.js`.

**Fuera (para specs futuras):**

- Power pellets y modo asustado (comerse fantasmas).
- Ralentización de fantasmas en el túnel.
- Comportamiento o velocidad por nivel.
- Reglas de colisión entre fantasmas (se solapan visualmente por diseño).
- Animación de rebote dentro de la pen antes de salir (los no liberados esperan quietos).

## Modelo de datos

Sin archivos nuevos. En `src/js/maze.js`, `GHOST_STARTS` pasa a 4 entradas con `speed`, `corner` y `release`:

```js
const GHOST_STARTS = [
  { x: 13, y: 14, kind: 'chaser',   speed: 1 / 8,  corner: { x: 26, y: 1 },  release: 'immediate' },
  { x: 14, y: 14, kind: 'ambusher', speed: 1 / 10, corner: { x: 1, y: 1 },   release: { type: 'time', frames: 150 } },
  { x: 13, y: 13, kind: 'flanker',  speed: 1 / 10, corner: { x: 26, y: 29 }, release: { type: 'dots', count: 30 } },
  { x: 14, y: 13, kind: 'shy',      speed: 1 / 10, corner: { x: 1, y: 29 },  release: { type: 'dots', count: 60 } },
];
```

Reglas de liberación:

| Fantasma | Condición | Cuándo |
| --- | --- | --- |
| `chaser` (rojo) | `immediate` | sale el primero, al empezar la partida |
| `ambusher` (rosa) | `time` 150 frames | a los ~2,5 s (~60 fps) |
| `flanker` (cian) | `dots` 30 | tras comer 30 dots |
| `shy` (naranja) | `dots` 60 | tras comer 60 dots |

Convenciones:

- `corner` es la esquina de dispersión: celdas transitables más exteriores (las paredes ocupan x=0/x=27 e y=0/y=30).
- Velocidades: `1/8` el `chaser` (más rápido) y `1/10` el resto, ambas divisores de celda (alinean cada 8/10 frames con la tolerancia 1e-3).
- `dotsEaten = game.totalDots - game.dotsRemaining`.

En `src/js/game.js`, el estado de partida añade:

```js
// createGame():
frameCount: 0,   // para liberación por tiempo
totalDots: dots, // para liberación por dots
ghostMode: { index: 0, mode: 'scatter', timer: 420 },
// por fantasma: { x, y, dir: 'up', speed, kind, corner,
//                released: release === 'immediate' }
```

```js
const MODE_SCHEDULE = [
  { mode: 'scatter', frames: 420 },  // 7 s
  { mode: 'chase',   frames: 1200 }, // 20 s
  { mode: 'scatter', frames: 420 },  // 7 s
  { mode: 'chase',   frames: 1200 }, // 20 s
  { mode: 'scatter', frames: 300 },  // 5 s
  { mode: 'chase',   frames: Infinity },
];
```

Funciones de objetivo (`game.js`): `pacmanCell(game)` (celda redondeada de Pac-Man), `aheadCell(pacman, tiles)` (celda a `tiles` posiciones en su `dir`, recortada al grid), `flankCell(game)` (`P = aheadCell(pacman, 2)`, `B` = celda redondeada del `chaser`, devuelve `2·P − B` recortado; sin chaser devuelve `P`). Distancia Manhattan entre celdas redondeadas.

## Plan de implementación

1. **Datos y colores.** `maze.js`: `GHOST_STARTS` con las 4 entradas (kind, speed, corner, release). `render.js`: `GHOST_COLORS` → objeto por `kind` (`chaser: '#ff0000'`, `ambusher: '#ffb8ff'`, `flanker: '#00ffff'`, `shy: '#ffb852'`) y `draw` lo indexa con `g.kind`. La partida sigue jugable (los kinds nuevos caen al azar, sin errores). Verificación: 4 fantasmas en sus colores.
2. **IA por objetivo.** `game.js`: `createGame` copia `speed`/`corner`/`release`; extraer la greedy del `hunter` a `chooseByTarget(game, g, target)`; `decideGhost` usa `ghostTarget(game, g)`: `chaser` → `pacmanCell`, `ambusher` → `aheadCell(p, 4)`, `flanker` → `flankCell`, `shy` → su `corner` si Pac-Man está a < 8 celdas Manhattan, si no `pacmanCell`. Eliminar la rama `'random'` y el const `GHOST_SPEED`. Verificación: 4 comportamientos distintos.
3. **Salida por turnos.** `game.js`: estado `released` por fantasma, `frameCount` y `totalDots` en `createGame`; en `update()` incrementar `frameCount`, y para cada fantasma no liberado comprobar su condición de `release` (`time` → `frameCount >= frames`; `dots` → `dotsEaten >= count`) marcándolo `released` al cumplirla; `moveGhost` no mueve a un fantasma `!released`. Verificación: el rojo sale el primero, el rosa a los ~2,5 s, y el cian/naranja al comer 30/60 dots.
4. **Fases scatter/chase.** `game.js`: `MODE_SCHEDULE` + `ghostMode` en `createGame`; en `update()` decrementar el timer y pasar al siguiente elemento al llegar a 0; `ghostTarget` consulta `game.ghostMode.mode` (en `scatter`, los 4 a su `corner`). Verificación: dispersión y persecución según la agenda.

## Criterios de aceptación

- [ ] Al abrir `src/index.html` no hay errores en la consola.
- [ ] Hay exactamente 4 fantasmas, uno de cada color clásico (rojo, rosa, cian, naranja).
- [ ] El `chaser` (rojo) reduce siempre su distancia Manhattan a Pac-Man en cada cruce: persigue agresivamente.
- [ ] El `ambusher` (rosa) se dirige a la celda 4 posiciones delante de Pac-Man.
- [ ] El `flanker` (cian) se dirige a `2·P − B` con `P` = 2 celdas delante y `B` = celda del `chaser`.
- [ ] El `shy` (naranja) va a su esquina cuando Pac-Man está a menos de 8 celdas y le persigue en caso contrario.
- [ ] Al iniciar, el `chaser` sale de la pen al instante y los otros tres esperan quietos dentro.
- [ ] El `ambusher` sale a los ~2,5 s, el `flanker` tras 30 dots y el `shy` tras 60 dots.
- [ ] Un fantasma no liberado no se mueve ni puede chocar con Pac-Man.
- [ ] La partida alterna `scatter` ~7 s / `chase` ~20 s, con un `scatter` extra de 5 s y `chase` indefinido al final.
- [ ] Cada fantasma mantiene su velocidad (1/8 el `chaser`, 1/10 el resto) sin vibraciones ni atascos.
- [ ] Comer puntos, perder vidas y ganar/perder funcionan como antes.
- [ ] `MAZE` no se muta y Start reinicia los 4 fantasmas, sus condiciones de salida y el contador de frames.

## Decisiones tomadas y descartadas

- **Sí:** 4 fantasmas en total, sustituyendo a `hunter`/`random`. Lo confirmó el usuario; «patas» se interpreta como fantasmas.
- **Sí:** comportamientos clásicos del arcade (chaser, ambusher, flanker, shy). Son los probados en el original y encajan con los 4 colores ya existentes en `render.js`.
- **Sí:** salida por turnos desde la pen, pedida explícitamente por el usuario. Se usan los disparadores del nivel 1 del arcade: tiempo (2,5 s) para el rosa y dots (30 y 60) para el cian y el naranja.
- **Sí:** los 4 nacen dentro de la pen y el `chaser` se libera al instante. En el arcade el rojo nace fuera; aquí se simplifica manteniendo el mismo orden de salida (confirmado por el usuario).
- **Sí:** fases scatter/chase con la agenda simplificada (7/20/7/20/5/∞ segundos), empezando en `scatter`.
- **Sí:** velocidad propia por fantasma, solo fracciones unitarias de celda/frame para no romper la alineación.
- **No:** offset clásico del emboscador hacia arriba; se usa la dirección pura recortada a los límites. Más simple y predecible.
- **No:** power pellets / modo asustado. No existe el power pellet en el juego y merece spec propia.
- **No:** ralentización en el túnel ni dificultad por nivel. Fuera del alcance y del motor actual.
- **No:** animación de rebote de los no liberados dentro de la pen. Esperan quietos; es cosmético y se puede añadir en otra spec.

## Riesgos

| Riesgo | Mitigación |
| ------ | ---------- |
| Velocidades mezcladas rompen la alineación a la celda | Solo fracciones unitarias de celda/frame (1/8 y 1/10); `aligned()` ya tolera 1e-3. |
| `flankCell` depende de que exista el `chaser` | Fallback a `P` si no hay `chaser`. En la práctica siempre existe: la partida crea los 4 kinds. |
| Los dots comidos se derivan de `dotsRemaining` | Guardar `totalDots` en `createGame`; `dotsEaten = totalDots - dotsRemaining`. |

## Qué **no** entra en esta spec

- Power pellets y modo asustado.
- Ralentización en el túnel.
- Dificultad o velocidad por nivel.
- Reglas de colisión entre fantasmas.
- Animación de rebote dentro de la pen.

Cada uno de esos, si llega, va en su propia spec.