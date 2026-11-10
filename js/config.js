/* =====================================================================
   CONFIG: AQUÍ EDITAS TODO (textos, fechas, fotos, vales, contraseña).
   El resto de archivos solo leen de este objeto.
   Fotos: pon las tuyas en /assets y cámbialas, p. ej. "assets/foto1.jpg".
   ===================================================================== */
const CONFIG = {
  pareja: {
    nombreElla: "Zayra",
    nombreEl: "Tu amor",                    // cámbialo por tu nombre (firma de la carta)
    fechaInicio: "2023-02-14T00:00:00",     // 14 de febrero de 2023
    telefonoWhatsapp: "34600000000",        // TU número (sin +) para recibir los vales
    tituloHeader: "¡Felices 3 años, mi amor! 💙",
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
      titulo: "Nuestra escapada mágica ✈️💙",
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

  /* icono: "heart" | "plane" | "sparkles" | "gift" | "cake" | "movie" */
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
    pistaExtra: "El día en que empezó todo, día-mes-año 💙",
    labelInput: "Contraseña:",
    placeholder: "Escribe aquí la contraseña...",
    boton: "Abrir Secreto 💙✨",
    // Se comparan sin mayúsculas, tildes, espacios ni símbolos: "14/02/2023" == "14022023"
    passwordsValidas: ["140223", "14022023", "14/02/2023", "14-02-2023", "14 de febrero", "14 de febrero de 2023", "14 de febrero del 2023"],
    mensajeError: "¡Ups! Esa no es la contraseña mi amor... mira bien la pista, piensa en nuestro día 🥺💙",
    tituloSecreto: "💙 ¡Desbloqueaste mi carta secreta! 💙",
    mensajeSecreto: "Gracias por estos 3 años increíbles. Eres lo mejor que me ha pasado y quería dejarte este rincón secreto solo para nosotros...\n\nTe quiero hoy, mañana y siempre.",
    fotoSecreta: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=600"
  }
};
