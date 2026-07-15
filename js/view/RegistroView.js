/* =====================================================================
   view/RegistroView.js
   =====================================================================
   CAPA: VIEW
   --------------------------------
   Auto-registro publico de nuevos medicos, protegido por un codigo de
   invitacion de un solo uso: un administrador lo genera desde
   Configuracion > Gestion de Usuarios (le llega como notificacion
   in-app con el codigo) y se lo entrega al nuevo medico por el canal
   que prefiera. Sin un codigo valido, POST /api/auth/registro
   rechaza la creacion de la cuenta (control de accesos, PB-14).
   ===================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const formulario = document.getElementById("form-registro");
  const elementoError = document.getElementById("registro-error");

  function mostrarError(mensaje) {
    elementoError.textContent = mensaje;
    elementoError.style.display = "block";
  }

  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    elementoError.style.display = "none";

    const nombreUsuario = document.getElementById("reg-usuario").value.trim();
    const correo = document.getElementById("reg-correo").value.trim();
    const contrasena = document.getElementById("reg-contrasena").value;
    const confirmar = document.getElementById("reg-confirmar").value;
    const codigo = document.getElementById("reg-codigo").value.trim().toUpperCase();

    if (contrasena !== confirmar) {
      mostrarError("Las contrasenas no coinciden");
      return;
    }

    const boton = formulario.querySelector("button[type=submit]");
    boton.disabled = true;
    boton.textContent = "Creando cuenta...";

    try {
      await AuthModel.registrarUsuario({ nombreUsuario, contrasena, correo, codigo });
      alert("Cuenta creada correctamente. Ahora puedes iniciar sesion.");
      window.location.href = "login.html";
    } catch (error) {
      mostrarError(error.message || "No se pudo crear la cuenta");
    } finally {
      boton.disabled = false;
      boton.textContent = "Crear Cuenta";
    }
  });
});