'use strict';
/* ============================================================
   tests/run.js — Suite de verificación TDD (node:assert/strict)
   Ejecutar: node tests/run.js
   Casos verificados a mano según API STD 520 Parte I (10ª Ed.)
   ============================================================ */
const assert = require('node:assert/strict');

require('../js/orifices.js');
require('../js/api520.js');

const A = globalThis.API520;

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
