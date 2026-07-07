/* =====================================================================
   viewmodel/ResultsViewModel.js
   =====================================================================
   CAPA: VIEWMODEL
   --------------------------------
   El backend ahora calcula la clasificacion clinica de apoyo
   ("severidad": normal | revisar | positivo) usando el criterio
   Bethesda / dataset SIPaKMeD directamente en domain/entities.py
   (Expediente.severidad), para que sea una UNICA fuente de verdad
   compartida por la API, el correo de notificacion y esta pantalla.
   Aqui solo se traduce esa severidad a un badge visual.

   IMPORTANTE: esto es solo una clasificacion de apoyo visual para la
   interfaz, NO un diagnostico medico definitivo; la confirmacion
   clinica siempre la da un profesional de salud.
   ===================================================================== */

const MAPA_BADGE_POR_SEVERIDAD = {
  normal: { claseCSS: "badge-normal", etiqueta: "Normal" },
  revisar: { claseCSS: "badge-revisar", etiqueta: "Revisar" },
  positivo: { claseCSS: "badge-positivo", etiqueta: "Positivo" },
};

function obtenerBadgePara(severidad) {
  return MAPA_BADGE_POR_SEVERIDAD[severidad] || MAPA_BADGE_POR_SEVERIDAD.revisar;
}

class ResultsViewModel {
  constructor(uploadViewModel) {
    this._uploadViewModel = uploadViewModel;
  }

  /** Devuelve los expedientes recien creados en la ultima tanda de analisis, con su badge clinico. */
  obtenerResultados() {
    return this._uploadViewModel.ultimosResultados.map((resultado) => ({
      ...resultado,
      badge: resultado.error ? null : obtenerBadgePara(resultado.severidad),
    }));
  }

  hayResultados() {
    return this._uploadViewModel.ultimosResultados.length > 0;
  }
}
