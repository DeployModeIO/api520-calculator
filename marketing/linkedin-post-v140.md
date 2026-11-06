# Post para LinkedIn — v1.4.0 "Presión de operación y vida del asiento"

> Uso sugerido: publicar como **carrusel de imágenes** (subir las 8 PNG de `marketing/` 06–13 en orden).
> El enlace NO va en el post (penaliza alcance): "pídmela por mensaje directo".
> Es un post de seguimiento del lanzamiento (v1.3.0, `linkedin-post.md`): no repite el pitch completo.

---

## TEXTO DEL POST (copiar y pegar)

¿Tu PSV lleva años "rozando" su punto de tarado? El asiento lo nota, y la fuga llega sin aviso.

Le añadí a mi calculadora de válvulas de alivio (API 520 Parte I / API 526) un nuevo control de **vida del asiento**: la presión de operación frente a la presión de ajuste.

Cómo funciona, en simple:

→ Introduces la **presión de operación (psig)** — opcional, junto a la presión de ajuste.

→ La app calcula el **margen** = (p_set − p_op) / p_set × 100 y te clasifica el riesgo según la regla de pulgar de API 520/576 sobre "simulating flow":

• **p_op ≥ p_set** → la válvula abriría en operación normal. Revisa tu tarado.
• **margen < 10 %** → riesgo alto de fuga por desgaste del asiento: el disco pasa demasiado tiempo cerca del asiento.
• **10–25 %** → correcto SOLO si la presión de proceso es estable.
• **≥ 25 %** → aguanta fluctuaciones normales de presión (compresores, valvulería modulante).

→ Es un **aviso, no un bloqueo**: el dimensionamiento sigue ahí siempre, como debe ser en una herramienta de apoyo.

→ La **hoja de especificación** (formato API 520 / ISA S20) ahora imprime p_op y el margen, para que el revisor de tu memoria de cálculo lo vea de un vistazo.

Detalles que me importaban:

• Motor **100 % testeado**: la función `marginCheck` tiene sus anclas unitarias exactas (15 %→ok, 8 %→warn-low, 30 %→ok-fluct, bordes en 10 y 25). Suite completa: 33 casos.
• Funciona igual en los **3 modos**: gas/vapor, vapor ASME y líquido.
• Bilingüe ES/EN y modo oscuro, como el resto de la app.
• Sigue siendo **100 % offline**, sin servidor y gratis.

Sigue siendo una herramienta de apoyo: valida siempre contra la norma vigente y los datos del fabricante.

¿Qué margen de operación–ajuste usáis como criterio en vuestros instalaciones? Leo criterios en comentarios 👇

**Si quieres la calculadora, escríbeme por mensaje directo** y te paso el enlace.

#SeguridadDeProcesos #API520 #VálvulasDeAlivio #PSV #IngenieríaQuímica #Refinería #Mantenimiento #IngenieríaMecánica

---

## ALT TEXT para cada imagen (accesibilidad + SEO de LinkedIn)

1. `06-panel-campo-opcional.png` — Panel completo de la calculadora con el nuevo campo opcional "Presión de operación (psig)" justo debajo de la presión de ajuste, sin ningún aviso activo.
2. `07-margen-15pct-ok-estable.png` — Tarjeta de entrada con set 100 psig y presión de operación 85 psig: la app muestra el aviso ámbar "margen entre 10 y 25 %: correcto solo si la presión es estable".
3. `08-margen-8pct-simulating-flow.png` — Presión de operación 92 psig con set 100 psig (margen 8 %): aviso de riesgo de simulating flow y desgaste del asiento según API 520/576.
4. `09-margen-30pct-con-fluctuaciones.png` — Presión de operación 70 psig con set 100 psig (margen 30 %): aviso de margen amplio, adecuado incluso con fluctuaciones.
5. `10-margen-invalido-pop-mayor-set.png` — Presión de operación 105 psig mayor que el set de 100 psig: aviso de que la válvula abriría en operación normal.
6. `11-datasheet-con-pop-y-margen.png` — Hoja de especificación API 520 / ISA S20 con las nuevas filas "Presion de operacion 85.00 psig" y "Margen operacion-ajuste 15.0 %".
7. `12-modo-oscuro-margen.png` — Panel completo en modo oscuro Solarized con el campo de presión de operación en 85 psig y el orificio H seleccionado.
8. `13-ingles-margen-bajo.png` — Interfaz en inglés con el aviso "Operating–set margin < 10 %: risk of simulating flow and seat wear", demostrando la app bilingüe.

## Tips de publicación

- Este post funciona mejor como **seguimiento** 2–4 semanas después del post de lanzamiento: la audiencia que ya interactuó tiene prioridad en el alcance.
- Los close-ups (imágenes 2–5) son las que enseñan: LinkedIn recorta a cuadrado/vertical en móvil, y 454×1180 se lee bien.
- Responde rápido los comentarios con criterios de margen (las 2 primeras horas multiplican alcance).
- Si alguien pide el enlace: "te escribo por MD" y el enlace solo por mensaje.
