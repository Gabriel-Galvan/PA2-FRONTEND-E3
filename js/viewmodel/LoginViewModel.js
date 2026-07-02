/* =====================================================================
   viewmodel/LoginViewModel.js
   =====================================================================
   CAPA: VIEWMODEL (la "VM" de MVVM)
   --------------------------------
   El ViewModel es el puente entre el Modelo y la Vista: contiene el
   ESTADO de la pantalla (cargando, mensajeError) y la LOGICA de que
   hacer cuando el usuario pulsa "Ingresar", pero jamas escribe
   directamente en el DOM (eso lo hace view/LoginView.js, suscrito a
   este ViewModel).
   ===================================================================== */

class LoginViewModel {
  constructor() {
    this.cargando = false;
    this.mensajeError = "";
    this._oyentes = [];
  }

  /** La View se suscribe aqui para re-renderizarse cuando cambia el estado. */
  suscribir(funcionOyente) {
    this._oyentes.push(funcionOyente);
  }

  _notificar() {
    this._oyentes.forEach((f) => f(this));
  }

  async iniciarSesion(nombreUsuario, contrasena) {
    this.cargando = true;
    this.mensajeError = "";
    this._notificar();

    try {
      const usuario = await AuthModel.iniciarSesion(nombreUsuario, contrasena);
      this.cargando = false;
      this._notificar();
      return usuario;
    } catch (error) {
      this.cargando = false;
      // Mensaje pedido explicitamente en el cronograma para credenciales invalidas.
      this.mensajeError = error.message || "Usuario y clave incorrectos";
      this._notificar();
      return null;
    }
  }
}