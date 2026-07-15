/* =====================================================================
   viewmodel/NotificacionesViewModel.js
   =====================================================================
   CAPA: VIEWMODEL
   --------------------------------
   Estado de la "campanita": lista de notificaciones del usuario
   autenticado y contador de no leidas.
   ===================================================================== */

class NotificacionesViewModel {
  constructor() {
    this.notificaciones = [];
    this.noLeidas = 0;
    this.cargando = false;
    this.mensajeError = "";
  }

  async cargar() {
    this.cargando = true;
    this.mensajeError = "";
    try {
      const datos = await NotificacionesModel.listar();
      this.notificaciones = datos.notificaciones || [];
      this.noLeidas = datos.no_leidas || 0;
    } catch (error) {
      this.mensajeError = error.message;
    }
    this.cargando = false;
  }

  async marcarLeida(notificacionId) {
    try {
      await NotificacionesModel.marcarLeida(notificacionId);
      const notificacion = this.notificaciones.find((n) => n.id === notificacionId);
      if (notificacion && !notificacion.leida) {
        notificacion.leida = true;
        this.noLeidas = Math.max(0, this.noLeidas - 1);
      }
    } catch (error) {
      this.mensajeError = error.message;
    }
  }

  async marcarTodasLeidas() {
    try {
      await NotificacionesModel.marcarTodasLeidas();
      this.notificaciones.forEach((n) => (n.leida = true));
      this.noLeidas = 0;
    } catch (error) {
      this.mensajeError = error.message;
    }
  }
}
