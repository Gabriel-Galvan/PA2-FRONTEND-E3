/* =====================================================================
   viewmodel/HistoryViewModel.js
   =====================================================================
   CAPA: VIEWMODEL
   --------------------------------
   Historial de analisis EN MEMORIA durante la sesion del navegador.

   Tal como se acordo explicitamente: la base de datos relacional
   completa para el historial por medico (PB-12) se construira en una
   siguiente iteracion del proyecto. Por ahora este ViewModel solo
   acumula los resultados reales obtenidos durante la sesion actual,
   para que la pantalla "Ver Historial" no quede vacia mientras se usa
   la aplicacion.
   ===================================================================== */

class HistoryViewModel {
  constructor() {
    this.elementos = []; // mismo formato que ResultsViewModel.obtenerResultados()
  }

  agregarResultados(resultadosConBadge) {
    const ahora = new Date();
    for (const resultado of resultadosConBadge) {
      if (resultado.error) continue; // no se guardan en historial los analisis fallidos
      this.elementos.unshift({ ...resultado, fechaLocal: ahora });
    }
  }

  obtenerElementos() {
    return this.elementos;
  }
}