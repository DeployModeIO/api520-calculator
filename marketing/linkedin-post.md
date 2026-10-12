# Post para LinkedIn — Calculadora API 520

> Uso sugerido: publicar como **carrusel de imágenes** (subir las 5 PNG de `marketing/` en orden).
> El enlace NO va en el post (penaliza alcance): "pídmela por mensaje directo".

---

## TEXTO DEL POST (copiar y pegar)

Ingenieros de procesos y seguridad: ya no hace falta abrir el Excel de toda la vida para precargar una PSV.

Construí una calculadora de válvulas de alivio según **API STD 520 Parte I** y **API 526**, y la voy a compartir gratis.

Qué hace, en simple:

→ Dimensiona el área de orificio requerida para **gases/vapores** (flujo crítico y subcrítico con la ecuación F2 exacta), **líquidos** (con corrección por viscosidad vía Reynolds) y **vapor ASME** (factor Ksh por sobrecalentamiento).

→ Selecciona sola el **orificio estándar API 526** (D a T) y te devuelve la **capacidad real certificada** de ese orificio, con margen de uso.

→ Cubre el efecto de contrapresión según el **tipo de válvula**: convencional, fuelle balanceada (curvas Kb/Kw) o pilotada POSRV (inmune a contrapresión acumulada).

→ Genera la **hoja de especificación** estilo API 520 / ISA S20 lista para copiar, imprimir o exportar a PDF.

→ Avisa en tiempo real si violas la **regla del 3 %** de la tubería de entrada o el límite del 50 % de contrapresión del fuelle.

Detalles técnicos que me importaban:

• Todas las fórmulas y constantes verificadas contra fuentes de ingeniería (520/521/526, ASME VIII) — no es un "prompt y rezar": cada ecuación tiene su test unitario (26 casos con valores calculados a mano).

• Funciona **100 % offline**, sin servidor, sin registro, sin instalar nada: es una sola página. Se instala como PWA en Windows/Edge.

• Validaciones reactivas: Z ≤ 0, k ≤ 1, P2 ≥ P1… te avisa ANTES de que propagues el error a tu memoria de cálculo.

• Interfaz en español e inglés, modo claro industrial y modo oscuro.

• Código abierto, MIT.

Es una herramienta de apoyo al cálculo — no reemplaza la verificación contra la norma vigente ni los datos del fabricante, y eso está dicho en la propia app.

La comparto gratis para la comunidad. **Si la quieres, escríbeme por mensaje directo** y te paso el enlace.

¿Qué le faltaría a una calculadora así para tu día a día? Leo propuestas en comentarios.

#IngenieríaQuímica #SeguridadDeProcesos #API520 #VálvulasDeAlivio #PSV #Refinería #IngenieríaMecánica #PWA

---

## ALT TEXT para cada imagen (accesibilidad + SEO de LinkedIn)

1. `01-panel-principal.png` — Panel de la calculadora en modo gas: formulario de parámetros, donut de uso de orificio al 84 %, resultado "orificio H" y gráfico de capacidad frente a sobrepresión.
2. `02-flujo-subcritico.png` — Mismo panel en régimen subcrítico: aviso ámbar "FLUJO SUBCRÍTICO" y factor F2 calculado con la ecuación exacta de API 520.
3. `03-vapor-asme.png` — Modo vapor ASME: 10 000 lb/hr a 500 psig, orificio G, capacidad real 14 263 lb/hr y factor Ksh 1.0 (vapor saturado).
4. `04-modo-oscuro.png` — Interfaz en modo oscuro Solarized calculando líquido de servicio (diésel): Reynolds, Kv y Kw visibles en la tarjeta de resultados.
5. `05-hoja-especificacion.png` — Hoja de especificación de datos de proceso generada (formato API 520 / ISA S20) con botones de copiar, PDF e imprimir.

## Tips de publicación

- **Mejor hora**: martes–jueves 08:00–10:00 hora local de tu audiencia.
- Las **primeras 2 horas** son críticas: responde todos los comentarios rápido (multiplica alcance).
- Si alguien pide el enlace en comentarios, respóndele con "te escribo por MD" y el enlace solo por mensaje (mantiene el CTA y el algoritmo).
- Si decides hacerla pública en GitHub después, puedes cambiar el CTA a "enlace en el primer comentario".
