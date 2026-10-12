'use strict';
/* ============================================================
   fluids.js — Fluidos típicos pre-cargados (valores editables)
   M [lb/lbmol], k [Cp/Cv], Z [factor compresibilidad @ alivio],
   muLiquido [cP] viscosidad dinámica aproximada para modo líquido,
   GLiquido [—] gravedad específica del líquido (rel. agua 4 °C).
   Todos los valores son puntos de partida editables en la UI.
   ============================================================ */
(function (root) {
  root.FLUIDOS_BASE = [
    { id: 'metano',    nombre: 'Metano',                          M: 16.04,  k: 1.31, Z: 1.0,  muLiquido: 0.12, GLiquido: 0.42 },
    { id: 'etano',     nombre: 'Etano',                           M: 30.07,  k: 1.19, Z: 1.0,  muLiquido: 0.16, GLiquido: 0.544 },
    { id: 'propano',   nombre: 'Propano',                         M: 44.10,  k: 1.13, Z: 1.0,  muLiquido: 0.11, GLiquido: 0.51 },
    { id: 'butano',    nombre: 'Butano',                          M: 58.12,  k: 1.09, Z: 1.0,  muLiquido: 0.18, GLiquido: 0.58 },
    { id: 'gasnat',    nombre: 'Gas Natural Típico',              M: 18.5,   k: 1.25, Z: 1.0,  muLiquido: 0.15, GLiquido: 0.45 },
    { id: 'hidrogeno', nombre: 'Hidrógeno',                       M: 2.016,  k: 1.41, Z: 1.06, muLiquido: 0.014, GLiquido: 0.07 },
    { id: 'nitrogeno', nombre: 'Nitrógeno',                       M: 28.01,  k: 1.40, Z: 1.0,  muLiquido: 0.16, GLiquido: 0.81 },
    { id: 'agua',      nombre: 'Agua / Vapor',                    M: 18.02,  k: 1.33, Z: 1.0,  muLiquido: 1.0,  GLiquido: 1.0 },
    { id: 'gasolina',  nombre: 'Gasolina (Motor)',                M: 114.0,  k: 1.05, Z: 1.0,  muLiquido: 0.55, GLiquido: 0.74 },
    { id: 'diesel',    nombre: 'Diésel',                          M: 200.0,  k: 1.05, Z: 1.0,  muLiquido: 4.0,  GLiquido: 0.84 },
    { id: 'jeta1',     nombre: 'Kerosene de Aviación (Turbo / Jet A1)', M: 170.0, k: 1.05, Z: 1.0, muLiquido: 1.4, GLiquido: 0.80 },
  ];
})(typeof window !== 'undefined' ? window : globalThis);
