# SPEC 03 — Power pellets y modo asustado

> **Estado:** Implementado
> **Depende de:** SPEC 01, SPEC 02
> **Fecha:** 2026-09-24
> **Objetivo:** Añadir 4 power pellets por partida que, al comerse, asustan a los fantasmas (azules, con reversa, mitad de velocidad y movimiento aleatorio) durante 6 s con parpadeo de aviso, y permiten comérselos para ganar 50 puntos por pellet y 200→400→800→1600 por fantasma, como el arcade.

## Por qué existe esta spec

SPEC 01 y 02 declararon el modo asustado como spec futura. Hoy el único comestible es el dot (tile 2): `movePacman` solo come valor 2 y los fantasmas nunca se pueden comer. El usuario pidió power pellets para imitar al original. En el arcade hay 4 energizadores **fijos**; en las preguntas el usuario confirmó que prefiere **posición aleatoria por partida** (recolocada en cada Start), manteniendo el resto de reglas clásicas: 6 s de asustado, parpadeo final, reversa + mitad de velocidad + zigzag aleatorio, y la secuencia 200/400/800/1600.

## Alcance

**Entra:**

- 4 power pellets por partida en celdas transitables aleatorias, excluyendo la pen (filas 13-15, cols 11-17), el inicio de Pac-Man (13,23) y con ≥ 8 celdas Manhattan entre ellos. Colocación en `createGame` sobre la copia de `MAZE`; el laberinto ASCII no cambia.
- Comer un pellet: +50 pts, y cuenta como comestible para ganar la partida y para las liberaciones por dots de SPEC 01.
- Modo asustado de 6 s (360 frames) al comer un pellet: todo fantasma liberado invierte la dirección, va a mitad de velocidad (1/16 y 1/20) y elige dirección aleatoria en cada cruce; se pinta azul, con parpadeo azul/blanco en los últimos 2 s (120 frames).
- Pac-Man puede comerse un fantasma asustado: +200→400→800→1600 según el orden en la secuencia (se reinicia con cada pellet; del 4º en adelante, 1600).
- El fantasma comido vuelve a la pen (`released=false`, `frightened=false`) y se re-libera solo con su regla de SPEC 01/02; nace con su color normal aunque queden frames de asustado.
- Comer un pellet con el modo ya activo: reinicia el temporizador a 360, la secuencia a 200 y vuelve a invertir (comportamiento arcade).
- Power pellet dibujado como dot grande parpadeante (mismo color, radio ~7 px).

**Fuera (para specs futuras):**

- Animación de ojos que caminan de vuelta a la pen al ser comidos (aquí: teletransporte a la pen).
- Sonidos/melodías del modo asustado.
- Frutas (cereza, fresa…) y duración/velocidad/puntos por nivel (el juego no tiene niveles).

## Modelo de datos

Sin archivos nuevos. En `src/js/game.js`, constantes nuevas:

```js
const PELLET_COUNT = 4;
const PELLET_SCORE = 50;
const FRIGHT_FRAMES = 360;      // 6 s a ~60 fps
const FRIGHT_FLASH = 120;       // últimos 2 s: parpadeo blanco/azul
const FRIGHT_SPEED_FACTOR = 0.5; // mitad de velocidad
const FRIGHT_SCORES = [ 200, 400, 800, 1600 ];
// Celdas de la pen excluidas de la colocación (filas 13-15, cols 11-17).
const PEN_BOX = { x0: 11, y0: 13, x1: 17, y1: 15 };
```

`createGame()` (orden): copiar `MAZE` a `grid` (como hoy) → limpiar la celda de Pac-Man → `placePellets(grid)` → contar `dots` como celdas con valor 2 **o** 4.

`placePellets(grid)` garantiza que los 4 no se junten (requisito explícito del usuario):

```js
function placePellets( grid ) {
  // 1. Candidatas: celdas transitables (0 o 2) fuera de PEN_BOX y de PACMAN_START.
  // 2. Elegir una al azar, colocarla (grid[y][x] = 4) y descartar de las
  //    candidatas todas las que estén a < 8 celdas Manhattan de ella.
  // 3. Repetir hasta colocar PELLET_COUNT. La distancia mínima queda
  //    garantizada: el laberinto tiene ~200 celdas transitables repartidas
  //    (las 4 cámaras de las esquinas están a ≥ 20 celdas Manhattan entre
  //    sí), así que el pool nunca se agota antes de colocar los 4.
}
```

Estado nuevo:

```js
frightTimer: 0,  // frames restantes; 0 = sin modo asustado
frightSeq: 0,    // fantasmas comidos en la secuencia actual (para el pico 200/400/800/1600)
// por fantasma: g.frightened = false
```

El valor de tile nuevo es `4` (power pellet), escrito solo en `game.grid` en la colocación. `MAZE` permanece prístino.

## Plan de implementación

1. **Colocación y comida básica.** `maze.js` no cambia. `game.js`: constantes + `placePellets(grid)` + `PEN_BOX`, llamada en `createGame`, conteo sobre valores 2 y 4, y en `movePacman` tratar `grid[p.y][p.x] === 4` → `score += 50; dotsRemaining--; grid=0` (aún sin asustar). `render.js`: `drawDots` dibuja el valor 4 como círculo grande (~r 7) parpadeando (alternar según `frame`, p. ej. cada 30 frames) y `draw()` le pasa el `frame`. Verificación: cada Start coloca 4 pellets grandes en sitios (normalmente) distintos; comerlos da +50 y la partida se puede ganar.
2. **Modo asustado.** `game.js`: `startFright(game)` — `frightTimer = 360; frightSeq = 0;` y para cada fantasma liberado: `frightened = true` + `g.dir = OPPOSITE[g.dir]`. En `update()`: decrementar `frightTimer` y al llegar a 0 limpiar `frightened` de todos. En `moveGhost`: velocidad `g.speed * FRIGHT_SPEED_FACTOR` si `g.frightened`. En `decideGhost`: si `g.frightened`, dirección aleatoria válida (sin la inversa) en vez de `chooseByTarget`. `render.js`: `drawGhost` recibe el fantasma; si `frightened`, cuerpo azul `#2121ff` y, si `frightTimer <= 120`, alternar azul/blanco cada ~6 frames (ojos intactos). Verificación: al comer un pellet, los liberados invierten, se vuelven azules, zigzaguean lentos, parpadean al final y recuperan color/IA a los 6 s.
3. **Comer fantasmas.** `update()`: en el bucle de colisiones, si el fantasma está `released && frightened`, Pac-Man se lo come: `score += FRIGHT_SCORES[Math.min(game.frightSeq, 3)]; game.frightSeq++;` y vuelve a la pen (`released=false; frightened=false; x/y = GHOST_STARTS[i].x/y; dir='up'`); continuar con el resto. En cualquier otro caso, la colisión pierde vida como hoy. Verificación: 200/400/800/1600 en orden; el comido reaparece en la pen y se re-libera normal con su condición.
4. **Reinicio y límites.** Verificar que Start regenere la colocación, que `resetPositions` no toque `frightTimer`/`frightSeq` (el asustado sigue su curso tras perder una vida) y que `MAZE` no se mute. Sin cambios nuevos salvo ajustes que salgan. Verificación: muerte no resetea el asustado; Start sí.

## Criterios de aceptación

- [x] Al abrir `src/index.html` no hay errores en la consola.
- [x] Cada partida tiene exactamente 4 power pellets en celdas transitables (0/2), fuera de la pen (filas 13-15, cols 11-17), fuera de (13,23) y **siempre** a ≥ 8 celdas Manhattan entre sí (nunca amontonados).
- [x] Cada Start recoloca los pellets al azar (dos Starts seguidos casi siempre muestran una colocación distinta).
- [x] Comer un power pellet suma exactamente 50 puntos y queda comido (progresa hacia ganar).
- [x] Al comer un pellet, todo fantasma liberado invierte su dirección, se vuelve azul y va a mitad de velocidad (1/16 el `chaser`, 1/20 el resto).
- [x] Los fantasmas azules eligen dirección aleatoria (sin vuelta atrás) en cada cruce, en vez de su IA de objetivo.
- [x] El modo asustado dura 360 frames; en los últimos 120 el fantasma parpadea azul/blanco; al acabar recupera color, velocidad e IA del scatter/chase vigente.
- [x] Comerse un fantasma azul suma 200, 400, 800 y 1600 en orden; cada pellet nuevo vuelve la secuencia a 200.
- [x] El fantasma comido vuelve a la pen y se re-libera con su regla de SPEC 01/02, naciendo con su color normal aunque queden frames de asustado.
- [x] Un fantasma no asustado que choca con Pac-Man sigue quitando una vida; sin asustado, la partida se juega igual que hoy.
- [x] Comer pellets cuenta para la liberación por dots de SPEC 01 (`dotsEaten = totalDots - dotsRemaining`).
- [x] Hay que comerse todos los dots y pellets para ganar; perder una vida conserva lo ya comido.
- [x] `MAZE` no se muta; Start regenera los 4 pellets y reinicia `frightTimer`/`frightSeq`.

## Decisiones tomadas y descartadas

- **Sí:** posición **aleatoria por partida** para los 4 pellets (decisión explícita del usuario). **Distancia mínima garantizada** ≥ 8 celdas Manhattan: tras cada colocación se descartan del pool las celdas a menos de 8, de modo que nunca quedan amontonados.
- **No:** los 4 puntos fijos del arcade (1,3), (26,3), (1,23), (26,23). Eran la recomendación por fidelidad (y ya tienen dot en el laberinto), pero el usuario eligió aleatorios.
- **Sí:** 6 s de asustado (360 frames) con parpadeo de aviso en los últimos 2 s (120 frames), como el arcade.
- **Sí:** al comer el pellet: reversa inmediata + mitad de velocidad + dirección aleatoria en los cruces. Es el zigzag clásico y da mérito a comerse fantasmas.
- **Sí:** 200→400→800→1600 con reinicio por pellet; a partir del 4º fantasma de la secuencia, 1600.
- **Sí:** el fantasma comido vuelve a la pen y se re-libera solo (usa la maquinaria de SPEC 01/02). Como sus condiciones ya están cumplidas, reaparece en su spawn casi de inmediato; nace con color normal, no azul.
- **No:** animación de ojos caminando de vuelta. Trabajo visible; spec propia.
- **Sí:** el pellet cuenta como comestible para `dotsRemaining` y para las liberaciones por dots. Coincide con el arcade (los energizadores cuentan como dots).
- **Sí:** comer un pellet con asustado activo reinicia temporizador y secuencia y vuelve a invertir. Comportamiento arcade.
- **No:** duración/velocidad/puntos por nivel, frutas ni sonidos. Sin niveles ni audio en el proyecto.

## Riesgos

| Riesgo | Mitigación |
| ------ | ---------- |
| Colocación aleatoria: pellets muy juntos o en zonas muertas | El pool se filtra tras cada colocación (se descartan las celdas a < 8 Manhattan), lo que **garantiza** la separación; el pool es tan grande (~200 celdas) que nunca se agota antes de colocar los 4. |
| Un pellet sobre celda vacía aumenta `totalDots` y altera la cuenta | Se acepta: `dotsRemaining` se calcula tras colocar (valores 2 y 4); la liberación por dots se ajusta sola (`dotsEaten`). Coherente con el arcade. |
| El fantasma comido re-entra en la pen y re-libera en medio de una colisión | Re-usa el flujo de SPEC 01/02; la re-liberación ocurre en el `update()` siguiente, no dentro del bucle de colisiones. |
| Reversa aplicada a mitad de celda | Invierten sobre el camino que ya recorrieron → la celda de destino es siempre transitable; la alineación no se rompe porque la velocidad sigue siendo fracción unitaria. Verificar en el paso 2. |
| `frightSeq` desborda si se comen más de 4 | `FRIGHT_SCORES[Math.min(frightSeq, 3)]`; 4º y siguientes valen 1600. |

## Qué **no** entra en esta spec

- Animación de ojos de vuelta a la pen.
- Sonidos/melodías.
- Frutas y secuencia de puntos extra.
- Niveles (duración/velocidad por nivel).

Cada uno de esos, si llega, va en su propia spec.