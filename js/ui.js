'use strict';
/* ============================================================
   ui.js — Orquestación de la interfaz: estado, validación
   reactiva, render de resultados, gráficos y datasheet.
   ============================================================ */
(function () {
  'use strict';

  /* ---------- referencias ---------- */
  const $ = function (id) { return document.getElementById(id); };

  const refs = {
    modoGas: $('modo-gas'), modoLiq: $('modo-liq'),
    grupoGas: $('grupo-gas'), grupoLiq: $('grupo-liq'),
    fluido: $('fluido'),
    set: $('set'), sobrepresion: $('sobrepresion'), pback: $('pback'), temp: $('temp'),
    tipov: $('tipov'), kc: $('kc'),
    w: $('w'), m: $('m'), z: $('z'), kk: $('kk'),
    q: $('q'), g: $('g'), mu: $('mu'), kw: $('kw'),
    alerta: $('alerta'),
    donut: $('donut'), chart: $('chart'),
    estado: $('estado'), estadoTxt: $('estado-txt'), estadoSub: $('estado-sub'),
    oOrificio: $('o-orificio'), oAreaOrif: $('o-area-orif'), oArea: $('o-area'),
    oUso: $('o-uso'), oMargen: $('o-margen'), oWreal: $('o-wreal'),
    oC: $('o-c'), oKb: $('o-kb'), oPcf: $('o-pcf'), oExtra: $('o-extra'),
    datasheet: $('datasheet'), printArea: $('print-area'),
    btnCopy: $('btn-copy'), btnPdf: $('btn-pdf'), btnPrint: $('btn-print'),
    avisoExport: $('aviso-export'),
  };

  const estado = { modo: 'gas', datosUltimos: null, entradaUltima: null };

  /* ---------- utilidades ---------- */
  function fmt(n, dec) {
    if (typeof n !== 'number' || !isFinite(n)) return '—';
    return n.toLocaleString('en-US', { minimumFractionDigits: dec === undefined ? 3 : dec, maximumFractionDigits: dec === undefined ? 3 : dec });
  }

  function num(id) {
    const v = $(id).value.trim().replace(',', '.');
    return v === '' ? NaN : Number(v);
  }

  const CAMPOS = ['set', 'pback', 'temp', 'w', 'm', 'z', 'kk', 'q', 'g', 'mu', 'kw'];

  function validarCampo(id, opts) {
    const el = $(id);
    const errEl = $('err-' + id);
    const v = el.value.trim().replace(',', '.');
    let msg = '';
    if (v === '' || !isFinite(Number(v))) {
      msg = 'Ingrese un valor numérico.';
    } else if (opts && opts.min !== undefined && Number(v) < opts.min) {
      msg = 'El valor debe ser ≥ ' + opts.min + '.';
    }
    el.classList.toggle('invalid', !!msg);
    if (errEl) errEl.textContent = msg;
    return !msg;
  }

  function limpiarErrores() {
    CAMPOS.forEach(function (id) {
      const el = $(id);
      if (el) el.classList.remove('invalid');
      const errEl = $('err-' + id);
      if (errEl) errEl.textContent = '';
    });
    refs.alerta.hidden = true;
  }

  /* ---------- fluidos ---------- */
  function poblarFluidos() {
    const f = root.FLUIDOS_BASE;
    refs.fluido.innerHTML = '';
    for (const fluido of f) {
      const op = document.createElement('option');
      op.value = fluido.id;
      op.textContent = `${fluido.nombre} — M ${fluido.M}, k ${fluido.k}`;
      refs.fluido.appendChild(op);
    }
    const pers = document.createElement('option');
    pers.value = 'custom';
    pers.textContent = 'Personalizado (editado)';
    refs.fluido.appendChild(pers);
    const sel = document.createElement('option');
    sel.value = 'liquido-agua';
    sel.textContent = 'Agua (servicio líquido)';
    refs.fluido.insertBefore(sel, pers);
  }

  function aplicarFluido() {
    const id = refs.fluido.value;
    const f = root.FLUIDOS_BASE.find(function (x) { return x.id === id; });
    if (!f) return; // personalizado: no sobrescribir
    refs.m.value = f.M;
    refs.kk.value = f.k;
    refs.z.value = f.Z;
    refs.mu.value = f.muLiquido;
    if (estado.modo === 'liquido') refs.g.value = Math.max(0.05, f.M / 28.96).toFixed(2);
  }

  /* ---------- recolección de entrada ---------- */
  function recolectar() {
    return {
      modo: estado.modo,
      fluido: refs.fluido.options[refs.fluido.selectedIndex].text.split(' — ')[0],
      set: num('set'),
      sobrepresionPct: Number(refs.sobrepresion.value),
      pback: num('pback'),
      temp: num('temp'),
      tipoValvula: refs.tipov.value,
      Kc: Number(refs.kc.value),
      W: num('w'), M: num('m'), Z: num('z'), k: num('kk'),
      Q: num('q'), G: num('g'), mu: num('mu'), Kw: num('kw'),
    };
  }

  /* ---------- render ---------- */
  function pillEstado(clase, texto) {
    refs.estado.className = 'pill ' + clase;
    refs.estadoTxt.textContent = texto;
  }

  function render(r, entrada) {
    // estado de flujo
    if (r.flujo === 'CRITICO') {
      pillEstado('pill-ok', 'FLUJO CRÍTICO');
      refs.estadoSub.textContent = 'P2 ≤ Pcf — diseño API 520 estándar';
    } else if (r.flujo === 'SUBCRITICO') {
      pillEstado('pill-warn', 'FLUJO SUBCRÍTICO');
      refs.estadoSub.textContent = 'P2 > Pcf — verificar selección de válvula';
    } else {
      pillEstado('pill-ok', 'SERVICIO LÍQUIDO');
      refs.estadoSub.textContent = 'Dimensionamiento API 520 Secc. 5.7';
    }

    refs.oOrificio.textContent = r.orificio.letra;
    refs.oAreaOrif.textContent = fmt(r.orificio.area) + ' in²';
    refs.oArea.textContent = fmt(r.areaRequerida, 4) + ' in²';
    refs.oUso.textContent = fmt(r.usoPct, 1) + ' %';
    const uso = r.usoPct;
    refs.oUso.style.color = uso > 95 ? 'var(--err-txt)' : 'var(--txt)';
    refs.oMargen.textContent = '+' + fmt(r.margenPct, 1) + ' %';

    if (r.modo === 'gas') {
      refs.oWreal.textContent = fmt(Math.round(r.Wreal), 0) + ' lb/hr';
      refs.oC.textContent = fmt(r.C, 2);
      refs.oKb.textContent = fmt(r.Kb, 3) + ' (' + entrada.tipoValvula + ')';
      refs.oPcf.textContent = fmt(r.Pcf, 2) + ' psia';
      refs.oExtra.textContent = 'n/a en modo gas';
    } else {
      refs.oWreal.textContent = fmt(Math.round(r.Wreal), 0) + ' GPM';
      refs.oC.textContent = 'n/a en modo líquido';
      refs.oKb.textContent = 'n/a en modo líquido';
      refs.oPcf.textContent = 'n/a en modo líquido';
      refs.oExtra.textContent = fmt(r.Kv, 3) + ' / ' + fmt(Math.round(r.Re), 0);
    }

    // donut: uso del orificio
    ChartsHMI.donut(refs.donut, r.usoPct, r.flujo);

    // gráfico de barras: capacidad a 10/16/21 %
    let series;
    if (r.modo === 'gas') {
      const p1Base = entrada.set * (1 + 0.10) + 14.7;
      series = [10, 16, 21].map(function (pct) {
        const p1 = entrada.set * (1 + pct / 100) + 14.7;
        return { label: pct + '%', valor: r.Wreal * (p1 / p1Base), destacado: pct === entrada.sobrepresionPct };
      });
    } else {
      const dPBase = r.P1 - (entrada.pback + 14.7);
      series = [10, 16, 21].map(function (pct) {
        const dP = entrada.set * (1 + pct / 100) + 14.7 - (entrada.pback + 14.7);
        return { label: pct + '%', valor: r.Wreal * Math.sqrt(dP / dPBase), destacado: pct === entrada.sobrepresionPct };
      });
    }
    const wReq = r.modo === 'gas' ? entrada.W : entrada.Q;
    ChartsHMI.barras(refs.chart, series, wReq);

    // datasheet
    const texto = Datasheet.construirTexto(r, entrada, entrada.fluido);
    refs.datasheet.textContent = texto;
    refs.printArea.textContent = texto;
  }

  function mostrarError(msg) {
    refs.alerta.textContent = msg;
    refs.alerta.hidden = false;
  }

  /* ---------- ciclo de cálculo ---------- */
  function recalcular() {
    limpiarErrores();
    const entrada = recolectar();

    // validación por campo según modo
    let ok = true;
    ok = validarCampo('set', { min: 0.1 }) && ok;
    ok = validarCampo('pback', { min: 0 }) && ok;
    ok = validarCampo('temp', { min: -459 }) && ok;
    if (estado.modo === 'gas') {
      ok = validarCampo('w', { min: 0.1 }) && ok;
      ok = validarCampo('m', { min: 0.1 }) && ok;
      ok = validarCampo('z', { min: 0.01 }) && ok;
      ok = validarCampo('kk', { min: 1.01 }) && ok;
    } else {
      ok = validarCampo('q', { min: 0.1 }) && ok;
      ok = validarCampo('g', { min: 0.01 }) && ok;
      ok = validarCampo('mu', { min: 0.01 }) && ok;
      ok = validarCampo('kw', { min: 0 }) && ok;
    }
    if (!ok) return;

    try {
      const r = estado.modo === 'gas'
        ? API520.dimensionarGas(entrada)
        : API520.dimensionarLiquido(entrada);
      estado.datosUltimos = r;
      estado.entradaUltima = entrada;
      render(r, entrada);
    } catch (e) {
      // errores termodinámicos del núcleo (Z, k, P1, etc.)
      const msg = e.message || 'Error de cálculo';
      if (/^Z /.test(msg)) { validarCampo('z'); $('err-z').textContent = msg; }
      else if (/^k /.test(msg)) { validarCampo('kk'); $('err-kk').textContent = msg; }
      else if (/^P1 /.test(msg)) { $('err-pback').textContent = 'P2 ≥ P1: reduzca la contrapresión.'; }
      else { mostrarError(msg); }
    }
  }

  /* ---------- acciones datasheet ---------- */
  refs.btnCopy.addEventListener('click', async function () {
    if (!estado.datosUltimos) return;
    const ok = await Datasheet.copiar(refs.datasheet.textContent);
    refs.avisoExport.textContent = ok ? 'Copiada al portapapeles.' : 'No se pudo copiar: seleccione el texto manualmente.';
    setTimeout(function () { refs.avisoExport.textContent = ''; }, 3000);
  });

  refs.btnPdf.addEventListener('click', async function () {
    if (!estado.datosUltimos) return;
    refs.avisoExport.textContent = 'Generando PDF…';
    const ok = await Datasheet.exportarPDF(refs.datasheet.textContent);
    refs.avisoExport.textContent = ok
      ? 'PDF generado.'
      : 'Sin conexión al CDN: use "Imprimir" → "Guardar como PDF".';
    setTimeout(function () { refs.avisoExport.textContent = ''; }, 5000);
  });

  refs.btnPrint.addEventListener('click', function () { root.print(); });

  /* ---------- modo gas/líquido ---------- */
  function setModo(modo) {
    estado.modo = modo;
    const gas = modo === 'gas';
    refs.modoGas.classList.toggle('active', gas);
    refs.modoLiq.classList.toggle('active', !gas);
    refs.modoGas.setAttribute('aria-selected', String(gas));
    refs.modoLiq.setAttribute('aria-selected', String(!gas));
    refs.grupoGas.hidden = !gas;
    refs.grupoLiq.hidden = gas;
    recalcular();
  }
  refs.modoGas.addEventListener('click', function () { setModo('gas'); });
  refs.modoLiq.addEventListener('click', function () { setModo('liquido'); });

  /* ---------- eventos reactivos ---------- */
  refs.fluido.addEventListener('change', function () { aplicarFluido(); recalcular(); });
  CAMPOS.forEach(function (id) {
    const el = $(id);
    if (el) el.addEventListener('input', recalcular);
  });
  ['sobrepresion', 'tipov', 'kc'].forEach(function (id) {
    $(id).addEventListener('change', recalcular);
  });

  /* ---------- service worker (solo http/https) ---------- */
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    navigator.serviceWorker.register('sw.js').catch(function () { /* offline directo: sin SW */ });
  }

  /* ---------- arranque ---------- */
  poblarFluidos();
  ChartsHMI.activarTooltip(refs.chart);
  recalcular();
})();
