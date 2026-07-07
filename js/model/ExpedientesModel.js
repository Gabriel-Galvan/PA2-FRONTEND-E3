/* =====================================================================
   model/ExpedientesModel.js
   =====================================================================
   CAPA: MODEL
   --------------------------------
   Implementa, del lado del cliente, el Modulo de Expedientes (PB-12):
   cada imagen citologica analizada se guarda como un expediente ligado
   a un paciente y al medico que lo creo. Sabe COMO hablar con
   /api/expedientes, nada mas: el "que hacer" con esos datos vive en
   viewmodel/ExpedientesViewModel.js y viewmodel/UploadViewModel.js.
   ===================================================================== */

const ExpedientesModel = {
  /**
   * Crea un expediente: sube la imagen + los datos clinicos del
   * paciente en una sola peticion multipart. El backend analiza la
   * imagen con el modelo de IA, persiste el expediente completo y
   * (si el medico configuro un correo) intenta notificarle por email.
   * @param {File} archivo
   * @param {Object} datosPaciente - nombre_paciente, numero_documento,
   *        fecha_nacimiento, historial_ginecologico, sintomas, observaciones
   */
  async crearExpediente(archivo, datosPaciente) {
    return ApiClient.subirArchivoConCampos("/api/expedientes", "imagen", archivo, datosPaciente, {
      autenticado: true,
    });
  },

  /** Lista los expedientes visibles para el usuario autenticado (propios, o todos si es admin). */
  async listarExpedientes() {
    return ApiClient.solicitarJSON("/api/expedientes", { metodo: "GET", autenticado: true });
  },

  /** Detalle completo de un expediente, incluida la imagen en base64. */
  async obtenerExpediente(expedienteId) {
    return ApiClient.solicitarJSON(`/api/expedientes/${expedienteId}`, { metodo: "GET", autenticado: true });
  },

  /** Actualiza solo los datos clinicos (nunca el resultado de IA ni la imagen). */
  async actualizarExpediente(expedienteId, campos) {
    return ApiClient.solicitarJSON(`/api/expedientes/${expedienteId}`, {
      metodo: "PATCH",
      autenticado: true,
      cuerpo: campos,
    });
  },

  async eliminarExpediente(expedienteId) {
    return ApiClient.solicitarJSON(`/api/expedientes/${expedienteId}`, {
      metodo: "DELETE",
      autenticado: true,
    });
  },
};
