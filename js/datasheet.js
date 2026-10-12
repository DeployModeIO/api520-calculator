'use strict';
/* ============================================================
   datasheet.js — Hoja de especificación de datos de proceso
   (formato API 520 / ISA S20 aproximado), bilingüe ES/EN.
   Acciones: copiar al portapapeles, exportar PDF (jsPDF por CDN
   con fallback a impresión), imprimir.
   ============================================================ */
(function (root) {
  'use strict';

  function ds(clave) {
    return (root.I18N && root.I18N.t(clave) !== clave) ? root.I18N.t(clave) : clave;
  }

  function fecha() {
    const loc = (root.I18N && root.I18N.getLang() === 'en') ? 'en-US' : 'es-ES';
    return new Date().toLocaleDateString(loc, { year: 'numeric', month: '2-digit', day: '2-digit' });
  }

  function linea(ch) { return ch.repeat(66); }

  function campo(etiqueta, valor) {
    const puntos = '.'.repeat(Math.max(2, 28 - etiqueta.length));
    return ` ${etiqueta} ${puntos} ${valor}`;
  }

  /* ---------- generación de texto ---------- */
  function construirTexto(r, entrada, nombreFluido) {
    const regimen = r.flujo === 'CRITICO' ? ds('ds_critico')
      : r.flujo === 'SUBCRITICO' ? ds('ds_subcritico') : ds('ds_liq');
    const L = [];
    L.push(linea('='));
    L.push('   ' + ds('ds_title1'));
    L.push('   ' + ds('ds_title2'));
    L.push(linea('='));
    L.push(campo(ds('ds_fecha'), fecha()));
    L.push(campo(ds('ds_fluido'), nombreFluido));
    L.push(campo(ds('ds_modo'), r.modo === 'gas' ? ds('ds_modo_gas') : r.modo === 'vapor' ? ds('ds_modo_vapor') : ds('ds_modo_liq')));
    L.push(campo(ds('ds_regimen'), regimen));
    L.push(campo(ds('ds_tipo'), ds('opt_' + entrada.tipoValvula)));
    L.push(linea('-'));
    L.push(' ' + ds('ds_cond'));
    L.push(campo(ds('ds_set'), entrada.set.toFixed(2) + ' psig'));
    L.push(campo(ds('ds_sobrep'), entrada.sobrepresionPct + ' %'));
    L.push(campo(ds('ds_p1'), r.P1.toFixed(2) + ' psia'));
    L.push(campo(ds('ds_p2'), (entrada.pback + 14.7).toFixed(2) + ' psia (' + entrada.pback + ' psig)'));
    if (r.modo === 'gas') {
      L.push(campo(ds('ds_pcf'), r.Pcf.toFixed(2) + ' psia'));
      L.push(campo(ds('ds_temp'), (entrada.temp + 459.67).toFixed(2) + ' R (' + entrada.temp + ' F)'));
    } else if (r.modo === 'vapor') {
      L.push(campo(ds('ds_temp'), entrada.temp.toFixed(0) + ' F (' + (entrada.temp + 459.67).toFixed(2) + ' R)'));
    }
    L.push(linea('-'));
    L.push(' ' + ds('ds_prop'));
    if (r.modo === 'gas') {
      L.push(campo(ds('ds_m'), entrada.M.toFixed(2) + ' lb/lbmol'));
      L.push(campo(ds('ds_k'), entrada.k.toFixed(2)));
      L.push(campo(ds('ds_z'), entrada.Z.toFixed(2)));
      L.push(campo(ds('ds_c'), r.C.toFixed(2)));
      L.push(campo(ds('ds_kb'), r.Kb.toFixed(3)));
    } else if (r.modo === 'vapor') {
      L.push(campo(ds('ds_ksh'), r.Ksh.toFixed(3) + (entrada.saturado ? ' (saturado)' : ' (' + entrada.temp + ' F)')));
      L.push(campo(ds('ds_kb'), r.Kb.toFixed(3)));
    } else {
      L.push(campo(ds('ds_g'), entrada.G.toFixed(2)));
      L.push(campo(ds('ds_mu'), entrada.mu.toFixed(2) + ' cP'));
      L.push(campo(ds('ds_kv'), r.Kv.toFixed(3)));
      L.push(campo(ds('ds_re'), Math.round(r.Re).toLocaleString('en-US')));
      L.push(campo(ds('ds_kw'), r.Kw.toFixed(3)));
    }
    L.push(campo(ds('ds_kd'), (r.modo === 'liquido' ? 0.65 : 0.975).toFixed(3)));
    L.push(campo(ds('ds_kc'), entrada.Kc.toFixed(1)));
    L.push(linea('-'));
    L.push(' ' + ds('ds_res'));
    L.push(campo(ds('ds_area_req'), r.areaRequerida.toFixed(4) + ' in2'));
    L.push(campo(ds('ds_orificio'), r.orificio.letra + ' — ' + r.orificio.area.toFixed(3) + ' in2'));
    L.push(campo(ds('ds_uso'), r.usoPct.toFixed(1) + ' %'));
    L.push(campo(ds('ds_margen'), '+' + r.margenPct.toFixed(1) + ' %'));
    if (r.modo !== 'liquido') {
      L.push(campo(ds('ds_wreal'), Math.round(r.Wreal).toLocaleString('en-US') + ' lb/hr'));
      L.push(campo(ds('ds_wreq'), Math.round(entrada.W).toLocaleString('en-US') + ' lb/hr'));
    } else {
      L.push(campo(ds('ds_qreal'), Math.round(r.Wreal).toLocaleString('en-US') + ' GPM'));
      L.push(campo(ds('ds_qreq'), Math.round(entrada.Q).toLocaleString('en-US') + ' GPM'));
    }
    L.push(linea('='));
    L.push(' ' + ds('ds_nota1'));
    L.push(' ' + ds('ds_nota2'));
    L.push(linea('='));
    return L.join('\n');
  }

  /* ---------- portapapeles ---------- */
  async function copiar(texto) {
    try {
      await navigator.clipboard.writeText(texto);
      return true;
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = texto;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (e2) { ok = false; }
      document.body.removeChild(ta);
      return ok;
    }
  }

  /* ---------- PDF: jsPDF por CDN con fallback a impresión ---------- */
  let jspdfCargado = false;

  function cargarJsPDF() {
    if (root.jspdf && jspdfCargado) return Promise.resolve(true);
    const urls = [
      'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
      'https://unpkg.com/jspdf@2.5.1/dist/jspdf.umd.min.js',
    ];
    return new Promise(function (resolve) {
      let i = 0;
      function siguiente() {
        if (i >= urls.length) { resolve(false); return; }
        const s = document.createElement('script');
        s.src = urls[i++];
        s.onload = function () {
          jspdfCargado = !!(root.jspdf && root.jspdf.jsPDF);
          resolve(jspdfCargado);
        };
        s.onerror = siguiente;
        document.head.appendChild(s);
      }
      siguiente();
    });
  }

  async function exportarPDF(texto) {
    const ok = await cargarJsPDF();
    if (!ok) return false;
    const doc = new root.jspdf.jsPDF({ unit: 'pt', format: 'letter' });
    const lineas = texto.split('\n');
    const alto = 13;
    let y = 40;
    doc.setFont('courier', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(22, 56, 94); // navy
    for (const ln of lineas) {
      if (y > 760) { doc.addPage(); y = 40; }
      doc.text(ln, 40, y);
      y += alto;
    }
    doc.save('datasheet-psv-api520.pdf');
    return true;
  }

  root.Datasheet = {
    construirTexto: construirTexto,
    copiar: copiar,
    exportarPDF: exportarPDF,
  };
})(typeof window !== 'undefined' ? window : globalThis);
