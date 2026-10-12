# Calculadora de Válvulas de Alivio — API 520 Parte I

Aplicación web para el **dimensionamiento riguroso de capacidad y área de orificio de válvulas de alivio a presión (PSV)** según **API STD 520 Parte I (10ª Edición)** con selección de orificio estándar **API STD 526**.

Panel de control ejecutivo HMI industrial en **Light Mode estricto**: Bento Grid plano, tarjetas soft-white, navy profundo para visualizaciones, naranja de seguridad para críticos y esmeralda para operativos. Sin gradientes, alto contraste, 100% offline.

## Funcionalidad

- **Gas / vapor**: presión crítica de flujo (Pcf), coeficiente de expansión isentrópica (C), área requerida `A = W/(C·Kd·P1·Kb·Kc) · √(T·Z/M)`, detección de flujo crítico/subcrítico.
- **Líquido**: `A = Q/(38·Kd·Kw·Kc·Kv) · √(G/ΔP)` con corrección de viscosidad **Kv iterativa** (correlación API en función de Reynolds, aproximación documentada).
- **Selección automática de orificio API 526** (D–T) con capacidad real certificada `W_real`, uso y margen.
- **Tres tipos de válvula (API 520 Parte I)** con física diferenciada: **Convencional** (Kb=1.0 en flujo crítico, sensible a contrapresión superimpuesta), **Fuelle balanceada** (curvas Kb en gas y Kw en líquido — aproximaciones editables) y **Pilotada POSRV** (Kb=1.0: la presión de ajuste no se ve afectada por la contrapresión acumulada; piloto snap-acting o modulante).
- **Bilingüe ES/EN** con selector de idioma persistente (`localStorage`).
- **Dos temas**: HMI claro (por defecto) y **oscuro Solarized** (`data-theme="dark"` con override de tokens); los gráficos Canvas leen la paleta de los tokens en cada dibujo.
- **Gráfico Canvas nativo**: capacidad certificada a 10 / 16 / 21 % de sobrepresión con tooltips; donut de uso del orificio.
- **Hoja de especificación (Datasheet)** estilo API 520 / ISA S20: copiar al portapapeles, exportar PDF (jsPDF por CDN con *fallback* a impresión) e imprimir.
- **Validación reactiva inline**: `Z ≤ 0`, `k ≤ 1.0`, `P1 ≤ P2`, valores vacíos o no numéricos.
- Fluidos pre-cargados editables: metano, etano, propano, butano, gas natural, hidrógeno, nitrógeno, agua/vapor.

## Ejecución

### Web (archivo o servidor estático)

```bash
# Opción A: abrir directamente
start index.html          # funciona desde file://

# Opción B: servidor estático
npx serve .               # o: python -m http.server 8080
```

### Windows (PWA instalable)

1. Sirve la app por HTTP (`npx serve .`) o publícala en cualquier hosting estático.
2. Abre **Edge o Chrome** → icono de instalación en la barra de direcciones → **Instalar**.
3. Atajos de teclado completos (navegación por Tab, foco visible); resolución mínima 1366×768; funciona offline gracias al service worker (`sw.js`, cache-first).

### Windows (.exe nativo con Electron, opcional)

```bash
npm init -y
npm install --save-dev electron electron-packager
# main: "index.html" en package.json
npx electron .                         # prueba local
npx electron-packager . CalculadoraAPI520 --platform=win32 --arch=x64 --out=dist
# → dist/CalculadoraAPI520-win32-x64/CalculadoraAPI520.exe
```

## Tests de verificación

```bash
node tests/run.js
```

Suite TDD (`node:assert/strict`, sin framework) con casos verificados a mano: coeficiente C, área de gas, selección de orificio, área de líquido, Pcf, validaciones termodinámicas, curvas Kb/Kw, pilotada (Kb=1.0), catálogo de fluidos y paridad de diccionarios i18n ES/EN.

## ¿Por qué no lleva backend?

Es una **herramienta de cálculo local offline-first**: todas las funciones son puras y corren en el navegador. La persistencia de preferencias usa `localStorage`. Esto elimina dependencias de red, servidores y superficie de ataque, lo que la hace apta para tablets de campo y equipos aislados ( Toughbook/iPad).

## Diseño

Tokens en `:root` (`css/styles.css`): fondo `#f5f6f8`, tarjetas `#ffffff`, navy `#16385e`, texto `#0f2a4a`, esmeralda operativo `#10b981`, naranja de seguridad crítico `#ea580c`. Bento Grid plano, cero gradientes, una sombra sutil, tipografía system-ui + mono para valores. Accesibilidad: contraste ≥ 4.5:1, foco visible, objetivos ≥ 44×44 px, `aria` en gráficos y estados.

## Aviso de ingeniería

Herramienta de apoyo. Los factores de curva (Kb de fuelle, Kw de fuelle, Kv de viscosidad) son **aproximaciones documentadas de las curvas API 520 Parte I** y son editables. Validar siempre contra las ediciones vigentes de API STD 520 / 526 y los datos del fabricante de la válvula.

## Fuentes de referencia (verificación 2026-10-12)

Fórmulas, constantes, tabla API 526, factores de corrección y propiedades de fluidos verificados contra:

- Technical Toolboxes Knowledge Center — *API 520 – Relief Valves Requiring Capacity Certification* (fórmula de líquido con constante 38, regla Kw por tipo de válvula, correlación Kv `(0.9935 + 2.878/√Re + 342.75/Re^1.5)^−1`, Re = 2800·Q·G/(μ·√A)): https://help.technicaltoolboxes.com/knowledge-base/api-520-relief-valves-requiring-capacity-certification/
- Neutrium — *Relief Valve Orifice Area to API RP 526* (tabla D–T exacta): https://neutrium.net/articles/equipment/relief-valve-orifice-area-to-api-rp-526/
- ProcessTools — *Relief Valve Sizing Theory* (fórmulas gas/líquido/vapor, Kd 0.975/0.65, sobrepresión 10/16/21 %): https://processtools.app/relief-valve/theory
- FlowMachinery — *PRV Orifice Sizing per API 526 Guide* (P1 = set×1.10 + atm, regla de 3 % de pérdida de entrada): https://flowmachinery.com/valves/pressure-relief-valve-orifice
- Wikipedia — *Choked flow* (relación crítica, γ de gases vía Perry's Table 2-166), *Relief valve* (terminología PRV/PSV/RV/SRV/POSRV), *Pilot-operated relief valve* (snap vs modulating), *Gasoline*, *Diesel fuel*, *Jet fuel*, *Ethane*: https://en.wikipedia.org/wiki/Choked_flow , https://en.wikipedia.org/wiki/Relief_valve , https://en.wikipedia.org/wiki/Pilot-operated_relief_valve
- Engineering ToolBox — *Molecular weights of gases/vapors* y *Specific heat ratios*: https://www.engineeringtoolbox.com/molecular-weight-gas-vapor-d_1156.html
- Cheresources (foro de expertos) — límite de fuelle ≤50 % BP y Kb=1.0 a 21 % de sobrepresión (Fig. 30 API 520 7ª ed.): https://www.cheresources.com/invision/topic/15761-back-pressure-correction-factor-for-balanced-bellows-psv/

### Correcciones aplicadas tras la verificación

1. Correlación Kv: sustituida por la publicada en API 520 (antes una fit con exponentes incorrectos).
2. Reynolds: ahora evalúa el área del orificio estándar seleccionado (procedimiento API).
3. Kb de fuelle: curva dependiente de la sobrepresión (10 %→curva Fig. 30; 21 %→1.0 hasta 50 %; 16 %→interpolación documentada).
4. Etano G líquida 0.36→0.544 (544 kg/m³ a −88.5 °C); Jet A1 M 150→170 y μ 1.7→1.4 cP; diésel G 0.85→0.84 (EN 590).
