'use strict';
/* ============================================================
   tests/run.js — Suite de verificación TDD (node:assert/strict)
   Ejecutar: node tests/run.js
   Casos verificados a mano según API STD 520 Parte I (10ª Ed.)
   ============================================================ */
const assert = require('node:assert/strict');

require('../js/orifices.js');
require('../js/fluids.js');
require('../js/api520.js');
require('../js/i18n.js');

const A = globalThis.API520;
const FLUIDOS = globalThis.FLUIDOS_BASE;
const I18N = globalThis.I18N;

const tests = [];
function t(name, fn) { tests.push([name, fn]); }

// ---- Constantes verificadas manualmente ----
// C(k=1.4) = 520*sqrt(1.4*(2/2.4)^(6)) = 520*0.684732 = 356.061
// A_gas = (5000/(356.061*0.975*114.7))*sqrt(520/29) = 0.531662
// Pcf(114.7, 1.4) = 114.7*0.833333^3.5 = 60.594
// A_liq = (500/(38*0.65))*sqrt(0.75/100) = 1.75305

t('Coeficiente de expansión C(k=1.4) ≈ 356.06', () => {
  const C = A.coeficienteExpansionC(1.4);
  assert.ok(Math.abs(C - 356.061) / 356.061 <= 0.005, 'C=' + C);
});

t('Área requerida gas (caso manual) ≈ 0.5317 in²', () => {
  const r = A.areaRequeridaGas({ W: 5000, P1: 114.7, T: 520, Z: 1, M: 29, k: 1.4, Kd: 0.975, Kb: 1, Kc: 1 });
  assert.ok(Math.abs(r - 0.5317) / 0.5317 <= 0.01, 'A=' + r);
});

t('Selección de orificio API 526: 0.5317 → H (0.785) con capacidad real ≥ requerida', () => {
  const o = A.seleccionarOrificio(0.5317);
  assert.equal(o.letra, 'H');
  assert.equal(o.area, 0.785);
  const W = A.capacidadRealGas(0.785, { P1: 114.7, T: 520, Z: 1, M: 29, k: 1.4, Kd: 0.975, Kb: 1, Kc: 1 });
  assert.ok(W >= 5000, 'W_real=' + W);
});

t('Área requerida líquido (caso manual) ≈ 1.753 in²', () => {
  const r = A.areaRequeridaLiquido({ Q: 500, G: 0.75, dP: 100, Kd: 0.65, Kw: 1, Kc: 1, Kv: 1 });
  assert.ok(Math.abs(r - 1.753) / 1.753 <= 0.01, 'A=' + r);
});

t('Presión crítica de flujo Pcf ≈ 60.59 psia', () => {
  const p = A.presionCriticaFlujo(114.7, 1.4);
  assert.ok(Math.abs(p - 60.594) / 60.594 <= 0.01, 'Pcf=' + p);
});

t('Validación: Z <= 0 lanza error "Z"', () => {
  assert.throws(
    () => A.areaRequeridaGas({ W: 100, P1: 100, T: 520, Z: 0, M: 29, k: 1.4, Kd: 0.975, Kb: 1, Kc: 1 }),
    /Z/
  );
});

t('Validación: k <= 1.0 lanza error "k"', () => {
  assert.throws(
    () => A.areaRequeridaGas({ W: 100, P1: 100, T: 520, Z: 1, M: 29, k: 0.9, Kd: 0.975, Kb: 1, Kc: 1 }),
    /k/
  );
});

t('Validación: P1 <= P2 lanza error "P1"', () => {
  assert.throws(
    () => A.dimensionarGas({ W: 100, set: 100, sobrepresionPct: 10, P2: 200, T: 520, Z: 1, M: 29, k: 1.4, Kd: 0.975, Kc: 1, tipoValvula: 'convencional' }),
    /P1/
  );
});

t('Kb fuelle (interpolación): 0%→1.0, 30%→0.95, 50%→0.86', () => {
  assert.ok(Math.abs(A.factorKb(0, 'fuelle') - 1.0) < 0.005);
  assert.ok(Math.abs(A.factorKb(30, 'fuelle') - 0.95) <= 0.0095);
  assert.ok(Math.abs(A.factorKb(50, 'fuelle') - 0.86) <= 0.0086);
  assert.equal(A.factorKb(10, 'convencional'), 1.0);
});

t('Regresión: dimensionarGas SIN Kd explícito usa 0.975 y no produce NaN', () => {
  const r = A.dimensionarGas({ W: 5000, set: 100, sobrepresionPct: 10, P2: 14.7, T: 559.67, Z: 1, M: 18.5, k: 1.25, Kc: 1, tipoValvula: 'convencional' });
  assert.ok(isFinite(r.areaRequerida) && r.areaRequerida > 0, 'A=' + r.areaRequerida);
  assert.equal(r.flujo, 'CRITICO');
  assert.ok(r.orificio.area >= r.areaRequerida);
});

t('Catálogo de fluidos: incluye gasolina, diésel y Jet A1 con propiedades válidas', () => {
  const ids = FLUIDOS.map(function (f) { return f.id; });
  for (const esperado of ['gasolina', 'diesel', 'jeta1']) {
    assert.ok(ids.includes(esperado), 'falta fluido: ' + esperado);
  }
  for (const f of FLUIDOS) {
    assert.ok(f.M > 0 && f.M < 400, 'M inválido en ' + f.id);
    assert.ok(f.k > 1.0 && f.k < 2.0, 'k inválido en ' + f.id);
    assert.ok(f.Z > 0 && f.Z < 2, 'Z inválido en ' + f.id);
    assert.ok(f.muLiquido > 0, 'muLiquido inválido en ' + f.id);
    assert.ok(f.GLiquido > 0 && f.GLiquido < 3, 'GLiquido inválida en ' + f.id);
  }
});

t('Kw fuelle líquido (curva API aprox.): 0%→1.0, 30%→0.88; default en dimensionarLiquido', () => {
  assert.ok(Math.abs(A.factorKw(0, 'fuelle') - 1.0) < 0.005);
  assert.ok(Math.abs(A.factorKw(30, 'fuelle') - 0.88) <= 0.0088);
  assert.equal(A.factorKw(30, 'convencional'), 1.0);
  assert.equal(A.factorKw(30, 'pilot'), 1.0);
  // P1=124.7 psia, P2=29.4 psia → 23.6% → Kw≈0.90 (sin Kw explícito)
  const r = A.dimensionarLiquido({ Q: 500, G: 0.85, set: 100, sobrepresionPct: 10, P2: 29.4, mu: 4, Kc: 1, tipoValvula: 'fuelle' });
  assert.ok(r.Kw > 0.85 && r.Kw < 1.0, 'Kw=' + r.Kw);
  assert.ok(isFinite(r.areaRequerida) && r.areaRequerida > 0);
});

t('Válvula pilotada (POSRV): Kb=1.0 con cualquier contrapresión', () => {
  assert.equal(A.factorKb(0, 'pilot'), 1.0);
  assert.equal(A.factorKb(35, 'pilot'), 1.0);
  assert.equal(A.factorKb(50, 'pilot'), 1.0);
});

t('Subcrítico: P2 alta exige MÁS área que el caso crítico (no menos)', () => {
  const comun = { W: 5000, set: 100, sobrepresionPct: 10, T: 559.67, Z: 1, M: 18.5, k: 1.25, Kc: 1, tipoValvula: 'pilot' };
  const critico = A.dimensionarGas(Object.assign({}, comun, { P2: 14.7 }));
  const subcrit = A.dimensionarGas(Object.assign({}, comun, { P2: 114.7 })); // P2 > Pcf
  assert.equal(critico.flujo, 'CRITICO');
  assert.equal(subcrit.flujo, 'SUBCRITICO');
  assert.ok(subcrit.areaRequerida > critico.areaRequerida,
    'A_sub=' + subcrit.areaRequerida + ' debe > A_crit=' + critico.areaRequerida);
  assert.equal(subcrit.orificio.letra, 'J'); // 1.14 in² > H
});

t('i18n: diccionarios ES/EN con claves idénticas y no vacías', () => {
  const es = I18N.claves('es');
  const en = I18N.claves('en');
  assert.ok(es.length > 50, 'diccionario ES demasiado corto: ' + es.length);
  const faltanEn = es.filter(function (k) { return en.indexOf(k) === -1; });
  const faltanEs = en.filter(function (k) { return es.indexOf(k) === -1; });
  assert.deepEqual(faltanEn, [], 'claves ES sin traducción EN');
  assert.deepEqual(faltanEs, [], 'claves EN sin origen ES');
  I18N.setLang('en');
  assert.equal(I18N.t('estado_sistema'), 'OPERATIONAL');
  I18N.setLang('es');
  assert.equal(I18N.t('estado_sistema'), 'OPERATIVO');
});

// ---- Ejecución ----
let ok = 0;
let fail = 0;
for (const [name, fn] of tests) {
  try {
    fn();
    ok += 1;
    console.log('  [OK]  ', name);
  } catch (e) {
    fail += 1;
    console.error('  [FALLO]', name, '\n          ', e.message);
  }
}
console.log(`\n${ok}/${tests.length} tests OK` + (fail ? ` — ${fail} FALLOS` : ' — todo verde'));
process.exit(fail ? 1 : 0);
