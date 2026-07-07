/* =====================================================================
   viewmodel/AdminViewModel.js
   =====================================================================
   CAPA: VIEWMODEL
   --------------------------------
   Logica de la pantalla de "Gestion de Usuarios" (solo visible para
   el rol admin). Mantiene la lista de usuarios cargada y expone
   acciones para crear/eliminar/activar-desactivar, delegando siempre
   la llamada real a AdminModel.
   ===================================================================== */

class AdminViewModel {
  constructor() {
    this.usuarios = [];
    this.cargando = false;
    this.mensajeError = "";
  }

  async cargarUsuarios() {
    this.cargando = true;
    this.mensajeError = "";
    try {
      this.usuarios = await AdminModel.listarUsuarios();
    } catch (error) {
      this.mensajeError = error.message;
    }
    this.cargando = false;
  }

  async crearUsuario(nombreUsuario, contrasena, rol, correo) {
    this.mensajeError = "";
    try {
      await AdminModel.crearUsuario(nombreUsuario, contrasena, rol, correo);
      await this.cargarUsuarios();
      return true;
    } catch (error) {
      this.mensajeError = error.message;
      return false;
    }
  }

  async eliminarUsuario(usuarioId) {
    try {
      await AdminModel.eliminarUsuario(usuarioId);
      await this.cargarUsuarios();
    } catch (error) {
      this.mensajeError = error.message;
    }
  }

  async alternarEstado(usuarioId, activoActual) {
    try {
      await AdminModel.cambiarEstadoUsuario(usuarioId, !activoActual);
      await this.cargarUsuarios();
    } catch (error) {
      this.mensajeError = error.message;
    }
  }
}