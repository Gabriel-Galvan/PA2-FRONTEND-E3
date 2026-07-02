/* =====================================================================
   model/AdminModel.js
   =====================================================================
   CAPA: MODEL
   --------------------------------
   Cubre, del lado del cliente, el requerimiento del cronograma:
   "el backend debera incluir funcionalidades administrativas, como
   mantenimiento, gestion de usuarios, permisos [...]". Solo el rol
   'admin' puede usar estas funciones (el backend tambien lo valida
   con @rol_requerido('admin'), por seguridad nunca se confia solo en
   que el frontend oculte el boton).
   ===================================================================== */

const AdminModel = {
  async listarUsuarios() {
    return ApiClient.solicitarJSON("/api/admin/usuarios", { metodo: "GET", autenticado: true });
  },

  async crearUsuario(nombreUsuario, contrasena, rol) {
    return ApiClient.solicitarJSON("/api/admin/usuarios", {
      metodo: "POST",
      autenticado: true,
      cuerpo: { nombre_usuario: nombreUsuario, contrasena: contrasena, rol: rol },
    });
  },

  async eliminarUsuario(usuarioId) {
    return ApiClient.solicitarJSON(`/api/admin/usuarios/${usuarioId}`, {
      metodo: "DELETE",
      autenticado: true,
    });
  },

  async cambiarEstadoUsuario(usuarioId, activo) {
    return ApiClient.solicitarJSON(`/api/admin/usuarios/${usuarioId}/estado`, {
      metodo: "PATCH",
      autenticado: true,
      cuerpo: { activo: activo },
    });
  },
};