/* =====================================================================
   view/PrincipalView.js
   =====================================================================
   CAPA: VIEW
   --------------------------------
   Pieza mas grande de la Vista: conecta el HTML de principal.html con
   todos los ViewModel (Upload, Results, Expedientes, Config, Admin).
   Todos los datos clinicos (expedientes, diagnosticos, estadisticas)
   vienen REALES de la base de datos a traves de la API; nada se
   inventa ni se simula del lado del navegador.
   ===================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  // ---- GUARDA DE AUTENTICACION (control de accesos, PB-14) ----
  if (!AuthModel.estaAutenticado()) {
    window.location.href = "login.html";
    return;
  }

  // ---- INSTANCIAS DE LOS VIEWMODELS ----
  const uploadVM = new UploadViewModel();
  const resultsVM = new ResultsViewModel(uploadVM);
  const expedientesVM = new ExpedientesViewModel();
  const configVM = new ConfigViewModel();
  const adminVM = new AdminViewModel();

  const usuario = AuthModel.obtenerUsuario();

  /** Escapa texto ingresado por el usuario antes de insertarlo con innerHTML. */
  function escaparHtml(texto) {
    if (texto == null) return "";
    return String(texto)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // =====================================================================
  // DATOS DEL USUARIO EN PANTALLA
  // =====================================================================
  function pintarUsuario() {
    document.getElementById("banner-nombre").textContent = usuario.nombre_usuario;
    document.getElementById("sb-usuario").textContent = usuario.nombre_usuario;
    document.getElementById("config-nombre-usuario-input").value = usuario.nombre_usuario;
    document.getElementById("sb-rol").textContent = usuario.rol === "admin" ? "Administrador" : "Medico";
    document.getElementById("config-correo-input").value = usuario.correo || "";
    pintarAvatar();

    // El panel de Gestion de Usuarios solo se muestra a administradores.
    // (El backend tambien lo exige con @rol_requerido('admin'); esto es
    // solo para no confundir a un medico con botones que no puede usar.)
    document.getElementById("bloque-admin").style.display = usuario.rol === "admin" ? "block" : "none";
  }

  // =====================================================================
  // NAVEGACION ENTRE SECCIONES (igual idea que el mockup original)
  // =====================================================================
  function navegar(seccion) {
    const secciones = ["home", "upload", "results", "history", "config"];
    secciones.forEach((s) => {
      const el = document.getElementById("sec-" + s);
      if (el) el.style.display = s === seccion ? "block" : "none";
      const nav = document.getElementById("nav-" + s);
      if (nav) nav.classList.toggle("activo", s === seccion);
    });
    if (seccion === "home") expedientesVM.cargar().then(renderEstadisticas);
    if (seccion === "results") renderResultados();
    if (seccion === "history") expedientesVM.cargar().then(renderExpedientes);
    if (seccion === "config") adminVM.cargarUsuarios().then(renderAdmin);
  }
  window.navegar = navegar; // usado por los onclick="" del HTML

  // =====================================================================
  // ESTADISTICAS (Pagina Principal) - PB-12, datos reales de expedientes
  // =====================================================================
  function renderEstadisticas() {
    const stats = expedientesVM.estadisticas();
    document.getElementById("stat-total").textContent = stats.total;
    document.getElementById("stat-normal").textContent = stats.normal;
    document.getElementById("stat-revisar").textContent = stats.revisar;
    document.getElementById("stat-positivo").textContent = stats.positivo;
  }

  // =====================================================================
  // NUEVO EXPEDIENTE: datos del paciente (PB-12)
  // =====================================================================
  const mapaCamposPaciente = {
    "pac-nombre": "nombre_paciente",
    "pac-documento": "numero_documento",
    "pac-nacimiento": "fecha_nacimiento",
    "pac-sexo": "sexo",
    "pac-historial": "historial_ginecologico",
    "pac-sintomas": "sintomas",
    "pac-observaciones": "observaciones",
  };
  Object.entries(mapaCamposPaciente).forEach(([idInput, campo]) => {
    const elemento = document.getElementById(idInput);
    const manejador = (evento) => {
      uploadVM.actualizarCampoPaciente(campo, evento.target.value);
      document.getElementById("upload-error").style.display = "none";
    };
    elemento.addEventListener("input", manejador);
    elemento.addEventListener("change", manejador);
  });

  function limpiarFormularioPacienteDOM() {
    Object.keys(mapaCamposPaciente).forEach((idInput) => {
      // El sexo del paciente viene predeterminado como Femenino (perfil
      // clinico tipico de este sistema, ver <option selected> en el HTML);
      // los demas campos si vuelven a quedar vacios.
      document.getElementById(idInput).value = idInput === "pac-sexo" ? "femenino" : "";
    });
  }

  // =====================================================================
  // SUBIR IMAGENES / CREAR EXPEDIENTE (PB-10 / PB-11 / PB-12)
  // =====================================================================
  const zonaArrastrar = document.getElementById("zonaArrastrar");
  const inputArchivo = document.getElementById("inputArchivo");
  const gridPreview = document.getElementById("gridPreview");
  const secAnalizar = document.getElementById("secAnalizar");
  const barraWrap = document.getElementById("barraWrap");
  const barraInner = document.getElementById("barraInner");
  const uploadError = document.getElementById("upload-error");

  zonaArrastrar.addEventListener("click", () => inputArchivo.click());
  zonaArrastrar.addEventListener("dragover", (e) => {
    e.preventDefault();
    zonaArrastrar.style.borderColor = "#a07850";
  });
  zonaArrastrar.addEventListener("dragleave", () => {
    zonaArrastrar.style.borderColor = "#c9b99a";
  });
  zonaArrastrar.addEventListener("drop", (e) => {
    e.preventDefault();
    zonaArrastrar.style.borderColor = "#c9b99a";
    uploadVM.agregarArchivos(e.dataTransfer.files);
  });
  inputArchivo.addEventListener("change", () => uploadVM.agregarArchivos(inputArchivo.files));

  function renderPreviews() {
    gridPreview.innerHTML = "";
    uploadVM.imagenesPendientes.forEach((item, indice) => {
      const div = document.createElement("div");
      div.className = "preview-item";
      const img = document.createElement("img");
      img.src = item.url;
      img.alt = item.archivo.name;
      const quitar = document.createElement("span");
      quitar.className = "quitar";
      quitar.textContent = "x";
      quitar.onclick = () => uploadVM.quitarImagen(indice);
      div.appendChild(img);
      div.appendChild(quitar);
      gridPreview.appendChild(div);
    });
    secAnalizar.style.display = uploadVM.imagenesPendientes.length > 0 ? "block" : "none";
  }

  uploadVM.suscribir((vm) => {
    renderPreviews();
    barraWrap.style.display = vm.analizando ? "block" : "none";
    barraInner.style.width = vm.progreso + "%";
  });

  document.getElementById("btn-analizar-imagenes").addEventListener("click", async () => {
    if (!uploadVM.datosPacienteValidos()) {
      uploadError.textContent = "Completa al menos el nombre y el numero de documento del paciente antes de analizar.";
      uploadError.style.display = "block";
      return;
    }
    uploadError.style.display = "none";

    await uploadVM.analizarImagenes();

    // Registrar la vista previa local (blob) de cada expediente recien
    // creado, para poder mostrar una miniatura instantanea en la
    // pantalla de Expedientes sin tener que volver a pedirle la
    // imagen al servidor.
    resultsVM.obtenerResultados().forEach((r) => {
      if (!r.error && r.id) expedientesVM.registrarImagenLocal(r.id, r.urlPreview);
    });

    limpiarFormularioPacienteDOM();
    await expedientesVM.cargar();
    navegar("results");

    const huboCorreo = resultsVM.obtenerResultados().some((r) => r.correo_enviado);
    mostrarToast(huboCorreo ? "Expediente guardado y correo de notificacion enviado" : "Expediente(s) guardado(s) correctamente");
  });

  // =====================================================================
  // RESULTADOS (PB-11 / PB-16) - expedientes recien creados
  // =====================================================================
  function renderResultados() {
    const contenedor = document.getElementById("contenido-resultados");
    const resultados = resultsVM.obtenerResultados();

    if (resultados.length === 0) {
      contenedor.innerHTML =
        '<div class="estado-vacio"><div class="icono-vacio">&#9654;</div>' +
        "<p>No hay resultados todavia.</p>" +
        '<p style="margin-top:6px; font-size:0.7857rem;">Ve a "Nuevo Expediente" para registrar un paciente y analizar su imagen.</p></div>';
      return;
    }

    contenedor.innerHTML = resultados.map((r) => tarjetaResultadoHTML(r)).join("");

    contenedor.querySelectorAll("[data-expediente-id]").forEach((tarjeta) => {
      tarjeta.addEventListener("click", () => {
        abrirModalExpediente(parseInt(tarjeta.dataset.expedienteId, 10));
      });
    });
  }

  function tarjetaResultadoHTML(r) {
    if (r.error) {
      return (
        '<div class="tarjeta-resultado">' +
        '<div class="resultado-cabecera"><div>' +
        '<div class="resultado-nombre">' + escaparHtml(r.nombreArchivoOriginal) + "</div>" +
        '<div class="resultado-meta">Error al analizar</div></div>' +
        '<span class="badge badge-positivo">Error</span></div>' +
        '<div class="resultado-img"><img src="' + r.urlPreview + '" alt="muestra"></div>' +
        '<p style="font-size:0.7857rem;color:#a02020;">' + escaparHtml(r.error) + "</p>" +
        "</div>"
      );
    }

    const confianzaTexto = r.confianza_ia.toFixed(2) + "% de confianza";
    const horaTexto = new Date(r.creado_en).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
    const notaCorreo = r.correo_enviado
      ? '<div class="mensaje-correo-estado">Se envio un correo de notificacion al medico.</div>'
      : '<div class="mensaje-correo-estado">Sin notificacion por correo (configura tu correo en Configuracion para activarla).</div>';

    return (
      '<div class="tarjeta-resultado clickeable" data-expediente-id="' + r.id + '">' +
      '<div class="resultado-cabecera"><div>' +
      '<div class="expediente-codigo">' + r.codigo + "</div>" +
      '<div class="resultado-nombre">' + escaparHtml(r.nombre_paciente) + "</div>" +
      '<div class="resultado-meta">Hoy &nbsp;|&nbsp; ' + horaTexto + "</div></div>" +
      '<span class="badge ' + (r.severidad === "normal" ? "badge-normal" : r.severidad === "positivo" ? "badge-positivo" : "badge-revisar") + '">' +
      (r.severidad === "normal" ? "Normal" : r.severidad === "positivo" ? "Positivo" : "Revisar") + "</span>" +
      "</div>" +
      '<div class="resultado-img"><img src="' + r.urlPreview + '" alt="muestra"></div>' +
      '<div class="tags"><span class="tag activo">' + escaparHtml(r.diagnostico_ia) + "</span>" +
      '<span class="tag">' + confianzaTexto + "</span></div>" +
      notaCorreo +
      "</div>"
    );
  }

  // =====================================================================
  // EXPEDIENTES (antes "Historial") - PB-12, datos reales persistidos
  // =====================================================================
  function renderExpedientes() {
    const contenedor = document.getElementById("contenido-historial");

    if (expedientesVM.mensajeError) {
      contenedor.innerHTML = '<p style="color:#a02020; font-size:0.8571rem;">' + escaparHtml(expedientesVM.mensajeError) + "</p>";
      return;
    }

    const lista = expedientesVM.obtenerListaFiltrada();

    if (lista.length === 0) {
      contenedor.innerHTML =
        '<div class="estado-vacio"><div class="icono-vacio">&#9685;</div>' +
        "<p>" + (expedientesVM.filtro ? "No se encontraron expedientes con ese criterio." : "Aun no hay expedientes registrados.") + "</p></div>";
      return;
    }

    contenedor.innerHTML = lista.map((e) => tarjetaExpedienteHTML(e)).join("");

    contenedor.querySelectorAll("[data-expediente-id]").forEach((tarjeta) => {
      tarjeta.addEventListener("click", () => {
        abrirModalExpediente(parseInt(tarjeta.dataset.expedienteId, 10));
      });
    });
  }

  function tarjetaExpedienteHTML(e) {
    const fecha = new Date(e.creado_en).toLocaleDateString("es-PE", { year: "numeric", month: "short", day: "numeric" });
    const imagenLocal = expedientesVM.imagenLocalPara(e.id);
    const imagenHTML = imagenLocal
      ? '<img src="' + imagenLocal + '" alt="muestra">'
      : '<span style="font-size:1.8571rem;">&#9685;</span>';
    const infoMedico = usuario.rol === "admin" ? '<div class="expediente-doctor">Medico #' + e.medico_id + "</div>" : "";

    return (
      '<div class="tarjeta-resultado clickeable" data-expediente-id="' + e.id + '">' +
      '<div class="resultado-cabecera"><div>' +
      '<div class="expediente-codigo">' + e.codigo + " &middot; " + fecha + "</div>" +
      '<div class="resultado-nombre">' + escaparHtml(e.nombre_paciente) + "</div>" +
      '<div class="resultado-meta">Doc: ' + escaparHtml(e.numero_documento) + "</div>" +
      infoMedico +
      "</div>" +
      '<span class="badge ' + (e.severidad === "normal" ? "badge-normal" : e.severidad === "positivo" ? "badge-positivo" : "badge-revisar") + '">' +
      (e.severidad === "normal" ? "Normal" : e.severidad === "positivo" ? "Positivo" : "Revisar") + "</span>" +
      "</div>" +
      '<div class="resultado-img">' + imagenHTML + "</div>" +
      '<div class="tags"><span class="tag activo">' + escaparHtml(e.diagnostico_ia) + "</span>" +
      '<span class="tag">' + e.confianza_ia.toFixed(2) + "% confianza</span></div>" +
      "</div>"
    );
  }

  document.getElementById("buscador-expedientes").addEventListener("input", (evento) => {
    expedientesVM.establecerFiltro(evento.target.value);
    renderExpedientes();
  });

  // =====================================================================
  // MODAL DE EXPEDIENTE: ver detalle completo, editar, eliminar, imprimir
  // =====================================================================
  const modalOverlay = document.getElementById("modalExpediente");
  const modalCuerpo = document.getElementById("modalCuerpo");
  const modalTitulo = document.getElementById("modalTitulo");

  function puedeEditar(expediente) {
    return usuario.rol === "admin" || expediente.medico_id === usuario.id;
  }

  async function abrirModalExpediente(expedienteId) {
    await expedientesVM.abrirDetalle(expedienteId);
    if (expedientesVM.mensajeError) {
      mostrarToast(expedientesVM.mensajeError);
      return;
    }
    renderModal(false);
    modalOverlay.style.display = "flex";
  }

  function cerrarModal() {
    modalOverlay.style.display = "none";
    expedientesVM.cerrarDetalle();
  }
  document.getElementById("btnCerrarModal").addEventListener("click", cerrarModal);
  modalOverlay.addEventListener("click", (evento) => {
    if (evento.target === modalOverlay) cerrarModal();
  });

  function etiquetaSexo(valor) {
    return { femenino: "Femenino", masculino: "Masculino", otro: "Otro" }[valor] || "No especificado";
  }

  function calcularEdad(fechaNacimientoISO) {
    if (!fechaNacimientoISO) return null;
    const nacimiento = new Date(fechaNacimientoISO);
    if (isNaN(nacimiento.getTime())) return null;
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const aunNoCumple =
      hoy.getMonth() < nacimiento.getMonth() ||
      (hoy.getMonth() === nacimiento.getMonth() && hoy.getDate() < nacimiento.getDate());
    if (aunNoCumple) edad--;
    return edad >= 0 ? edad : null;
  }

  function renderModal(modoEdicion) {
    const e = expedientesVM.expedienteSeleccionado;
    if (!e) return;
    modalTitulo.textContent = e.codigo + " - " + e.nombre_paciente;

    const imagenHTML = e.imagen_base64
      ? '<img src="' + e.imagen_base64 + '" alt="Muestra citologica">'
      : "Sin imagen disponible";

    const badgeClase = e.severidad === "normal" ? "badge-normal" : e.severidad === "positivo" ? "badge-positivo" : "badge-revisar";
    const badgeTexto = e.severidad === "normal" ? "Normal" : e.severidad === "positivo" ? "Positivo" : "Revisar";

    const editable = puedeEditar(e);

    if (!modoEdicion) {
      modalCuerpo.innerHTML =
        '<div class="expediente-imagen-grande">' + imagenHTML + "</div>" +
        '<div class="tags" style="margin-bottom:14px;">' +
        '<span class="badge ' + badgeClase + '">' + badgeTexto + "</span>" +
        '<span class="tag activo">' + escaparHtml(e.diagnostico_ia) + "</span>" +
        '<span class="tag">' + e.confianza_ia.toFixed(2) + "% confianza</span>" +
        "</div>" +
        '<div class="expediente-detalle-grid">' +
        campoLectura("Numero de documento", e.numero_documento) +
        campoLectura("Fecha de nacimiento", e.fecha_nacimiento || "No registrada") +
        campoLectura("Sexo", etiquetaSexo(e.sexo)) +
        campoLectura("Historial ginecologico", e.historial_ginecologico || "Sin registrar", true) +
        campoLectura("Sintomas", e.sintomas || "Sin registrar", true) +
        campoLectura("Observaciones", e.observaciones || "Sin registrar", true) +
        seccionCelulasDetectadas(e) +
        "</div>" +
        '<div class="expediente-acciones no-imprimir">' +
        (editable ? '<button class="btn-secundario" id="btnEditarExpediente">Editar datos</button>' : "") +
        '<button class="btn-secundario" id="btnDescargarPdf">Descargar PDF</button>' +
        '<button class="btn-secundario" id="btnImprimirExpediente">Imprimir</button>' +
        (editable ? '<button class="btn-secundario" id="btnEliminarExpediente" style="color:#a02020; border-color:#c9a0a0;">Eliminar expediente</button>' : "") +
        "</div>";

      if (editable) {
        document.getElementById("btnEditarExpediente").addEventListener("click", () => renderModal(true));
        document.getElementById("btnEliminarExpediente").addEventListener("click", async () => {
          if (!confirm("¿Eliminar este expediente de forma permanente? Esta accion no se puede deshacer.")) return;
          const ok = await expedientesVM.eliminarActual();
          if (ok) {
            cerrarModal();
            renderExpedientes();
            renderEstadisticas();
            mostrarToast("Expediente eliminado correctamente");
          } else {
            mostrarToast(expedientesVM.mensajeError || "No se pudo eliminar el expediente");
          }
        });
      }
      document.getElementById("btnImprimirExpediente").addEventListener("click", () => window.print());
      document.getElementById("btnDescargarPdf").addEventListener("click", () => descargarPdfExpediente(e));
    } else {
      modalCuerpo.innerHTML =
        '<div class="expediente-imagen-grande">' + imagenHTML + "</div>" +
        '<div class="expediente-detalle-grid">' +
        campoEdicion("edit-nombre", "Nombre del paciente", e.nombre_paciente) +
        campoEdicion("edit-documento", "Numero de documento", e.numero_documento) +
        campoEdicion("edit-nacimiento", "Fecha de nacimiento", e.fecha_nacimiento || "", "date") +
        campoEdicionSexo(e.sexo) +
        campoEdicion("edit-historial", "Historial ginecologico", e.historial_ginecologico || "", "text", true) +
        campoEdicion("edit-sintomas", "Sintomas", e.sintomas || "", "text", true) +
        campoEdicion("edit-observaciones", "Observaciones", e.observaciones || "", "text", true) +
        "</div>" +
        '<p id="modal-error" style="color:#a02020; font-size:0.7857rem; margin-bottom:8px;"></p>' +
        '<div class="expediente-acciones no-imprimir">' +
        '<button class="btn-principal" id="btnGuardarEdicion" style="width:auto; padding:8px 16px;">Guardar cambios</button>' +
        '<button class="btn-secundario" id="btnCancelarEdicion">Cancelar</button>' +
        "</div>";

      document.getElementById("btnCancelarEdicion").addEventListener("click", () => renderModal(false));
      document.getElementById("btnGuardarEdicion").addEventListener("click", async () => {
        const campos = {
          nombre_paciente: document.getElementById("edit-nombre").value,
          numero_documento: document.getElementById("edit-documento").value,
          fecha_nacimiento: document.getElementById("edit-nacimiento").value || null,
          sexo: document.getElementById("edit-sexo").value || null,
          historial_ginecologico: document.getElementById("edit-historial").value,
          sintomas: document.getElementById("edit-sintomas").value,
          observaciones: document.getElementById("edit-observaciones").value,
        };
        const ok = await expedientesVM.guardarEdicion(campos);
        if (ok) {
          renderModal(false);
          renderExpedientes();
          mostrarToast("Expediente actualizado correctamente");
        } else {
          document.getElementById("modal-error").textContent = expedientesVM.mensajeError;
        }
      });
    }
  }

  /**
   * Tabla de apoyo con TODAS las celulas que el detector encontro en la
   * imagen de campo completo (no solo la que se reporta como
   * diagnostico principal del expediente). Si solo hay 0 o 1 celula
   * detectada, no aporta nada nuevo frente al badge principal, asi que
   * no se muestra.
   */
  function seccionCelulasDetectadas(e) {
    const celulas = e.celulas_detectadas || [];
    if (celulas.length <= 1) return "";

    const filas = celulas
      .map((c, i) => {
        return (
          "<tr>" +
          '<td style="padding:4px 8px; font-size:0.8571rem; color:var(--texto-secundario);">' + (i + 1) + "</td>" +
          '<td style="padding:4px 8px; font-size:0.8571rem; color:var(--texto-principal);">' + escaparHtml(c.clase) + "</td>" +
          '<td style="padding:4px 8px; font-size:0.8571rem; color:var(--texto-principal);">' + Number(c.confianza).toFixed(2) + "%</td>" +
          "</tr>"
        );
      })
      .join("");

    return (
      '<div class="campo campo-ancho" style="margin-top:14px;">' +
      '<label style="display:block; font-size:0.7857rem; color:var(--texto-secundario); margin-bottom:6px; text-transform:uppercase; letter-spacing:0.5px;">' +
      "Todas las celulas detectadas (" + celulas.length + ")</label>" +
      '<table style="width:100%; border-collapse:collapse;">' +
      '<thead><tr style="border-bottom:1px solid #e0d3c0;">' +
      '<th style="text-align:left; padding:4px 8px; font-size:0.7143rem; color:var(--texto-terciario); text-transform:uppercase;">#</th>' +
      '<th style="text-align:left; padding:4px 8px; font-size:0.7143rem; color:var(--texto-terciario); text-transform:uppercase;">Tipo de celula</th>' +
      '<th style="text-align:left; padding:4px 8px; font-size:0.7143rem; color:var(--texto-terciario); text-transform:uppercase;">Confianza</th>' +
      "</tr></thead><tbody>" +
      filas +
      "</tbody></table>" +
      '<p style="font-size:0.7143rem; color:var(--texto-terciario); margin-top:6px;">' +
      "El diagnostico principal del expediente corresponde al hallazgo de mayor severidad clinica entre estas celulas." +
      "</p>" +
      "</div>"
    );
  }

  function campoLectura(etiqueta, valor, ancho) {
    return (
      '<div class="campo' + (ancho ? " campo-ancho" : "") + '">' +
      '<label style="display:block; font-size:0.7857rem; color:var(--texto-secundario); margin-bottom:3px; text-transform:uppercase; letter-spacing:0.5px;">' + etiqueta + "</label>" +
      '<div style="font-size:0.9286rem; color:var(--texto-principal);">' + escaparHtml(valor) + "</div>" +
      "</div>"
    );
  }

  function campoEdicion(id, etiqueta, valor, tipo, ancho) {
    return (
      '<div class="campo' + (ancho ? " campo-ancho" : "") + '">' +
      "<label>" + etiqueta + "</label>" +
      '<input type="' + (tipo || "text") + '" id="' + id + '" value="' + escaparHtml(valor) + '">' +
      "</div>"
    );
  }

  function campoEdicionSexo(valorActual) {
    const opciones = [
      ["", "Sin especificar"],
      ["femenino", "Femenino"],
      ["masculino", "Masculino"],
      ["otro", "Otro"],
    ]
      .map(
        ([valor, etiqueta]) =>
          '<option value="' + valor + '"' + (valor === (valorActual || "") ? " selected" : "") + ">" + etiqueta + "</option>"
      )
      .join("");
    return '<div class="campo"><label>Sexo</label><select id="edit-sexo">' + opciones + "</select></div>";
  }

  // =====================================================================
  // DESCARGA DE INFORME EN PDF (informe clinico generico del expediente)
  // =====================================================================
  function formatearFechaHora(iso) {
    if (!iso) return "No registrada";
    return new Date(iso).toLocaleString("es-PE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function descargarPdfExpediente(e) {
    const JsPDFCtor = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
    if (!JsPDFCtor) {
      mostrarToast("No se pudo cargar el generador de PDF. Verifica tu conexion e intenta de nuevo.");
      return;
    }

    const doc = new JsPDFCtor({ unit: "mm", format: "a4" });
    const margenX = 18;
    const anchoUtil = 210 - margenX * 2;
    const medicoNombre = e.medico_id === usuario.id ? usuario.nombre_usuario : "Medico N.\u00ba " + e.medico_id;

    function verificarSaltoPagina(y) {
      if (y > 263) {
        doc.addPage();
        return 20;
      }
      return y;
    }

    // ---- Caja superior derecha: numero de expediente (como el recuadro del Nº Historia Clinica) ----
    doc.setDrawColor(160, 120, 80);
    doc.setLineWidth(0.3);
    doc.rect(140, 12, 52, 20);
    doc.setFontSize(8);
    doc.setTextColor(90, 69, 53);
    doc.text("N.\u00ba de Expediente", 143, 18);
    doc.setFontSize(12);
    doc.setTextColor(30, 26, 20);
    doc.setFont(undefined, "bold");
    doc.text(e.codigo, 143, 26);
    doc.setFont(undefined, "normal");

    // ---- Bloque de identificacion del paciente (izquierda, sin logo) ----
    const edad = calcularEdad(e.fecha_nacimiento);
    let yId = 16;
    doc.setFontSize(9);
    doc.setTextColor(60, 46, 30);
    doc.text(
      "Fecha nacimiento: " + (e.fecha_nacimiento || "No registrada") + (edad != null ? "     Edad: " + edad : ""),
      margenX,
      yId
    );
    yId += 5;
    doc.text("Sexo: " + etiquetaSexo(e.sexo), margenX, yId);
    yId += 5;
    doc.text("N.\u00ba de documento: " + e.numero_documento, margenX, yId);
    yId += 6;
    doc.setFontSize(11);
    doc.setFont(undefined, "bold");
    doc.setTextColor(30, 26, 20);
    doc.text(e.nombre_paciente, margenX, yId);
    doc.setFont(undefined, "normal");

    let y = 42;
    doc.setDrawColor(150, 130, 100);
    doc.setLineWidth(0.4);
    doc.line(margenX, y, 210 - margenX, y);
    y += 8;

    doc.setFontSize(14);
    doc.setFont(undefined, "bold");
    doc.setTextColor(40, 32, 22);
    doc.text("INFORME DE ANALISIS CITOLOGICO CERVICAL", 105, y, { align: "center" });
    doc.setFont(undefined, "normal");
    y += 8;

    doc.setFontSize(9);
    doc.setTextColor(90, 69, 53);
    doc.text("Servicio: Patologia Cervical - Apoyo Diagnostico por IA", margenX, y);
    doc.text("Fecha del analisis: " + formatearFechaHora(e.creado_en), 210 - margenX, y, { align: "right" });
    y += 5;
    doc.text("Medico responsable: " + medicoNombre, margenX, y);
    y += 9;

    function seccion(titulo, contenido) {
      y = verificarSaltoPagina(y);
      doc.setFontSize(9.5);
      doc.setFont(undefined, "bold");
      doc.setTextColor(120, 90, 50);
      doc.text(titulo.toUpperCase(), margenX, y);
      y += 1.5;
      doc.setDrawColor(200, 185, 154);
      doc.setLineWidth(0.2);
      doc.line(margenX, y, 210 - margenX, y);
      y += 5;
      doc.setFont(undefined, "normal");
      doc.setFontSize(10);
      doc.setTextColor(30, 26, 20);
      const texto = contenido && String(contenido).trim() ? String(contenido) : "Sin registrar.";
      const lineas = doc.splitTextToSize(texto, anchoUtil);
      doc.text(lineas, margenX, y);
      y += lineas.length * 5 + 6;
    }

    seccion("Antecedentes / Historial ginecologico", e.historial_ginecologico);
    seccion("Motivo de consulta / Sintomas", e.sintomas);
    seccion(
      "Prueba diagnostica realizada",
      "Analisis citologico automatizado mediante inteligencia artificial (modelo MobileNetV2 entrenado sobre el dataset SIPaKMeD), a partir de la imagen citologica '" +
        (e.nombre_archivo_imagen || "muestra") +
        "' cargada al sistema."
    );

    // ---- RESULTADO DEL ANALISIS: texto a la izquierda, imagen analizada
    // en miniatura a la derecha (mismo bloque, dos columnas) ----
    const anchoImagenMiniatura = 55; // mm
    const altoImagenMiniatura = 55; // mm
    const tieneImagen = !!e.imagen_base64;
    const gapColumnas = 8;
    const anchoColumnaTexto = tieneImagen ? anchoUtil - anchoImagenMiniatura - gapColumnas : anchoUtil;
    const xColumnaImagen = margenX + anchoColumnaTexto + gapColumnas;

    // Si el bloque completo (encabezado + un par de lineas + la miniatura)
    // no entra en lo que queda de la pagina actual, se pasa a una pagina
    // nueva completa para que la imagen no quede cortada a la mitad.
    if (tieneImagen && y + altoImagenMiniatura + 14 > 280) {
      doc.addPage();
      y = 20;
    } else {
      y = verificarSaltoPagina(y);
    }

    doc.setFontSize(9.5);
    doc.setFont(undefined, "bold");
    doc.setTextColor(120, 90, 50);
    doc.text("RESULTADO DEL ANALISIS", margenX, y);
    y += 1.5;
    doc.setDrawColor(200, 185, 154);
    doc.line(margenX, y, 210 - margenX, y);
    y += 6;

    const yInicioBloque = y;

    // Columna derecha: miniatura de la imagen citologica analizada.
    if (tieneImagen) {
      try {
        doc.setDrawColor(190, 170, 140);
        doc.rect(xColumnaImagen, yInicioBloque, anchoImagenMiniatura, altoImagenMiniatura);

        // Mantiene la proporcion real de la imagen dentro del recuadro
        // (evita que se vea estirada/deformada), centrandola.
        const propiedadesImagen = doc.getImageProperties(e.imagen_base64);
        let anchoDibujo = anchoImagenMiniatura;
        let altoDibujo = (propiedadesImagen.height * anchoDibujo) / propiedadesImagen.width;
        if (altoDibujo > altoImagenMiniatura) {
          altoDibujo = altoImagenMiniatura;
          anchoDibujo = (propiedadesImagen.width * altoDibujo) / propiedadesImagen.height;
        }
        const xImg = xColumnaImagen + (anchoImagenMiniatura - anchoDibujo) / 2;
        const yImg = yInicioBloque + (altoImagenMiniatura - altoDibujo) / 2;
        doc.addImage(e.imagen_base64, xImg, yImg, anchoDibujo, altoDibujo);

        doc.setFont(undefined, "normal");
        doc.setFontSize(7);
        doc.setTextColor(140, 120, 95);
        doc.text("Imagen citologica analizada", xColumnaImagen + anchoImagenMiniatura / 2, yInicioBloque + altoImagenMiniatura + 4, {
          align: "center",
          maxWidth: anchoImagenMiniatura,
        });
      } catch (errorImagen) {
        // Si el navegador no logra decodificar la imagen (formato no
        // soportado por jsPDF), se omite sin romper el resto del PDF.
        doc.setDrawColor(190, 170, 140);
        doc.rect(xColumnaImagen, yInicioBloque, anchoImagenMiniatura, altoImagenMiniatura);
        doc.setFont(undefined, "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(150, 60, 60);
        doc.text("Imagen no disponible", xColumnaImagen + anchoImagenMiniatura / 2, yInicioBloque + altoImagenMiniatura / 2, {
          align: "center",
          maxWidth: anchoImagenMiniatura - 6,
        });
      }
    }

    // Columna izquierda: texto del resultado, envuelto al ancho reducido.
    doc.setFont(undefined, "normal");
    doc.setFontSize(10);
    doc.setTextColor(30, 26, 20);
    const lineasDiagnostico = doc.splitTextToSize(
      "Diagnostico principal: " + e.diagnostico_ia + " (" + e.confianza_ia.toFixed(2) + "% de confianza)",
      anchoColumnaTexto
    );
    doc.text(lineasDiagnostico, margenX, y);
    y += lineasDiagnostico.length * 5 + 1;

    const etiquetaSeveridad =
      { normal: "Normal", revisar: "Requiere seguimiento", positivo: "Hallazgo relevante" }[e.severidad] ||
      "Requiere seguimiento";
    const lineasSeveridad = doc.splitTextToSize("Clasificacion de apoyo: " + etiquetaSeveridad, anchoColumnaTexto);
    doc.text(lineasSeveridad, margenX, y);
    y += lineasSeveridad.length * 5 + 3;

    doc.setFont(undefined, "bold");
    doc.setFontSize(9);
    doc.text("Otros hallazgos (diagnostico diferencial):", margenX, y);
    y += 5;
    doc.setFont(undefined, "normal");
    const probsOrdenadas = Object.entries(e.probabilidades_ia || {}).sort((a, b) => b[1] - a[1]);
    probsOrdenadas.forEach(([clase, valor]) => {
      const lineasProb = doc.splitTextToSize("- " + clase + ": " + Number(valor).toFixed(2) + "%", anchoColumnaTexto - 3);
      doc.text(lineasProb, margenX + 3, y);
      y += lineasProb.length * 5;
    });

    // La siguiente seccion no puede empezar antes de que termine tanto el
    // texto como la miniatura, para que no se superpongan.
    if (tieneImagen) {
      y = Math.max(y, yInicioBloque + altoImagenMiniatura + 9);
    }
    y += 5;

    const celulasDetectadas = e.celulas_detectadas || [];
    if (celulasDetectadas.length > 1) {
      y = verificarSaltoPagina(y);
      doc.setFont(undefined, "bold");
      doc.setFontSize(9);
      doc.text(
        "Total de celulas detectadas en la imagen: " + celulasDetectadas.length,
        margenX,
        y
      );
      y += 5;
      doc.setFont(undefined, "normal");
      celulasDetectadas.forEach((c, i) => {
        y = verificarSaltoPagina(y);
        doc.text(
          "- Celula " + (i + 1) + ": " + c.clase + " (" + Number(c.confianza).toFixed(2) + "%)",
          margenX + 3,
          y
        );
        y += 5;
      });
      y += 4;
    }

    seccion("Observaciones clinicas", e.observaciones);
    seccion(
      "Recomendacion",
      "Este informe fue generado por un sistema de apoyo diagnostico basado en inteligencia artificial. El diagnostico, tratamiento y seguimiento deben ser determinados por el profesional de salud tratante segun su criterio clinico."
    );

    y = verificarSaltoPagina(y + 6);
    doc.setDrawColor(120, 100, 80);
    doc.line(margenX, y, margenX + 75, y);
    y += 5;
    doc.setFontSize(9);
    doc.setTextColor(60, 46, 30);
    doc.text("Firma - Medico responsable: " + medicoNombre, margenX, y);

    doc.setFontSize(7.5);
    doc.setTextColor(140, 120, 95);
    doc.text(
      "Documento de apoyo diagnostico generado automaticamente. No constituye una historia clinica oficial ni tiene validez legal.",
      105,
      289,
      { align: "center", maxWidth: anchoUtil }
    );

    doc.save(e.codigo + "-" + e.nombre_paciente.replace(/\s+/g, "_") + ".pdf");
  }


  // =====================================================================
  // CONFIGURACION (tema, fuente, avatar, nombre de usuario, correo)
  // =====================================================================

  /** Aplica el tema y el tamano de fuente actuales de configVM al documento. */
  function aplicarPreferenciasVisuales() {
    document.body.classList.toggle("tema-oscuro", configVM.modoOscuro);
    document.getElementById("toggleTema").classList.toggle("on", configVM.modoOscuro);
    document.getElementById("toggleClaro").classList.toggle("on", !configVM.modoOscuro);
    document.documentElement.style.fontSize = configVM.tamanoFuente + "px";
    document.getElementById("valFuente").textContent = configVM.tamanoFuente;
  }

  document.getElementById("toggleTema").addEventListener("click", () => {
    configVM.alternarTema();
    aplicarPreferenciasVisuales();
  });
  document.getElementById("toggleClaro").addEventListener("click", () => {
    document.getElementById("toggleTema").click();
  });

  document.getElementById("btn-fuente-menos").addEventListener("click", () => {
    configVM.cambiarFuente(-1);
    aplicarPreferenciasVisuales();
  });
  document.getElementById("btn-fuente-mas").addEventListener("click", () => {
    configVM.cambiarFuente(1);
    aplicarPreferenciasVisuales();
  });

  /** Pinta el avatar (foto real si existe, o la inicial del nombre) en sidebar y en Configuracion. */
  function pintarAvatar() {
    const inicial = usuario.nombre_usuario.charAt(0).toUpperCase();
    const avGrande = document.getElementById("av-grande");
    const avSidebar = document.getElementById("av-sidebar");
    if (usuario.avatar_base64) {
      avGrande.innerHTML = `<img src="${usuario.avatar_base64}">`;
      avSidebar.innerHTML = `<img src="${usuario.avatar_base64}">`;
    } else {
      avGrande.textContent = inicial;
      avSidebar.textContent = inicial;
    }
  }

  document.getElementById("inputAvatar").addEventListener("change", async (evento) => {
    const archivo = evento.target.files[0];
    if (!archivo) return;
    try {
      await AuthModel.actualizarAvatar(archivo);
      pintarAvatar();
      mostrarToast("Foto de perfil actualizada");
    } catch (error) {
      mostrarToast(error.message || "No se pudo actualizar la foto de perfil");
    } finally {
      evento.target.value = "";
    }
  });

  document.getElementById("form-nombre-usuario").addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const nombreMensaje = document.getElementById("nombre-usuario-mensaje");
    const nuevoNombre = document.getElementById("config-nombre-usuario-input").value.trim();
    try {
      const nombreActualizado = await AuthModel.actualizarNombreUsuario(nuevoNombre);
      usuario.nombre_usuario = nombreActualizado;
      pintarUsuario();
      nombreMensaje.style.color = "#3a6020";
      nombreMensaje.textContent = "Nombre de usuario actualizado correctamente.";
      mostrarToast("Nombre de usuario actualizado");
    } catch (error) {
      nombreMensaje.style.color = "#a02020";
      nombreMensaje.textContent = error.message;
    }
  });

  document.getElementById("form-correo-usuario").addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const correoMensaje = document.getElementById("correo-mensaje");
    const correo = document.getElementById("config-correo-input").value.trim();
    try {
      await AuthModel.actualizarCorreo(correo);
      correoMensaje.style.color = "#3a6020";
      correoMensaje.textContent = "Correo actualizado. A partir de ahora recibiras notificaciones aqui.";
      mostrarToast("Correo de notificaciones actualizado");
    } catch (error) {
      correoMensaje.style.color = "#a02020";
      correoMensaje.textContent = error.message;
    }
  });

  // =====================================================================
  // GESTION DE USUARIOS (panel administrativo - mantenimiento/permisos)
  // =====================================================================
  function renderAdmin() {
    if (usuario.rol !== "admin") return;
    const tabla = document.getElementById("tabla-admin-usuarios");
    tabla.innerHTML = adminVM.usuarios
      .map(
        (u) => `
        <div class="config-fila">
          <div>
            <div class="config-label">${escaparHtml(u.nombre_usuario)} <span style="color:var(--texto-secundario);font-size:0.7857rem;">(${u.rol})</span></div>
            <div class="config-desc">${u.activo ? "Activo" : "Inactivo"}${u.correo ? " &middot; " + escaparHtml(u.correo) : " &middot; sin correo configurado"}</div>
          </div>
          <div style="display:flex; gap:6px;">
            <button class="btn-secundario" data-accion="estado" data-id="${u.id}" data-activo="${u.activo}">${u.activo ? "Desactivar" : "Activar"}</button>
            <button class="btn-secundario" data-accion="eliminar" data-id="${u.id}">Eliminar</button>
          </div>
        </div>`
      )
      .join("");

    tabla.querySelectorAll("button[data-accion]").forEach((boton) => {
      boton.addEventListener("click", async () => {
        const id = parseInt(boton.dataset.id, 10);
        if (boton.dataset.accion === "eliminar") {
          if (!confirm("¿Eliminar este usuario? Sus expedientes NO se eliminan.")) return;
          await adminVM.eliminarUsuario(id);
        } else {
          await adminVM.alternarEstado(id, boton.dataset.activo === "true");
        }
        renderAdmin();
      });
    });

    document.getElementById("admin-error").textContent = adminVM.mensajeError;
  }

  document.getElementById("form-admin-crear-usuario").addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const nombreUsuario = document.getElementById("admin-nuevo-usuario").value.trim();
    const contrasena = document.getElementById("admin-nueva-contrasena").value;
    const correo = document.getElementById("admin-nuevo-correo").value.trim();
    const rol = document.getElementById("admin-nuevo-rol").value;
    if (!nombreUsuario || !contrasena) return;

    const exito = await adminVM.crearUsuario(nombreUsuario, contrasena, rol, correo);
    if (exito) {
      document.getElementById("form-admin-crear-usuario").reset();
      mostrarToast("Usuario creado correctamente");
    }
    renderAdmin();
  });

  // =====================================================================
  // CERRAR SESION Y TOAST
  // =====================================================================
  document.getElementById("btn-cerrar-sesion").addEventListener("click", () => {
    AuthModel.cerrarSesion();
    window.location.href = "login.html";
  });

  function mostrarToast(mensaje) {
    const toast = document.getElementById("toast");
    toast.textContent = mensaje;
    toast.classList.add("visible");
    setTimeout(() => toast.classList.remove("visible"), 3000);
  }

  // ---- ARRANQUE ----
  aplicarPreferenciasVisuales();
  pintarUsuario();
  navegar("home");
});
