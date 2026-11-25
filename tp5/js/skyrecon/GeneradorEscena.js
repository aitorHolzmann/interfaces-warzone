// Generador de torres, items de corredor y misiles sin superposiciones

class GeneradorEscena {
  constructor(
    capaObstaculosEl,
    capaElementosEl,
    control = CONTROL_GENERACION,
    catalogo = CATALOGO_ELEMENTOS
  ) {
    this.capaObstaculosEl = capaObstaculosEl;
    this.capaElementosEl = capaElementosEl;
    this.control = control;
    this.catalogo = catalogo;
    this.reiniciar();
  }

  reiniciar() {
    this.distanciaProximaTorre = 140;
    this.corredoresSinCombustible = 0;
    this.tiempoProximoMisil = azar(
      this.control.misiles.cadaSegundosMin,
      this.control.misiles.cadaSegundosMax
    );
  }

  actualizar(dt, velActual, tiempoSobrevivido, torres, elementos) {
    this.distanciaProximaTorre -= velActual * dt;
    if (this.distanciaProximaTorre <= 0) {
      this.crearTorreYCorredor(tiempoSobrevivido, torres, elementos);
    }

    if (this.control.misiles.habilitados) {
      this.tiempoProximoMisil -= dt;
      if (this.tiempoProximoMisil <= 0) {
        this.intentarCrearMisil(torres, elementos);
      }
    }
  }

  crearTorreYCorredor(tiempoSobrevivido, torres, elementos) {
    const huecoBase = Math.max(
      CONFIG_TORRES.HUECO_MIN,
      CONFIG_TORRES.HUECO_INICIAL - tiempoSobrevivido * CONFIG_TORRES.REDUCCION_POR_SEG
    );
    const hueco = limitar(
      huecoBase + azar(-CONFIG_TORRES.VARIACION_HUECO, CONFIG_TORRES.VARIACION_HUECO),
      CONFIG_TORRES.HUECO_MIN,
      CONFIG_TORRES.HUECO_INICIAL + 15
    );

    const minCentro = ESCENARIO.TECHO + CONFIG_TORRES.MARGEN_VERTICAL + hueco / 2;
    const maxCentro = ESCENARIO.PISO - CONFIG_TORRES.MARGEN_VERTICAL - hueco / 2;
    const centro = azar(minCentro, maxCentro);

    const xTorre = ESCENARIO.ANCHO + 10;
    torres.push(new Torre(this.capaObstaculosEl, xTorre, centro, hueco));

    this.distanciaProximaTorre = azar(CONFIG_TORRES.DIST_MIN, CONFIG_TORRES.DIST_MAX);

    // Ubica como maximo 1 item en el punto medio libre entre esta torre y la siguiente
    const espacioLibre = this.distanciaProximaTorre - CONFIG_TORRES.ANCHO;
    if (espacioLibre < this.control.espacioLibreMinimoCorredor) return;

    const debeForzarCombustible = this.corredoresSinCombustible >= this.control.maxCorredoresSinCombustible;
    if (!debeForzarCombustible && Math.random() > this.control.probabilidadPorCorredor) {
      this.corredoresSinCombustible++;
      return;
    }

    const tipo = this.elegirTipoCorredor(debeForzarCombustible);
    const cfg = this.catalogo[tipo];
    if (!cfg) return;

    const xItem = xTorre + CONFIG_TORRES.ANCHO + espacioLibre / 2 - cfg.ancho / 2;
    const yItem = azar(ESCENARIO.TECHO + 32, ESCENARIO.PISO - cfg.alto - 32);
    elementos.push(new ElementoEscena(this.capaElementosEl, tipo, xItem, yItem));
  }

  elegirTipoCorredor(forzarCombustible) {
    if (forzarCombustible) {
      this.corredoresSinCombustible = 0;
      return 'combustible';
    }

    const entradas = Object.entries(this.control.pesosCorredor).filter(([, peso]) => peso > 0);
    const total = entradas.reduce((acc, [, peso]) => acc + peso, 0);

    let elegido = 'combustible';
    if (total > 0) {
      let acumulado = Math.random() * total;
      for (const [tipo, peso] of entradas) {
        acumulado -= peso;
        if (acumulado <= 0) {
          elegido = tipo;
          break;
        }
      }
    }

    this.corredoresSinCombustible = elegido === 'combustible' ? 0 : this.corredoresSinCombustible + 1;
    return elegido;
  }

  intentarCrearMisil(torres, elementos) {
    const cfg = this.catalogo.misil;
    if (!cfg) return;

    const xSpawn = ESCENARIO.ANCHO + 24;
    const hayTorreEnEntrada = torres.some(
      (t) => t.x + t.ancho > ESCENARIO.ANCHO - 30 && t.x < xSpawn + cfg.ancho + 20
    );

    // Si hay una torre entrando por el borde derecho, pospone el misil un instante
    if (hayTorreEnEntrada) {
      this.tiempoProximoMisil = 0.35;
      return;
    }

    const ySpawn = this.buscarAlturaLibre(cfg.alto, elementos);
    elementos.push(new ElementoEscena(this.capaElementosEl, 'misil', xSpawn, ySpawn));

    this.tiempoProximoMisil = azar(
      this.control.misiles.cadaSegundosMin,
      this.control.misiles.cadaSegundosMax
    );
  }

  buscarAlturaLibre(altoMisil, elementos) {
    const cercanos = elementos.filter((el) => el.x > ESCENARIO.ANCHO - 220);
    const sepMin = this.control.misiles.separacionVerticalMin;

    for (let intento = 0; intento < 8; intento++) {
      const candidataY = azar(ESCENARIO.TECHO + 36, ESCENARIO.PISO - altoMisil - 36);
      const chocaVertical = cercanos.some((el) => Math.abs(candidataY - el.y) < sepMin);
      if (!chocaVertical) return candidataY;
    }

    return azar(ESCENARIO.TECHO + 36, ESCENARIO.PISO - altoMisil - 36);
  }
}
