'use strict';
/* ============================================================
   datasheet.js — Hoja de especificación de datos de proceso
   (formato API 520 / ISA S20 aproximado).
   Acciones: copiar al portapapeles, exportar PDF (jsPDF por CDN
   con fallback a impresión), imprimir.
   ============================================================ */
(function (root) {
  'use strict';

  function fecha() {
    return new Date().toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
  }

  function linea(ch) { return ch.repeat(66); }

  function campo(etiqueta, valor) {
    const puntos = '.'.repeat(Math.max(2, 26 - etiqueta.length));
    return ` ${etiqueta} ${puntos} ${valor}`;
  }

  /* ---------- generación de texto ---------- */
  function construirTexto(r, entrada, nombreFluido) {
    const L = [];
    L.push(linea('='));
    L.push('   HOJA DE ESPECIFICACION DE DATOS DE PROCESO — VALVULA DE ALIVIO (PSV)');
    L.push('   Formato API 520 / ISA S20 (aproximacion) — generado localmente');
    L.push(linea('='));
    L.push(campo('Fecha', fecha()));
    L.push(campo('Fluido', nombreFluido));
    L.push(campo('Modo de calculo', r.modo === 'gas' ? 'Gas / Vapor' : 'Liquido'));
    L.push(campo('Regimen de flujo', r.flujo));
    L.push(linea('-'));
    L.push(' CONDICIONES DE OPERACION');
    L.push(campo('Presion de ajuste', entrada.set.toFixed(2) + ' psig'));
    L.push(campo('Sobrepresion', entrada.sobrepresionPct + ' %'));
    L.push(campo('P1 (alivio absoluta)', r.P1.toFixed(2) + ' psia'));
    L.push(campo('Contrapresion P2', (entrada.pback + 14.7).toFixed(2) + ' psia (' + entrada.pback + ' psig)'));
    if (r.modo === 'gas') {
      L.push(campo('Pcf (presion critica)', r.Pcf.toFixed(2) + ' psia'));
      L.push(campo('Temperatura de alivio', (entrada.temp + 459.67).toFixed(2) + ' R (' + entrada.temp + ' F)'));
    }
    L.push(linea('-'));
    L.push(' PROPIEDADES DEL FLUIDO');
    if (r.modo === 'gas') {
      L.push(campo('M (peso molecular)', entrada.M.toFixed(2) + ' lb/lbmol'));
      L.push(campo('k (Cp/Cv)', entrada.k.toFixed(2)));
      L.push(campo('Z (compresibilidad)', entrada.Z.toFixed(2)));
      L.push(campo('C (expansion isentropica)', r.C.toFixed(2)));
      L.push(campo('Kb (contrapresion)', r.Kb.toFixed(3) + '  [' + entrada.tipoValvula + ']'));
    } else {
      L.push(campo('G (gravedad especifica)', entrada.G.toFixed(2)));
      L.push(campo('mu (viscosidad)', entrada.mu.toFixed(2) + ' cP'));
      L.push(campo('Kv (viscosidad)', r.Kv.toFixed(3)));
      L.push(campo('Reynolds (orificio)', Math.round(r.Re).toLocaleString('en-US')));
      L.push(campo('Kw', r.Kw.toFixed(3)));
    }
    L.push(campo('Kd (descarga)', (r.modo === 'gas' ? 0.975 : 0.65).toFixed(3)));
    L.push(campo('Kc (disco de ruptura)', entrada.Kc.toFixed(1)));
    L.push(linea('-'));
    L.push(' RESULTADOS API 520 PARTE I');
    L.push(campo('Area requerida', r.areaRequerida.toFixed(4) + ' in2'));
    L.push(campo('Orificio API 526', r.orificio.letra + ' — ' + r.orificio.area.toFixed(3) + ' in2'));
    L.push(campo('Uso del orificio', r.usoPct.toFixed(1) + ' %'));
    L.push(campo('Margen de capacidad', '+' + r.margenPct.toFixed(1) + ' %'));
    if (r.modo === 'gas') {
      L.push(campo('Capacidad real W_real', Math.round(r.Wreal).toLocaleString('en-US') + ' lb/hr'));
      L.push(campo('Caudal requerido W', Math.round(entrada.W).toLocaleString('en-US') + ' lb/hr'));
    } else {
      L.push(campo('Capacidad real Q_real', Math.round(r.Wreal).toLocaleString('en-US') + ' GPM'));
      L.push(campo('Caudal requerido Q', Math.round(entrada.Q).toLocaleString('en-US') + ' GPM'));
    }
    L.push(linea('='));
    L.push(' NOTA: herramienta de apoyo a ingenieria. Validar contra API STD 520');
    L.push(' Parte I (10a Ed.) y API STD 526. Factores Kb/Kv: aproximaciones.');
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
