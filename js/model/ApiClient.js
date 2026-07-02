/* =====================================================================
   model/ApiClient.js
   =====================================================================
   CAPA: MODEL
   --------------------------------
   Sabe COMO hablar por HTTP con el backend Flask en Render.
   ===================================================================== */

const ApiClient = {
  // URL base del backend en Render.

  BASE_URL: "https://backend-render-zl0j.onrender.com",

  async solicitarJSON(ruta, { metodo = "GET", cuerpo = null, autenticado = false } = {}) {
    const encabezados = { "Content-Type": "application/json" };
    if (autenticado) {
      const token = AuthModel.obtenerToken();
      if (token) encabezados["Authorization"] = `Bearer ${token}`;
    }

    const respuesta = await fetch(this.BASE_URL + ruta, {
      method: metodo,
      headers: encabezados,
      body: cuerpo ? JSON.stringify(cuerpo) : null,
    });

    const datos = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) {
      throw new Error(datos.error || `Error ${respuesta.status}`);
    }
    return datos;
  },

  async subirArchivo(ruta, campoArchivo, archivo, { autenticado = true } = {}) {
    const formulario = new FormData();
    formulario.append(campoArchivo, archivo);

    const encabezados = {};
    if (autenticado) {
      const token = AuthModel.obtenerToken();
      if (token) encabezados["Authorization"] = `Bearer ${token}`;
    }

    const respuesta = await fetch(this.BASE_URL + ruta, {
      method: "POST",
      headers: encabezados,
      body: formulario,
    });

    const datos = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) {
      throw new Error(datos.error || `Error ${respuesta.status}`);
    }
    return datos;
  },
};
