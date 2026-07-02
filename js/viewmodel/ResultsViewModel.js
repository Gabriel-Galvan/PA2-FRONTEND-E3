/* =====================================================================
   viewmodel/ResultsViewModel.js
   =====================================================================
   CAPA: VIEWMODEL
   --------------------------------
   En el mockup original, la "etiqueta" (Normal / Revisar / Positivo)
   de cada resultado se elegia con Math.random(), sin relacion alguna
   con la clase predicha. Aqui se deriva del DIAGNOSTICO REAL que
   devuelve el modelo de IA, usando el criterio citologico habitual
   del sistema Bethesda / dataset SIPaKMeD:

     - Superficiales/Intermedias y Parabasales: celulas de epitelio
       normal -> badge "Normal".
     - Metaplasicas: cambio celular benigno pero que conviene seguir
       -> badge "Revisar".
     - Koilocitoticas: cambios asociados a VPH -> badge "Revisar".
     - Disqueratosicas: celulas con mayor asociacion a lesion/cancer
       -> badge "Positivo".

   IMPORTANTE: esto es solo una clasificacion de apoyo visual para la
   interfaz, NO un diagnostico medico definitivo; la confirmacion
   clinica siempre la da un profesional de salud.
   ===================================================================== */

const MAPA_BADGE_POR_CLASE = {
  "Superficiales/Intermedias": { claseCSS: "badge-normal", etiqueta: "Normal" },
  Parabasales: { claseCSS: "badge-normal", etiqueta: "Normal" },
  Metaplasicas: { claseCSS: "badge-revisar", etiqueta: "Revisar" },
  Koilocitoticas: { claseCSS: "badge-revisar", etiqueta: "Revisar" },
  Disqueratosicas: { claseCSS: "badge-positivo", etiqueta: "Positivo" },
};

function obtenerBadgePara(diagnostico) {
  return MAPA_BADGE_POR_CLASE[diagnostico] || { claseCSS: "badge-revisar", etiqueta: "Revisar" };
}

class ResultsViewModel {
  constructor(uploadViewModel) {
    this._uploadViewModel = uploadViewModel;
  }

  /** Devuelve los resultados de la ultima tanda de analisis, ya con su badge clinico calculado. */
  obtenerResultados() {
    return this._uploadViewModel.ultimosResultados.map((resultado) => ({
      ...resultado,
      badge: resultado.error ? null : obtenerBadgePara(resultado.diagnostico),
    }));
  }

  hayResultados() {
    return this._uploadViewModel.ultimosResultados.length > 0;
  }
}