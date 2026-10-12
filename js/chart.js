'use strict';
/* ============================================================
   chart.js — Gráficos Canvas nativos sin librerías.
   Donut de uso del orificio + barras de capacidad vs sobrepresión.
   Paleta: navy primario, esmeralda operativo, naranja crítico.
   ============================================================ */
(function (root) {
  'use strict';

  const CSS = getComputedStyle(document.documentElement);
  const C = {
    navy: CSS.getPropertyValue('--primary').trim() || '#16385e',
    ring: CSS.getPropertyValue('--border').trim() || '#e2e8f0',
    txt: CSS.getPropertyValue('--txt').trim() || '#0f2a4a',
    txt2: CSS.getPropertyValue('--txt2').trim() || '#47586b',
    ok: CSS.getPropertyValue('--ok').trim() || '#10b981',
    err: CSS.getPropertyValue('--err').trim() || '#ea580c',
    mono: CSS.getPropertyValue('--mono').trim() || 'monospace',
  };
  const NAVY_SOFT = 'rgba(22, 56, 94, 0.14)';

  function prepararCanvas(canvas) {
    const dpr = root.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width > 0 ? rect.width : canvas.width;
    const h = rect.height > 0 ? rect.height : canvas.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    return { ctx: ctx, w: w, h: h };
  }

  /* ---------- donut: % de uso del orificio ---------- */
  let donutUltimo = { usoPct: 0, critico: false };

  function dibujarDonut(canvas, usoPct, critico) {
    donutUltimo = { usoPct: usoPct, critico: critico };
    const _ = prepararCanvas(canvas);
    const ctx = _.ctx, w = _.w, h = _.h;
    const cx = w / 2, cy = h / 2;
    const r = Math.min(w, h) / 2 - 12;
    const grosor = r * 0.28;
    const uso = Math.min(100, Math.max(0, usoPct));

    const color = usoPct > 100 ? C.err : (uso >= 85 || critico === 'SUBCRITICO' ? C.ok : C.navy);

    // anillo de fondo
    ctx.beginPath();
    ctx.arc(cx, cy, r - grosor / 2, 0, Math.PI * 2);
    ctx.strokeStyle = C.ring;
    ctx.lineWidth = grosor;
    ctx.stroke();

    // arco de uso
    ctx.beginPath();
    ctx.arc(cx, cy, r - grosor / 2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (uso / 100));
    ctx.strokeStyle = color;
    ctx.lineWidth = grosor;
    ctx.lineCap = 'butt';
    ctx.stroke();

    // texto central
    ctx.fillStyle = C.txt;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `700 ${Math.round(r * 0.42)}px ${C.mono}`;
    ctx.fillText(uso.toFixed(0) + '%', cx, cy - r * 0.06);
    ctx.fillStyle = C.txt2;
    ctx.font = `600 ${Math.round(r * 0.15)}px ${C.mono}`;
    ctx.fillText('USO ORIFICIO', cx, cy + r * 0.34);
  }

  /* ---------- barras: capacidad vs sobrepresión ---------- */
  let chartEstado = { series: [], wReq: 0, canvas: null, barras: [] };
  let tooltipEl = null;

  function tooltip() {
    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.className = 'chart-tooltip';
      document.body.appendChild(tooltipEl);
    }
    return tooltipEl;
  }

  function dibujarBarras(canvas, series, wReq) {
    chartEstado = { series: series, wReq: wReq, canvas: canvas, barras: [] };
    const _ = prepararCanvas(canvas);
    const ctx = _.ctx, w = _.w, h = _.h;
    if (!series.length) return;

    const padL = 64, padR = 16, padT = 18, padB = 40;
    const chartW = w - padL - padR;
    const chartH = h - padT - padB;
    const maxVal = Math.max.apply(null, series.map(function (s) { return s.valor; }).concat([wReq || 0])) * 1.12 || 1;

    // rejilla horizontal (4 divisiones)
    ctx.strokeStyle = NAVY_SOFT;
    ctx.fillStyle = C.txt2;
    ctx.lineWidth = 1;
    ctx.font = `600 11px ${C.mono}`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = 0; i <= 4; i++) {
      const y = padT + chartH - (chartH * i) / 4;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(w - padR, y);
      ctx.stroke();
      const v = (maxVal * i) / 4;
      ctx.fillText(v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v.toFixed(0), padL - 8, y);
    }

    // línea de referencia: caudal requerido W (esmeralda)
    if (wReq > 0) {
      const yW = padT + chartH - (wReq / maxVal) * chartH;
      ctx.strokeStyle = C.ok;
      ctx.setLineDash([6, 4]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(padL, yW);
      ctx.lineTo(w - padR, yW);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // barras navy
    const n = series.length;
    const paso = chartW / n;
    const ancho = Math.min(72, paso * 0.55);
    for (let i = 0; i < n; i++) {
      const s = series[i];
      const x = padL + paso * i + (paso - ancho) / 2;
      const hBarra = (s.valor / maxVal) * chartH;
      const y = padT + chartH - hBarra;
      ctx.fillStyle = s.destacado ? C.navy : NAVY_SOFT;
      ctx.fillRect(x, y, ancho, hBarra);
      ctx.strokeStyle = C.navy;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, y, ancho, hBarra);

      // valor sobre la barra
      ctx.fillStyle = C.txt;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.font = `700 11px ${C.mono}`;
      const etiqueta = s.valor >= 1000 ? (s.valor / 1000).toFixed(1) + 'k' : s.valor.toFixed(0);
      ctx.fillText(etiqueta, x + ancho / 2, y - 3);

      // etiqueta eje X
      ctx.fillStyle = C.txt2;
      ctx.textBaseline = 'top';
      ctx.font = `600 11px ${C.mono}`;
      ctx.fillText(s.label, x + ancho / 2, padT + chartH + 8);

      chartEstado.barras.push({ x: x, y: y, w: ancho, h: hBarra, serie: s });
    }

    // eje X
    ctx.strokeStyle = C.navy;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padL, padT + chartH);
    ctx.lineTo(w - padR, padT + chartH);
    ctx.stroke();
  }

  // Tooltip por hover/touch sobre las barras
  function activarTooltip(canvas) {
    canvas.addEventListener('mousemove', function (ev) {
      const rect = canvas.getBoundingClientRect();
      const x = ev.clientX - rect.left;
      const y = ev.clientY - rect.top;
      const hit = chartEstado.barras.find(function (b) {
        return x >= b.x - 4 && x <= b.x + b.w + 4 && y >= b.y - 4 && y <= b.y + b.h;
      });
      const tt = tooltip();
      if (hit) {
        tt.textContent = `W_real @ ${hit.serie.label}: ${Math.round(hit.serie.valor).toLocaleString('en-US')} lb/hr`;
        tt.style.display = 'block';
        tt.style.left = ev.clientX + 12 + 'px';
        tt.style.top = ev.clientY - 30 + 'px';
        canvas.style.cursor = 'pointer';
      } else {
        tt.style.display = 'none';
        canvas.style.cursor = 'default';
      }
    });
    canvas.addEventListener('mouseleave', function () {
      if (tooltipEl) tooltipEl.style.display = 'none';
    });
  }

  // Redibujo responsivo
  root.addEventListener('resize', function () {
    if (chartEstado.canvas && chartEstado.series.length) {
      dibujarBarras(chartEstado.canvas, chartEstado.series, chartEstado.wReq);
    }
  });

  root.ChartsHMI = {
    donut: dibujarDonut,
    barras: dibujarBarras,
    activarTooltip: activarTooltip,
  };
})(typeof window !== 'undefined' ? window : globalThis);
