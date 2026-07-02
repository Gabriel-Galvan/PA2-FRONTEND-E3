/* =====================================================================
   model/AnalisisModel.js
   =====================================================================
   CAPA: MODEL
   --------------------------------
   Implementa, del lado del cliente, PB-10/PB-11: enviar una imagen
   citologica real al backend y recibir el diagnostico real generado
   por el modelo de IA (MobileNetV2). Antes este resultado se generaba
   con numeros aleatorios en el navegador (Math.random); ahora viaja
   la imagen real al servidor y la respuesta es la prediccion real del
   modelo entrenado.
   ===================================================================== */

const AnalisisModel = {
  /**
   * Envia una imagen al endpoint protegido /api/analizar.
   * @param {File} archivo
   * @returns {Promise<{diagnostico:string, confianza:number, probabilidades:object, archivo:string}>}
   */
  async analizarImagen(archivo) {
    return ApiClient.subirArchivo("/api/analizar", "imagen", archivo, { autenticado: true });
  },
};