/* =====================================================================
   model/AuthModel.js
   =====================================================================
   CAPA: MODEL
   --------------------------------
   Implementa PB-14 ("Implementacion del modulo de autenticacion y
   control de accesos para el personal de salud") en el lado del
   cliente. Sabe COMO iniciar sesion contra la API y COMO guardar el
   token de sesion (JWT) entre paginas. No conoce nada de HTML.

   Se usa sessionStorage (no localStorage) a proposito: la sesion se
   cierra automaticamente cuando se cierra la pestana/navegador,
   coherente con software de uso clinico donde no conviene dejar una
   sesion abierta indefinidamente en un equipo compartido.
   ===================================================================== */

const AuthModel = {
  CLAVE_TOKEN: "cervix_app_token",
  CLAVE_USUARIO: "cervix_app_usuario",

  /**
   * Llama a POST /api/auth/login. Si las credenciales son correctas,
   * guarda el token y el usuario en sessionStorage.
   * Lanza un Error con el mensaje del backend si fallan (por ejemplo
   * "Usuario y clave incorrectos", tal como pide el cronograma).
   */
  async iniciarSesion(nombreUsuario, contrasena) {
    const datos = await ApiClient.solicitarJSON("/api/auth/login", {
      metodo: "POST",
      cuerpo: { usuario: nombreUsuario, contrasena: contrasena },
    });
    sessionStorage.setItem(this.CLAVE_TOKEN, datos.token);
    sessionStorage.setItem(this.CLAVE_USUARIO, JSON.stringify(datos.usuario));
    return datos.usuario;
  },

  cerrarSesion() {
    sessionStorage.removeItem(this.CLAVE_TOKEN);
    sessionStorage.removeItem(this.CLAVE_USUARIO);
  },

  /**
   * Permite que el propio usuario (medico o admin) configure su correo
   * de notificaciones desde Configuracion, sin depender de un admin.
   * Actualiza tambien la copia en sessionStorage para que el resto de
   * la app (banner, config) refleje el cambio sin recargar la pagina.
   */
  async actualizarCorreo(correo) {
    const datos = await ApiClient.solicitarJSON("/api/perfil/correo", {
      metodo: "PATCH",
      autenticado: true,
      cuerpo: { correo: correo },
    });
    const usuario = this.obtenerUsuario();
    if (usuario) {
      usuario.correo = datos.correo;
      sessionStorage.setItem(this.CLAVE_USUARIO, JSON.stringify(usuario));
    }
    return datos.correo;
  },

  obtenerToken() {
    return sessionStorage.getItem(this.CLAVE_TOKEN);
  },

  obtenerUsuario() {
    const crudo = sessionStorage.getItem(this.CLAVE_USUARIO);
    return crudo ? JSON.parse(crudo) : null;
  },

  estaAutenticado() {
    return !!this.obtenerToken();
  },
};