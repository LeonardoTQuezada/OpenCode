// game.js
// Estado y reglas. Depende de globals de maze.js: MAZE, TUNNEL_ROW,
// PACMAN_START, GHOST_STARTS.

const DIRS = {
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
};
const OPPOSITE = { left: 'right', right: 'left', up: 'down', down: 'up' };

const PACMAN_SPEED = 0.125; // 1/8 celda/frame -> alinea cada 8 frames

// Power pellets y modo asustado (SPEC 03).
const PELLET_COUNT = 4;
const PELLET_SCORE = 50;
const FRIGHT_FRAMES = 360;       // 6 s a ~60 fps
const FRIGHT_FLASH = 120;        // ultimos 2 s: parpadeo blanco/azul
const FRIGHT_SPEED_FACTOR = 0.5; // mitad de velocidad
const FRIGHT_SCORES = [ 200, 400, 800, 1600 ];
// Celdas de la pen excluidas de la colocacion (filas 13-15, cols 11-17).
const PEN_BOX = { x0: 11, y0: 13, x1: 17, y1: 15 };

// Agenda de fases scatter/chase (duraciones en frames). La ultima es chase
// indefinida (Infinity nunca llega a 0 al decrementar).
const MODE_SCHEDULE = [
  { mode: 'scatter', frames: 420 },  // 7 s
  { mode: 'chase',   frames: 1200 }, // 20 s
  { mode: 'scatter', frames: 420 },  // 7 s
  { mode: 'chase',   frames: 1200 }, // 20 s
  { mode: 'scatter', frames: 300 },  // 5 s
  { mode: 'chase',   frames: Infinity },
];

// Coloca PELLET_COUNT power pellets (valor 4) en celdas transitables
// aleatorias de la copia de MAZE. Los 4 quedan siempre a >= 8 celdas
// Manhattan entre si: tras cada colocacion se descartan del pool las
// celdas a < 8 de la elegida.
function placePellets( grid ) {
  // 1. Candidatas: celdas transitables (0 o 2) fuera de la pen y del
  //    inicio de Pacman.
  const candidates = [];
  for ( let y = 0; y < grid.length; y++ ) {
    for ( let x = 0; x < grid[ 0 ].length; x++ ) {
      const v = grid[ y ][ x ];
      if ( v !== 0 && v !== 2 ) continue;
      if ( x >= PEN_BOX.x0 && x <= PEN_BOX.x1 && y >= PEN_BOX.y0 && y <= PEN_BOX.y1 ) continue;
      if ( x === PACMAN_START.x && y === PACMAN_START.y ) continue;
      candidates.push( { x, y } );
    }
  }

  // 2 y 3. Elegir al azar, colocar y descartar las cercanas (a < 8
  // Manhattan). El pool (~200 celdas) nunca se agota antes de los 4.
  for ( let placed = 0; placed < PELLET_COUNT && candidates.length > 0; placed++ ) {
    const chosen = candidates[ Math.floor( Math.random() * candidates.length ) ];
    grid[ chosen.y ][ chosen.x ] = 4;
    for ( let i = candidates.length - 1; i >= 0; i-- ) {
      const c = candidates[ i ];
      if ( Math.abs( c.x - chosen.x ) + Math.abs( c.y - chosen.y ) < 8 ) {
        candidates.splice( i, 1 );
      }
    }
  }
}

// Crea una partida nueva. Copia MAZE (pristino) a game.grid para poder comer
// dots sin destruir el original, y reiniciar.
function createGame() {
  const grid = MAZE.map( ( row ) => row.slice() );
  // La celda de inicio de Pacman arranca sin dot.
  grid[ PACMAN_START.y ][ PACMAN_START.x ] = 0;
  placePellets( grid );

  let dots = 0;
  for ( const row of grid ) for ( const v of row ) if ( v === 2 || v === 4 ) dots++;

  return {
    state: 'start',
    score: 0,
    lives: 3,
    dotsRemaining: dots,
    frameCount: 0,   // para liberacion por tiempo
    totalDots: dots, // para liberacion por dots
    frightTimer: 0,  // frames restantes de modo asustado; 0 = sin asustado
    frightSeq: 0,    // fantasmas comidos en la secuencia actual (200/400/800/1600)
    ghostMode: { index: 0, mode: 'scatter', timer: 420 },
    grid,
    pacman: {
      x: PACMAN_START.x,
      y: PACMAN_START.y,
      dir: 'left',
      nextDir: null,
      speed: PACMAN_SPEED,
    },
    ghosts: GHOST_STARTS.map( ( g ) => ( {
      // El chaser (release inmediato) nace ya en su spawn del pasillo (13,11);
      // el resto nace en la pen y espera quieto hasta cumplir su condicion.
      x: g.release === 'immediate' ? g.spawn.x : g.x,
      y: g.release === 'immediate' ? g.spawn.y : g.y,
      dir: g.release === 'immediate' ? g.spawn.dir : 'up',
      speed: g.speed,
      kind: g.kind,
      corner: g.corner,
      spawn: g.spawn,
      released: g.release === 'immediate',
      frightened: false, // azul, lento y aleatorio solo tras comer un pellet
    } ) ),
  };
}

function aligned( v ) {
  return Math.abs( v - Math.round( v ) ) < 1e-3;
}

// Una celda es muro para el actor dado?
//   pacman: bloqueado por pared (1) y puerta (3)
//   ghost:  bloqueado solo por pared (1)
function isWall( grid, x, y, actor ) {
  if ( y < 0 || y >= grid.length ) return true;
  if ( x < 0 || x >= grid[ 0 ].length ) return true;
  const v = grid[ y ][ x ];
  if ( v === 1 ) return true;
  if ( v === 3 && actor === 'pacman' ) return true;
  return false;
}

// Puede el actor avanzar desde (x,y) en la direccion dir?
function canMove( grid, x, y, dir, actor ) {
  const d = DIRS[ dir ];
  if ( !d ) return false;
  const tx = x + d.x;
  const ty = y + d.y;
  // Tunel: salir por un borde en la fila del tunel siempre es valido.
  if ( ty === TUNNEL_ROW && ( tx < 0 || tx >= grid[ 0 ].length ) ) return true;
  return !isWall( grid, tx, ty, actor );
}

function wrapTunnel( a, width ) {
  if ( Math.round( a.y ) === TUNNEL_ROW ) {
    if ( a.x < 0 ) a.x += width;
    else if ( a.x >= width ) a.x -= width;
  }
}

function movePacman( game ) {
  const p = game.pacman;
  const grid = game.grid;
  const width = grid[ 0 ].length;

  if ( aligned( p.x ) && aligned( p.y ) ) {
    p.x = Math.round( p.x );
    p.y = Math.round( p.y );

    // Aplicar giro pendiente si es posible.
    if ( p.nextDir && canMove( grid, p.x, p.y, p.nextDir, 'pacman' ) ) {
      p.dir = p.nextDir;
      p.nextDir = null;
    }
    // Comer dot.
    if ( grid[ p.y ][ p.x ] === 2 ) {
      grid[ p.y ][ p.x ] = 0;
      game.score += 10;
      game.dotsRemaining--;
    }
    // Comer power pellet: asusta a los fantasmas liberados.
    if ( grid[ p.y ][ p.x ] === 4 ) {
      grid[ p.y ][ p.x ] = 0;
      game.score += PELLET_SCORE;
      game.dotsRemaining--;
      startFright( game );
    }
    // Si no puede seguir, se detiene en la celda.
    if ( !canMove( grid, p.x, p.y, p.dir, 'pacman' ) ) return;
  }

  const d = DIRS[ p.dir ];
  p.x += d.x * p.speed;
  p.y += d.y * p.speed;
  wrapTunnel( p, width );
}

// Celda redondeada de Pac-Man (objetivo base de la mayoria de fantasmas).
function pacmanCell( game ) {
  const p = game.pacman;
  return { x: Math.round( p.x ), y: Math.round( p.y ) };
}

// Celda a `tiles` posiciones delante de Pac-Man en su dir, recortada al grid.
function aheadCell( pacman, tiles ) {
  const d = DIRS[ pacman.dir ] || { x: 0, y: 0 };
  return {
    x: Math.max( 0, Math.min( MAZE[ 0 ].length - 1, Math.round( pacman.x ) + d.x * tiles ) ),
    y: Math.max( 0, Math.min( MAZE.length - 1, Math.round( pacman.y ) + d.y * tiles ) ),
  };
}

// Celda para el flanker: 2·P − B, con P dos celdas delante del pacman y B la
// celda del chaser. Sin chaser devuelve P.
function flankCell( game ) {
  const P = aheadCell( game.pacman, 2 );
  const chaser = game.ghosts.find( ( g ) => g.kind === 'chaser' );
  if ( !chaser ) return P;
  const B = { x: Math.round( chaser.x ), y: Math.round( chaser.y ) };
  return {
    x: Math.max( 0, Math.min( MAZE[ 0 ].length - 1, 2 * P.x - B.x ) ),
    y: Math.max( 0, Math.min( MAZE.length - 1, 2 * P.y - B.y ) ),
  };
}

// Objetivo de cada fantasma segun su kind. En scatter, todos a su esquina.
function ghostTarget( game, g ) {
  if ( game.ghostMode.mode === 'scatter' ) return g.corner;
  if ( g.kind === 'chaser' ) return pacmanCell( game );
  if ( g.kind === 'ambusher' ) return aheadCell( game.pacman, 4 );
  if ( g.kind === 'flanker' ) return flankCell( game );
  const pc = pacmanCell( game );
  const dist = Math.abs( Math.round( g.x ) - pc.x ) + Math.abs( Math.round( g.y ) - pc.y );
  return dist < 8 ? g.corner : pc;
}

// Greedy Manhattan: elige el dir (sin volver atras) que mas reduce la
// distancia al objetivo. Es el criterio del hunter original, extraido.
function chooseByTarget( game, g, target ) {
  const grid = game.grid;
  const options = Object.keys( DIRS ).filter(
    ( dir ) => dir !== OPPOSITE[ g.dir ] && canMove( grid, g.x, g.y, dir, 'ghost' )
  );
  // Sin salida (callejon): permitir el giro de 180.
  const choices = options.length ? options : [ OPPOSITE[ g.dir ] ];

  let best = choices[ 0 ];
  let bestDist = Infinity;
  for ( const dir of choices ) {
    const d = DIRS[ dir ];
    const nx = g.x + d.x;
    const ny = g.y + d.y;
    const dist = Math.abs( nx - target.x ) + Math.abs( ny - target.y );
    if ( dist < bestDist ) {
      bestDist = dist;
      best = dir;
    }
  }
  return best;
}

function decideGhost( game, g ) {
  // Asustado: direccion aleatoria valida (sin volver atras) en cada cruce,
  // en vez de la IA de objetivo. Es el zigzag clasico del modo asustado.
  if ( g.frightened ) {
    const options = Object.keys( DIRS ).filter(
      ( dir ) => dir !== OPPOSITE[ g.dir ] && canMove( game.grid, g.x, g.y, dir, 'ghost' )
    );
    // Sin salida (callejon): permitir el giro de 180.
    g.dir = options.length ? options[ Math.floor( Math.random() * options.length ) ] : OPPOSITE[ g.dir ];
    return;
  }
  g.dir = chooseByTarget( game, g, ghostTarget( game, g ) );
}

function moveGhost( game, g ) {
  if ( !g.released ) return; // no liberado: espera quieto en la pen

  const grid = game.grid;
  const width = grid[ 0 ].length;

  if ( aligned( g.x ) && aligned( g.y ) ) {
    g.x = Math.round( g.x );
    g.y = Math.round( g.y );
    decideGhost( game, g );
    if ( !canMove( grid, g.x, g.y, g.dir, 'ghost' ) ) return;
  }

  const d = DIRS[ g.dir ];
  // Asustado: mitad de velocidad (1/16 chaser, 1/20 el resto), sigue siendo
  // fraccion unitaria de celda y no rompe la alineacion.
  const speed = g.frightened ? g.speed * FRIGHT_SPEED_FACTOR : g.speed;
  g.x += d.x * speed;
  g.y += d.y * speed;
  wrapTunnel( g, width );
}

function resetPositions( game ) {
  const p = game.pacman;
  p.x = PACMAN_START.x;
  p.y = PACMAN_START.y;
  p.dir = 'left';
  p.nextDir = null;
  game.ghosts.forEach( ( g, i ) => {
    if ( g.released ) {
      // Liberados: reaparecen en el spawn del pasillo con su direccion,
      // conservando `released` (no re-ejecutan la secuencia de liberacion).
      g.x = g.spawn.x;
      g.y = g.spawn.y;
      g.dir = g.spawn.dir;
    } else {
      // No liberados: vuelven a su celda de la pen.
      g.x = GHOST_STARTS[ i ].x;
      g.y = GHOST_STARTS[ i ].y;
      g.dir = 'up';
    }
  } );
}

function collides( a, b ) {
  return Math.abs( a.x - b.x ) < 0.5 && Math.abs( a.y - b.y ) < 0.5;
}

// Libera a un fantasma: sale de la pen y aparece directamente en su spawn
// del pasillo (13,11). La direccion del spawn es 'up', de modo que en el
// primer cruce 'down' (la opuesta) queda excluida y no re-entra por la puerta.
function releaseGhost( game, g ) {
  g.released = true;
  g.x = g.spawn.x;
  g.y = g.spawn.y;
  g.dir = g.spawn.dir;
}

// Activa el modo asustado: reinicia temporizador y secuencia de puntos, y
// los fantasmas liberados se vuelven azules invirtiendo su direccion.
// Comer un pellet con el modo ya activo reinicia ambos (comportamiento arcade).
function startFright( game ) {
  game.frightTimer = FRIGHT_FRAMES;
  game.frightSeq = 0;
  game.ghosts.forEach( ( g ) => {
    if ( !g.released ) return;
    g.frightened = true;
    g.dir = OPPOSITE[ g.dir ];
  } );
}

function update( game ) {
  game.frameCount++;

  // Modo asustado: decrementar el temporizador; al llegar a 0 los fantasmas
  // recuperan color, velocidad e IA del scatter/chase vigente.
  if ( game.frightTimer > 0 ) {
    game.frightTimer--;
    if ( game.frightTimer <= 0 ) {
      game.ghosts.forEach( ( g ) => { g.frightened = false; } );
    }
  }

  // Fases scatter/chase: decrementar el timer y pasar a la siguiente al llegar a 0.
  const mode = game.ghostMode;
  mode.timer--;
  if ( mode.timer <= 0 ) {
    const next = MODE_SCHEDULE[ mode.index + 1 ];
    if ( next ) {
      mode.index++;
      mode.mode = next.mode;
      mode.timer = next.frames;
    }
  }

  // Liberar fantasmas que cumplen su condicion de salida (tiempo o dots).
  game.ghosts.forEach( ( g, i ) => {
    if ( g.released ) return;
    const rule = GHOST_STARTS[ i ].release;
    if ( rule === 'immediate' ) releaseGhost( game, g );
    else if ( rule.type === 'time' && game.frameCount >= rule.frames ) releaseGhost( game, g );
    else if ( rule.type === 'dots' && game.totalDots - game.dotsRemaining >= rule.count ) releaseGhost( game, g );
  } );

  movePacman( game );
  game.ghosts.forEach( ( g ) => moveGhost( game, g ) );

  for ( let i = 0; i < game.ghosts.length; i++ ) {
    const g = game.ghosts[ i ];
    if ( !collides( game.pacman, g ) ) continue;

    // Fantasma liberado y asustado: Pac-Man se lo come. Puntua por la
    // secuencia 200/400/800/1600 y el fantasma vuelve a la pen; se re-libera
    // solo con su regla de SPEC 01/02 (creciendo con color normal).
    if ( g.released && g.frightened ) {
      game.score += FRIGHT_SCORES[ Math.min( game.frightSeq, 3 ) ];
      game.frightSeq++;
      g.released = false;
      g.frightened = false;
      g.x = GHOST_STARTS[ i ].x;
      g.y = GHOST_STARTS[ i ].y;
      g.dir = 'up';
      continue; // seguir comprobando el resto de fantasmas
    }

    // Colision normal: pierde una vida.
    game.lives--;
    if ( game.lives <= 0 ) {
      game.state = 'lost';
      return;
    }
    resetPositions( game );
    break;
  }

  if ( game.dotsRemaining <= 0 ) game.state = 'won';
}

window.createGame = createGame;
window.update = update;
window.DIRS = DIRS;
