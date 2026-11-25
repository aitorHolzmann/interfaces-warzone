// Orquestador principal de Sky Recon

class JuegoSkyRecon {
  constructor() {
    this.escenarioEl = document.getElementById('escenario-skyrecon');
    this.capaObstaculosEl = document.getElementById('capa-obstaculos');
    this.capaElementosEl = document.getElementById('capa-elementos');
    this.capaFeedbackEl = document.getElementById('capa-feedback');

    this.overlayCargandoEl = document.getElementById('sky-overlay-cargando');
    this.overlayMenuEl = document.getElementById('sky-overlay-menu');
    this.overlayFinEl = document.getElementById('sky-overlay-fin');

    this.hudTiempoRestanteEl = document.getElementById('hud-tiempo-restante');
    this.hudBarraTiempoEl = document.getElementById('hud-barra-tiempo');
    this.hudSobrevividoEl = document.getElementById('hud-tiempo-sobrevivido');
    this.hudRecordEl = document.getElementById('hud-record-tiempo');
    this.hudTurboBadgeEl = document.getElementById('hud-badge-turbo');
    this.hudTurboTiempoEl = document.getElementById('hud-turbo-tiempo');

    this.finSobrevividoEl = document.getElementById('fin-tiempo-sobrevivido');
    this.finRecordEl = document.getElementById('fin-record-tiempo');
    this.finTorresEl = document.getElementById('fin-torres-superadas');
    this.finTurbosEl = document.getElementById('fin-turbos-recogidos');
    this.finNuevoRecordEl = document.getElementById('fin-badge-nuevo-record');

    this.btnEmpezarEl = document.getElementById('btn-sky-empezar');
    this.btnReintentarEl = document.getElementById('btn-sky-reintentar');
    this.btnBarraMenuEl = document.getElementById('btn-sky-menu');
    this.btnBarraReiniciarEl = document.getElementById('btn-sky-reiniciar');
    this.btnBarraHitboxesEl = document.getElementById('btn-sky-hitboxes');

    this.parallax = new Parallax(
      document.getElementById('capa-parallax-contenedor'),
      CAPAS_PARALLAX
    );
    this.dron = new Dron(
      document.getElementById('jugador'),
      document.getElementById('jugador-sprite'),
      CONFIG_DRON
    );
    this.generador = new GeneradorEscena(this.capaObstaculosEl, this.capaElementosEl);

    this.estado = 'cargando'; // 'cargando' | 'menu' | 'jugando' | 'fin'
    this.entrada = { impulso: false };

    this.tiempoRestante = REGLAS_TIEMPO.TIEMPO_INICIAL;
    this.tiempoSobrevivido = 0;
    this.tiempoGlobal = 0;
    this.recordTiempo = this.cargarRecord();
    this.turbo = 0;
    this.torresAtravesadas = 0;
    this.turbosRecogidos = 0;
    this.cooldownFin = 0;

    this.torres = [];
    this.elementos = [];

    this.ultimoTimestamp = 0;
    this.ultimoDibujoHUD = 0;
    this.debugHitboxes = false;

    this.enlazarEventos();
    this.actualizarHUD(true);
  }

  cargarRecord() {
    try {
      const guardado = parseFloat(localStorage.getItem(CLAVE_RECORD_LS));
      return Number.isFinite(guardado) && guardado > 0 ? guardado : 0;
    } catch (e) {
      return 0;
    }
  }

  guardarRecord(valor) {
    try {
      localStorage.setItem(CLAVE_RECORD_LS, valor.toFixed(1));
    } catch (e) {
      // Ignora el error si el navegador bloquea localStorage
    }
  }

  esCampoDeTexto(el) {
    if (!el) return false;
    const tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable;
  }

  enlazarEventos() {
    // El evento solo anota la entrada; el loop decide cuando aplicarla
    document.addEventListener('keydown', (e) => {
      if (this.esCampoDeTexto(e.target)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (!e.repeat) {
          this.entrada.impulso = true;
        }
      } else if (e.code === 'KeyH' && !e.repeat) {
        this.toggleDebugHitboxes();
      }
    });

    this.escenarioEl.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button') || e.target.closest('a')) return;
      this.entrada.impulso = true;
    });

    if (this.btnEmpezarEl) {
      this.btnEmpezarEl.addEventListener('click', () => {
        if (this.estado === 'menu') this.empezar();
      });
    }

    if (this.btnReintentarEl) {
      this.btnReintentarEl.addEventListener('click', () => {
        if (this.estado === 'fin') this.reiniciar();
      });
    }

    if (this.btnBarraMenuEl) {
      this.btnBarraMenuEl.addEventListener('click', () => {
        this.volverAlMenu();
      });
    }

    if (this.btnBarraReiniciarEl) {
      this.btnBarraReiniciarEl.addEventListener('click', () => {
        if (this.estado !== 'cargando') this.reiniciar();
      });
    }

    if (this.btnBarraHitboxesEl) {
      this.btnBarraHitboxesEl.addEventListener('click', () => {
        this.toggleDebugHitboxes();
      });
    }
  }

  toggleDebugHitboxes(forzarValor) {
    this.debugHitboxes = typeof forzarValor === 'boolean' ? forzarValor : !this.debugHitboxes;
    this.escenarioEl.classList.toggle('debug-hitboxes', this.debugHitboxes);
    if (this.btnBarraHitboxesEl) {
      this.btnBarraHitboxesEl.classList.toggle('activo', this.debugHitboxes);
      this.btnBarraHitboxesEl.textContent = this.debugHitboxes ? 'Hitboxes: ON (H)' : 'Hitboxes (H)';
    }
  }

  async iniciar() {
    this.mostrarOverlay('cargando');
    await precargarImagenes(obtenerRutasPrecarga());

    this.estado = 'menu';
    this.mostrarOverlay('menu');
    this.aplicarHookDeTesteo();

    this.ultimoTimestamp = performance.now();
    requestAnimationFrame((ahora) => this.frame(ahora));
  }

  mostrarOverlay(cual) {
    this.overlayCargandoEl.classList.toggle('oculto', cual !== 'cargando');
    this.overlayMenuEl.classList.toggle('oculto', cual !== 'menu');
    this.overlayFinEl.classList.toggle('oculto', cual !== 'fin');
  }

  limpiarEntidades() {
    for (const t of this.torres) t.destruir();
    for (const el of this.elementos) el.destruir();
    this.torres = [];
    this.elementos = [];
    this.capaFeedbackEl.innerHTML = '';
  }

  resetearPartida() {
    this.limpiarEntidades();
    this.dron.reiniciar();
    this.generador.reiniciar();
    this.tiempoRestante = REGLAS_TIEMPO.TIEMPO_INICIAL;
    this.tiempoSobrevivido = 0;
    this.turbo = 0;
    this.torresAtravesadas = 0;
    this.turbosRecogidos = 0;
    this.escenarioEl.classList.remove('en-turbo', 'tiempo-critico');
  }

  volverAlMenu() {
    this.resetearPartida();
    this.parallax.reiniciar();
    this.estado = 'menu';
    this.mostrarOverlay('menu');
    this.actualizarHUD(true);
  }

  empezar() {
    this.resetearPartida();
    this.estado = 'jugando';
    this.mostrarOverlay(null);
    this.dron.impulsar();
    this.actualizarHUD(true);
  }

  reiniciar() {
    this.parallax.reiniciar();
    this.empezar();
  }

  frame(ahora) {
    const dt = Math.min(Math.max((ahora - this.ultimoTimestamp) / 1000, 0), FISICA.DT_MAXIMO);
    this.ultimoTimestamp = ahora;
    this.tiempoGlobal += dt;

    switch (this.estado) {
      case 'menu':
        this.parallax.actualizar(dt, FISICA.VEL_MENU);
        this.dron.actualizarEnMenu(this.tiempoGlobal);
        if (this.entrada.impulso) {
          this.empezar();
        }
        break;

      case 'jugando':
        this.actualizar(dt);
        if (this.tiempoRestante <= 0) {
          this.terminarPartida();
        }
        break;

      case 'fin':
        if (this.cooldownFin > 0) {
          this.cooldownFin = Math.max(0, this.cooldownFin - dt);
        } else if (this.entrada.impulso) {
          this.reiniciar();
        }
        break;
    }

    this.entrada.impulso = false;
    this.dibujar();
    requestAnimationFrame((ts) => this.frame(ts));
  }

  actualizar(dt) {
    if (this.entrada.impulso) {
      this.dron.impulsar();
      this.entrada.impulso = false;
    }

    if (this.turbo > 0) {
      this.turbo = Math.max(0, this.turbo - dt);
    }
    const enTurbo = this.turbo > 0;
    const velProgresiva = Math.min(
      FISICA.VEL_MAX,
      FISICA.VEL_BASE + this.tiempoSobrevivido * FISICA.ACELERACION_VEL
    );
    const velActual = enTurbo ? velProgresiva * FISICA.MULT_TURBO : velProgresiva;
    this.dron.setTurbo(enTurbo);
    this.escenarioEl.classList.toggle('en-turbo', enTurbo);

    const factorConsumo = velProgresiva / FISICA.VEL_BASE;
    this.tiempoSobrevivido += dt;
    this.tiempoRestante = Math.max(0, this.tiempoRestante - dt * factorConsumo);
    this.escenarioEl.classList.toggle('tiempo-critico', this.tiempoRestante <= 5);

    this.parallax.actualizar(dt, velActual);

    const rozoSuelo = this.dron.actualizar(dt);
    if (rozoSuelo) {
      this.aplicarDano(
        REGLAS_TIEMPO.PENALIDAD_SUELO,
        '-2s SUELO',
        this.dron.x + this.dron.ancho / 2,
        ESCENARIO.PISO - 30
      );
    }

    this.generador.actualizar(dt, velActual, this.tiempoSobrevivido, this.torres, this.elementos);

    for (const torre of this.torres) {
      torre.actualizar(dt, velActual);
      if (!torre.superada && torre.x + torre.ancho < this.dron.x) {
        torre.marcarSuperada();
        this.torresAtravesadas++;
      }
    }

    for (const item of this.elementos) {
      item.actualizar(dt, velActual, this.tiempoGlobal);
    }

    this.verificarColisiones();
    this.limpiarFueraDePantalla();
    this.actualizarHUD(false);
  }

  verificarColisiones() {
    const cajaDron = this.dron.hitbox();

    for (const torre of this.torres) {
      if (torre.hitboxes().some((caja) => choca(cajaDron, caja))) {
        this.aplicarDano(
          REGLAS_TIEMPO.PENALIDAD_TORRE,
          '-4s TORRE',
          this.dron.x + this.dron.ancho / 2,
          this.dron.y
        );
        break;
      }
    }

    for (const item of this.elementos) {
      if (!item.tomado && choca(cajaDron, item.hitbox())) {
        item.marcarTomado();
        item.aplicarEfecto(this);
      }
    }
  }

  recargarCombustible(segundos, x, y) {
    const estabaLleno = this.tiempoRestante >= REGLAS_TIEMPO.TIEMPO_MAXIMO;
    this.tiempoRestante = Math.min(REGLAS_TIEMPO.TIEMPO_MAXIMO, this.tiempoRestante + segundos);
    const texto = estabaLleno ? 'TANQUE LLENO' : `+${segundos}s COMBUSTIBLE`;
    this.mostrarFeedbackFlotante(texto, 'feedback-positivo', x, Math.max(55, y));
  }

  activarTurbo(segundos, x, y) {
    this.turbo = Math.max(this.turbo, segundos);
    this.turbosRecogidos++;
    this.dron.setTurbo(true);
    this.mostrarFeedbackFlotante(`TURBO ${segundos}s!`, 'feedback-turbo', x, y);
  }

  aplicarDano(penalidadSeg, texto, x, y) {
    if (!this.dron.chocar()) return;
    this.tiempoRestante = Math.max(0, this.tiempoRestante - penalidadSeg);
    this.mostrarFeedbackFlotante(texto, 'feedback-negativo', x, Math.max(55, y));
  }

  limpiarFueraDePantalla() {
    this.torres = this.torres.filter((torre) => {
      if (torre.estaFueraDePantalla()) {
        torre.destruir();
        return false;
      }
      return true;
    });

    this.elementos = this.elementos.filter((item) => {
      if (item.estaFueraDePantalla()) {
        item.destruir();
        return false;
      }
      return true;
    });
  }

  mostrarFeedbackFlotante(texto, claseTipo, x, y) {
    const popup = document.createElement('div');
    popup.className = `feedback-flotante ${claseTipo}`;
    popup.textContent = texto;
    popup.style.left = `${limitar(x, 85, ESCENARIO.ANCHO - 85)}px`;
    popup.style.top = `${limitar(y, 58, ESCENARIO.PISO - 30)}px`;
    popup.addEventListener('animationend', () => popup.remove());
    this.capaFeedbackEl.appendChild(popup);
  }

  terminarPartida() {
    this.estado = 'fin';
    this.cooldownFin = REGLAS_TIEMPO.COOLDOWN_REINICIO;
    this.turbo = 0;
    this.dron.setTurbo(false);
    this.escenarioEl.classList.remove('en-turbo');

    const esNuevoRecord = this.tiempoSobrevivido > this.recordTiempo && this.tiempoSobrevivido > 0;
    if (esNuevoRecord) {
      this.recordTiempo = this.tiempoSobrevivido;
      this.guardarRecord(this.recordTiempo);
    }

    this.finSobrevividoEl.textContent = formatearSegundos(this.tiempoSobrevivido);
    this.finRecordEl.textContent = formatearSegundos(this.recordTiempo);
    this.finTorresEl.textContent = String(this.torresAtravesadas);
    this.finTurbosEl.textContent = String(this.turbosRecogidos);
    this.finNuevoRecordEl.classList.toggle('visible', esNuevoRecord);

    this.actualizarHUD(true);
    this.mostrarOverlay('fin');
  }

  actualizarHUD(forzar) {
    const ahora = performance.now();
    if (!forzar && ahora - this.ultimoDibujoHUD < 60) return;
    this.ultimoDibujoHUD = ahora;

    this.hudTiempoRestanteEl.textContent = formatearSegundos(this.tiempoRestante);
    this.hudTiempoRestanteEl.classList.toggle('critico', this.tiempoRestante <= 5);

    const porcentaje = limitar((this.tiempoRestante / REGLAS_TIEMPO.TIEMPO_MAXIMO) * 100, 0, 100);
    this.hudBarraTiempoEl.style.width = `${porcentaje}%`;
    this.hudBarraTiempoEl.classList.toggle('critico', this.tiempoRestante <= 5);
    this.hudBarraTiempoEl.classList.toggle('alerta', this.tiempoRestante > 5 && this.tiempoRestante <= 10);

    this.hudSobrevividoEl.textContent = formatearSegundos(this.tiempoSobrevivido);
    this.hudRecordEl.textContent = formatearSegundos(this.recordTiempo);

    const enTurbo = this.turbo > 0;
    this.hudTurboBadgeEl.classList.toggle('activo', enTurbo);
    if (enTurbo) {
      this.hudTurboTiempoEl.textContent = `${this.turbo.toFixed(1)}s`;
    }
  }

  dibujar() {
    this.parallax.dibujar();
    this.dron.dibujar();

    for (const torre of this.torres) {
      torre.dibujar();
    }

    for (const item of this.elementos) {
      item.dibujar();
    }
  }

  // Estados de prueba accesibles por hash (#test-jugando, #test-hitboxes, #test-turbo, #test-choca, #test-fin)
  aplicarHookDeTesteo() {
    const hash = window.location.hash;
    if (!hash) return;

    if (hash === '#test-jugando' || hash === '#test-hitboxes' || hash === '#test-turbo' || hash === '#test-choca') {
      this.limpiarEntidades();
      this.estado = 'jugando';
      this.mostrarOverlay(null);
      this.tiempoRestante = 18.5;
      this.tiempoSobrevivido = 24.3;
      this.torresAtravesadas = 4;
      this.dron.x = 150;
      this.dron.y = 190;
      this.dron.vy = -80;

      this.torres.push(new Torre(this.capaObstaculosEl, 410, 225, 175));
      this.torres.push(new Torre(this.capaObstaculosEl, 710, 185, 145));
      this.elementos.push(new ElementoEscena(this.capaElementosEl, 'nitro', 285, 130));
      this.elementos.push(new ElementoEscena(this.capaElementosEl, 'mina', 285, 315));
      this.elementos.push(new ElementoEscena(this.capaElementosEl, 'combustible', 574, 190));
      this.elementos.push(new ElementoEscena(this.capaElementosEl, 'misil', 555, 330));

      if (hash === '#test-hitboxes') {
        this.toggleDebugHitboxes(true);
      } else if (hash === '#test-turbo') {
        this.activarTurbo(3, 240, 170);
      } else if (hash === '#test-choca') {
        this.aplicarDano(4, '-4s TORRE', 195, 165);
      }

      this.actualizarHUD(true);
      this.dibujar();
    } else if (hash === '#test-fin') {
      this.tiempoSobrevivido = 48.6;
      this.recordTiempo = 42.0;
      this.torresAtravesadas = 9;
      this.turbosRecogidos = 3;
      this.tiempoRestante = 0;
      this.terminarPartida();
      this.dibujar();
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('escenario-skyrecon')) {
    window.juegoSkyRecon = new JuegoSkyRecon();
    window.juegoSkyRecon.iniciar();
  }
});
