// Parallax horizontal sincronizado con la velocidad actual del juego

class Parallax {
  constructor(contenedorEl, definiciones = CAPAS_PARALLAX) {
    this.contenedorEl = contenedorEl;
    this.contenedorEl.innerHTML = '';

    this.capas = definiciones.map((def, indice) => {
      const el = document.createElement('div');
      el.className = def.enSuelo ? 'capa-parallax capa-parallax-suelo' : 'capa-parallax';
      el.style.zIndex = String(indice + 1);
      el.style.height = `${def.alto}px`;
      el.style.backgroundImage = `url('${def.imagen}')`;
      el.style.backgroundSize = `${def.anchoTile}px ${def.alto}px`;
      this.contenedorEl.appendChild(el);

      return {
        el: el,
        factor: def.factor,
        anchoTile: def.anchoTile,
        x: 0
      };
    });
  }

  actualizar(dt, velActual) {
    for (const capa of this.capas) {
      capa.x = (capa.x + velActual * capa.factor * dt) % capa.anchoTile;
    }
  }

  dibujar() {
    for (const capa of this.capas) {
      capa.el.style.backgroundPositionX = `${-capa.x}px`;
    }
  }

  reiniciar() {
    for (const capa of this.capas) {
      capa.x = 0;
    }
    this.dibujar();
  }
}
