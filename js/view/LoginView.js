/* =====================================================================
   view/LoginView.js
   =====================================================================
   CAPA: VIEW (la "V" de MVVM)
   --------------------------------
   Unica pieza que toca el DOM de login.html. Lee los inputs, llama al
   LoginViewModel, y pinta el resultado (mensaje de error o redireccion
   a /principal). No contiene reglas de negocio: solo "pegamento" entre
   HTML y el ViewModel.
   ===================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  // Si ya hay una sesion activa, no tiene sentido mostrar el login otra vez.
  if (AuthModel.estaAutenticado()) {
    window.location.href = "principal.html";
    return;
  }

  const viewModel = new LoginViewModel();
  const formulario = document.getElementById("form-login");
  const inputUsuario = document.getElementById("inp-usuario");
  const inputPass = document.getElementById("inp-pass");
  const botonIngresar = document.getElementById("btn-ingresar");
  const elementoError = document.getElementById("login-error");

  viewModel.suscribir((vm) => {
    botonIngresar.disabled = vm.cargando;
    botonIngresar.textContent = vm.cargando ? "Ingresando..." : "Ingresar";
    elementoError.textContent = vm.mensajeError;
    elementoError.style.display = vm.mensajeError ? "block" : "none";
  });

  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const usuario = await viewModel.iniciarSesion(inputUsuario.value.trim(), inputPass.value);
    if (usuario) {
      window.location.href = "principal.html";
    }
  });
});