'use strict';
/* ============================================================
   api520.js — Funciones PURAS de cálculo, API STD 520 Parte I
   (10ª Edición) y selección de orificio API STD 526.
   Sin dependencias, sin DOM. Expuesto como window.API520.
   ============================================================ */
(function (root) {
  'use strict';

  const ORIFICIOS = root.ORIFICIOS_API526 || [
    { letra: 'D', area: 0.110 }, { letra: 'E', area: 0.196 }, { letra: 'F', area: 0.307 },
    { letra: 'G', area: 0.503 }, { letra: 'H', area: 0.785 }, { letra: 'J', area: 1.287 },
    { letra: 'K', area: 1.838 }, { letra: 'L', area: 2.853 }, { letra: 'M', area: 3.600 },
    { letra: 'N', area: 4.340 }, { letra: 'P', area: 6.380 }, { letra: 'Q', area: 11.05 },
    { letra: 'R', area: 16.00 }, { letra: 'T', area: 26.00 },
  ];

  /* ---------- validación básica ---------- */
  function assertNum(v, name) {
    if (typeof v !== 'number' || !isFinite(v)) {
      throw new Error(name + ' debe ser un número finito (recibido: ' + v + ')');
    }
    return v;
  }

  /* ---------- núcleo API 520 Parte I ---------- */

  // Coeficiente de expansión isentrópica C (flujo crítico, unidades API)
  function coeficienteExpansionC(k) {
    assertNum(k, 'k');
    if (k <= 1.0) throw new Error('k debe ser > 1.0 (relación de calores específicos Cp/Cv)');
    return 520 * Math.sqrt(k * Math.pow(2 / (k + 1), (k + 1) / (k - 1)));
  }

  // Presión crítica de flujo (psia)
  function presionCriticaFlujo(P1, k) {
    assertNum(P1, 'P1');
    assertNum(k, 'k');
    if (P1 <= 0) throw new Error('P1 debe ser > 0');
    if (k <= 1.0) throw new Error('k debe ser > 1.0');
    return P1 * Math.pow(2 / (k + 1), k / (k - 1));
  }

  // Factor de corrección por contrapresión Kb.
  // Convencional en flujo crítico: 1.0. Fuelle: interpolación lineal de
  // curvas API 520 Parte I (APROXIMACIÓN editable, % de contrapresión).
  const KB_FUELLE = [[0, 1.0], [10, 0.99], [20, 0.97], [30, 0.95], [40, 0.91], [50, 0.86]];
  function factorKb(pctContrapresion, tipoValvula) {
    if (tipoValvula !== 'fuelle') return 1.0;
    const pct = Math.min(50, Math.max(0, pctContrapresion || 0));
    for (let i = 1; i < KB_FUELLE.length; i++) {
      const x0 = KB_FUELLE[i - 1][0], y0 = KB_FUELLE[i - 1][1];
      const x1 = KB_FUELLE[i][0], y1 = KB_FUELLE[i][1];
      if (pct <= x1) return y0 + ((y1 - y0) * (pct - x0)) / (x1 - x0);
    }
    return 0.86;
  }

  // Área efectiva requerida de descarga — gases/vapores (in²), flujo crítico.
  // A = (W / (C*Kd*P1*Kb*Kc)) * sqrt(T*Z/M)
  function areaRequeridaGas(p) {
    const W = assertNum(p.W, 'W');
    const P1 = assertNum(p.P1, 'P1');
    const T = assertNum(p.T, 'T');
    const M = assertNum(p.M, 'M');
    const Z = assertNum(p.Z, 'Z');
    const k = assertNum(p.k, 'k');
    if (W <= 0) throw new Error('W debe ser > 0 (caudal de alivio)');
    if (P1 <= 0) throw new Error('P1 debe ser > 0 (presión de alivio absoluta)');
    if (T <= 0) throw new Error('T debe ser > 0 (temperatura absoluta de alivio)');
    if (M <= 0) throw new Error('M debe ser > 0 (peso molecular)');
    if (Z <= 0) throw new Error('Z debe ser > 0 (factor de compresibilidad)');
    if (k <= 1.0) throw new Error('k debe ser > 1.0 (relación de calores específicos)');
    const C = coeficienteExpansionC(k);
    return (W / (C * p.Kd * P1 * p.Kb * p.Kc)) * Math.sqrt((T * Z) / M);
  }

  // Capacidad real certificada de un orificio API 526 (lb/hr), flujo crítico.
  function capacidadRealGas(Aorificio, p) {
    const C = coeficienteExpansionC(p.k);
    return (Aorificio * C * p.Kd * p.P1 * p.Kb * p.Kc) / Math.sqrt((p.T * p.Z) / p.M);
  }

  // Área requerida — líquidos API 520 Secc. 5.7 (in²).
  // A = (Q / (38*Kd*Kw*Kc*Kv)) * sqrt(G/dP)
  function areaRequeridaLiquido(p) {
    const Q = assertNum(p.Q, 'Q');
    const G = assertNum(p.G, 'G');
    const dP = assertNum(p.dP, 'dP');
    if (Q <= 0) throw new Error('Q debe ser > 0 (caudal líquido)');
    if (G <= 0) throw new Error('G debe ser > 0 (gravedad específica)');
    if (dP <= 0) throw new Error('dP debe ser > 0 (diferencial de presión)');
    return (Q / (38 * p.Kd * p.Kw * p.Kc * p.Kv)) * Math.sqrt(G / dP);
  }

  // Correlación publicada para el factor de viscosidad Kv (API 520 Parte I,
  // APROXIMACIÓN en función del número de Reynolds).
  function kvViscosidad(Re) {
    if (!(Re > 0)) return 1.0;
    const inv = 0.9942 + 2.8788 * Math.pow(Re, -0.2847) + 340.6 * Math.pow(Re, -0.9111);
    return 1 / inv;
  }

  // Método iterativo API para líquidos con corrección por viscosidad.
  // Re (API 520, unidades prácticas) = 3160 * Q * G / (d * mu)  [Q GPM, d in, mu cP]
  function areaLiquidoConViscosidad(p) {
    let Kv = 1.0;
    let A = 0;
    let Re = 0;
    for (let i = 0; i < 3; i++) {
      A = areaRequeridaLiquido({ Q: p.Q, G: p.G, dP: p.dP, Kd: p.Kd, Kw: p.Kw, Kc: p.Kc, Kv: Kv });
      const d = Math.sqrt((4 * A) / Math.PI);
      Re = (3160 * p.Q * p.G) / (d * (p.mu || 0.3));
      Kv = kvViscosidad(Re);
    }
    return { area: A, Kv: Kv, Re: Re };
  }

  /* ---------- selección de orificio API 526 ---------- */
  function seleccionarOrificio(areaRequerida) {
    assertNum(areaRequerida, 'areaRequerida');
    for (const o of ORIFICIOS) {
      if (o.area >= areaRequerida) {
        return { letra: o.letra, area: o.area, usoPct: (areaRequerida / o.area) * 100, margenPct: (o.area / areaRequerida - 1) * 100 };
      }
    }
    throw new Error('El área requerida excede el mayor orificio API 526 (T, 26.00 in²)');
  }

  /* ---------- orquestadores ---------- */

  // Gas/vapor: i = { W, set, sobrepresionPct, P2, T, Z, M, k, Kd, Kc, tipoValvula, contrapresionPct }
  function dimensionarGas(i) {
    const P1 = i.set + i.set * (i.sobrepresionPct / 100) + 14.7;
    if (i.P2 >= P1) throw new Error('P1 debe ser > P2 (la contrapresión supera la presión de alivio)');
    const Pcf = presionCriticaFlujo(P1, i.k);
    const critico = i.P2 <= Pcf;

    const pctBP = critico ? (i.contrapresionPct || 0) : (i.P2 / P1) * 100;
    const Kb = factorKb(pctBP, i.tipoValvula);
    const base = { W: i.W, P1: P1, T: i.T, Z: i.Z, M: i.M, k: i.k, Kd: i.Kd, Kb: Kb, Kc: i.Kc };

    let A = areaRequeridaGas(base);

    // Flujo subcrítico: aproximación isentrópica — escala el área por la
    // razón de flujo másico relativo al crítico a igual P1 y T (documentada).
    let flujoRatio = 1;
    if (!critico) {
      const r = i.P2 / P1;
      const rc = 2 / (i.k + 1);
      const f = Math.pow(r, 2 / i.k) - Math.pow(r, (i.k + 1) / i.k);
      const fc = Math.pow(rc, 2 / i.k) - Math.pow(rc, (i.k + 1) / i.k);
      flujoRatio = f / fc;
      A = A / Math.sqrt(flujoRatio);
    }

    const orificio = seleccionarOrificio(A);
    let Wreal = capacidadRealGas(orificio.area, base);
    if (!critico) Wreal = Wreal * Math.sqrt(flujoRatio);

    return {
      modo: 'gas',
      P1: P1, Pcf: Pcf, flujo: critico ? 'CRITICO' : 'SUBCRITICO',
      C: coeficienteExpansionC(i.k), Kb: Kb, KbPct: pctBP,
      areaRequerida: A, orificio: orificio, Wreal: Wreal,
      usoPct: (A / orificio.area) * 100, margenPct: orificio.margenPct,
      unidades: { W: 'lb/hr', P: 'psia', T: 'R', A: 'in2' },
    };
  }

  // Líquido: i = { Q, G, set, sobrepresionPct, P2, mu, Kd, Kc, tipoValvula }
  function dimensionarLiquido(i) {
    const P1 = i.set + i.set * (i.sobrepresionPct / 100) + 14.7;
    if (i.P2 >= P1) throw new Error('P1 debe ser > P2 (la contrapresión supera la presión de alivio)');
    const Kw = i.Kw || 1.0;
    const r = areaLiquidoConViscosidad({ Q: i.Q, G: i.G, dP: P1 - i.P2, Kd: i.Kd, Kw: Kw, Kc: i.Kc, mu: i.mu });
    const orificio = seleccionarOrificio(r.area);
    return {
      modo: 'liquido',
      P1: P1, flujo: 'LIQUIDO',
      Kv: r.Kv, Re: r.Re, Kw: Kw,
      areaRequerida: r.area, orificio: orificio,
      Wreal: i.Q * (orificio.area / r.area),
      usoPct: (r.area / orificio.area) * 100, margenPct: orificio.margenPct,
      unidades: { Q: 'GPM', P: 'psia', A: 'in2' },
    };
  }

  /* ---------- API pública ---------- */
  root.API520 = {
    coeficienteExpansionC: coeficienteExpansionC,
    presionCriticaFlujo: presionCriticaFlujo,
    factorKb: factorKb,
    areaRequeridaGas: areaRequeridaGas,
    capacidadRealGas: capacidadRealGas,
    areaRequeridaLiquido: areaRequeridaLiquido,
    kvViscosidad: kvViscosidad,
    areaLiquidoConViscosidad: areaLiquidoConViscosidad,
    seleccionarOrificio: seleccionarOrificio,
    dimensionarGas: dimensionarGas,
    dimensionarLiquido: dimensionarLiquido,
    orificios: ORIFICIOS,
  };
})(typeof window !== 'undefined' ? window : globalThis);
