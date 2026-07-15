/* =====================================================================
   model/NotificacionesModel.js
   =====================================================================
   CAPA: MODEL
   --------------------------------
   Sabe COMO hablar con /api/notificaciones: la "campanita" de la
   interfaz. Dos tipos de notificacion llegan por aca: avisos de
   expediente listo (para el medico dueno) y avisos de codigo de
   invitacion generado (para los administradores).
   ===================================================================== */

const NotificacionesModel = {
  /** Devuelve { notificaciones: [...], no_leidas: number }. */
  async listar(limite = 30) {
    return ApiClient.solicitarJSON(`/api/notificaciones?limite=${limite}`, {
      metodo: "GET",
      autenticado: true,
    });
  },

  async marcarLeida(notificacionId) {
    return ApiClient.solicitarJSON(`/api/notificaciones/${notificacionId}/leer`, {
      metodo: "PATCH",
      autenticado: true,
    });
  },

  async marcarTodasLeidas() {
    return ApiClient.solicitarJSON("/api/notificaciones/leer-todas", {
      metodo: "PATCH",
      autenticado: true,
    });
  },
};
