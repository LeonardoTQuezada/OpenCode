# SPEC 02 — Salida de los fantasmas desde la pen

> **Estado:** Implementado
> **Depende de:** SPEC 01
> **Fecha:** 2026-09-24
> **Objetivo:** Al liberarse, cada fantasma aparece directamente en su punto de salida del mapa en lugar de intentar salir andando de la pen, de modo que ninguno quede atrapado en la jaula.

## Por qué existe esta spec

SPEC 01 implementó las condiciones de liberación (inmediata / tiempo / dots), pero los 4 fantasmas nacen **dentro** de la pen (filas 13-15, cols 11-16) con el único escape por la puerta en (13,12)/(14,12). La IA greedy-Manhattan hacia un objetivo externo crea mínimos locales dentro de la pen: el fantasma oscila entre celdas sin encontrar la salida (p. ej. el `flanker` rebota entre (13,15) y (14,15) porque subir hacia la puerta *aumenta* la distancia a su esquina). Además, al perder una vida `resetPositions` devuelve a los liberados a la pen **sin** tocar `released`, y se vuelven a atascar. Solución: al liberarse, el fantasma se coloca directamente en el mapa, en la celda de salida (13,11), justo encima de la puerta. Esto **cambia el criterio de SPEC 01** «el chaser sale de la pen»: ahora nace directamente en el mapa, manteniendo el mismo orden de salida.

## Alcance

**Entra:**

- Campo `spawn` (celda + dirección) por fantasma en `GHOST_STARTS` (`maze.js`), todos en (13,11) con dirección `up` (como si acabaran de salir por la puerta): al ser `down` la opuesta, el primer cruce nunca baja por la puerta a la pen.
- Al cumplirse la condición de liberación, el fantasma se coloca en `spawn` y desde ahí la IA navega normal (primer cruce decidido por `chooseByTarget`).
- El `chaser` (`release: 'immediate'`) arranca la partida directamente en `spawn`.
- `resetPositions`: los liberados vuelven a `spawn` (conservando `released`); los no liberados vuelven a su celda de la pen.
- Los no liberados se siguen dibujando quietos dentro de la pen (sin cambios visuales).

**Fuera (para specs futuras):**

- Animación de salida real caminando por la puerta (tile 3) o rebote de los no liberados dentro de la pen (ya estaba fuera en SPEC 01).
- Puntos de aparición individuales por fantasma distribuidos por el mapa (descartado en las preguntas).
- Power pellets y modo asustado (spec 01).

## Modelo de datos

`src/js/maze.js` — cada entrada de `GHOST_STARTS` gana `spawn` (celda (13,11) + dirección alternada por índice par/impar):

```js
const GHOST_STARTS = [
  { x: 13, y: 14, kind: 'chaser',   speed: 1 / 8,  corner: { x: 26, y: 1 },  release: 'immediate',
    spawn: { x: 13, y: 11, dir: 'up' } },
  { x: 14, y: 14, kind: 'ambusher', speed: 1 / 10, corner: { x: 1, y: 1 },   release: { type: 'time', frames: 150 },
    spawn: { x: 13, y: 11, dir: 'up' } },
  { x: 13, y: 13, kind: 'flanker',  speed: 1 / 10, corner: { x: 26, y: 29 }, release: { type: 'dots', count: 30 },
    spawn: { x: 13, y: 11, dir: 'up' } },
  { x: 14, y: 13, kind: 'shy',      speed: 1 / 10, corner: { x: 1, y: 29 },  release: { type: 'dots', count: 60 },
    spawn: { x: 13, y: 11, dir: 'up' } },
];
```

`src/js/game.js`:

```js
// createGame(): cada fantasma copia además spawn; si release === 'immediate'
// nace ya en spawn:  x: released ? g.spawn.x : g.x,  dir: released ? g.spawn.dir : 'up'

// Nuevo helper, usado al liberar (sustituye a "g.released = true" en update()):
function releaseGhost( game, g ) {
  g.released = true;
  g.x = g.spawn.x;
  g.y = g.spawn.y;
  g.dir = g.spawn.dir;
}
```

Convenciones: `x, y` de `GHOST_STARTS` siguen siendo las celdas de la pen (para no liberados); `spawn` es el punto de aparición en el mapa. `(13,11)` es la celda del pasillo justo encima de la puerta izquierda de la pen y está libre; con `dir: 'up'`, el primer cruce excluye `down` (la puerta, tile 3) y el fantasma no puede volver a entrar a la pen al liberarse.

## Plan de implementación

1. **Datos de spawn.** `maze.js`: añadir `spawn` a las 4 entradas de `GHOST_STARTS`. Verificación: consola sin errores y partida idéntica (el campo aún no se usa).
2. **Aparición al liberarse.** `game.js`: copiar `spawn` al estado del fantasma en `createGame` (el `chaser` nace en `spawn`); añadir `releaseGhost()` y usarlo en la detección de liberación de `update()`. Verificación: el rojo arranca en (13,11), y rosa/cian/naranja aparecen ahí al cumplirse su condición y **no** quedan atascados.
3. **Reset de posiciones.** `game.js`: `resetPositions` coloca a los `released` en `g.spawn` (con `g.spawn.dir`) y a los no liberados en su celda de la pen. Verificación: tras perder una vida, los liberados reaparecen en el pasillo y siguen moviéndose.

## Criterios de aceptación

- [ ] Al abrir `src/index.html` no hay errores en la consola.
- [ ] El `chaser` arranca la partida en (13,11) (dir `up`) y se mueve desde el primer frame.
- [ ] El `ambusher` espera quieto en la pen y aparece en (13,11) (dir `up`) a los ~2,5 s.
- [ ] El `flanker` y el `shy` esperan quietos en la pen y aparecen en (13,11) (dir `up`) al comerse 30/60 dots.
- [ ] Ningún fantasma liberado queda atascado en la pen: el primer cruce tras liberarse nunca baja por la puerta (dir `up` excluye `down`), todos alcanzan el pasillo y navegan el mapa con su IA (scatter/chase intactos).
- [ ] Los no liberados se dibujan quietos en sus celdas de la pen, no se mueven ni chocan.
- [ ] Tras perder una vida, los liberados reaparecen en (13,11) con su dirección y los no liberados vuelven a su celda; `released` no se reinicia.
- [ ] Start reinicia la secuencia completa (rojo en el mapa, resto en la pen con sus condiciones).
- [ ] `MAZE` no se muta; comer puntos, ganar/perder y las 4 velocidades funcionan como antes.

## Decisiones tomadas y descartadas

- **Sí:** spawn único en la salida de la pen (13,11). Fiel al arcade (salen por la puerta y entran al pasillo) con el mínimo cambio de código.
- **Sí:** dirección `up` en el spawn (como si acabaran de salir por la puerta). Con `up`, `down` queda excluida en el primer cruce y ningún liberado vuelve a bajar por la puerta a la pen. Se eligió tras verificar que `left`/`right` permitía ese cruce y re-atascaba a los liberados 20-30 s dentro de la pen.
- **No:** direcciones `left`/`right` alternadas en el spawn. Probado en la implementación: permitía el primer cruce hacia abajo por la puerta (13,12) y volvía a atascar a los liberados en la pen (es el bug que esta spec elimina).
- **Sí:** teletransporte al cumplirse la condición de liberación, sin animación de salida por la puerta.
- **Sí:** el `chaser` nace directamente en `spawn` (release inmediato); mismo orden de salida que SPEC 01, sin frames intermedios.
- **Sí:** en `resetPositions`, liberados → `spawn` conservando `released`; no liberados → pen. Evita re-ejecutar la secuencia tras cada muerte (y el re-atasco actual).
- **Sí:** los no liberados se dibujan quietos en la pen, tal y como aprobó SPEC 01.
- **No:** caminar de verdad por la puerta (tile 3) ni rebote en la pen. Cosmético; spec futura.
- **No:** un punto de aparición distinto por fantasma distribuido por el mapa. Descartado por el usuario en favor de la salida única.

## Riesgos

| Riesgo | Mitigación |
| ------ | ---------- |
| Pac-Man está justo en (13,11) cuando un fantasma aparece y colisiona en el mismo frame | (13,11) está lejos del inicio de Pac-Man (13,23) y las liberaciones por dots exigen 30/60 dots; `collides` tolera < 0,5 celdas. Impacto mínimo, aceptado. |
| El `chaser` (1/8) y el resto (1/10) comparten el spawn y pueden solaparse al aparecer | Los fantasmas no colisionan entre sí por diseño (SPEC 01); no hay cambio. |
| Un liberado re-entra a la pen por la puerta durante la navegación libre (no en el spawn) | El `spawn` usa `up`, así que el primer cruce ya no baja; la re-entrada posterior por la puerta es comportamiento preexistente (los fantasmas pueden atravesarla) y queda fuera de esta spec. Candidato a spec futura (cerrar la puerta tras la liberación). |

## Qué **no** entra en esta spec

- Animación de salida a través de la puerta ni rebote de los no liberados.
- Un punto de aparición individual por fantasma.
- Power pellets y modo asustado.

Cada uno de esos, si llega, va en su propia spec.