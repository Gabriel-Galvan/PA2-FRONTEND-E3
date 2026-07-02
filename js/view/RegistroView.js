/* =====================================================================
   view/RegistroView.js
   =====================================================================
   CAPA: VIEW
   --------------------------------
   DECISION DE DISENO: el Product Backlog (PB-14) solo exige un modulo
   de AUTENTICACION para personal de salud ya registrado, no un
   AUTO-REGISTRO publico. En un sistema clinico real, normalmente es
   el administrador quien da de alta a cada medico (ver la seccion
   "Gestion de Usuarios" dentro de Configuracion, una vez autenticado
   como admin), en vez de permitir que cualquiera cree su propia
   cuenta. Por eso esta pantalla se deja como informativa: mantiene el
   diseno original del mockup, pero en vez de "crear" una cuenta real,
   explica el flujo correcto y redirige al login.
   ===================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const formulario = document.getElementById("form-registro");
  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();
    alert(
      "Por seguridad, las cuentas del personal de salud son creadas por un administrador " +
      "desde el panel de Gestion de Usuarios (Configuracion). Contacta a tu administrador del sistema."
    );
    window.location.href = "login.html";
  });
});