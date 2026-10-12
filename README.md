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

## Fuentes de referencia (tipos de válvula y terminología)

- Wikipedia — *Relief valve* (terminología PRV/PSV/RV/SRV/POSRV, blowdown, estándares API 520/521/526, ASME VIII, ISO 4126): https://en.wikipedia.org/wiki/Relief_valve
- Wikipedia — *Pilot-operated relief valve* (funcionamiento snap-acting vs modulating, ventajas frente a contrapresión alta): https://en.wikipedia.org/wiki/Pilot-operated_relief_valve
