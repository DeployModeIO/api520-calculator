# Changelog

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
- La fórmula subcrítica de gas es una aproximación isentrópica, no la ecuación exacta de API 520.
- Herramienta de apoyo: validar siempre contra API STD 520/521/526 y datos de fabricante.

## v1.0.0 (2026-10-12)

- Versión inicial: calculadora API 520 Parte I (gas/vapor ASME/liquido), selección API 526, datasheet ISA S20, gráficos Canvas nativos, PWA offline, diseño HMI Light Mode.
