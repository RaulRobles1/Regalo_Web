/* =====================================================================
   CONFIG: AQUÍ EDITAS TODO (textos, fechas, fotos, vales, quiz, contraseña).
   El resto de archivos solo leen de este objeto.
   Fotos: pon las tuyas en /assets y cámbialas, p. ej. "assets/foto1.jpg".
   ===================================================================== */
const CONFIG = {
  pareja: {
    nombreElla: "Zayra",
    nombreEl: "Tu amor",                    // cámbialo por tu nombre (firma de la carta)
    fechaInicio: "2023-02-14T00:00:00",     // 14 de febrero de 2023
    telefonoWhatsapp: "34600000000",        // TU número (sin +) para recibir mensajes, vales y premios
    tituloHeader: "¡Felices 3 años, mi amor! ❤️",
    fraseHeader: "3 años creando los recuerdos más bonitos del mundo a tu lado 💙✨",
    fraseContador: "Y cada segundo a tu lado es mi favorito ✨"
  },

  /* Cada recuerdo puede estar:
     - libre: bloqueado:false
     - con pregunta: bloqueado:true + preguntaDesbloqueo + respuestaCorrecta (texto o lista de textos)
     - con fecha: bloqueado:true + desbloqueoFecha ("AAAA-MM-DDT00:00:00"); no se abre hasta esa fecha */
  recuerdosTimeline: [
    {
      id: 1,
      fecha: "14 de Febrero 2023",
      titulo: "Donde empezó todo 💙",
      ubicacion: "Madrid",
      foto: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600",
      textoDetras: "Aquí va el texto largo que se ve al darle la vuelta a la Polaroid, escrito como si fuera una carta por detrás...\n\nCuenta aquí lo que sentiste ese día, lo que recuerdas, lo que te hizo reír.",
      bloqueado: false,
      preguntaDesbloqueo: "",
      respuestaCorrecta: ""
    },
    {
      id: 2,
      fecha: "Verano 2024",
      titulo: "Nuestra escapada mágica ✈️❤️",
      ubicacion: "Valencia",
      foto: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=600",
      textoDetras: "Increíble aquel viaje, sobre todo cuando...",
      bloqueado: true,
      preguntaDesbloqueo: "¿En qué ciudad nos comimos aquel arroz tan rico?",
      respuestaCorrecta: ["valencia"]
    },
    {
      id: 3,
      fecha: "Nuestro próximo aniversario",
      titulo: "Una sorpresa en el futuro ✨",
      ubicacion: "Donde tú quieras",
      foto: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=600",
      textoDetras: "Este recuerdo se abre solo cuando llegue el día... 💙",
      bloqueado: true,
      desbloqueoFecha: "2027-02-14T00:00:00",
      preguntaDesbloqueo: "",
      respuestaCorrecta: ""
    }
  ],

  lugaresMapa: [
    {
      ciudad: "Madrid 💙",
      coords: [40.4168, -3.7038],
      descripcion: "Nuestros paseos, risas y cenas favoritas.",
      foto: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=600"
    },
    {
      ciudad: "Valencia ✈️",
      coords: [39.4699, -0.3763],
      descripcion: "Aquella escapada mágica con arroz y playa.",
      foto: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=600"
    }
  ],

  /* ---------- Bote de razones (añade todas las que quieras) ---------- */
  razones: [
    "Porque me haces reír hasta cuando estoy de mal humor 😂",
    "Porque tu abrazo es mi lugar favorito del mundo 🫂",
    "Porque contigo hasta lo más simple se convierte en un plan perfecto ✨",
    "Porque me haces querer ser mejor cada día 💙",
    "Porque tu sonrisa me arregla cualquier día ❤️",
    "Porque eres mi persona favorita para todo 🥰",
    "Porque a tu lado el tiempo vuela y aun así quiero más ⌛",
    "Porque eres tú, y con eso me basta 💕"
  ],

  /* ---------- Quiz de nuestra historia ----------
     EDITA las preguntas, opciones y la respuesta correcta (correcta = número de opción empezando en 0).
     Las de ejemplo son de relleno: cámbialas por cosas reales de vosotros. */
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
    resultados: [
      { minimo: 0,   titulo: "Mmm... ¡toca repasar nuestra historia!", mensaje: "Tenemos que crear muchos más recuerdos juntos 😉❤️" },
      { minimo: 0.5, titulo: "¡No está nada mal!", mensaje: "Casi te lo sabes todo de nosotros 💙" },
      { minimo: 0.8, titulo: "¡Casi perfecto!", mensaje: "Se nota que guardas cada momento como yo 🥰" },
      { minimo: 1,   titulo: "¡PERFECTO, mi amor!", mensaje: "Nadie conoce nuestra historia como tú ❤️💙" }
    ],
    premio: "Premio por pleno: un beso gigante y cena donde tú quieras 💋🍽️",
    mensajeWhatsApp: "¡Hola mi amor! ❤️ He hecho el quiz de nuestra historia y he sacado {puntos}/{total} 💙✨"
  },

  /* ---------- Ruleta de premios (cada giro se puede reclamar por WhatsApp) ---------- */
  ruleta: {
    titulo: "La ruleta de la suerte",
    subtitulo: "Gira y descubre tu premio 🎡",
    boton: "¡Girar! ❤️",
    unaVezAlDia: false,                     // true = solo un giro al día
    premios: [
      { emoji: "😘", texto: "10 besos seguidos" },
      { emoji: "🍽️", texto: "Cena donde elijas" },
      { emoji: "💆", texto: "Masaje de 15 minutos" },
      { emoji: "🎬", texto: "Noche de peli y mantita" },
      { emoji: "🍫", texto: "Un antojito sorpresa" },
      { emoji: "🫂", texto: "Abrazo de 1 minuto sin soltar" },
      { emoji: "✈️", texto: "Escapada sorpresa" },
      { emoji: "💌", texto: "Una carta escrita a mano" }
    ],
    mensajeWhatsApp: "¡Hola mi amor! ❤️ Giré la ruleta de nuestro 3er aniversario y me ha tocado: {premio} ✨ ¡Quiero mi premio!"
  },

  /* ---------- Botón del amor: mensajes rápidos por WhatsApp ---------- */
  mensajesRapidos: {
    titulo: "El botón del amor",
    subtitulo: "Un toque y le llega a él 📲",
    placeholder: "Escríbele algo bonito…",
    botones: [
      { emoji: "😘", label: "Mándame un beso", msg: "Mi amor, quiero un beso ahora mismo 😘❤️" },
      { emoji: "🫂", label: "Quiero un abrazo", msg: "Necesito uno de esos abrazos tuyos que lo arreglan todo 🫂💙" },
      { emoji: "🥺", label: "Te echo de menos", msg: "Te echo de menos, amor 🥺❤️" },
      { emoji: "📸", label: "Mándame una foto", msg: "Mándame una foto tuya, quiero verte la carita 📸💙" },
      { emoji: "📞", label: "Llámame", msg: "Llámame cuando puedas, quiero oír tu voz 📞❤️" },
      { emoji: "🍕", label: "Plan de cena", msg: "¿Cena juntos hoy? Elijo yo el postre 🍕💙" }
    ]
  },

  /* Los vales (se canjean por WhatsApp) */
  vales: [
    { id: "vale-1", titulo: "Una cena romántica donde elijas", descripcion: "Hoy mandas tú, yo solo disfruto de verte feliz 💙", icono: "heart" },
    { id: "vale-2", titulo: "Escapada de fin de semana", descripcion: "Prepara la maleta, nos vamos a crear más recuerdos ✨", icono: "plane" },
    { id: "vale-3", titulo: "Tarde de mimos, peli y tu comida favorita", descripcion: "Sin prisas, solo tú y yo en el sofá 🧸💙", icono: "sparkles" }
  ],

  rascaYGana: {
    titulo: "✨ Rasca con el dedo para ver tu sorpresa ✨",
    textoCapa: "✨ Rasca aquí con el dedo, amor ✨",
    mensajeOculto: "Ponte guapa que hoy nos vamos a celebrar nuestros 3 años a un sitio muy especial 💙🥂"
  },

  easterEgg: {
    tituloSeccion: "🔐 Tenemos un secreto guardado...",
    pista: "Día: XX-XX-XX",                  // la contraseña es esa fecha en 6 dígitos: 140223
    pistaExtra: "El día en que empezó todo, día-mes-año ❤️",
    labelInput: "Contraseña:",
    placeholder: "Escribe aquí la contraseña...",
    boton: "Abrir Secreto ❤️✨",
    // Se comparan sin mayúsculas, tildes, espacios ni símbolos: "14/02/2023" == "14022023"
    passwordsValidas: ["140223", "14022023", "14/02/2023", "14-02-2023", "14 de febrero", "14 de febrero de 2023", "14 de febrero del 2023"],
    mensajeError: "¡Ups! Esa no es la contraseña mi amor... mira bien la pista, piensa en nuestro día 🥺💙",
    tituloSecreto: "❤️ ¡Desbloqueaste mi carta secreta! ❤️",
    mensajeSecreto: "Gracias por estos 3 años increíbles. Eres lo mejor que me ha pasado y quería dejarte este rincón secreto solo para nosotros...\n\nTe quiero hoy, mañana y siempre.",
    fotoSecreta: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=600"
  }
};
