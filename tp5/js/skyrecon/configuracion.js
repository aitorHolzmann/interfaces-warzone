// Configuracion general de Sky Recon

const ESCENARIO = {
  ANCHO: 800,        // ancho del area de juego en px
  ALTO: 500,         // alto total del area de juego en px
  TECHO: 10,         // limite superior hasta donde sube el dron
  ALTURA_SUELO: 64,  // alto de la franja del suelo en px
  PISO: 436          // limite inferior de vuelo (ALTO - ALTURA_SUELO)
};

const FISICA = {
  GRAVEDAD: 1300,        // aceleracion hacia abajo en px/s²
  IMPULSO: 430,          // velocidad hacia arriba al saltar en px/s
  VEL_BASE: 200,         // velocidad horizontal inicial del juego en px/s
  VEL_MAX: 1000,         // tope de velocidad horizontal progresiva en px/s
  ACELERACION_VEL: 0,    // px/s extra por segundo sobrevivido (0 = velocidad constante)
  VEL_MENU: 55,          // velocidad suave del fondo en el menu inicial
  MULT_TURBO: 1.65,      // multiplicador de velocidad mientras dura el turbo
  VEL_EXTRA_MISIL: 115,  // velocidad adicional del misil respecto al escenario
  DT_MAXIMO: 0.05        // tope de delta time para evitar saltos al cambiar de pestana
};

const REGLAS_TIEMPO = {
  TIEMPO_INICIAL: 15,         // combustible inicial al empezar en segundos
  TIEMPO_MAXIMO: 60,          // tope del tanque y 100% de la barra del HUD
  BONUS_COMBUSTIBLE: 6,       // segundos que recarga cada bidon de combustible
  PENALIDAD_TORRE: 4,         // segundos perdidos al chocar una torre
  PENALIDAD_SUELO: 2,         // segundos perdidos al tocar el piso
  PENALIDAD_PELIGRO: 3,       // segundos perdidos al chocar una bomba o misil
  DURACION_TURBO: 3,          // duracion del efecto turbo en segundos
  DURACION_INVULNERABLE: 1.2, // segundos de inmunidad despues de un choque
  COOLDOWN_REINICIO: 0.6      // espera al perder para no reiniciar por accidente
};

const CONFIG_TORRES = {
  ANCHO: 76,              // ancho de cada columna en px
  PAD_X: 6,               // margen horizontal interno de la hitbox en px
  PAD_Y: 4,               // margen vertical interno de la hitbox en px
  HUECO_INICIAL: 210,     // abertura inicial entre torre superior e inferior
  HUECO_MIN: 115,         // abertura minima a la que puede llegar con el tiempo
  REDUCCION_POR_SEG: 1.8, // cuantos px se achica el hueco por cada segundo de partida
  VARIACION_HUECO: 20,    // variacion al azar +- en px respecto al hueco actual
  DIST_MIN: 260,          // distancia horizontal minima entre dos torres
  DIST_MAX: 400,          // distancia horizontal maxima entre dos torres
  MARGEN_VERTICAL: 36     // distancia minima del hueco respecto al techo y al piso
};

// Cada capa tiene: factor (velocidad relativa; 1.0 = igual a las torres), anchoTile y enSuelo
const CAPAS_PARALLAX = [
  { nombre: 'cielo',    imagen: 'assets/images/skyrecon/parallax-1-cielo.png',    factor: 0.10, anchoTile: 800, alto: 500, enSuelo: false },
  { nombre: 'montanas', imagen: 'assets/images/skyrecon/parallax-2-montanas.png', factor: 0.25, anchoTile: 800, alto: 500, enSuelo: false },
  { nombre: 'base',     imagen: 'assets/images/skyrecon/parallax-3-base.png',     factor: 0.50, anchoTile: 800, alto: 500, enSuelo: false },
  { nombre: 'suelo',    imagen: 'assets/images/skyrecon/parallax-4-suelo.png',    factor: 1.00, anchoTile: 800, alto: 64,  enSuelo: true  }
];

const CONFIG_DRON = {
  xInicial: 150, // posicion X fija del dron en pantalla
  yInicial: 195, // altura inicial al empezar o en el menu
  ancho: 64,     // ancho de un cuadro del spritesheet del dron
  alto: 44,      // alto de un cuadro del spritesheet del dron
  padX: 12,      // margen horizontal para achicar la hitbox del dron
  padY: 9,       // margen vertical para achicar la hitbox del dron
  estados: {
    vuela:   { imagen: 'assets/images/skyrecon/sprite-dron-vuela.png',   frames: 4, duracion: '0.42s' },
    impulso: { imagen: 'assets/images/skyrecon/sprite-dron-impulso.png', frames: 4, duracion: '0.26s' },
    choca:   { imagen: 'assets/images/skyrecon/sprite-dron-choca.png',   frames: 4, duracion: '0.52s' },
    turbo:   { imagen: 'assets/images/skyrecon/sprite-dron-turbo.png',   frames: 4, duracion: '0.2s'  }
  }
};

const CONTROL_GENERACION = {
  probabilidadPorCorredor: 0.92,  // probabilidad de que salga un item entre dos torres
  maxCorredoresSinCombustible: 2, // maximo de espacios seguidos sin bidon de combustible
  espacioLibreMinimoCorredor: 130, // px libres minimos entre torres para meter un item
  pesosCorredor: {
    combustible: 30, // peso relativo del bidon de combustible
    mina: 50,        // peso relativo de la bomba/mina aerea
    nitro: 20        // peso relativo de la celula de nitro
  },
  misiles: {
    habilitados: true,        // activa o desactiva la aparicion de misiles
    cadaSegundosMin: 3.5,     // tiempo minimo en segundos entre misiles
    cadaSegundosMax: 6.0,     // tiempo maximo en segundos entre misiles
    separacionVerticalMin: 75 // distancia vertical minima respecto a otros items cercanos
  }
};

// Cada elemento define medidas, margen de hitbox (padX/padY), esBonus, sprite, movimiento y efecto
const CATALOGO_ELEMENTOS = {
  combustible: {
    ancho: 48,
    alto: 48,
    padX: 8,
    padY: 8,
    esBonus: true,
    sprite: {
      imagen: 'assets/images/skyrecon/sprite-combustible.png',
      frames: 4,
      duracion: '0.6s'
    },
    movimiento: { velExtraX: 0, amplitudY: 9, frecuenciaY: 3.5 },
    alColisionar: (juego, x, y) => {
      juego.recargarCombustible(REGLAS_TIEMPO.BONUS_COMBUSTIBLE, x, y);
    }
  },
  nitro: {
    ancho: 48,
    alto: 48,
    padX: 8,
    padY: 8,
    esBonus: true,
    sprite: {
      imagen: 'assets/images/skyrecon/sprite-nitro.png',
      frames: 6,
      duracion: '0.65s'
    },
    movimiento: { velExtraX: 0, amplitudY: 10, frecuenciaY: 4.0 },
    alColisionar: (juego, x, y) => {
      juego.activarTurbo(REGLAS_TIEMPO.DURACION_TURBO, x, y);
    }
  },
  mina: {
    ancho: 48,
    alto: 48,
    padX: 10,
    padY: 10,
    esBonus: false,
    sprite: {
      imagen: 'assets/images/skyrecon/sprite-mina.png',
      frames: 4,
      duracion: '0.55s'
    },
    movimiento: { velExtraX: 0, amplitudY: 14, frecuenciaY: 3.0 },
    alColisionar: (juego, x, y) => {
      juego.aplicarDano(REGLAS_TIEMPO.PENALIDAD_PELIGRO, '-3s BOMBA', x, y);
    }
  },
  misil: {
    ancho: 64,
    alto: 32,
    padX: 10,
    padY: 7,
    esBonus: false,
    sprite: {
      imagen: 'assets/images/skyrecon/sprite-misil.png',
      frames: 4,
      duracion: '0.32s'
    },
    movimiento: { velExtraX: FISICA.VEL_EXTRA_MISIL, amplitudY: 0, frecuenciaY: 0 },
    alColisionar: (juego, x, y) => {
      juego.aplicarDano(REGLAS_TIEMPO.PENALIDAD_PELIGRO, '-3s MISIL', x, y);
    }
  }
};

const CLAVE_RECORD_LS = 'skyrecon_record_tiempo'; // clave en localStorage para guardar el record

function azar(min, max) {
  return Math.random() * (max - min) + min;
}

function limitar(valor, min, max) {
  return Math.max(min, Math.min(max, valor));
}

function choca(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function formatearSegundos(segundos) {
  return `${Math.max(0, segundos).toFixed(1)}s`;
}

function aplicarSpritesheet(el, sprite, anchoFrame, altoFrame) {
  const anchoTotal = anchoFrame * sprite.frames;
  el.style.backgroundImage = `url('${sprite.imagen}')`;
  el.style.backgroundSize = `${anchoTotal}px ${altoFrame}px`;
  el.style.setProperty('--sprite-desplazamiento', `${-anchoTotal}px`);
  el.style.setProperty('--sprite-frames', String(sprite.frames));
  el.style.setProperty('--sprite-duracion', sprite.duracion);
}

function obtenerRutasPrecarga() {
  const rutas = new Set();
  for (const capa of CAPAS_PARALLAX) rutas.add(capa.imagen);
  for (const estado of Object.values(CONFIG_DRON.estados)) rutas.add(estado.imagen);
  for (const elem of Object.values(CATALOGO_ELEMENTOS)) rutas.add(elem.sprite.imagen);
  return Array.from(rutas);
}

function precargarImagenes(rutas) {
  return Promise.all(
    rutas.map((ruta) => new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = ruta;
    }))
  );
}
