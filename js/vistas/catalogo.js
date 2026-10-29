import { api } from '../api.js';
import { agregarOIniciarSesion } from '../carrito.js';
import { conBotonDeshabilitado, mostrarAlerta } from '../formularios.js';
import { dinero, html, urlTapa } from '../html.js';

/**
 * Listado del catálogo (#/catalogo).
 * Se piden TODOS los libros una sola vez (GET /api/libros/todos): la búsqueda,
 * el orden, el rango de precio y el paginado se van a resolver acá, en JS.
 */

// "Él Túnel" -> "el tunel": se busca sin distinguir mayúsculas ni acentos, igual que hacía el backend.
const normalizar = (texto) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Precio escrito en un campo: número >= 0, o null si está vacío o no es válido (sin límite).
function precio(texto) {
    if (texto.trim() === '') return null;
    const numero = Number(texto);
    return Number.isFinite(numero) && numero >= 0 ? numero : null;
}

// Desde este ancho los filtros quedan al costado de la lista (mismo corte que catalogo.css).
const DESKTOP = '(min-width: 1000px)';

// Opciones de "Libros por página" (la primera es la predeterminada).
const POR_PAGINA = [6, 12, 24];

// Órdenes que se suman a los de la API (precio y título), para ordenar por más criterios.
const ORDENES_EXTRA = { 'autor-asc': 'Autor: A-Z', 'autor-desc': 'Autor: Z-A' };

// Cómo comparar dos libros en cada orden. localeCompare('es'): "Él" y "Ñ" van donde corresponde.
const COMPARADORES = {
    'precio-asc':  (a, b) => a.price - b.price,
    'precio-desc': (a, b) => b.price - a.price,
    'titulo-asc':  (a, b) => a.title.localeCompare(b.title, 'es'),
    'titulo-desc': (a, b) => b.title.localeCompare(a.title, 'es'),
    'autor-asc':   (a, b) => a.author.localeCompare(b.author, 'es'),
    'autor-desc':  (a, b) => b.author.localeCompare(a.author, 'es'),
};

// 1 … 4 [5] 6 … 12: la primera, la última y las vecinas de la actual (en el celular no entran todas).
function paginasVisibles(actual, total) {
    const paginas = [];
    for (let pagina = 1; pagina <= total; pagina++) {
        if (pagina === 1 || pagina === total || Math.abs(pagina - actual) <= 1) {
            paginas.push(pagina);
        } else if (paginas.at(-1) !== '…') {
            paginas.push('…');
        }
    }
    return paginas;
}

// Botones de paginación. Anterior y Siguiente quedan siempre en su lugar (deshabilitados
// en los extremos), para que no se muevan bajo el dedo. En el celular, en vez de los números
// (no entran en una línea) se muestra "Página X de Y": ver catalogo-paginado.css.
const botonesPaginas = (actual, total) => total > 1 && html`
    <ul>
        <li><button type="button" data-pagina="${actual - 1}" ${actual === 1 && 'disabled'}>
            <span aria-hidden="true">‹</span> Anterior
        </button></li>
        ${paginasVisibles(actual, total).map((pagina) => html`
            <li class="numero">
                ${pagina === '…'
                    ? html`<span class="puntos" aria-hidden="true">…</span>`
                    : html`<button type="button" data-pagina="${pagina}" aria-label="Página ${pagina}"
                        ${pagina === actual && html`aria-current="page"`}>${pagina}</button>`}
            </li>
        `)}
        <li class="resumen">Página ${actual} de ${total}</li>
        <li><button type="button" data-pagina="${actual + 1}" ${actual === total && 'disabled'}>
            Siguiente <span aria-hidden="true">›</span>
        </button></li>
    </ul>
`;

// Una celda del CSV, entre comillas (las comillas de adentro se duplican, como pide el formato CSV).
// Si empieza con = + - @ se le antepone ': si no, Excel la ejecutaría como fórmula ("inyección de fórmulas").
function celdaCsv(valor) {
    let texto = String(valor);
    if (/^[=+\-@]/.test(texto)) texto = `'${texto}`;
    return `"${texto.replaceAll('"', '""')}"`;
}

// CSV con las mismas columnas que exportaba el backend.
// ﻿ (BOM) al principio: hace que Excel muestre bien los acentos.
function armarCsv(libros) {
    const filas = [
        ['ID', 'Título', 'Autor', 'Género', 'Precio'],
        ...libros.map((libro) => [libro.id, libro.title, libro.author, libro.genre, libro.price]),
    ];
    return '﻿' + filas.map((fila) => fila.map(celdaCsv).join(',')).join('\n') + '\n';
}

// Tarjeta de un libro del listado.
const tarjetaLibro = (libro) => html`
    <article>
        <a href="#/catalogo/${encodeURIComponent(libro.slug)}">
            <img src="${urlTapa(libro)}" alt="Portada de ${libro.title}" width="150">
        </a>
        <h2>${libro.title}</h2>
        <p>${libro.author}</p>
        <p><strong>Precio:</strong> ${dinero(libro.price)}</p>
        <p>${libro.summary}</p>
        <form data-agregar>
            <input type="hidden" name="libro" value="${libro.slug}">
            <button type="submit">Añadir al carrito</button>
        </form>
    </article>
`;

export default {
    titulo: 'Catálogo',
    estilos: ['css/paginas/catalogo.css', 'css/paginas/catalogo-paginado.css'],

    cargar: () => api('/libros/todos'),

    // Solo el esqueleto: la cantidad y los libros los completa actualizar(), en montar().
    render: ({ sorts }, { query }) => {

        return html`
            <h1>Catálogo</h1>

            <aside>
                <!-- En el celular el panel arranca cerrado, para que los libros se vean sin tener que bajar. -->
                <details class="panel-filtros" data-panel ${matchMedia(DESKTOP).matches && 'open'}>
                    <summary><h2>Filtros y orden <span data-activos></span></h2></summary>
                    <form data-filtros>
                        <fieldset>
                            <legend>Búsqueda</legend>
                            <label for="q-catalogo">Título o autor</label>
                            <input type="search" id="q-catalogo" name="q" value="${query.get('q') ?? ''}" maxlength="100">
                        </fieldset>
                        <fieldset>
                            <legend>Orden</legend>
                            <label for="orden">Ordenar por</label>
                            <select id="orden" name="orden">
                                <option value="">Predeterminado</option>
                                ${Object.entries({ ...sorts, ...ORDENES_EXTRA }).map(([valor, texto]) => html`
                                    <option value="${valor}" ${valor === query.get('orden') && 'selected'}>${texto}</option>
                                `)}
                            </select>
                        </fieldset>
                        <fieldset>
                            <legend>Precio</legend>
                            <label for="precio-desde">Desde</label>
                            <input type="number" id="precio-desde" name="desde" min="0" step="100"
                                inputmode="numeric" placeholder="$0" value="${query.get('desde') ?? ''}">
                            <label for="precio-hasta">Hasta</label>
                            <input type="number" id="precio-hasta" name="hasta" min="0" step="100"
                                inputmode="numeric" placeholder="Sin límite" value="${query.get('hasta') ?? ''}">
                            <p class="error-campo" id="error-precio" hidden data-error-precio></p>
                        </fieldset>
                        <fieldset>
                            <legend>Mostrar</legend>
                            <label for="por-pagina">Libros por página</label>
                            <select id="por-pagina" name="porPagina">
                                ${POR_PAGINA.map((cantidad) => html`
                                    <option value="${cantidad}" ${cantidad === Number(query.get('por-pagina')) && 'selected'}>${cantidad}</option>
                                `)}
                            </select>
                        </fieldset>
                        <!-- Los filtros se aplican solos; en el celular este botón cierra el panel y lleva a los libros. -->
                        <button type="submit">Ver resultados</button>
                        <!-- Solo se muestra cuando hay algún filtro aplicado. -->
                        <button type="button" class="limpiar-filtros" hidden data-limpiar>Limpiar filtros</button>
                    </form>
                </details>
            </aside>

            <div class="catalogo-info">
                <p data-info></p>
                <!-- Descarga los resultados que se están viendo (con filtros y orden, sin paginar). -->
                <button type="button" data-csv>Descargar CSV</button>
            </div>

            <p class="alerta-error" role="alert" hidden data-alerta></p>

            <p class="sin-resultados" hidden data-sin-resultados>No encontramos libros que coincidan con tu búsqueda.</p>
            <section id="catalogo" data-lista></section>

            <nav class="paginacion" aria-label="Páginas del catálogo" data-paginacion></nav>
        `;
    },

    montar(main, { data: libros }, { query, navegar }) {
        const form = main.querySelector('[data-filtros]');
        const lista = main.querySelector('[data-lista]');
        const info = main.querySelector('[data-info]');
        const sinResultados = main.querySelector('[data-sin-resultados]');
        const errorPrecio = main.querySelector('[data-error-precio]');
        const paginacion = main.querySelector('[data-paginacion]');
        const panel = main.querySelector('[data-panel]');
        const activos = main.querySelector('[data-activos]');
        const limpiar = main.querySelector('[data-limpiar]');
        // Página de la URL (?pagina=3); si no viene o no es un número válido, la 1.
        let pagina = Math.max(1, Math.floor(Number(query.get('pagina'))) || 1);
        // Resultados de los filtros actuales (todas las páginas): los usa "Descargar CSV".
        let resultados = libros;

        // Sube la pantalla hasta el principio de la lista (el espacio del header fijo lo deja scroll-padding-top).
        function subirALaLista() {
            info.scrollIntoView({ behavior: 'smooth' });
        }

        // "Desde" mayor que "Hasta": se avisa junto a los campos y el rango no se aplica
        // (en vez de mostrar 0 resultados sin explicar por qué).
        function validarPrecio(desde, hasta) {
            const valido = desde === null || hasta === null || desde <= hasta;
            mostrarAlerta(errorPrecio, valido ? '' : 'El precio "Desde" no puede ser mayor que "Hasta".');
            for (const campo of [form.elements.desde, form.elements.hasta]) {
                if (valido) {
                    campo.removeAttribute('aria-invalid');
                    campo.removeAttribute('aria-describedby');
                } else {
                    campo.setAttribute('aria-invalid', 'true');
                    campo.setAttribute('aria-describedby', errorPrecio.id);
                }
            }
            return valido;
        }

        // Copia los filtros y la página a la URL (#/catalogo?q=borges&pagina=2): así se mantienen al recargar,
        // al volver atrás desde un libro o al compartir el link. Los valores vacíos o predeterminados no se escriben.
        // replaceState cambia la URL sin disparar "hashchange": el router no vuelve a cargar la vista.
        function guardarEnUrl() {
            const parametros = new URLSearchParams();
            for (const campo of ['q', 'orden', 'desde', 'hasta']) {
                const valor = form.elements[campo].value.trim();
                if (valor) parametros.set(campo, valor);
            }
            if (form.elements.porPagina.value !== String(POR_PAGINA[0])) {
                parametros.set('por-pagina', form.elements.porPagina.value);
            }
            if (pagina > 1) parametros.set('pagina', pagina);

            const consulta = String(parametros);
            history.replaceState(null, '', `#/catalogo${consulta ? `?${consulta}` : ''}`);
        }

        // Redibuja solo la lista (no toda la vista): se llama al entrar y cada vez que cambie un filtro.
        function actualizar() {
            const busqueda = form.elements.q.value.trim();

            const comparar = COMPARADORES[form.elements.orden.value];
            let desde = precio(form.elements.desde.value);
            let hasta = precio(form.elements.hasta.value);
            if (!validarPrecio(desde, hasta)) {
                desde = hasta = null;
            }

            // Título o autor contienen lo buscado (con la búsqueda vacía, coinciden todos)
            // y el precio está dentro del rango (null: sin límite de ese lado).
            const visibles = libros.filter((libro) =>
                normalizar(`${libro.title} ${libro.author}`).includes(normalizar(busqueda))
                && (desde === null || libro.price >= desde)
                && (hasta === null || libro.price <= hasta));

            // "Predeterminado" no tiene comparador: queda el orden original del catálogo.
            if (comparar) visibles.sort(comparar);
            resultados = visibles;

            // Solo los libros de la página actual: con 6 por página, la 2 va del 7 al 12.
            const porPagina = Number(form.elements.porPagina.value);
            const totalPaginas = Math.max(1, Math.ceil(visibles.length / porPagina));
            pagina = Math.min(pagina, totalPaginas);
            const enPagina = visibles.slice((pagina - 1) * porPagina, pagina * porPagina);

            const hayBusqueda = busqueda !== '';
            const hayOrden = comparar !== undefined;
            const hayPrecio = desde !== null || hasta !== null;

            lista.innerHTML = String(html`${enPagina.map(tarjetaLibro)}`);
            paginacion.innerHTML = String(html`${botonesPaginas(pagina, totalPaginas)}`);
            // "libros en el catálogo" solo sin filtros: con búsqueda o precio, son los que cumplen el filtro.
            // textContent: lo que escribió el usuario nunca se interpreta como HTML.
            if (hayBusqueda) {
                info.textContent = `${visibles.length} resultado(s) para "${busqueda}"`;
            } else if (hayPrecio) {
                info.textContent = `${visibles.length} resultado(s)`;
            } else {
                info.textContent = `${visibles.length} libros en el catálogo`;
            }
            sinResultados.hidden = visibles.length > 0;

            // Cuántos filtros hay aplicados, ej. "(2)": se ve en el título aunque el panel esté cerrado.
            const cantidad = [hayBusqueda, hayOrden, hayPrecio].filter(Boolean).length;
            activos.textContent = cantidad ? `(${cantidad})` : '';
            limpiar.hidden = cantidad === 0;

            guardarEnUrl();
        }

        // Los filtros se aplican mientras se escribe, sin recargar la vista ni volver a pedir los libros.
        // Cualquier cambio vuelve a la página 1: si no, se podría quedar en la página 5 de un resultado que ahora tiene 2.
        form.addEventListener('input', () => {
            pagina = 1;
            actualizar();
        });

        // Enter o "Ver resultados": que el form no se envíe (recargaría la página); los filtros ya están aplicados.
        // En el celular, además, se cierra el panel y se lleva a los libros.
        form.addEventListener('submit', (evento) => {
            evento.preventDefault();
            actualizar();
            if (!matchMedia(DESKTOP).matches) {
                panel.open = false;
                subirALaLista();
            }
        });

        // Vacía búsqueda, orden y precio. "Libros por página" se respeta: es cómo se quiere ver la lista, no un filtro.
        limpiar.addEventListener('click', () => {
            for (const campo of ['q', 'orden', 'desde', 'hasta']) {
                form.elements[campo].value = '';
            }
            pagina = 1;
            actualizar();
        });

        // Descarga los resultados actuales como catalogo.csv, armado acá (sin pedir nada al backend):
        // se crea un archivo en memoria (Blob), un enlace temporal que apunta a él, y se lo "clickea".
        main.querySelector('[data-csv]').addEventListener('click', () => {
            const archivo = new Blob([armarCsv(resultados)], { type: 'text/csv;charset=utf-8' });
            const enlace = document.createElement('a');
            enlace.href = URL.createObjectURL(archivo);
            enlace.download = 'catalogo.csv';
            enlace.click();
            // Libera el archivo de la memoria una vez que el navegador empezó la descarga.
            setTimeout(() => URL.revokeObjectURL(enlace.href), 0);
        });

        // Cambiar de página y llevar al principio de la lista.
        paginacion.addEventListener('click', (evento) => {
            const boton = evento.target.closest('[data-pagina]');
            if (!boton || boton.disabled) return;
            pagina = Number(boton.dataset.pagina);
            actualizar();
            subirALaLista();
        });

        // Añadir al carrito y llevar al carrito (sin sesión, primero lleva a iniciar sesión).
        // Un solo listener en la lista (delegación): sirve también para las tarjetas que dibuje actualizar().
        lista.addEventListener('submit', async (evento) => {
            const form = evento.target.closest('[data-agregar]');
            if (!form) return;
            evento.preventDefault();
            try {
                await conBotonDeshabilitado(form.querySelector('button'),
                    () => agregarOIniciarSesion(form.elements.libro.value, navegar));
            } catch (error) {
                mostrarAlerta(main.querySelector('[data-alerta]'), error.message);
            }
        });

        actualizar();
    },
};
