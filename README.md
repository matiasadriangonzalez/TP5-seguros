# Cubrí Seguros · Flujo de contratación digital

Checkout de seguros (TP5 · Diseño UXUI 2026). HTML5 + Tailwind CSS v4 (CDN) + Basecoat UI (CSS, y solo el JS del toast) + JavaScript vanilla con módulos ES. No hay backend: los planes salen de archivos JSON locales y el pago es una función que simula la respuesta.

Productos: **Celular** (el del enunciado) y **Bicicleta** (bonus). Hogar y Viaje figuran como "Próximamente".

## Cómo correrlo

`index.html` carga los planes con `fetch`, así que **no funciona abriéndolo con doble click (`file://`)**. Hace falta un servidor local:

```bash
cd cubri-seguros
npx serve          # o: python3 -m http.server 8000
```

Después abrí la URL que muestre el servidor (por ejemplo `http://localhost:3000`). Si el JSON no se puede cargar, el paso 1 muestra un aviso explicando esto. Tailwind, Basecoat, el toast de Basecoat y la fuente Inter se cargan desde CDN, por lo que hace falta conexión a internet.

Tests de las funciones puras, con Node 22 o superior (probado con Node 24) y sin dependencias:

```bash
node --test "tests/*.test.mjs"
```

## Estructura

```
cubri-seguros/
├── index.html              7 pantallas como <section data-paso> (0 a 6)
├── css/tokens.css          tokens del Figma sobre las variables de Basecoat, ajustes y modo oscuro
├── data/
│   ├── planes.json         Básico, Plus (recomendado) y Premium del celular (tal cual el enunciado)
│   └── planes-bicicleta.json   tabla de tasas propia de la bicicleta
├── js/
│   ├── app.js              arranque, eventos y navegación
│   ├── estado.js           objeto `solicitud` + irAPaso(), cargarPlanes(), elegirProducto()
│   ├── render.js           pinta cada paso desde el estado (stepper, resumen, planes)
│   ├── validaciones.js     funciones puras: reciben un valor y devuelven mensaje o null
│   ├── cotizador.js        calcularCuota() (única función de cuota) y formatos de número/moneda
│   ├── pago.js             simularPago(), generarPoliza() y textoPoliza()
│   ├── productos.js        catálogo de productos: rangos de valor, marcas, factores, textos
│   ├── modelos.js          sugerencias de modelos por marca (modelosDeMarca)
│   ├── mascaras.js         máscaras de tarjeta y vencimiento
│   ├── persistencia.js     guardado en localStorage sin datos sensibles
│   ├── tema.js             modo claro/oscuro
│   ├── tema-inicial.js     script clásico que aplica el tema antes de pintar
│   └── basecoat-shim.js    shim mínimo para usar solo toast.js de Basecoat
├── tests/                  node:test sobre las funciones puras
├── capturas/               capturas mobile (390) y desktop (1440), en claro y oscuro
└── README.md
```

## Decisiones tomadas

- **Un único estado.** Todo vive en `solicitud` (`paso`, `equipo`, `plan`, `titular`, `pago`, `poliza`). Se agregaron claves al mismo objeto: `producto`, `equipo.tipo` (reemplaza a `antiguedad` en la bicicleta), `volverAPago`, y las de interfaz `errores`, `procesando`, `motivoError` y `errorPlanes`. Cada evento modifica el estado y llama a `render()`; el DOM nunca se usa para leer datos.
- **Inputs rellenados desde el estado** en `render()`, por eso "Volver" y "Reintentar pago" conservan los datos. Mientras se escribe en un campo, `render()` no lo pisa.
- **Una sola función de cuota.** `calcularCuota(valor, tasaAnual, factor)` se usa en las cards de plan, en el resumen y en la barra mobile; el factor lo decide el producto (`factorDeEquipo`). Los números se convierten con `Number()` después de quitar todo lo que no sea dígito, y la moneda se formatea con `Intl.NumberFormat("es-AR")`.
- **Resumen generado una vez.** `renderResumen()` rellena un único `<aside id="resumen">`. En mobile es una barra fija arriba del botón desde el paso 2. En el paso 4 (resumen final) ese mismo elemento se muestra completo (seguro, equipo, plan, titular y total) arriba del botón de pago; en desktop es siempre la card lateral (`lg:grid-cols-[1fr_380px]`).
- **Validaciones como funciones puras.** Se muestran al salir del campo (`blur`) y, si el campo ya tenía error, se revalidan mientras se corrige. Al intentar avanzar se revalidan todos los campos del paso y se enfoca el primero con error. Los campos sin validación (medio de pago) se ignoran.
- **Botón deshabilitado con explicación.** El botón principal queda `disabled` hasta que el paso es válido y se muestra qué falta completar (en modo oscuro tiene relleno apagado y borde punteado para distinguirlo de uno activo). Como un botón deshabilitado no recibe clicks, una capa transparente encima permite "intentar avanzar" y ver los errores; Enter dentro de un campo hace lo mismo.
- **Accesibilidad.** `<label for>` en cada input, errores con `aria-invalid`, `aria-describedby` y `role="alert"`, foco al primer campo inválido o al título del paso, y botón de tema con `aria-label` y `aria-pressed`.
- **Pago simulado.** `simularPago()` espera 1,5 s; el botón pasa a "Procesando…" y queda deshabilitado, y solo se vuelve a habilitar si el pago falla. `4000 0000 0000 0002` se rechaza; cualquier otro número válido se aprueba. La póliza usa el formato `POL-AAAA-NNNNNN` con un contador en memoria.
- **Vencimiento de tarjeta.** Una tarjeta vale hasta el último día del mes indicado, así que el mes en curso se acepta y los anteriores no.
- **Nombre y apellido.** La regla dice "mínimo 2 letras" con un único mensaje; se usa "Ingresá tu nombre" / "Ingresá tu apellido" según el campo.
- **Logo.** El logo del encabezado es un botón ("Ir al inicio"). Desde los pasos 1 a 4 y desde el error vuelve al inicio sin perder los datos de `solicitud` (y cancela una edición pendiente de "Editar"); desde el éxito hace lo mismo que "Volver al inicio" y reinicia la solicitud. Mientras se procesa el pago no hace nada.
- **Modelo del equipo.** Sigue siendo texto libre de 2 a 40 caracteres (como pide el enunciado) y se valida igual. Con una marca elegida, un listado de sugerencias propio (`js/sugerencias.js`, patrón combobox/listbox con `aria-expanded`, `aria-controls` y `role="option"`) muestra los modelos de esa marca, filtrados por lo que se escribe sin importar mayúsculas, acentos ni espacios. Se reemplazó el `<datalist>` nativo porque en iOS Safari casi no muestra sugerencias. Funciona con toque (opciones de al menos 44 px), mouse y teclado (flechas, Enter, Escape). Si el modelo escrito no está entre los de la marca, aparece un aviso informativo (`role="status"`, sin borde rojo) y se puede continuar igual. Probado con emulación de WebKit y Chromium, no en un dispositivo real.
- **Controles de formulario en mobile.** Todos los inputs y selects miden 16 px de fuente en mobile (en desktop 15 px, como el Figma) para que iOS Safari no haga zoom al enfocarlos; no se usa `maximum-scale` ni `user-scalable=no`. El campo de fecha usa `appearance: none` y reglas para WebKit para medir y alinear igual que los demás campos (48 px, texto a la izquierda y centrado verticalmente).
- **Clicks en botones.** `render()` solo reescribe el texto de un botón si cambió: en WebKit/iOS, cambiar el nodo de texto en medio de un toque (por ejemplo, por el `blur` de un campo) hacía que se perdiera el click.

### Diferencias entre el Figma y el enunciado

Para el comportamiento y las reglas de negocio se siguió el PDF; para lo visual, el Figma.

- Hogar y Viaje no muestran el precio "desde" del Figma, porque deben estar deshabilitados con "Próximamente". Bicicleta pasó a estar habilitada por el bonus.
- En mobile el Figma muestra una card de resumen dentro del paso de pago; el enunciado pide un único resumen generado por `renderResumen()`. En el paso 4 mobile ese resumen se muestra como card en el flujo, arriba del botón de pago (en vez de la barra fija, que se usa en los pasos 2 y 3).
- El aviso de simulación usa `.alert` de Basecoat: ámbar en el paso de pago (como en el Figma) y variante `destructive` en la pantalla de error, con el motivo tomado del estado.
- "Descargar póliza" (del Figma de éxito) genera un `.txt` de demostración en el navegador con el nombre del plan y la cuota.
- En mobile el Figma no tiene encabezado en las pantallas de éxito y error; acá se muestra para poder llegar al botón de modo oscuro.

## Bonus (sección 12 del enunciado)

Se hicieron seis. No se hizo "Vite + GitHub Actions".

1. **Persistencia.** La solicitud se guarda en `localStorage` (con `try/catch`: si no hay almacenamiento, la app funciona igual) y se restaura al recargar solo los **datos**: la app siempre arranca en el inicio y, al continuar, los formularios aparecen con esos datos cargados (el paso y una edición pendiente de "Editar" no se guardan). Se borra al terminar la contratación y con "Volver al inicio". **Nunca se guardan el número de tarjeta, el CVV ni el vencimiento**: `datosPersistibles()` arma el objeto con una lista blanca y los tests lo verifican. Por eso, después de recargar en el paso de pago hay que volver a escribir esos tres datos.
2. **Editar desde el resumen.** En el paso 4, el resumen tiene enlaces "Editar" (equipo, plan, titular). Llevan al paso correspondiente con los datos cargados y, al continuar, vuelven directo al pago (clave `volverAPago` del estado). "Volver" durante la edición cancela y regresa al pago.
3. **Toast de Basecoat** al confirmar el pago. Se carga solo `toast.min.js` de `basecoat-css@1.1.0` (mismo paquete y versión que el CSS). Ese archivo solo se inicializa si existe `window.basecoat.register`, que normalmente aporta el núcleo `basecoat.js`; como el enunciado pide cargar únicamente el JS del toast, `js/basecoat-shim.js` provee ese `register` mínimo. El toast se descarta al salir de la pantalla de éxito ("Volver al inicio" o cualquier otro cambio de paso), así que no pasa a una compra nueva. En mobile se ubica arriba, debajo del encabezado. Si el CDN no carga, el toast simplemente no aparece.
4. **Otro producto: Bicicleta**, con el mismo flujo, sus propios campos y su propia tabla de tasas en `data/planes-bicicleta.json` (3 %, 5 % y 8 % anual). En lugar de la antigüedad se elige el tipo de bicicleta, que actúa como factor (urbana 1,00 · montaña 1,15 · ruta 1,20 · eléctrica 1,35), y el valor va de $50.000 a $3.000.000. **Estas tasas, factores y rangos son inventados para el TP**, no salen del enunciado. `data/planes.json` y el comportamiento del celular no cambiaron.
5. **Máscaras de input.** Tarjeta en grupos de 4 y vencimiento con barra automática (aparece al escribir el tercer dígito, para poder borrarla). El cursor se mantiene junto al mismo dígito al editar en el medio. Las validaciones siguen ignorando los espacios.
6. **Modo oscuro** con las variables de Basecoat (clase `.dark` en `<html>`). Parte de `prefers-color-scheme`, tiene un botón visible (icono de luna/sol) y recuerda la preferencia en `localStorage`.

## Capturas

Mobile (390 px) a la izquierda y desktop (1440 px) a la derecha. Generadas con Chromium automatizado en idioma y zona horaria es-AR (las fechas salen día/mes/año; el texto de relleno del campo de fecha lo pone el navegador y se ve como `dd/mm/yyyy`); todas están en [`capturas/`](capturas/).

| Pantalla | Mobile · 390 | Desktop · 1440 |
| --- | --- | --- |
| 01 · Inicio | <img src="capturas/mobile-01-inicio.png" width="200" alt="Inicio, mobile"> | <img src="capturas/desktop-01-inicio.png" width="520" alt="Inicio, desktop"> |
| 02 · Cotizar | <img src="capturas/mobile-02-cotizar.png" width="200" alt="Cotizar, mobile"> | <img src="capturas/desktop-02-cotizar.png" width="520" alt="Cotizar, desktop"> |
| 02 · Cotizar, con errores | <img src="capturas/mobile-02-cotizar-errores.png" width="200" alt="Cotizar con errores, mobile"> | <img src="capturas/desktop-02-cotizar-errores.png" width="520" alt="Cotizar con errores, desktop"> |
| 03 · Elegir plan | <img src="capturas/mobile-03-plan.png" width="200" alt="Elegir plan, mobile"> | <img src="capturas/desktop-03-plan.png" width="520" alt="Elegir plan, desktop"> |
| 04 · Datos personales, con errores | <img src="capturas/mobile-04-datos-errores.png" width="200" alt="Datos personales con errores, mobile"> | <img src="capturas/desktop-04-datos-errores.png" width="520" alt="Datos personales con errores, desktop"> |
| 05 · Pago | <img src="capturas/mobile-05-pago.png" width="200" alt="Pago, mobile"> | <img src="capturas/desktop-05-pago.png" width="520" alt="Pago, desktop"> |
| 05 · Pago, resumen final | <img src="capturas/mobile-08-pago-resumen-final.png" width="200" alt="Resumen final, mobile"> | <img src="capturas/desktop-08-pago-resumen-final.png" width="520" alt="Resumen final, desktop"> |
| 06 · Éxito | <img src="capturas/mobile-06-exito.png" width="200" alt="Éxito, mobile"> | <img src="capturas/desktop-06-exito.png" width="520" alt="Éxito, desktop"> |
| 07 · Error de pago | <img src="capturas/mobile-07-error.png" width="200" alt="Error de pago, mobile"> | <img src="capturas/desktop-07-error.png" width="520" alt="Error de pago, desktop"> |

Bonus:

| Bonus | Mobile · 390 | Desktop · 1440 |
| --- | --- | --- |
| Éxito, con el toast de Basecoat visible | <img src="capturas/mobile-17-exito-toast.png" width="200" alt="Éxito con toast, mobile"> | <img src="capturas/desktop-17-exito-toast.png" width="520" alt="Éxito con toast, desktop"> |
| Bicicleta · cotizar | <img src="capturas/mobile-09-bicicleta-cotizar.png" width="200" alt="Bicicleta, cotizar, mobile"> | <img src="capturas/desktop-09-bicicleta-cotizar.png" width="520" alt="Bicicleta, cotizar, desktop"> |
| Bicicleta · plan | <img src="capturas/mobile-10-bicicleta-plan.png" width="200" alt="Bicicleta, plan, mobile"> | <img src="capturas/desktop-10-bicicleta-plan.png" width="520" alt="Bicicleta, plan, desktop"> |
| Modo oscuro · plan | <img src="capturas/mobile-11-oscuro-plan.png" width="200" alt="Modo oscuro, plan, mobile"> | <img src="capturas/desktop-11-oscuro-plan.png" width="520" alt="Modo oscuro, plan, desktop"> |
| Modo oscuro · pago | <img src="capturas/mobile-13-oscuro-pago.png" width="200" alt="Modo oscuro, pago, mobile"> | <img src="capturas/desktop-13-oscuro-pago.png" width="520" alt="Modo oscuro, pago, desktop"> |

También están en `capturas/` las de modo oscuro de datos con errores, error de pago, éxito e inicio (`12`, `14`, `15` y `16`).

## Sitio publicado

URL: https://cubri-seguros.netlify.app/

## Verificación realizada

- Tests con `node --test "tests/*.test.mjs"` sobre cotización (los 3 casos del enunciado y los de la bicicleta), todas las validaciones y sus mensajes, pago simulado y póliza, modelos, máscaras, persistencia (incluye que no se guarden datos de la tarjeta), tema y texto de la póliza.
- Recorrido completo en Chromium headless a 390 y 1440 px: sin errores en la consola en modo claro y oscuro, cuotas exactas de los 3 casos, el toast se descarta al volver al inicio, rechazo con `4000 0000 0000 0002` y "Reintentar" con datos conservados, "Volver", recarga con restauración, "Editar", bicicleta de punta a punta, máscaras y toast.
- También se corrió el recorrido en WebKit con el perfil de iPhone 15 Pro de Playwright (sin errores en la consola, controles de 16 px y 48 px de alto, sin desborde horizontal, recarga que vuelve al inicio con datos).
- No se probó en un iPhone real, en Safari de escritorio ni en Firefox, ni con lectores de pantalla.
