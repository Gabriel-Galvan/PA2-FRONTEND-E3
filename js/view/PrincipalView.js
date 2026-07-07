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
    const inicial = usuario.nombre_usuario.charAt(0).toUpperCase();
    document.getElementById("banner-nombre").textContent = usuario.nombre_usuario;
    document.getElementById("sb-usuario").textContent = usuario.nombre_usuario;
    document.getElementById("config-nombre-usuario").textContent = usuario.nombre_usuario;
    document.getElementById("sb-rol").textContent = usuario.rol === "admin" ? "Administrador" : "Medico";
    document.getElementById("config-correo-input").value = usuario.correo || "";
    if (!configVM.urlAvatar) {
      document.getElementById("av-sidebar").textContent = inicial;
      document.getElementById("av-grande").textContent = inicial;
    }

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
    "pac-historial": "historial_ginecologico",
    "pac-sintomas": "sintomas",
    "pac-observaciones": "observaciones",
  };
  Object.entries(mapaCamposPaciente).forEach(([idInput, campo]) => {
    document.getElementById(idInput).addEventListener("input", (evento) => {
      uploadVM.actualizarCampoPaciente(campo, evento.target.value);
      document.getElementById("upload-error").style.display = "none";
    });
  });

  function limpiarFormularioPacienteDOM() {
    Object.keys(mapaCamposPaciente).forEach((idInput) => {
      document.getElementById(idInput).value = "";
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
        '<p style="margin-top:6px; font-size:11px;">Ve a "Nuevo Expediente" para registrar un paciente y analizar su imagen.</p></div>';
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
        '<p style="font-size:11px;color:#a02020;">' + escaparHtml(r.error) + "</p>" +
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
      contenedor.innerHTML = '<p style="color:#a02020; font-size:12px;">' + escaparHtml(expedientesVM.mensajeError) + "</p>";
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
      : '<span style="font-size:26px;">&#9685;</span>';
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
        campoLectura("Historial ginecologico", e.historial_ginecologico || "Sin registrar", true) +
        campoLectura("Sintomas", e.sintomas || "Sin registrar", true) +
        campoLectura("Observaciones", e.observaciones || "Sin registrar", true) +
        "</div>" +
        '<div class="expediente-acciones no-imprimir">' +
        (editable ? '<button class="btn-secundario" id="btnEditarExpediente">Editar datos</button>' : "") +
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
    } else {
      modalCuerpo.innerHTML =
        '<div class="expediente-imagen-grande">' + imagenHTML + "</div>" +
        '<div class="expediente-detalle-grid">' +
        campoEdicion("edit-nombre", "Nombre del paciente", e.nombre_paciente) +
        campoEdicion("edit-documento", "Numero de documento", e.numero_documento) +
        campoEdicion("edit-nacimiento", "Fecha de nacimiento", e.fecha_nacimiento || "", "date") +
        campoEdicion("edit-historial", "Historial ginecologico", e.historial_ginecologico || "", "text", true) +
        campoEdicion("edit-sintomas", "Sintomas", e.sintomas || "", "text", true) +
        campoEdicion("edit-observaciones", "Observaciones", e.observaciones || "", "text", true) +
        "</div>" +
        '<p id="modal-error" style="color:#a02020; font-size:11px; margin-bottom:8px;"></p>' +
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

  function campoLectura(etiqueta, valor, ancho) {
    return (
      '<div class="campo' + (ancho ? " campo-ancho" : "") + '">' +
      '<label style="display:block; font-size:11px; color:#8a7560; margin-bottom:3px; text-transform:uppercase; letter-spacing:0.5px;">' + etiqueta + "</label>" +
      '<div style="font-size:13px; color:#3d2e1e;">' + escaparHtml(valor) + "</div>" +
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

  // =====================================================================
  // CONFIGURACION (tema, fuente, avatar, correo de notificaciones)
  // =====================================================================
  document.getElementById("toggleTema").addEventListener("click", () => {
    const oscuro = configVM.alternarTema();
    document.body.style.backgroundColor = oscuro ? "#1e1a14" : "#f0ebe3";
    document.body.style.color = oscuro ? "#e8dece" : "#3d2e1e";
    document.getElementById("toggleTema").classList.toggle("on", oscuro);
    document.getElementById("toggleClaro").classList.toggle("on", !oscuro);
  });
  document.getElementById("toggleClaro").addEventListener("click", () => {
    document.getElementById("toggleTema").click();
  });

  document.getElementById("btn-fuente-menos").addEventListener("click", () => {
    document.body.style.fontSize = configVM.cambiarFuente(-1) + "px";
    document.getElementById("valFuente").textContent = configVM.tamanoFuente;
  });
  document.getElementById("btn-fuente-mas").addEventListener("click", () => {
    document.body.style.fontSize = configVM.cambiarFuente(1) + "px";
    document.getElementById("valFuente").textContent = configVM.tamanoFuente;
  });

  document.getElementById("inputAvatar").addEventListener("change", (evento) => {
    const archivo = evento.target.files[0];
    if (!archivo) return;
    const url = URL.createObjectURL(archivo);
    configVM.establecerAvatar(url);
    document.getElementById("av-grande").innerHTML = `<img src="${url}">`;
    document.getElementById("av-sidebar").innerHTML =
      `<img src="${url}" style="width:100%;height:100%;border-radius:50%;object-fit:cover">`;
    mostrarToast("Foto de perfil actualizada");
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
            <div class="config-label">${escaparHtml(u.nombre_usuario)} <span style="color:#8a7560;font-size:11px;">(${u.rol})</span></div>
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
  pintarUsuario();
  navegar("home");
});
