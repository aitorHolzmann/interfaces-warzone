// Entidad del dron jugador: fisica vertical, estados CSS e hitboxes

class Dron {
  constructor(contenedorEl, spriteEl, cfg = CONFIG_DRON) {
    this.el = contenedorEl;
    this.spriteEl = spriteEl;
    this.cfg = cfg;

    this.x = cfg.xInicial;
    this.y = cfg.yInicial;
    this.vy = 0;
    this.ancho = cfg.ancho;
    this.alto = cfg.alto;
    this.padX = cfg.padX;
    this.padY = cfg.padY;

    this.el.style.width = `${this.ancho}px`;
    this.el.style.height = `${this.alto}px`;
    this.spriteEl.style.width = `${this.ancho}px`;
    this.spriteEl.style.height = `${this.alto}px`;

    this.invulnerable = 0;
    this.enTurbo = false;
    this.estadoAnimacion = 'vuela';

    // Vuelve al estado continuo cuando termina el ciclo del spritesheet de impulso o choque
    this.spriteEl.addEventListener('animationend', (e) => {
      if (e.animationName !== 'ciclo-spritesheet') return;
      if (this.estadoAnimacion === 'impulso' || this.estadoAnimacion === 'choca') {
        this.ponerEstado(this.enTurbo ? 'turbo' : 'vuela');
      }
    });

    this.configurarHitboxDebug();
    this.reiniciar();
  }

  configurarHitboxDebug() {
    let debugEl = this.el.querySelector('.hitbox-debug');
    if (!debugEl) {
      debugEl = document.createElement('div');
      debugEl.className = 'hitbox-debug';
      this.el.appendChild(debugEl);
    }
    debugEl.style.left = `${this.padX}px`;
    debugEl.style.top = `${this.padY}px`;
    debugEl.style.width = `${this.ancho - this.padX * 2}px`;
    debugEl.style.height = `${this.alto - this.padY * 2}px`;
  }

  reiniciar() {
    this.x = this.cfg.xInicial;
    this.y = this.cfg.yInicial;
    this.vy = 0;
    this.invulnerable = 0;
    this.enTurbo = false;
    this.ponerEstado('vuela');
    this.dibujar();
  }

  // Asigna vy en vez de sumar para que el impulso responda igual aunque venga cayendo rapido
  impulsar() {
    this.vy = -FISICA.IMPULSO;
    if (this.estadoAnimacion !== 'choca') {
      this.ponerEstado('impulso');
    }
  }

  ponerEstado(nombre) {
    const estado = this.cfg.estados[nombre];
    if (!estado) return;

    this.estadoAnimacion = nombre;
    this.spriteEl.classList.remove(...Object.keys(this.cfg.estados));
    aplicarSpritesheet(this.spriteEl, estado, this.ancho, this.alto);
    void this.spriteEl.offsetWidth; // fuerza reflow para reiniciar la animacion CSS
    this.spriteEl.classList.add(nombre);
  }

  setTurbo(activo) {
    const cambio = this.enTurbo !== activo;
    this.enTurbo = activo;
    if (cambio && this.estadoAnimacion !== 'choca') {
      this.ponerEstado(activo ? 'turbo' : 'vuela');
    }
  }

  chocar() {
    if (this.invulnerable > 0) return false;
    this.invulnerable = REGLAS_TIEMPO.DURACION_INVULNERABLE;
    this.ponerEstado('choca');
    return true;
  }

  actualizarEnMenu(tiempoGlobal) {
    this.y = this.cfg.yInicial + Math.sin(tiempoGlobal * 3.2) * 10;
    this.vy = 0;
  }

  // Devuelve true si toco el suelo para aplicar el rebote y la penalidad
  actualizar(dt) {
    if (this.invulnerable > 0) {
      this.invulnerable = Math.max(0, this.invulnerable - dt);
    }

    this.vy += FISICA.GRAVEDAD * dt;
    this.y += this.vy * dt;

    if (this.y < ESCENARIO.TECHO) {
      this.y = ESCENARIO.TECHO;
      if (this.vy < 0) this.vy = 0;
    }

    const yMax = ESCENARIO.PISO - this.alto;
    if (this.y >= yMax) {
      this.y = yMax;
      this.vy = -FISICA.IMPULSO * 0.48;
      return true;
    }

    return false;
  }

  // Caja mas chica que el sprite para que no cobre choques en los bordes transparentes
  hitbox() {
    return {
      x: this.x + this.padX,
      y: this.y + this.padY,
      w: this.ancho - this.padX * 2,
      h: this.alto - this.padY * 2
    };
  }

  dibujar() {
    const ang = limitar(this.vy / 12, -25, 65);
    this.el.style.transform = `translate(${this.x}px, ${this.y}px) rotate(${ang}deg)`;
    this.el.classList.toggle('invulnerable', this.invulnerable > 0);
  }
}
