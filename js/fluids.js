'use strict';
/* ============================================================
   fluids.js — Fluidos típicos pre-cargados (valores editables)
   M [lb/lbmol], k [Cp/Cv], Z [factor compresibilidad @ alivio],
   muLiquido [cP] viscosidad dinámica aproximada para modo líquido.
   Todos los valores son puntos de partida editables en la UI.
   ============================================================ */
(function (root) {
  root.FLUIDOS_BASE = [
    { id: 'metano',   nombre: 'Metano',             M: 16.04,  k: 1.31, Z: 1.0,  muLiquido: 0.12 },
    { id: 'etano',    nombre: 'Etano',              M: 30.07,  k: 1.19, Z: 1.0,  muLiquido: 0.16 },
    { id: 'propano',  nombre: 'Propano',            M: 44.10,  k: 1.13, Z: 1.0,  muLiquido: 0.11 },
    { id: 'butano',   nombre: 'Butano',             M: 58.12,  k: 1.09, Z: 1.0,  muLiquido: 0.18 },
    { id: 'gasnat',   nombre: 'Gas Natural Típico', M: 18.5,   k: 1.25, Z: 1.0,  muLiquido: 0.15 },
    { id: 'hidrogeno',nombre: 'Hidrógeno',          M: 2.016,  k: 1.41, Z: 1.06, muLiquido: 0.014 },
    { id: 'nitrogeno',nombre: 'Nitrógeno',          M: 28.01,  k: 1.40, Z: 1.0,  muLiquido: 0.16 },
    { id: 'agua',     nombre: 'Agua / Vapor',       M: 18.02,  k: 1.33, Z: 1.0,  muLiquido: 1.0 },
  ];
})(typeof window !== 'undefined' ? window : globalThis);
