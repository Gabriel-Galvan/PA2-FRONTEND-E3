/* =====================================================================
   viewmodel/UploadViewModel.js
   =====================================================================
   CAPA: VIEWMODEL
   --------------------------------
   Mantiene la lista de imagenes seleccionadas por el usuario y
   orquesta el envio de cada una al backend real (PB-10/PB-11),
   reemplazando la barra de progreso "falsa" (setInterval con numeros
   aleatorios) del mockup original por el progreso REAL de analizar
   cada imagen una por una contra la API.

   Los resultados quedados aqui son leidos despues por
   ResultsViewModel e HistoryViewModel (en memoria; la persistencia en
   base de datos del historial se hara en una siguiente iteracion del
   proyecto, tal como se acordo).
   ===================================================================== */

class UploadViewModel {
  constructor() {
    this.imagenesPendientes = []; // [{ archivo: File, url: string }]
    this.analizando = false;
    this.progreso = 0; // 0-100
    this.ultimosResultados = []; // resultados reales de la ultima corrida de analisis
    this._oyentes = [];
  }

  suscribir(funcionOyente) {
    this._oyentes.push(funcionOyente);
  }

  _notificar() {
    this._oyentes.forEach((f) => f(this));
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

  /**
   * Envia cada imagen pendiente al backend (una por una) y guarda los
   * resultados reales del modelo de IA. Actualiza `progreso` conforme
   * van llegando las respuestas, para alimentar la barra de progreso.
   */
  async analizarImagenes() {
    if (this.imagenesPendientes.length === 0) return;

    this.analizando = true;
    this.progreso = 0;
    this.ultimosResultados = [];
    this._notificar();

    const total = this.imagenesPendientes.length;

    for (let i = 0; i < total; i++) {
      const item = this.imagenesPendientes[i];
      try {
        const resultado = await AnalisisModel.analizarImagen(item.archivo);
        this.ultimosResultados.push({
          ...resultado,
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

    // Las imagenes ya analizadas se limpian de "pendientes" para la
    // siguiente tanda, igual que en el mockup original.
    this.imagenesPendientes = [];
    this._notificar();
  }
}