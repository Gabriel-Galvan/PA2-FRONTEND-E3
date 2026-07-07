/* =====================================================================
   model/ApiClient.js
   =====================================================================
   CAPA: MODEL
   --------------------------------
   Sabe COMO hablar por HTTP con el backend Flask en Render.
   ===================================================================== */

const ApiClient = {
  // URL base del backend en Render.

  BASE_URL: "https://pa2-backend-e3.onrender.com",

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

  /**
   * Igual que subirArchivo, pero permite adjuntar campos de texto
   * adicionales en el mismo multipart/form-data (usado por el modulo
   * de Expedientes: imagen + datos clinicos del paciente en una sola
   * peticion).
   * @param {string} ruta
   * @param {string} campoArchivo
   * @param {File} archivo
   * @param {Object} camposExtra - pares clave/valor de texto
   */
  async subirArchivoConCampos(ruta, campoArchivo, archivo, camposExtra = {}, { autenticado = true } = {}) {
    const formulario = new FormData();
    formulario.append(campoArchivo, archivo);
    Object.entries(camposExtra).forEach(([clave, valor]) => {
      formulario.append(clave, valor == null ? "" : valor);
    });

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
