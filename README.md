# 3 Años Juntos 💙

Web app romántica (mobile-first) para celebrar el 3er aniversario: contador en tiempo real, línea temporal con polaroids y cápsulas bloqueadas, mapa de recuerdos, talonario de vales (canje por WhatsApp), rasca y gana y una carta secreta con contraseña.

## Cómo personalizarla
Todo se edita en **`js/config.js`**: nombres, fecha de inicio, tu teléfono de WhatsApp, recuerdos, lugares, vales, mensaje del rasca y la carta secreta.
Pon tus fotos en `assets/` y cámbialas en el config (p. ej. `foto: "assets/foto1.jpg"`). Las de Unsplash son de relleno.

- Contraseña del secreto: `140223` (también acepta `14/02/2023`, `14 de febrero`…, ver `passwordsValidas`).
- Para empezar de cero (borrar progreso guardado): abre la web con `?reset` al final de la URL.

## Probarla
Abre `index.html` en el navegador o publícala con GitHub Pages (Settings → Pages → rama y carpeta raíz). Necesita internet (fuentes, mapa y librerías por CDN).
