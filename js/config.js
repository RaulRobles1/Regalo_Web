/* ╔══════════════════════════════════════════════════════════════════════════╗
   ║  CONFIG  ·  AQUÍ EDITAS TODO LO PERSONAL DE LA WEB                        ║
   ║  El resto de archivos solo leen de este objeto: no hace falta tocarlos.   ║
   ╠══════════════════════════════════════════════════════════════════════════╣
   ║  ÍNDICE                                                                   ║
   ║   0. Fotos (cómo ponerlas)        6. Juego de la canasta                  ║
   ║   1. Datos de la pareja           7. Ruleta de premios                    ║
   ║   2. Recuerdos (línea temporal)   8. Botón del amor (mensajes rápidos)    ║
   ║   3. Mapa de recuerdos            9. Vales                                ║
   ║   4. Bote de razones             10. Rasca y gana                         ║
   ║   5. Quiz de la relación         11. Secreto (contraseña y carta)         ║
   ╠══════════════════════════════════════════════════════════════════════════╣
   ║  REGLAS RÁPIDAS                                                           ║
   ║   · Los textos van entre comillas "así".  Cuidado con borrar comas o      ║
   ║     comillas: si la web se queda en blanco, suele ser una coma de más/menos.
   ║   · Para un salto de línea dentro de un texto escribe \n                  ║
   ║   · Los emojis se pueden usar tal cual: 💙 ❤️ ✨                          ║
   ║   · Todo lo marcado con  ✏️ EDITA  es lo que seguro querrás cambiar.      ║
   ║   · Alternativa sin tocar código: abre editor.html (ver EDITAR.md).       ║
   ╚══════════════════════════════════════════════════════════════════════════╝ */


/* ══════════════ 0. FOTOS · cómo ponerlas ══════════════════════════════════
   1) Copia tus fotos a la carpeta  assets/fotos/   (nombres sin espacios, tildes
      ni mayúsculas: recuerdo1.jpg, valencia.jpg, secreta.jpg …)
   2) Redúcelas antes (≈ 800-1000 px de ancho, menos de 300 KB cada una).
   3) En cada campo "foto" de abajo cambia la dirección de internet por la ruta:
          foto: "assets/fotos/recuerdo1.jpg",
   Las direcciones de Unsplash que ves ahora son fotos de RELLENO.
   Si una ruta está mal escrita saldrá un corazón en su lugar (no se rompe nada).
   ═══════════════════════════════════════════════════════════════════════════ */

const CONFIG = {

  /* ══════════════ 1. DATOS DE LA PAREJA ═════════════════════════════════════ */
  pareja: {
    nombreElla: "Zayra",                    // ✏️ EDITA · su nombre (sale en el sobre y arriba)
    nombreEl: "Tu amor",                    // ✏️ EDITA · tu nombre: firma de la carta secreta
    fechaInicio: "2023-02-14T00:00:00",     // ✏️ EDITA · día que empezasteis. Formato AAAA-MM-DDT00:00:00
    telefonoWhatsapp: "34608832550",        // ✏️ EDITA · tu móvil con prefijo de país y SIN "+" (34 = España)
    tituloHeader: "¡Felices 3 años, mi amor! ❤️",   // título grande de la portada
    fraseHeader: "3 años creando los recuerdos más bonitos del mundo a tu lado 💙✨",  // frase bajo el título
    fraseContador: "Y cada segundo a tu lado es mi favorito ✨"                        // frase bajo el contador
  },


  /* ══════════════ 2. RECUERDOS · línea temporal de polaroids ════════════════
     Añade un recuerdo copiando uno entero (de { a },) y cambiando el "id" a un número nuevo.
     Cada recuerdo puede estar:
       · LIBRE ........ bloqueado: false
       · CON PREGUNTA . bloqueado: true  + preguntaDesbloqueo + respuestaCorrecta
                        (respuestaCorrecta puede ser un texto o una lista: ["valencia", "valéncia"])
       · CON FECHA .... bloqueado: true  + desbloqueoFecha: "AAAA-MM-DDT00:00:00"
                        (no se abre hasta ese día)
     ═══════════════════════════════════════════════════════════════════════════ */
  recuerdosTimeline: [
    {
      id: 1,                                        // número único, no repetir
      fecha: "14 de Febrero 2023",                  // ✏️ EDITA · fecha en texto, la que quieras mostrar
      titulo: "Donde empezó todo 💙",               // ✏️ EDITA · título de la polaroid
      ubicacion: "Madrid",                          // ✏️ EDITA · lugar (sale en el sello de la postal)
      foto: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600",   // ✏️ EDITA · foto → "assets/fotos/recuerdo1.jpg"
      textoDetras: "Aquí va el texto largo que se ve al darle la vuelta a la Polaroid, escrito como si fuera una carta por detrás...\n\nCuenta aquí lo que sentiste ese día, lo que recuerdas, lo que te hizo reír.",  // ✏️ EDITA · carta de detrás
      bloqueado: false,                             // false = visible · true = cápsula bloqueada
      preguntaDesbloqueo: "",
      respuestaCorrecta: ""
    },
    {
      id: 2,
      fecha: "Verano 2024",
      titulo: "Nuestra escapada mágica ✈️❤️",
      ubicacion: "Valencia",
      foto: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=600",    // ✏️ EDITA · foto
      textoDetras: "Increíble aquel viaje, sobre todo cuando...",
      bloqueado: true,                              // bloqueado por pregunta
      preguntaDesbloqueo: "¿En qué ciudad nos comimos aquel arroz tan rico?",       // ✏️ EDITA · la pregunta
      respuestaCorrecta: ["valencia"]               // ✏️ EDITA · respuesta(s) válida(s), sin importar mayúsculas ni tildes
    },
    {
      id: 3,
      fecha: "Nuestro próximo aniversario",
      titulo: "Una sorpresa en el futuro ✨",
      ubicacion: "Donde tú quieras",
      foto: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=600",    // ✏️ EDITA · foto
      textoDetras: "Este recuerdo se abre solo cuando llegue el día... 💙",
      bloqueado: true,                              // bloqueado por fecha
      desbloqueoFecha: "2027-02-14T00:00:00",       // ✏️ EDITA · día en que se abre solo
      preguntaDesbloqueo: "",
      respuestaCorrecta: ""
    }
  ],


  /* ══════════════ 3. MAPA DE RECUERDOS ══════════════════════════════════════
     coords = [latitud, longitud]. Para sacarlas: en Google Maps, clic derecho sobre
     el sitio → el primer número que aparece es "latitud, longitud".
     ═══════════════════════════════════════════════════════════════════════════ */
  lugaresMapa: [
    {
      ciudad: "Madrid 💙",                         // ✏️ EDITA · nombre del lugar
      coords: [40.4168, -3.7038],                  // ✏️ EDITA · [latitud, longitud]
      descripcion: "Nuestros paseos, risas y cenas favoritas.",   // ✏️ EDITA · nota romántica
      foto: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=600"    // ✏️ EDITA · foto → "assets/fotos/madrid.jpg"
    },
    {
      ciudad: "Valencia ✈️",
      coords: [39.4699, -0.3763],
      descripcion: "Aquella escapada mágica con arroz y playa.",
      foto: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=600"
    }
  ],


  /* ══════════════ 4. BOTE DE RAZONES · una por línea, añade las que quieras ═══ */
  razones: [
    "Porque me haces reír hasta cuando estoy de mal humor 😂",              // ✏️ EDITA
    "Porque tu abrazo es mi lugar favorito del mundo 🫂",
    "Porque contigo hasta lo más simple se convierte en un plan perfecto ✨",
    "Porque me haces querer ser mejor cada día 💙",
    "Porque tu sonrisa me arregla cualquier día ❤️",
    "Porque eres mi persona favorita para todo 🥰",
    "Porque a tu lado el tiempo vuela y aun así quiero más ⌛",
    "Porque eres tú, y con eso me basta 💕"
  ],


  /* ══════════════ 5. QUIZ DE LA RELACIÓN ════════════════════════════════════
     ✏️ EDITA · Las preguntas de ejemplo son de RELLENO: cámbialas por cosas reales.
     "correcta" = posición de la respuesta buena contando desde 0
        (0 = la primera, 1 = la segunda, 2 = la tercera, 3 = la cuarta).
     ═══════════════════════════════════════════════════════════════════════════ */
  quiz: {
    titulo: "El gran quiz de nuestra historia",
    subtitulo: "¿Cuánto recordamos de lo nuestro? ❤️💙",
    preguntas: [
      { pregunta: "¿Qué día empezamos a salir?", opciones: ["14 de febrero de 2023", "14 de marzo de 2023", "1 de enero de 2023", "14 de febrero de 2022"], correcta: 0, explicacion: "¡El mejor día de mi vida! 💙" },
      { pregunta: "¿Dónde fue nuestra primera cita?", opciones: ["En un parque", "En una cafetería", "En el cine", "En un restaurante"], correcta: 1, explicacion: "Qué nervios ❤️" },
      { pregunta: "¿Cuál es nuestra comida favorita para compartir?", opciones: ["Pizza", "Sushi", "Hamburguesas", "Pasta"], correcta: 0, explicacion: "Siempre pedimos de más 😄" },
      { pregunta: "¿En qué ciudad hicimos nuestra primera escapada?", opciones: ["Valencia", "Barcelona", "Sevilla", "Madrid"], correcta: 0, explicacion: "Arroz, playa y tú ✈️" },
      { pregunta: "¿Cuál fue la primera película que vimos juntos?", opciones: ["Una romántica", "Una de acción", "Una de terror", "Una de animación"], correcta: 0, explicacion: "¡Y lloré yo, no tú! 🎬" },
      { pregunta: "¿Qué es lo que más me gusta de ti?", opciones: ["Tu sonrisa", "Tu risa", "Tu forma de ser", "Todo, mi amor"], correcta: 3, explicacion: "Todo, absolutamente todo ❤️" }
    ],
    // Mensajes según la nota (minimo = porcentaje de aciertos: 0, 0.5 = mitad, 0.8, 1 = todas)
    resultados: [
      { minimo: 0,   titulo: "Mmm... ¡toca repasar nuestra historia!", mensaje: "Tenemos que crear muchos más recuerdos juntos 😉❤️" },
      { minimo: 0.5, titulo: "¡No está nada mal!", mensaje: "Casi te lo sabes todo de nosotros 💙" },
      { minimo: 0.8, titulo: "¡Casi perfecto!", mensaje: "Se nota que guardas cada momento como yo 🥰" },
      { minimo: 1,   titulo: "¡PERFECTO, mi amor!", mensaje: "Nadie conoce nuestra historia como tú ❤️💙" }
    ],
    premio: "Premio por pleno: un beso gigante y cena donde tú quieras 💋🍽️",                  // ✏️ EDITA · si acierta todas
    mensajeWhatsApp: "¡Hola mi amor! ❤️ He hecho el quiz de nuestra historia y he sacado {puntos}/{total} 💙✨"   // {puntos} y {total} se rellenan solos
  },


  /* ══════════════ 6. JUEGO DE LA CANASTA ════════════════════════════════════
     Aparece dentro de la pestaña Secreto, después de abrir la carta.
     Arrastra el balón hacia abajo-izquierda y suéltalo. Si acierta {aciertosParaPremio}
     de {tiros}, sale el botón que te avisa por WhatsApp (el mensaje sale escrito; ella
     solo pulsa enviar).
     ═══════════════════════════════════════════════════════════════════════════ */
  juego: {
    titulo: "Encesta conmigo 🏀",
    subtitulo: "Tira hacia atrás y suelta ❤️",
    tiros: 5,                                   // ✏️ EDITA · tiros por partida
    aciertosParaPremio: 5,                      // ✏️ EDITA · aciertos necesarios para ganar
    pelotaImg: "",                              // vacío = balón dibujado · o una foto: "assets/fotos/pelota.png"
    textoPanel: "Encesta {n} de {n}",           // título de la pantalla de inicio ({n} = aciertosParaPremio)
    textoPanelSub: "y gana tu sorpresa",
    textoPremio: "Has ganado un beso gigante y una noche a tu gusto, mi amor 💋",   // ✏️ EDITA · premio al ganar
    textoFallo: "Casi… necesitas {n} aciertos para el premio. ¡Otra vez! 💪",
    mensajeWhatsApp: "¡Hola mi amor! 🏀❤️ He metido {aciertos}/{tiros} canastas en nuestro juego de aniversario. ¡Quiero mi premio! 💙"   // ✏️ EDITA · mensaje que te llega
  },


  /* ══════════════ 7. RULETA DE PREMIOS (pestaña Regalos) ════════════════════
     Cada giro se puede reclamar por WhatsApp. Puedes poner entre 4 y 12 premios
     (con 6, 8 o 10 queda mejor). Cada premio: emoji + texto.
     ═══════════════════════════════════════════════════════════════════════════ */
  ruleta: {
    titulo: "La ruleta de la suerte",
    subtitulo: "Gira y descubre tu premio 🎡",
    boton: "¡Girar! ❤️",
    unaVezAlDia: false,                         // true = solo un giro al día
    premios: [                                  // ✏️ EDITA
      { emoji: "😘", texto: "10 besos seguidos" },
      { emoji: "🍽️", texto: "Cena donde elijas" },
      { emoji: "💆", texto: "Masaje de 15 minutos" },
      { emoji: "🎬", texto: "Noche de peli y mantita" },
      { emoji: "🍫", texto: "Un antojito sorpresa" },
      { emoji: "🫂", texto: "Abrazo de 1 minuto sin soltar" },
      { emoji: "✈️", texto: "Escapada sorpresa" },
      { emoji: "💌", texto: "Una carta escrita a mano" }
    ],
    mensajeWhatsApp: "¡Hola mi amor! ❤️ Giré la ruleta de nuestro 3er aniversario y me ha tocado: {premio} ✨ ¡Quiero mi premio!"   // {premio} se rellena solo
  },


  /* ══════════════ 8. BOTÓN DEL AMOR · mensajes rápidos por WhatsApp ═════════
     Cada botón abre WhatsApp contigo con el mensaje "msg" ya escrito.
     ═══════════════════════════════════════════════════════════════════════════ */
  mensajesRapidos: {
    titulo: "El botón del amor",
    subtitulo: "Un toque y le llega a él 📲",
    placeholder: "Escríbele algo bonito…",
    botones: [                                  // ✏️ EDITA · emoji, texto del botón y mensaje
      { emoji: "😘", label: "Mándame un beso", msg: "Mi amor, quiero un beso ahora mismo 😘❤️" },
      { emoji: "🫂", label: "Quiero un abrazo", msg: "Necesito uno de esos abrazos tuyos que lo arreglan todo 🫂💙" },
      { emoji: "🥺", label: "Te echo de menos", msg: "Te echo de menos, amor 🥺❤️" },
      { emoji: "📸", label: "Mándame una foto", msg: "Mándame una foto tuya, quiero verte la carita 📸💙" },
      { emoji: "📞", label: "Llámame", msg: "Llámame cuando puedas, quiero oír tu voz 📞❤️" },
      { emoji: "🍕", label: "Plan de cena", msg: "¿Cena juntos hoy? Elijo yo el postre 🍕💙" }
    ]
  },


  /* ══════════════ 9. VALES · se canjean por WhatsApp ════════════════════════
     icono: "heart" ❤️ · "plane" ✈️ · "sparkles" ✨ · "gift" 🎁 · "cake" 🍰 · "movie" 🍿
     "id" tiene que ser único (vale-1, vale-2, vale-3…).
     ═══════════════════════════════════════════════════════════════════════════ */
  vales: [
    { id: "vale-1", titulo: "Una cena romántica donde elijas", descripcion: "Hoy mandas tú, yo solo disfruto de verte feliz 💙", icono: "heart" },      // ✏️ EDITA
    { id: "vale-2", titulo: "Escapada de fin de semana", descripcion: "Prepara la maleta, nos vamos a crear más recuerdos ✨", icono: "plane" },
    { id: "vale-3", titulo: "Tarde de mimos, peli y tu comida favorita", descripcion: "Sin prisas, solo tú y yo en el sofá 🧸💙", icono: "sparkles" }
  ],


  /* ══════════════ 10. RASCA Y GANA (pestaña Inicio) ═════════════════════════ */
  rascaYGana: {
    titulo: "✨ Rasca con el dedo para ver tu sorpresa ✨",
    textoCapa: "✨ Rasca aquí con el dedo, amor ✨",    // texto sobre la capa plateada
    mensajeOculto: "Ponte guapa que hoy nos vamos a celebrar nuestros 3 años a un sitio muy especial 💙🥂",   // ✏️ EDITA · la sorpresa
    textoPista: "Rasca con el dedo ✨",         // texto bajo el boleto antes de rascar
    textoBoton: "Contarle que ya la vi 📲",     // botón que sale al descubrir la sorpresa
    mensajeWhatsApp: "¡Hola mi amor! ❤️ Acabo de rascar mi sorpresa y ya sé lo que me espera 😍💙"   // ✏️ EDITA · mensaje que te llega por WhatsApp
  },


  /* ══════════════ 11. SECRETO · contraseña y carta (pestaña Secreto) ═══════
     La contraseña se compara SIN mayúsculas, tildes, espacios ni símbolos:
     "14/02/2023" y "14022023" cuentan igual. Pon todas las variantes que aceptes.
     ═══════════════════════════════════════════════════════════════════════════ */
  easterEgg: {
    tituloSeccion: "🔐 Tenemos un secreto guardado...",
    pista: "Día: XX-XX-XX",                     // ✏️ EDITA · lo que ve ella (no la contraseña)
    pistaExtra: "El día en que empezó todo, día-mes-año ❤️",   // ✏️ EDITA · pista escrita a mano
    labelInput: "Contraseña:",
    placeholder: "Escribe aquí la contraseña...",
    boton: "Abrir Secreto ❤️✨",
    passwordsValidas: ["140223", "14022023", "14/02/2023", "14-02-2023", "14 de febrero", "14 de febrero de 2023", "14 de febrero del 2023"],   // ✏️ EDITA · contraseñas válidas
    mensajeError: "¡Ups! Esa no es la contraseña mi amor... mira bien la pista, piensa en nuestro día 🥺💙",
    tituloSecreto: "❤️ ¡Desbloqueaste mi carta secreta! ❤️",
    mensajeSecreto: "Gracias por estos 3 años increíbles. Eres lo mejor que me ha pasado y quería dejarte este rincón secreto solo para nosotros...\n\nTe quiero hoy, mañana y siempre.",   // ✏️ EDITA · la carta
    fotoSecreta: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=600"   // ✏️ EDITA · foto → "assets/fotos/secreta.jpg"
  }
};
