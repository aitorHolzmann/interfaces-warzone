// Elemento animado de escena configurado desde CATALOGO_ELEMENTOS

class ElementoEscena {
  constructor(contenedorDOM, tipo, xInicial, yInicial) {
    const cfg = CATALOGO_ELEMENTOS[tipo];
    this.tipo = tipo;
    this.cfg = cfg;

    this.x = xInicial;
    this.y = yInicial;
    this.yBase = yInicial;
    this.ancho = cfg.ancho;
    this.alto = cfg.alto;
    this.padX = cfg.padX;
    this.padY = cfg.padY;
    this.fase = azar(0, Math.PI * 2);

    this.tomado = false;
    this.listoParaEliminar = false;

    this.el = this.crearDOM();
    contenedorDOM.appendChild(this.el);
    this.dibujar();
  }

  crearDOM() {
    const el = document.createElement('div');
    el.className = `elemento-escena elemento-${this.tipo}`;
    el.style.width = `${this.ancho}px`;
    el.style.height = `${this.alto}px`;

    const sprite = document.createElement('div');
    sprite.className = 'elemento-sprite';
    aplicarSpritesheet(sprite, this.cfg.sprite, this.ancho, this.alto);
    el.appendChild(sprite);

    const debug = document.createElement('div');
    debug.className = this.cfg.esBonus ? 'hitbox-debug hitbox-debug-bonus' : 'hitbox-debug';
    debug.style.left = `${this.padX}px`;
    debug.style.top = `${this.padY}px`;
    debug.style.width = `${this.ancho - this.padX * 2}px`;
    debug.style.height = `${this.alto - this.padY * 2}px`;
    el.appendChild(debug);

    sprite.addEventListener('animationend', () => {
      if (this.tomado) {
        this.listoParaEliminar = true;
      }
    });

    return el;
  }

  actualizar(dt, velActual, tiempoGlobal) {
    const mov = this.cfg.movimiento;
    this.x -= (velActual + mov.velExtraX) * dt;

    if (mov.amplitudY > 0) {
      this.y = limitar(
        this.yBase + Math.sin(tiempoGlobal * mov.frecuenciaY + this.fase) * mov.amplitudY,
        ESCENARIO.TECHO + 10,
        ESCENARIO.PISO - this.alto - 10
      );
    }
  }

  aplicarEfecto(juego) {
    this.cfg.alColisionar(juego, this.x + this.ancho / 2, this.y);
  }

  hitbox() {
    return {
      x: this.x + this.padX,
      y: this.y + this.padY,
      w: this.ancho - this.padX * 2,
      h: this.alto - this.padY * 2
    };
  }

  marcarTomado() {
    if (this.tomado) return;
    this.tomado = true;
    this.el.classList.add('tomado');
  }

  dibujar() {
    this.el.style.transform = `translate(${this.x}px, ${this.y}px)`;
  }

  estaFueraDePantalla() {
    return this.x + this.ancho < -20 || this.listoParaEliminar;
  }

  destruir() {
    this.el.remove();
  }
}
