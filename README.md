# 3 Años Juntos 💙❤️

Web app romántica (mobile-first) para celebrar el 3er aniversario: contador en tiempo real, línea temporal con polaroids y cápsulas bloqueadas, mapa de recuerdos, quiz de la relación, ruleta de premios, botón del amor y vales (todo con aviso por WhatsApp), rasca y gana y una carta secreta con contraseña que desbloquea un juego de baloncesto.

## 👉 Cómo editarla
Lee **[EDITAR.md](EDITAR.md)**: qué cambiar y dónde, cómo poner tus fotos, cómo publicar y cómo usar el QR.

- 🖱️ **Editor visual:** abre `editor.html`.
- 📝 **A mano:** `js/config.js` (todo está comentado por secciones).

## Estructura
```
index.html            la web
editor.html           editor visual (formularios + fotos + QR)
EDITAR.md             guía de edición
js/config.js          TODO el contenido personal (editar aquí)
js/config.local.js    cambios guardados por el editor (gana sobre config.js)
js/*.js, css/*.css    lógica y diseño
assets/fotos/         tus fotos
assets/qr-regalo.*    código QR para imprimir
```

## Probarla
Abre `index.html` en el navegador (necesita internet para fuentes, mapa y librerías) o publícala con GitHub Pages. Añade `?reset` a la dirección para borrar el progreso guardado.
