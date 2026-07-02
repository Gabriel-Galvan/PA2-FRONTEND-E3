/* =====================================================================
   viewmodel/ConfigViewModel.js
   =====================================================================
   CAPA: VIEWMODEL
   --------------------------------
   Estado de las preferencias visuales (igual que en el mockup
   original): tema claro/oscuro, tamano de fuente y avatar del
   usuario. Es estado puramente de interfaz, por eso no necesita
   pasar por el backend.
   ===================================================================== */

class ConfigViewModel {
  constructor() {
    this.modoOscuro = false;
    this.tamanoFuente = 14;
    this.urlAvatar = null;
  }

  alternarTema() {
    this.modoOscuro = !this.modoOscuro;
    return this.modoOscuro;
  }

  cambiarFuente(delta) {
    this.tamanoFuente = Math.max(11, Math.min(20, this.tamanoFuente + delta));
    return this.tamanoFuente;
  }

  establecerAvatar(urlObjeto) {
    this.urlAvatar = urlObjeto;
  }
}