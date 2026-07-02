/* =====================================================================
   view/PrincipalView.js
   =====================================================================
   CAPA: VIEW
   --------------------------------
   Pieza mas grande de la Vista: conecta el HTML de principal.html con
   todos los ViewModel (Upload, Results, History, Config, Admin).
   Reemplaza la logica del mockup original (que generaba resultados
   aleatorios con Math.random) por datos REALES que vienen del modelo
   de IA a traves de la capa Model -> ViewModel.
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
  const historyVM = new HistoryViewModel();
  const configVM = new ConfigViewModel();
  const adminVM = new AdminViewModel();

  const usuario = AuthModel.obtenerUsuario();

  // =====================================================================
  // DATOS DEL USUARIO EN PANTALLA
  // =====================================================================
  function pintarUsuario() {
    const inicial = usuario.nombre_usuario.charAt(0).toUpperCase();
    document.getElementById("banner-nombre").textContent = usuario.nombre_usuario;
    document.getElementById("sb-usuario").textContent = usuario.nombre_usuario;
    document.getElementById("config-nombre-usuario").textContent = usuario.nombre_usuario;
    document.getElementById("sb-rol").textContent = usuario.rol === "admin" ? "Administrador" : "Medico";
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
    if (seccion === "results") renderResultados();
    if (seccion === "history") renderHistorial();
    if (seccion === "config") adminVM.cargarUsuarios().then(renderAdmin);
  }
  window.navegar = navegar; // usado por los onclick="" del HTML

  // =====================================================================
  // SUBIR IMAGENES (PB-10 / PB-15)
  // =====================================================================
  const zonaArrastrar = document.getElementById("zonaArrastrar");
  const inputArchivo = document.getElementById("inputArchivo");
  const gridPreview = document.getElementById("gridPreview");
  const secAnalizar = document.getElementById("secAnalizar");
  const barraWrap = document.getElementById("barraWrap");
  const barraInner = document.getElementById("barraInner");

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
    await uploadVM.analizarImagenes();
    historyVM.agregarResultados(resultsVM.obtenerResultados());
    navegar("results");
    mostrarToast("Analisis completado");
  });

  // =====================================================================
  // RESULTADOS (PB-11 / PB-16) - datos reales del modelo de IA
  // =====================================================================
  function renderResultados() {
    const contenedor = document.getElementById("contenido-resultados");
    const resultados = resultsVM.obtenerResultados();

    if (resultados.length === 0) {
      contenedor.innerHTML =
        '<div class="estado-vacio"><div class="icono-vacio">&#9654;</div>' +
        "<p>No hay resultados todavia.</p>" +
        '<p style="margin-top:6px; font-size:11px;">Sube imagenes y ejecuta el analisis primero.</p></div>';
      return;
    }

    contenedor.innerHTML = resultados
      .map((r) => tarjetaResultadoHTML(r, new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })))
      .join("");
  }

  function tarjetaResultadoHTML(r, horaTexto) {
    if (r.error) {
      return (
        '<div class="tarjeta-resultado">' +
        '<div class="resultado-cabecera"><div>' +
        '<div class="resultado-nombre">' + r.nombreArchivoOriginal + "</div>" +
        '<div class="resultado-meta">Error al analizar</div></div>' +
        '<span class="badge badge-positivo">Error</span></div>' +
        '<div class="resultado-img"><img src="' + r.urlPreview + '" alt="muestra"></div>' +
        '<p style="font-size:11px;color:#a02020;">' + r.error + "</p>" +
        "</div>"
      );
    }

    const confianzaTexto = r.confianza.toFixed(2) + "% de confianza";
    return (
      '<div class="tarjeta-resultado">' +
      '<div class="resultado-cabecera"><div>' +
      '<div class="resultado-nombre">' + r.nombreArchivoOriginal + "</div>" +
      '<div class="resultado-meta">Hoy &nbsp;|&nbsp; ' + horaTexto + "</div></div>" +
      '<span class="badge ' + r.badge.claseCSS + '">' + r.badge.etiqueta + "</span>" +
      "</div>" +
      '<div class="resultado-img"><img src="' + r.urlPreview + '" alt="muestra"></div>' +
      '<div class="tags"><span class="tag activo">' + r.diagnostico + "</span>" +
      '<span class="tag">' + confianzaTexto + "</span></div>" +
      "</div>"
    );
  }

  // =====================================================================
  // HISTORIAL (en memoria durante la sesion; la persistencia en BD
  // queda para una siguiente iteracion, tal como se acordo)
  // =====================================================================
  function renderHistorial() {
    const contenedor = document.getElementById("contenido-historial");
    const elementos = historyVM.obtenerElementos();

    if (elementos.length === 0) {
      contenedor.innerHTML =
        '<div class="estado-vacio"><div class="icono-vacio">&#9685;</div>' +
        "<p>Aun no hay analisis en esta sesion.</p></div>";
      return;
    }

    contenedor.innerHTML = elementos
      .map((r) => tarjetaResultadoHTML(r, r.fechaLocal.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })))
      .join("");
  }

  // =====================================================================
  // CONFIGURACION (tema, fuente, avatar)
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
            <div class="config-label">${u.nombre_usuario} <span style="color:#8a7560;font-size:11px;">(${u.rol})</span></div>
            <div class="config-desc">${u.activo ? "Activo" : "Inactivo"}</div>
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
    const rol = document.getElementById("admin-nuevo-rol").value;
    if (!nombreUsuario || !contrasena) return;

    const exito = await adminVM.crearUsuario(nombreUsuario, contrasena, rol);
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