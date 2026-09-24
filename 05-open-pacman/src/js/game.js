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

// Crea una partida nueva. Copia MAZE (pristino) a game.grid para poder comer
// dots sin destruir el original, y reiniciar.
function createGame() {
  const grid = MAZE.map( ( row ) => row.slice() );
  // La celda de inicio de Pacman arranca sin dot.
  grid[ PACMAN_START.y ][ PACMAN_START.x ] = 0;

  let dots = 0;
  for ( const row of grid ) for ( const v of row ) if ( v === 2 ) dots++;

  return {
    state: 'start',
    score: 0,
    lives: 3,
    dotsRemaining: dots,
    frameCount: 0,   // para liberacion por tiempo
    totalDots: dots, // para liberacion por dots
    grid,
    pacman: {
      x: PACMAN_START.x,
      y: PACMAN_START.y,
      dir: 'left',
      nextDir: null,
      speed: PACMAN_SPEED,
    },
    ghosts: GHOST_STARTS.map( ( g ) => ( {
      x: g.x,
      y: g.y,
      dir: 'up',
      speed: g.speed,
      kind: g.kind,
      corner: g.corner,
      released: g.release === 'immediate',
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

// Objetivo de cada fantasma segun su kind:
//   chaser:   celda de Pac-Man
//   ambusher: 4 celdas delante de Pac-Man
//   flanker:  flankCell (2·P − B)
//   shy:      su esquina si Pac-Man esta a < 8 celdas, si no le persigue
function ghostTarget( game, g ) {
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
  g.x += d.x * g.speed;
  g.y += d.y * g.speed;
  wrapTunnel( g, width );
}

function resetPositions( game ) {
  const p = game.pacman;
  p.x = PACMAN_START.x;
  p.y = PACMAN_START.y;
  p.dir = 'left';
  p.nextDir = null;
  game.ghosts.forEach( ( g, i ) => {
    g.x = GHOST_STARTS[ i ].x;
    g.y = GHOST_STARTS[ i ].y;
    g.dir = 'up';
  } );
}

function collides( a, b ) {
  return Math.abs( a.x - b.x ) < 0.5 && Math.abs( a.y - b.y ) < 0.5;
}

function update( game ) {
  game.frameCount++;

  // Liberar fantasmas que cumplen su condicion de salida (tiempo o dots).
  game.ghosts.forEach( ( g, i ) => {
    if ( g.released ) return;
    const rule = GHOST_STARTS[ i ].release;
    if ( rule === 'immediate' ) g.released = true;
    else if ( rule.type === 'time' && game.frameCount >= rule.frames ) g.released = true;
    else if ( rule.type === 'dots' && game.totalDots - game.dotsRemaining >= rule.count ) g.released = true;
  } );

  movePacman( game );
  game.ghosts.forEach( ( g ) => moveGhost( game, g ) );

  for ( const g of game.ghosts ) {
    if ( collides( game.pacman, g ) ) {
      game.lives--;
      if ( game.lives <= 0 ) {
        game.state = 'lost';
        return;
      }
      resetPositions( game );
      break;
    }
  }

  if ( game.dotsRemaining <= 0 ) game.state = 'won';
}

window.createGame = createGame;
window.update = update;
window.DIRS = DIRS;
