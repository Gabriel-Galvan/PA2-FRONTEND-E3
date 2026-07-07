/* =====================================================================
   viewmodel/ExpedientesViewModel.js
   =====================================================================
   CAPA: VIEWMODEL
   --------------------------------
   Reemplaza al antiguo HistoryViewModel (que solo guardaba resultados
   EN MEMORIA durante la sesion). Ahora la pantalla "Expedientes" lee
   los expedientes REALES persistidos en la base de datos a traves de
   GET /api/expedientes: un medico solo ve los suyos, el admin los ve
   todos (control de accesos aplicado del lado del backend, esta
   pantalla solo pinta lo que la API le devuelve).

   El listado que expone el backend es liviano (no trae la imagen, ver
   Expediente.a_diccionario en el backend); la imagen completa solo se
   pide al abrir el detalle de un expediente especifico
   (GET /api/expedientes/<id>). Para los expedientes que el medico
   acaba de crear EN ESTA MISMA SESION, se reutiliza el blob local
   (`registrarImagenLocal`) para poder mostrar una vista previa
   instantanea sin tener que volver a pedirle la imagen al servidor.
   ===================================================================== */

class ExpedientesViewModel {
  constructor() {
    this.expedientes = [];
    this.cargando = false;
    this.mensajeError = "";
    this.filtro = "";
    this.expedienteSeleccionado = null; // detalle completo (con imagen) abierto en el modal
    this._imagenesLocales = {}; // id de expediente -> blob url (solo para los creados en esta sesion)
  }

  registrarImagenLocal(expedienteId, urlBlob) {
    this._imagenesLocales[expedienteId] = urlBlob;
  }

  imagenLocalPara(expedienteId) {
    return this._imagenesLocales[expedienteId] || null;
  }

  async cargar() {
    this.cargando = true;
    this.mensajeError = "";
    try {
      this.expedientes = await ExpedientesModel.listarExpedientes();
    } catch (error) {
      this.mensajeError = error.message;
    }
    this.cargando = false;
  }

  establecerFiltro(texto) {
    this.filtro = texto;
  }

  /** Filtra por nombre de paciente, numero de documento o codigo de expediente. */
  obtenerListaFiltrada() {
    const consulta = this.filtro.trim().toLowerCase();
    if (!consulta) return this.expedientes;
    return this.expedientes.filter((expediente) => {
      return (
        expediente.nombre_paciente.toLowerCase().includes(consulta) ||
        (expediente.numero_documento || "").toLowerCase().includes(consulta) ||
        expediente.codigo.toLowerCase().includes(consulta)
      );
    });
  }

  async abrirDetalle(expedienteId) {
    this.mensajeError = "";
    try {
      this.expedienteSeleccionado = await ExpedientesModel.obtenerExpediente(expedienteId);
    } catch (error) {
      this.mensajeError = error.message;
    }
  }

  cerrarDetalle() {
    this.expedienteSeleccionado = null;
  }

  async guardarEdicion(campos) {
    if (!this.expedienteSeleccionado) return false;
    try {
      const actualizado = await ExpedientesModel.actualizarExpediente(this.expedienteSeleccionado.id, campos);
      this.expedienteSeleccionado = { ...this.expedienteSeleccionado, ...actualizado };
      await this.cargar();
      return true;
    } catch (error) {
      this.mensajeError = error.message;
      return false;
    }
  }

  async eliminarActual() {
    if (!this.expedienteSeleccionado) return false;
    try {
      await ExpedientesModel.eliminarExpediente(this.expedienteSeleccionado.id);
      this.cerrarDetalle();
      await this.cargar();
      return true;
    } catch (error) {
      this.mensajeError = error.message;
      return false;
    }
  }

  /** Resumen para las tarjetas de estadisticas de la Pagina Principal. */
  estadisticas() {
    const total = this.expedientes.length;
    const normal = this.expedientes.filter((e) => e.severidad === "normal").length;
    const revisar = this.expedientes.filter((e) => e.severidad === "revisar").length;
    const positivo = this.expedientes.filter((e) => e.severidad === "positivo").length;
    return { total, normal, revisar, positivo };
  }
}
