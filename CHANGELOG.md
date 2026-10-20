# Changelog

## v1.3.0 (2026-10-20)

### Correcciones de cálculo y UI

- **`Kb` de fuelle con contrapresión real**: la UI ahora envía `contrapresionPct = P_back / P_set × 100` al motor. Antes se enviaba 0 % y una válvula de fuelle con 30 psig de contrapresión y set 100 psig mostraba `Kb = 1.000`; ahora muestra `Kb = 0.950`, que es el valor de la curva API 520 Fig. 30. Aplica a gas y a vapor.
- **Coherencia del fluido inicial**: el HTML arranca con `M = 16.04` y `k = 1.31`, que corresponden a la primera opción del selector (Metano). Antes el selector decía Metano pero los campos tenían los valores de Gas Natural (`18.5 / 1.25`).
- **Edición de propiedades**: cambiar `M`, `k` o `Z` pasa el selector a **Personalizado**, tal como indicaba la nota de la app (antes la nota era informativa pero el selector no cambiaba).
- **Cambio de idioma**: `poblarFluidos()` conserva la selección actual en lugar de volver al primer fluido.
- **PWA**: caché del service worker actualizada a `bpi-api520-v11` para invalidar los assets anteriores.

### Pruebas

- 4 tests nuevos de regresión para `Kb` por porcentaje del set: fuelle gas (0.950), POSRV (1.000), convencional (1.000) y fuelle vapor (0.950).
- Suite total: **30/30 tests OK**.

### Documentación

- README técnico ampliado: motor de cálculo, unidades, tabla API 526, supuestos y límites, arquitectura, estructura, pruebas, accesibilidad y referencias.
- Nuevos assets en `docs/`: banner, diagrama de flujo, guía visual y 13 capturas reales de la aplicación (gas crítico/subcrítico, vapor ASME, líquido, Kv, fuelle, POSRV, tema oscuro, inglés, hoja de especificación, validación y tooltip).

## v1.2.0 (2026-10-12)

- **Flujo subcrítico de gases**: implementada la ecuación EXACTA de API 520 Parte I `A = W/(735·F2·Kd·Kc)·√(ZT/(M·P1·(P1−P2)))` con coeficiente `F2` (constante SI equivalente 17.9). Reemplaza la aproximación isentrópica de v1.1. Continuidad verificada en el punto crítico (Δ 0.05 % frente a la fórmula de flujo crítico C=520·f(k)) y validada con caso manual F2=0.9289 / A=0.7746 in² → orificio H.
- En régimen subcrítico, Kb = 1.0 por definición de la ecuación (la contrapresión ya está incorporada en F2 y ΔP), y F2 se muestra en resultados y en la hoja de especificación.

## v1.1.0 (2026-10-12)

### Verificado contra fuentes especializadas (sin acceso a los estándares originales)

- **Fórmulas API 520** (gas con C=520, líquido con constante 38, vapor con 51.5), Kd 0.975/0.65, Kc 1.0/0.9, sobrepresiones 10/16/21 % y relación de flujo crítico: verificadas textualmente contra ProcessTools, FlowMachinery, Technical Toolboxes, Neutrium, Cheresources, Engineering ToolBox y Wikipedia.
- **Tabla de orificios API 526**: 14 letras D–T, áreas exactas (Neutrium).

### Correcciones derivadas de la verificación

- Correlación **Kv** de viscosidad: sustituida por la publicada en API 520 `(0.9935 + 2.878/√Re + 342.75/Re^1.5)^−1` (antes exponentes incorrectos).
- **Número de Reynolds**: evaluado con el área del orificio estándar seleccionado (procedimiento API), con iteración de convergencia.
- **Kb de fuelle**: ahora dependiente de la sobrepresión (10 % → curva estándar; 21 % → 1.0 hasta 50 %; 16 % → interpolación documentada).
- **Fluidos**: etano G líquida 0.36 → 0.544 (Wikipedia), Jet A1 M 150 → 170 y μ 1.7 → 1.4 cP, diésel G 0.85 → 0.84 (EN 590).

### Nuevas capacidades

- **Modo Vapor (ASME)**: `A = W/(51.5·Kd·P1·Ksh·Kb·Kc)` con factor de sobrecalentamiento Ksh (saturado = 1.0; curva aproximada para sobrecalentado), y regla de criticidad P2 ≤ 0.75·P1 con aviso.
- **Validaciones de cumplimiento**: regla del 3 % para ΔP de entrada (API 520/521) y límite del 50 % de contrapresión en válvulas de fuelle.
- Tres tipos de válvula (convencional/fuelle/POSRV), tema Solarized oscuro, idioma ES/EN, fluidos gasolina/diésel/Jet A1 (añadidos en tandas previas).

### Pendientes conocidos (documentados en la propia app)

- Las curvas Kb/Kw/Ksh son aproximaciones de lecturas secundarias de figuras API (de pago); se muestran como tablas editables.
- ~~La fórmula subcrítica de gas es una aproximación isentrópica, no la ecuación exacta de API 520.~~ Resuelto en **v1.2.0** con la ecuación exacta `F2/735`.
- Herramienta de apoyo: validar siempre contra API STD 520/521/526 y datos de fabricante.

## v1.0.0 (2026-10-12)

- Versión inicial: calculadora API 520 Parte I (gas/vapor ASME/liquido), selección API 526, datasheet ISA S20, gráficos Canvas nativos, PWA offline, diseño HMI Light Mode.
