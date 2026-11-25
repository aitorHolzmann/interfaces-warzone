// Obstaculo compuesto por segmentos verticales (arriba y abajo del hueco)

class Torre {
  constructor(contenedorDOM, xInicial, centro, hueco) {
    this.x = xInicial;
    this.ancho = CONFIG_TORRES.ANCHO;
    this.centro = centro;
    this.hueco = hueco;
    this.superada = false;

    this.padX = CONFIG_TORRES.PAD_X;
    this.padY = CONFIG_TORRES.PAD_Y;

    const altoArriba = Math.max(24, Math.round(centro - hueco / 2));
    const yAbajo = Math.min(ESCENARIO.PISO - 24, Math.round(centro + hueco / 2));
    const altoAbajo = Math.max(24, ESCENARIO.PISO - yAbajo);

    this.altoArriba = altoArriba;
    this.yAbajo = yAbajo;
    this.altoAbajo = altoAbajo;

    this.segmentos = [
      { y: 0, alto: altoArriba, clase: 'torre-arriba', padTop: 0 },
      { y: yAbajo, alto: altoAbajo, clase: 'torre-abajo', padTop: this.padY }
    ];

    this.el = this.crearDOM();
    contenedorDOM.appendChild(this.el);
    this.dibujar();
  }

  crearDOM() {
    const par = document.createElement('div');
    par.className = 'torre-par';
    par.style.width = `${this.ancho}px`;

    for (const seg of this.segmentos) {
      par.appendChild(this.crearSegmentoDOM(seg));
    }

    return par;
  }

  crearSegmentoDOM(seg) {
    const el = document.createElement('div');
    el.className = `torre-segmento ${seg.clase}`;
    if (seg.y > 0) el.style.top = `${seg.y}px`;
    el.style.height = `${seg.alto}px`;

    const remate = document.createElement('div');
    remate.className = 'torre-remate';
    el.appendChild(remate);

    const debug = document.createElement('div');
    debug.className = 'hitbox-debug';
    debug.style.left = `${this.padX}px`;
    debug.style.top = `${seg.padTop}px`;
    debug.style.width = `${this.ancho - this.padX * 2}px`;
    debug.style.height = `${Math.max(0, seg.alto - this.padY)}px`;
    el.appendChild(debug);

    return el;
  }

  actualizar(dt, velActual) {
    this.x -= velActual * dt;
  }

  marcarSuperada() {
    this.superada = true;
    this.el.classList.add('superada');
  }

  hitboxes() {
    return this.segmentos.map((seg) => ({
      x: this.x + this.padX,
      y: seg.y + seg.padTop,
      w: this.ancho - this.padX * 2,
      h: Math.max(0, seg.alto - this.padY)
    }));
  }

  dibujar() {
    this.el.style.transform = `translateX(${this.x}px)`;
  }

  estaFueraDePantalla() {
    return this.x + this.ancho < -20;
  }

  destruir() {
    this.el.remove();
  }
}
