/* =====================================================================
   viewmodel/UploadViewModel.js
   =====================================================================
   CAPA: VIEWMODEL
   --------------------------------
   Antes este ViewModel solo mandaba la imagen a /api/analizar y
   guardaba el resultado EN MEMORIA (se perdia al recargar la pagina).

   Ahora implementa el flujo real de Expedientes (PB-12): el medico
   completa los datos clinicos del paciente UNA vez (arriba de la zona
   de carga, pensado para el caso tipico de varias muestras/laminillas
   de un mismo paciente en una misma visita), sube una o mas imagenes,
   y cada imagen se envia a POST /api/expedientes junto con esos datos.
   El backend analiza la imagen con el modelo de IA y persiste un
   expediente completo por cada una. El resultado (incluyendo si se
   notifico por correo al medico) queda en `ultimosResultados`, que
   ResultsViewModel expone para la pantalla "Ver Resultados".
   ===================================================================== */

class UploadViewModel {
  constructor() {
    this.imagenesPendientes = []; // [{ archivo: File, url: string }]
    this.analizando = false;
    this.progreso = 0; // 0-100
    this.ultimosResultados = []; // expedientes reales creados en la ultima corrida
    this.datosPaciente = {
      nombre_paciente: "",
      numero_documento: "",
      fecha_nacimiento: "",
      sexo: "femenino",
      historial_ginecologico: "",
      sintomas: "",
      observaciones: "",
    };
    this._oyentes = [];
  }

  suscribir(funcionOyente) {
    this._oyentes.push(funcionOyente);
  }

  _notificar() {
    this._oyentes.forEach((f) => f(this));
  }

  actualizarCampoPaciente(campo, valor) {
    this.datosPaciente[campo] = valor;
  }

  datosPacienteValidos() {
    return (
      this.datosPaciente.nombre_paciente.trim().length > 0 &&
      this.datosPaciente.numero_documento.trim().length > 0
    );
  }

  agregarArchivos(listaArchivos) {
    for (const archivo of listaArchivos) {
      if (!archivo.type.startsWith("image/")) continue;
      this.imagenesPendientes.push({ archivo, url: URL.createObjectURL(archivo) });
    }
    this._notificar();
  }

  quitarImagen(indice) {
    this.imagenesPendientes.splice(indice, 1);
    this._notificar();
  }

  limpiarFormularioPaciente() {
    this.datosPaciente = {
      nombre_paciente: "",
      numero_documento: "",
      fecha_nacimiento: "",
      sexo: "femenino",
      historial_ginecologico: "",
      sintomas: "",
      observaciones: "",
    };
  }

  async analizarImagenes() {
    if (this.imagenesPendientes.length === 0) return;
    if (!this.datosPacienteValidos()) return;

    this.analizando = true;
    this.progreso = 0;
    this.ultimosResultados = [];
    this._notificar();

    const total = this.imagenesPendientes.length;

    for (let i = 0; i < total; i++) {
      const item = this.imagenesPendientes[i];
      try {
        const expediente = await ExpedientesModel.crearExpediente(item.archivo, this.datosPaciente);
        this.ultimosResultados.push({
          ...expediente,
          urlPreview: item.url,
          nombreArchivoOriginal: item.archivo.name,
        });
      } catch (error) {
        this.ultimosResultados.push({
          error: error.message,
          urlPreview: item.url,
          nombreArchivoOriginal: item.archivo.name,
        });
      }
      this.progreso = Math.round(((i + 1) / total) * 100);
      this._notificar();
    }

    this.analizando = false;
    this._notificar();

    this.imagenesPendientes = [];
    this.limpiarFormularioPaciente();
    this._notificar();
  }
}
