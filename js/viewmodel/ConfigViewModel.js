/* =====================================================================
   viewmodel/ConfigViewModel.js
   =====================================================================
   CAPA: VIEWMODEL
   --------------------------------
   Estado de las preferencias visuales: tema claro/oscuro y tamano de
   fuente. Es estado puramente de interfaz (no vive en el backend),
   pero SI se persiste en localStorage para que sobreviva a recargar
   la pagina o cerrar y volver a abrir el navegador (a diferencia de
   sessionStorage, que se usa para la sesion de autenticacion).

   La foto de perfil (avatar) ya NO vive aqui: ahora se guarda en el
   backend ligada al usuario (ver model/AuthModel.js), asi que
   persiste entre sesiones y dispositivos.
   ===================================================================== */

class ConfigViewModel {
  static CLAVE_TEMA = "cervix_app_modo_oscuro";
  static CLAVE_FUENTE = "cervix_app_tamano_fuente";

  constructor() {
    this.modoOscuro = localStorage.getItem(ConfigViewModel.CLAVE_TEMA) === "1";
    const fuenteGuardada = parseInt(localStorage.getItem(ConfigViewModel.CLAVE_FUENTE), 10);
    this.tamanoFuente = Number.isFinite(fuenteGuardada) ? fuenteGuardada : 14;
  }

  alternarTema() {
    this.modoOscuro = !this.modoOscuro;
    localStorage.setItem(ConfigViewModel.CLAVE_TEMA, this.modoOscuro ? "1" : "0");
    return this.modoOscuro;
  }

  cambiarFuente(delta) {
    this.tamanoFuente = Math.max(11, Math.min(20, this.tamanoFuente + delta));
    localStorage.setItem(ConfigViewModel.CLAVE_FUENTE, String(this.tamanoFuente));
    return this.tamanoFuente;
  }
}