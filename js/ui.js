'use strict';
/* ============================================================
   ui.js — Orquestación de la interfaz: estado, validación
   reactiva, render de resultados, gráficos, datasheet,
   idioma (ES/EN) y tema (HMI claro / Solarized oscuro).
   ============================================================ */
(function () {
  'use strict';

  const root = window;
  const $ = function (id) { return document.getElementById(id); };
  const t = function (k) { return root.I18N ? root.I18N.t(k) : k; };

  const refs = {
    modoGas: $('modo-gas'), modoVap: $('modo-vap'), modoLiq: $('modo-liq'),
    grupoW: $('grupo-w'), grupoGas: $('grupo-gas'), grupoVap: $('grupo-vap'), grupoLiq: $('grupo-liq'),
    fluido: $('fluido'),
    set: $('set'), sobrepresion: $('sobrepresion'), pback: $('pback'), temp: $('temp'),
    tipov: $('tipov'), tipoInfo: $('tipo-info'), tipoChip: $('tipo-chip'), kc: $('kc'),
    dpin: $('dpin'), estvapo: $('estvapo'),
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
    selIdioma: $('sel-idioma'), btnTema: $('btn-tema'),
    iconLuna: $('icon-luna'), iconSol: $('icon-sol'),
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

  const CAMPOS = ['set', 'pback', 'temp', 'w', 'm', 'z', 'kk', 'q', 'g', 'mu', 'kw', 'dpin'];

  function validarCampo(id, opts) {
    const el = $(id);
    const errEl = $('err-' + id);
    const v = el.value.trim().replace(',', '.');
    let msg = '';
    if (v === '' || !isFinite(Number(v))) {
      msg = t('err_numero');
    } else if (opts && opts.min !== undefined && Number(v) < opts.min) {
      msg = t('err_min') + opts.min + '.';
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
    refs.alerta.className = 'alerta';
  }

  /* ---------- fluidos ---------- */
  function poblarFluidos() {
    const f = root.FLUIDOS_BASE;
    refs.fluido.innerHTML = '';
    for (const fluido of f) {
      const op = document.createElement('option');
      op.value = fluido.id;
      op.textContent = `${t('fl_' + fluido.id)} — M ${fluido.M}, k ${fluido.k}`;
      refs.fluido.appendChild(op);
    }
    const pers = document.createElement('option');
    pers.value = 'custom';
    pers.textContent = t('fl_custom');
    refs.fluido.appendChild(pers);
  }

  function nombreFluido() {
    const id = refs.fluido.value;
    if (id === 'custom') return t('fl_custom');
    return t('fl_' + id);
  }

  function aplicarFluido() {
    const id = refs.fluido.value;
    const f = root.FLUIDOS_BASE.find(function (x) { return x.id === id; });
    if (!f) return; // personalizado: no sobrescribir
    refs.m.value = f.M;
    refs.kk.value = f.k;
    refs.z.value = f.Z;
    refs.mu.value = f.muLiquido;
    if (estado.modo === 'liquido') {
      refs.g.value = f.GLiquido !== undefined ? f.GLiquido : Math.max(0.05, f.M / 28.96).toFixed(2);
    }
  }

  /* ---------- tipo de válvula: info contextual + chip ---------- */
  function actualizarTipoV() {
    const tipo = refs.tipov.value;
    refs.tipoInfo.textContent = t('tipo_info_' + tipo);
    refs.tipoChip.textContent = tipo === 'pilot' ? 'POSRV' : (estado.modo === 'liquido' ? 'RV' : 'SRV');
    // Kw: al entrar en modo líquido con fuelle, sugerir valor de curva API
    if (estado.modo === 'liquido' && tipo === 'fuelle') {
      const P1 = num('set') * (1 + Number(refs.sobrepresion.value) / 100) + 14.7;
      const P2 = num('pback') + 14.7;
      if (isFinite(P1) && isFinite(P2) && P1 > 0) {
        refs.kw.value = API520.factorKw((P2 / P1) * 100, 'fuelle').toFixed(3);
      }
    }
  }

  /* ---------- recolección de entrada ---------- */
  function recolectar() {
    return {
      modo: estado.modo,
      fluido: nombreFluido(),
      set: num('set'),
      sobrepresionPct: Number(refs.sobrepresion.value),
      pback: num('pback'),
      temp: num('temp'),
      tipoValvula: refs.tipov.value,
      Kc: Number(refs.kc.value),
      dpin: num('dpin'),
      saturado: refs.estvapo.value === 'saturado',
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
    if (r.flujo === 'CRITICO') {
      pillEstado('pill-ok', t('estado_critico'));
      refs.estadoSub.textContent = t('estado_sub_critico');
    } else if (r.flujo === 'SUBCRITICO') {
      pillEstado('pill-warn', t('estado_subcritico'));
      refs.estadoSub.textContent = r.modo === 'vapor' ? t('estado_vapor_sub') : t('estado_sub_subcritico');
    } else {
      pillEstado('pill-ok', t('estado_liq'));
      refs.estadoSub.textContent = t('estado_sub_liq');
    }

    refs.oOrificio.textContent = r.orificio.letra;
    refs.oAreaOrif.textContent = fmt(r.orificio.area) + ' in²';
    refs.oArea.textContent = fmt(r.areaRequerida, 4) + ' in²';
    refs.oUso.textContent = fmt(r.usoPct, 1) + ' %';
    refs.oUso.style.color = r.usoPct > 95 ? 'var(--err-txt)' : '';
    refs.oMargen.textContent = '+' + fmt(r.margenPct, 1) + ' %';

    const tipoLabel = t('opt_' + entrada.tipoValvula);
    if (r.modo === 'gas') {
      refs.oWreal.textContent = fmt(Math.round(r.Wreal), 0) + ' lb/hr';
      refs.oC.textContent = fmt(r.C, 2);
      refs.oKb.textContent = fmt(r.Kb, 3) + ' (' + tipoLabel + ')';
      refs.oPcf.textContent = fmt(r.Pcf, 2) + ' psia';
      refs.oExtra.textContent = r.F2 !== null ? 'F2 ' + fmt(r.F2, 4) + ' (subcrítico)' : t('na_gas');
    } else if (r.modo === 'vapor') {
      refs.oWreal.textContent = fmt(Math.round(r.Wreal), 0) + ' lb/hr';
      refs.oC.textContent = t('na_liq');
      refs.oKb.textContent = fmt(r.Kb, 3) + ' (' + tipoLabel + ')';
      refs.oPcf.textContent = t('na_liq');
      refs.oExtra.textContent = 'Ksh ' + fmt(r.Ksh, 3) + (entrada.saturado ? '' : ' · Sobrecalentado');
    } else {
      refs.oWreal.textContent = fmt(Math.round(r.Wreal), 0) + ' GPM';
      refs.oC.textContent = t('na_liq');
      refs.oKb.textContent = t('na_liq');
      refs.oPcf.textContent = t('na_liq');
      refs.oExtra.textContent = fmt(r.Kv, 3) + ' / ' + fmt(Math.round(r.Re), 0) + ' · Kw ' + fmt(r.Kw, 3);
    }

    ChartsHMI.donut(refs.donut, r.usoPct, r.flujo);

    // gráfico: capacidad a 10/16/21 % de sobrepresión
    let series;
    if (r.modo !== 'liquido') {
      const p1Base = entrada.set * 1.10 + 14.7;
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
    ChartsHMI.barras(refs.chart, series, r.modo !== 'liquido' ? entrada.W : entrada.Q);

    const texto = Datasheet.construirTexto(r, entrada, entrada.fluido);
    refs.datasheet.textContent = texto;
    refs.printArea.textContent = texto;
  }

  function mostrarError(msg) {
    refs.alerta.textContent = msg;
    refs.alerta.className = 'alerta';
    refs.alerta.hidden = false;
  }

  function mostrarAvisos(lista) {
    if (!lista.length) return;
    refs.alerta.textContent = lista.join(' ');
    refs.alerta.className = 'alerta alerta-warn';
    refs.alerta.hidden = false;
  }

  /* ---------- ciclo de cálculo ---------- */
  function recalcular() {
    limpiarErrores();
    const entrada = recolectar();

    let ok = true;
    ok = validarCampo('set', { min: 0.1 }) && ok;
    ok = validarCampo('pback', { min: 0 }) && ok;
    ok = validarCampo('temp', { min: -459 }) && ok;
    ok = validarCampo('dpin', { min: 0 }) && ok;
    if (estado.modo === 'gas') {
      ok = validarCampo('w', { min: 0.1 }) && ok;
      ok = validarCampo('m', { min: 0.1 }) && ok;
      ok = validarCampo('z', { min: 0.01 }) && ok;
      ok = validarCampo('kk', { min: 1.01 }) && ok;
    } else if (estado.modo === 'vapor') {
      ok = validarCampo('w', { min: 0.1 }) && ok;
    } else {
      ok = validarCampo('q', { min: 0.1 }) && ok;
      ok = validarCampo('g', { min: 0.01 }) && ok;
      ok = validarCampo('mu', { min: 0.01 }) && ok;
      ok = validarCampo('kw', { min: 0 }) && ok;
    }
    if (!ok) return;

    try {
      // El núcleo API520 trabaja en unidades absolutas: P2 en psia (psig + 14.7);
      // gas usa T en °R; vapor usa T en °F para Ksh (definido en api520.js).
      const params = Object.assign({}, entrada, {
        P2: entrada.pback + 14.7,
        T: estado.modo === 'vapor' ? entrada.temp : entrada.temp + 459.67,
      });
      let r;
      if (estado.modo === 'gas') r = API520.dimensionarGas(params);
      else if (estado.modo === 'vapor') r = API520.dimensionarVapor(params);
      else r = API520.dimensionarLiquido(params);
      estado.datosUltimos = r;
      estado.entradaUltima = entrada;
      render(r, entrada);

      // --- Validaciones de cumplimiento API 520/521 ---
      const avisos = [];
      const lim3 = 0.03 * entrada.set; // regla del 3 % sobre la presión de ajuste
      if (isFinite(entrada.dpin) && entrada.dpin > lim3) {
        avisos.push(t('warn_3pct') + lim3.toFixed(2) + ' psig.');
      }
      // Fuelle balanceada: limitada a contrapresión ≤ 50 % del ajuste
      if (entrada.tipoValvula === 'fuelle' && entrada.pback > 0.5 * entrada.set) {
        avisos.push(t('warn_fuelle50'));
      }
      mostrarAvisos(avisos);
    } catch (e) {
      const msg = e.message || 'Error';
      if (/^Z /.test(msg)) { $('err-z').textContent = t('errZ'); }
      else if (/^k /.test(msg)) { $('err-kk').textContent = t('errK'); }
      else if (/^P1 /.test(msg)) { $('err-pback').textContent = t('errP1'); }
      else if (/excede|excede el mayor/i.test(msg)) { mostrarError(t('errOrif')); }
      else { mostrarError(msg); }
    }
  }

  /* ---------- acciones datasheet ---------- */
  refs.btnCopy.addEventListener('click', async function () {
    if (!estado.datosUltimos) return;
    const ok = await Datasheet.copiar(refs.datasheet.textContent);
    refs.avisoExport.textContent = ok ? t('aviso_copiada') : t('aviso_seleccion');
    setTimeout(function () { refs.avisoExport.textContent = ''; }, 3000);
  });

  refs.btnPdf.addEventListener('click', async function () {
    if (!estado.datosUltimos) return;
    refs.avisoExport.textContent = t('aviso_pdf_gen');
    const ok = await Datasheet.exportarPDF(refs.datasheet.textContent);
    refs.avisoExport.textContent = ok ? t('aviso_pdf_ok') : t('aviso_pdf_cdn');
    setTimeout(function () { refs.avisoExport.textContent = ''; }, 5000);
  });

  refs.btnPrint.addEventListener('click', function () { root.print(); });

  /* ---------- modo gas/líquido ---------- */
  function setModo(modo) {
    estado.modo = modo;
    const gas = modo === 'gas', vap = modo === 'vapor';
    refs.modoGas.classList.toggle('active', gas);
    refs.modoVap.classList.toggle('active', vap);
    refs.modoLiq.classList.toggle('active', !gas && !vap);
    refs.modoGas.setAttribute('aria-selected', String(gas));
    refs.modoVap.setAttribute('aria-selected', String(vap));
    refs.modoLiq.setAttribute('aria-selected', String(!gas && !vap));
    refs.grupoW.hidden = !(gas || vap);   // W solo en modos másicos
    refs.grupoGas.hidden = !gas;
    refs.grupoVap.hidden = !vap;
    refs.grupoLiq.hidden = gas || vap;
    if (modo === 'liquido') aplicarFluido(); // reaplica propiedades del fluido (G, μ)
    actualizarTipoV();
    recalcular();
  }
  refs.modoGas.addEventListener('click', function () { setModo('gas'); });
  refs.modoVap.addEventListener('click', function () { setModo('vapor'); });
  refs.modoLiq.addEventListener('click', function () { setModo('liquido'); });

  /* ---------- idioma ---------- */
  function aplicarIdioma(lang) {
    root.I18N.setLang(lang);
    document.documentElement.lang = lang;
    try { localStorage.setItem('bpi-idioma', lang); } catch (e) { /* modo privado */ }
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria')));
    });
    poblarFluidos();
    actualizarTipoV();
    recalcular();
  }
  refs.selIdioma.addEventListener('change', function () { aplicarIdioma(refs.selIdioma.value); });

  /* ---------- tema (HMI claro / Solarized oscuro) ---------- */
  function aplicarTema(tema) {
    document.documentElement.setAttribute('data-theme', tema);
    try { localStorage.setItem('bpi-tema', tema); } catch (e) { /* modo privado */ }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', tema === 'dark' ? '#002b36' : '#16385e');
    refs.iconLuna.hidden = tema === 'dark';
    refs.iconSol.hidden = tema !== 'dark';
    recalcular(); // redibuja gráficos con la nueva paleta
  }
  refs.btnTema.addEventListener('click', function () {
    const actual = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    aplicarTema(actual);
  });

  /* ---------- eventos reactivos ---------- */
  refs.fluido.addEventListener('change', function () { aplicarFluido(); recalcular(); });
  CAMPOS.forEach(function (id) {
    const el = $(id);
    if (el) el.addEventListener('input', recalcular);
  });
  refs.tipov.addEventListener('change', function () { actualizarTipoV(); recalcular(); });
  ['sobrepresion', 'kc', 'estvapo'].forEach(function (id) {
    $(id).addEventListener('change', recalcular);
  });

  /* ---------- service worker (solo http/https) ---------- */
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    navigator.serviceWorker.register('sw.js').catch(function () { /* offline directo: sin SW */ });
  }

  /* ---------- arranque ---------- */
  let temaGuardado = 'light', idiomaGuardado = 'es';
  try {
    temaGuardado = localStorage.getItem('bpi-tema') || 'light';
    idiomaGuardado = localStorage.getItem('bpi-idioma') || 'es';
  } catch (e) { /* modo privado */ }
  refs.selIdioma.value = idiomaGuardado;
  document.documentElement.setAttribute('data-theme', temaGuardado);
  refs.iconLuna.hidden = temaGuardado === 'dark';
  refs.iconSol.hidden = temaGuardado !== 'dark';
  aplicarIdioma(idiomaGuardado);
  ChartsHMI.activarTooltip(refs.chart);
})();
