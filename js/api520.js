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

  // Factor de corrección por contrapresión Kb (gas/vapor).
  // Convencional en flujo crítico: 1.0. Pilotada (POSRV): 1.0 — la presión de
  // ajuste no es afectada por la contrapresión acumulada (verificar límites del
  // fabricante). Fuelle balanceado: curva API 520 Parte I (Fig. 30) dependiente
  // de la sobrepresión, interpolación lineal (APROXIMACIÓN editable):
  //   · 10 % sobrepresión: curva estándar (lectura secundaria publicada)
  //   · 21 % (fuego):      Kb = 1.0 hasta 50 % de contrapresión (verificado)
  //   · 16 % (múltiples):  interpolación entre ambas — aproximación documentada
  const KB_FUELLE_10 = [[0, 1.0], [10, 0.99], [20, 0.97], [30, 0.95], [40, 0.91], [50, 0.86]];
  function factorKb(pctContrapresion, tipoValvula, sobrepresionPct) {
    if (tipoValvula === 'pilot' || tipoValvula !== 'fuelle') return 1.0;
    const op = sobrepresionPct || 10;
    const pct = Math.min(50, Math.max(0, pctContrapresion || 0));
    let kb10 = 0.86;
    for (let i = 1; i < KB_FUELLE_10.length; i++) {
      const x0 = KB_FUELLE_10[i - 1][0], y0 = KB_FUELLE_10[i - 1][1];
      const x1 = KB_FUELLE_10[i][0], y1 = KB_FUELLE_10[i][1];
      if (pct <= x1) { kb10 = y0 + ((y1 - y0) * (pct - x0)) / (x1 - x0); break; }
    }
    if (op >= 21) return 1.0;
    const f = Math.min(1, Math.max(0, (op - 10) / 11)); // 0→curva 10 %, 1→curva 21 %
    return kb10 + (1.0 - kb10) * f;
  }

  // Kw — corrección por contrapresión en servicio LÍQUIDO (API 520 Parte I,
  // APROXIMACIÓN de curva para fuelle balanceado). Convencional/pilotada: 1.0.
  const KW_FUELLE = [[0, 1.0], [10, 0.95], [20, 0.91], [30, 0.88], [40, 0.86], [50, 0.86]];
  function factorKw(pctContrapresion, tipoValvula) {
    if (tipoValvula !== 'fuelle') return 1.0;
    const pct = Math.min(50, Math.max(0, pctContrapresion || 0));
    for (let i = 1; i < KW_FUELLE.length; i++) {
      const x0 = KW_FUELLE[i - 1][0], y0 = KW_FUELLE[i - 1][1];
      const x1 = KW_FUELLE[i][0], y1 = KW_FUELLE[i][1];
      if (pct <= x1) return y0 + ((y1 - y0) * (pct - x0)) / (x1 - x0);
    }
    return 0.86;
  }

  // Flujo SUBCRÍTICO — ecuación exacta API 520 Parte I (Secc. 5.4/5.6):
  //   A  = W / (735·F2·Kd·Kc) · sqrt( Z·T / (M·P1·(P1−P2)) )   [US: lb/hr, psia, °R, in²]
  //   F2 = sqrt( (k/(k−1)) · r^(2/k) · (1 − r^((k−1)/k)) / (1 − r) ),  r = P2/P1
  // La constante 735 es la forma USC; la SI equivalente es 17.9 (kg/h, kPa, mm²).
  // Verificado: continuidad exacta en r = rc (Δ 0.05 % frente a la fórmula crítica
  // C = 520·f(k)) y coincidencia con la aproximación isentrópica (Δ 0.02 %).
  // En flujo subcrítico la contrapresión ya está incorporada en F2 y ΔP → Kb = 1.0
  // (API indica verificar selección de válvula con el fabricante en este régimen).
  function f2Subcritico(k, r) {
    assertNum(k, 'k');
    assertNum(r, 'r');
    if (k <= 1.0) throw new Error('k debe ser > 1.0');
    if (!(r > 0 && r < 1)) throw new Error('r = P2/P1 debe estar entre 0 y 1');
    return Math.sqrt((k / (k - 1)) * Math.pow(r, 2 / k) * ((1 - Math.pow(r, (k - 1) / k)) / (1 - r)));
  }

  function areaRequeridaGasSubcritica(p) {
    const r = p.P2 / p.P1;
    const F2 = f2Subcritico(p.k, r);
    const A = (p.W / (735 * F2 * p.Kd * p.Kc)) * Math.sqrt((p.Z * p.T) / (p.M * p.P1 * (p.P1 - p.P2)));
    return { area: A, F2: F2 };
  }

  function capacidadRealGasSubcritica(Aorificio, p) {
    const F2 = f2Subcritico(p.k, p.P2 / p.P1);
    return (735 * F2 * Aorificio * p.Kd * p.Kc) / Math.sqrt((p.Z * p.T) / (p.M * p.P1 * (p.P1 - p.P2)));
  }

  // Área efectiva requerida de descarga — gases/vapores (in²), flujo crítico.
  // A = (W / (C*Kd*P1*Kb*Kc)) * sqrt(T*Z/M)
  function areaRequeridaGas(p) {    const W = assertNum(p.W, 'W');
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

  // Correlación publicada en API 520 Parte I para el factor de viscosidad Kv
  // en función del número de Reynolds (Kv = 1.0 para Re ≥ 10^6).
  // Fuente: https://help.technicaltoolboxes.com/knowledge-base/api-520-relief-valves-requiring-capacity-certification/
  function kvViscosidad(Re) {
    if (!(Re > 0)) return 1.0;
    const inv = 0.9935 + 2.878 / Math.sqrt(Re) + 342.75 / Math.pow(Re, 1.5);
    return Math.min(1.0, 1 / inv);
  }

  // Método iterativo API para líquidos con corrección por viscosidad.
  // Procedimiento API 520: el Reynolds se evalúa con el área del orificio
  // estándar inmediatamente superior al área requerida:
  //   Re = 2800 · Q · G / (μ · √A_orificio)   [Q GPM, μ cP, A in²]
  function areaLiquidoConViscosidad(p) {
    let Kv = 1.0;
    let A = 0;
    let Re = 0;
    let orificio = null;
    for (let i = 0; i < 4; i++) {
      A = areaRequeridaLiquido({ Q: p.Q, G: p.G, dP: p.dP, Kd: p.Kd, Kw: p.Kw, Kc: p.Kc, Kv: Kv });
      orificio = seleccionarOrificio(A);
      Re = (2800 * p.Q * p.G) / ((p.mu || 0.3) * Math.sqrt(orificio.area));
      const nuevo = kvViscosidad(Re);
      const listo = Math.abs(nuevo - Kv) < 1e-4;
      Kv = nuevo;
      if (listo) break;
    }
    return { area: A, Kv: Kv, Re: Re, orificio: orificio };
  }

  // Ksh — factor de corrección por sobrecalentamiento del vapor (API 520
  // Parte I, Secc. 5.6). Aproximación lineal de la curva publicada (puntos de
  // lecturas secundarias del diagrama Ksh — editable). Saturado: Ksh = 1.0.
  const KSH_CURVA = [[400, 1.0], [500, 0.97], [600, 0.93], [700, 0.90], [800, 0.86], [900, 0.83], [1000, 0.80]];
  function factorKsh(tempF, saturado) {
    if (saturado) return 1.0;
    const T = assertNum(tempF, 'T');
    if (T <= 400) return 1.0;
    if (T >= 1000) return 0.80;
    for (let i = 1; i < KSH_CURVA.length; i++) {
      const x0 = KSH_CURVA[i - 1][0], y0 = KSH_CURVA[i - 1][1];
      const x1 = KSH_CURVA[i][0], y1 = KSH_CURVA[i][1];
      if (T <= x1) return y0 + ((y1 - y0) * (T - x0)) / (x1 - x0);
    }
    return 0.80;
  }

  // Vapor (ASME / API 520 Secc. 5.6): A = W / (51.5 · Kd · P1 · Ksh · Kb · Kc)
  // Flujo crítico del vapor: la aproximación estándar es P2 ≤ 0.75·P1 (absolutas);
  // por encima, consultar al fabricante (se marca SUBCRITICO como aviso).
  function dimensionarVapor(i) {
    const W = assertNum(i.W, 'W');
    if (W <= 0) throw new Error('W debe ser > 0 (caudal de vapor)');
    const P1 = i.set + i.set * (i.sobrepresionPct / 100) + 14.7;
    if (i.P2 >= P1) throw new Error('P1 debe ser > P2 (la contrapresión supera la presión de alivio)');
    const critico = i.P2 <= 0.75 * P1;
    const Kd = i.Kd || 0.975;
    const Ksh = factorKsh(i.T, i.saturado !== false);
    const pctBP = (i.P2 / P1) * 100;
    const Kb = factorKb(critico ? (i.contrapresionPct || 0) : pctBP, i.tipoValvula, i.sobrepresionPct);
    const Kc = i.Kc || 1.0;
    const denom = 51.5 * Kd * P1 * Ksh * Kb * Kc;
    const A = W / denom;
    const orificio = seleccionarOrificio(A);
    const Wreal = denom * orificio.area;
    return {
      modo: 'vapor', P1: P1, flujo: critico ? 'CRITICO' : 'SUBCRITICO',
      Ksh: Ksh, Kb: Kb, Kd: Kd,
      areaRequerida: A, orificio: orificio, Wreal: Wreal,
      usoPct: (A / orificio.area) * 100, margenPct: orificio.margenPct,
      unidades: { W: 'lb/hr', P: 'psia', T: 'F', A: 'in2' },
    };
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
    const KbCritico = factorKb(pctBP, i.tipoValvula, i.sobrepresionPct);
    const Kd = i.Kd || 0.975;

    let A, F2 = null, Kb;
    if (critico) {
      Kb = KbCritico;
      A = areaRequeridaGas({ W: i.W, P1: P1, T: i.T, Z: i.Z, M: i.M, k: i.k, Kd: Kd, Kb: Kb, Kc: i.Kc });
    } else {
      // Ecuación exacta API 520 flujo subcrítico (F2/735): la contrapresión ya
      // está incorporada en F2 y ΔP → Kb = 1.0 en este régimen.
      Kb = 1.0;
      const sub = areaRequeridaGasSubcritica({ W: i.W, P1: P1, P2: i.P2, T: i.T, Z: i.Z, M: i.M, k: i.k, Kd: Kd, Kc: i.Kc });
      A = sub.area;
      F2 = sub.F2;
    }

    const orificio = seleccionarOrificio(A);
    let Wreal;
    if (critico) {
      Wreal = capacidadRealGas(orificio.area, { P1: P1, T: i.T, Z: i.Z, M: i.M, k: i.k, Kd: Kd, Kb: Kb, Kc: i.Kc });
    } else {
      Wreal = capacidadRealGasSubcritica(orificio.area, { P1: P1, P2: i.P2, T: i.T, Z: i.Z, M: i.M, k: i.k, Kd: Kd, Kc: i.Kc });
    }

    return {
      modo: 'gas',
      P1: P1, Pcf: Pcf, flujo: critico ? 'CRITICO' : 'SUBCRITICO',
      C: coeficienteExpansionC(i.k), F2: F2, Kb: Kb, KbPct: pctBP,
      areaRequerida: A, orificio: orificio, Wreal: Wreal,
      usoPct: (A / orificio.area) * 100, margenPct: orificio.margenPct,
      unidades: { W: 'lb/hr', P: 'psia', T: 'R', A: 'in2' },
    };
  }

  // Líquido: i = { Q, G, set, sobrepresionPct, P2, mu, Kd, Kc, tipoValvula, Kw? }
  function dimensionarLiquido(i) {
    const P1 = i.set + i.set * (i.sobrepresionPct / 100) + 14.7;
    if (i.P2 >= P1) throw new Error('P1 debe ser > P2 (la contrapresión supera la presión de alivio)');
    // Si no se especifica Kw, se toma de la curva API 520 para el tipo
    // de válvula (1.0 en convencional y pilotada).
    const pctBPliq = (i.P2 / P1) * 100;
    const Kw = (i.Kw === undefined || i.Kw === null || isNaN(i.Kw)) ? factorKw(pctBPliq, i.tipoValvula) : i.Kw;
    const r = areaLiquidoConViscosidad({ Q: i.Q, G: i.G, dP: P1 - i.P2, Kd: i.Kd || 0.65, Kw: Kw, Kc: i.Kc, mu: i.mu });
    const orificio = r.orificio; // el orificio con el que convergió el Reynolds
    return {
      modo: 'liquido',
      P1: P1, flujo: 'LIQUIDO',
      Kv: r.Kv, Re: r.Re, Kw: Kw, KwPct: pctBPliq,
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
    factorKw: factorKw,
    factorKsh: factorKsh,
    dimensionarVapor: dimensionarVapor,
    areaRequeridaGas: areaRequeridaGas,
    areaRequeridaGasSubcritica: areaRequeridaGasSubcritica,
    capacidadRealGasSubcritica: capacidadRealGasSubcritica,
    f2Subcritico: f2Subcritico,
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
