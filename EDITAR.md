# ✏️ Cómo editar tu regalo (guía rápida)

Todo lo personal (nombres, fotos, textos, vales, quiz, contraseña…) se cambia en **un solo sitio**. Tienes 3 formas, elige la que prefieras:

| Forma | Para quién | Cómo |
|---|---|---|
| 🖱️ **Editor visual** | Lo más fácil, sin tocar código | Abre `editor.html` (doble clic) → [ver abajo](#-editor-visual) |
| 📝 **A mano** | Si te gusta editar texto | Abre `js/config.js` con tu editor (VS Code, Bloc de notas…) |
| 🤖 **Pidiéndomelo a mí** | Cuando no quieras tocar nada | Sube las fotos a `assets/fotos/` y dime qué cambiar |

> **Regla de prioridad:** lo que guarde el editor visual va en `js/config.local.js` y **gana** sobre `js/config.js`.
> Para volver a los valores de `config.js`, deja ese archivo así: `window.CONFIG_LOCAL = {};`

---

## 1. Primer día: traerte el proyecto

```bash
git clone https://github.com/raulrobles1/regalo_web.git
cd regalo_web
git checkout claude/pensive-wozniak-9ts451
```

Si ya lo tienes: `git pull` dentro de la carpeta. **Haz siempre `git pull` antes de empezar a editar.**

---

## 2. ¿Dónde cambio cada cosa?

Todo está en **`js/config.js`**. Está dividido en secciones numeradas (puedes usar buscar con `Ctrl+F` y el título de la sección). Lo que lleva `✏️ EDITA` es lo que seguro querrás cambiar.

| Quiero cambiar… | Sección de `js/config.js` | Campo |
|---|---|---|
| Mi teléfono de WhatsApp (donde llegan vales, premios y mensajes) | `1. DATOS DE LA PAREJA` | `telefonoWhatsapp` (con prefijo y sin `+`: `34608832550`) |
| Su nombre / mi nombre (firma de la carta) | `1. DATOS DE LA PAREJA` | `nombreElla` / `nombreEl` |
| El día que empezamos (contador) | `1. DATOS DE LA PAREJA` | `fechaInicio` (`AAAA-MM-DDT00:00:00`) |
| Título y frases de la portada | `1. DATOS DE LA PAREJA` | `tituloHeader`, `fraseHeader`, `fraseContador` |
| Las polaroids (fotos, fechas, cartas de detrás) | `2. RECUERDOS` | `foto`, `fecha`, `titulo`, `ubicacion`, `textoDetras` |
| Bloquear un recuerdo con pregunta o con fecha | `2. RECUERDOS` | `bloqueado`, `preguntaDesbloqueo`, `respuestaCorrecta`, `desbloqueoFecha` |
| Lugares del mapa | `3. MAPA DE RECUERDOS` | `ciudad`, `coords` `[latitud, longitud]`, `descripcion`, `foto` |
| Razones por las que la quiero | `4. BOTE DE RAZONES` | una frase por línea |
| Preguntas del quiz y mensajes finales | `5. QUIZ DE LA RELACIÓN` | `preguntas`, `resultados`, `premio` |
| El juego de la canasta (nº de tiros, premio, mensaje) | `6. JUEGO DE LA CANASTA` | `tiros`, `aciertosParaPremio`, `textoPremio`, `mensajeWhatsApp` |
| Los premios de la ruleta | `7. RULETA DE PREMIOS` | `premios` |
| Los botones de mensajes rápidos | `8. BOTÓN DEL AMOR` | `botones` |
| Los vales | `9. VALES` | `titulo`, `descripcion`, `icono` |
| La sorpresa del rasca y gana | `10. RASCA Y GANA` | `mensajeOculto` |
| **Contraseña del secreto**, pista y carta | `11. SECRETO` | `passwordsValidas`, `pista`, `pistaExtra`, `mensajeSecreto`, `fotoSecreta` |
| Colores, tamaños, animaciones | `css/` | (solo si quieres cambiar el diseño) |

Reglas para no romper nada al editar a mano:
- Los textos van entre comillas `"así"`. No borres comas ni comillas.
- Salto de línea dentro de un texto: `\n`.
- Si la web se queda en blanco, casi seguro falta o sobra una coma. Abre la consola del navegador (`F12`) y te dice la línea.

---

## 3. Poner fotos reales

1. **Prepara las fotos:** unos **800–1000 px de ancho** y menos de **300 KB** cada una (si no, la web tarda en cargar). El editor visual lo hace solo.
2. **Nombres sencillos:** minúsculas, sin espacios ni tildes → `recuerdo1.jpg`, `valencia.jpg`, `secreta.jpg`.
3. **Cópialas** a la carpeta `assets/fotos/`.
4. **Cambia la ruta** en `js/config.js`:
   ```js
   foto: "assets/fotos/recuerdo1.jpg",
   ```
   Las direcciones `https://images.unsplash.com/...` que ves ahora son fotos de **relleno**.

| Foto de… | Campo |
|---|---|
| Cada polaroid de la línea temporal | `recuerdosTimeline[…].foto` |
| Cada lugar del mapa | `lugaresMapa[…].foto` |
| Carta secreta | `easterEgg.fotoSecreta` |
| Pelota del juego (opcional, vacío = balón dibujado) | `juego.pelotaImg` |

⚠️ Los nombres distinguen mayúsculas: `Foto1.JPG` ≠ `foto1.jpg`. Si una ruta está mal, en su lugar sale un corazón (no se rompe nada).

---

## 🖱️ Editor visual

1. Abre **`editor.html`** (doble clic). Se ve mejor en Chrome o Edge de ordenador.
2. Pulsa **📁 Elegir carpeta** y selecciona la carpeta del proyecto.
3. Cambia lo que quieras. Para fotos: **🖼️ Elegir foto…** (se reducen y comprimen solas).
4. Pulsa **💾 Guardar**. Se escribe `js/config.local.js` y las fotos van a `assets/fotos/`.
5. Pulsa **👀 Ver la web** (o abre `index.html`) para comprobarlo.

¿Otro navegador o móvil? Usa **⬇️ Descargar archivos** y copia `config.local.js` a `js/` y las fotos a `assets/fotos/`.

---

## 4. Ver los cambios en tu ordenador

- Abre `index.html` con doble clic. Necesita internet (fuentes, mapa y confeti se cargan de internet).
- Si la web "recuerda" cosas de pruebas anteriores (vales canjeados, secreto abierto…), añade `?reset` al final de la dirección: `index.html?reset`.
- La intro del sobre solo sale la primera vez; con `?reset` vuelve a salir.

---

## 5. Publicar los cambios

```bash
git add -A
git commit -m "Mis fotos y textos"
git push
```

La web se actualiza sola en **1–2 minutos** (GitHub Pages). Si no ves el cambio, recarga a la fuerza (`Ctrl+F5`).

Enlace de la web: **https://raulrobles1.github.io/Regalo_Web/**

---

## 6. El código QR 🔳

El QR ya está hecho y lleva a la web: **`assets/qr-regalo.png`** y **`assets/qr-regalo.svg`** (el SVG es vectorial: ideal para imprimir). Si cambia el enlace, en `editor.html` → sección **🔳 Código QR** puedes generar uno nuevo.

Antes de imprimirlo:
1. **Que el enlace no cambie.** Publica la web desde la rama `main` (en GitHub: *Settings → Pages → Branch: main*), no desde una rama de trabajo.
2. **Pruébalo** con tu móvil (y con otro) antes de regalarlo.
3. **Tamaño:** al menos 3 × 3 cm, fondo blanco, buen contraste.
4. Cualquiera que tenga el enlace puede abrir la web (ver [Privacidad](#7-privacidad-️)).

---

## 7. Privacidad ⚠️

Para usar GitHub Pages gratis el repositorio tiene que ser **público**: cualquiera que lo encuentre puede leer el código, y por tanto la **contraseña del secreto, las respuestas, los textos y tu teléfono** (están en `js/config.js`). Para un regalo suele ser aceptable; si no quieres que se vean, no pongas datos muy sensibles. La web incluye `noindex` para que Google no la muestre en las búsquedas.

---

## 8. Problemas típicos

| Problema | Causa / solución |
|---|---|
| Web en blanco | Coma o comilla mal puesta en `config.js` o `config.local.js` (mira `F12` → Consola) |
| Sale un corazón en vez de mi foto | Ruta mal escrita o mayúsculas distintas |
| Cambié el `config.js` y no se nota | El editor visual guardó el mismo campo en `config.local.js` (gana ese). Vacíalo: `window.CONFIG_LOCAL = {};` |
| No veo los cambios publicados | Espera 1–2 min y `Ctrl+F5` |
| El mapa sale gris | Falta internet o recarga la pestaña Mapa |
| El WhatsApp abre un chat raro | Revisa `telefonoWhatsapp`: solo números, con prefijo, sin `+` |
