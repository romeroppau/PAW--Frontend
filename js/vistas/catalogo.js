import { api, urlApi } from '../api.js';
import { agregarAlCarrito } from '../carrito.js';
import { conBotonDeshabilitado, mostrarAlerta } from '../formularios.js';
import { dinero, html, urlTapa } from '../html.js';

// Búsqueda y orden actuales, sin los vacíos: se conservan al paginar y al exportar.
function filtrosDe(meta) {
    const filtros = {};
    if (meta.query) filtros.q = meta.query;
    if (meta.sort) filtros.orden = meta.sort;
    return filtros;
}

const urlPagina = (filtros, pagina) => `#/catalogo?${new URLSearchParams({ ...filtros, page: pagina })}`;

/**
 * Listado del catálogo (#/catalogo?q=texto&orden=precio-asc&page=2).
 * Los datos vienen de GET /api/libros con los mismos parámetros.
 */
export default {
    titulo: ({ meta }) => (meta.query ? `Resultados para "${meta.query}"` : 'Catálogo'),
    estilos: ['css/paginas/catalogo.css', 'css/paginas/catalogo-paginado.css'],

    // ?page=99 o ?page=abc: la API responde 404 y el router muestra la vista "no encontrada".
    cargar: ({ query }) => {
        const parametros = new URLSearchParams();
        for (const clave of ['q', 'orden', 'page']) {
            if (query.get(clave)) parametros.set(clave, query.get(clave));
        }
        return api(`/libros?${parametros}`);
    },

    render: ({ data: libros, meta, sorts }) => {
        const filtros = filtrosDe(meta);
        const exportar = urlApi('/libros/export.csv') + (Object.keys(filtros).length ? `?${new URLSearchParams(filtros)}` : '');
        const paginas = Array.from({ length: meta.total_pages }, (_, i) => i + 1);

        return html`
            <h1>Catálogo</h1>

            <aside>
                <h2>Filtros</h2>
                <!-- La búsqueda queda en la URL (#/catalogo?q=...): el resultado se puede compartir o guardar como enlace. -->
                <form data-filtros>
                    <fieldset>
                        <legend>Búsqueda</legend>
                        <label for="q-catalogo">Título o autor</label>
                        <input type="search" id="q-catalogo" name="q" value="${meta.query}" maxlength="100">
                    </fieldset>
                    <fieldset>
                        <legend>Orden</legend>
                        <label for="orden">Ordenar por</label>
                        <select id="orden" name="orden">
                            <option value="">Predeterminado</option>
                            ${Object.entries(sorts).map(([valor, texto]) => html`
                                <option value="${valor}" ${valor === meta.sort && 'selected'}>${texto}</option>
                            `)}
                        </select>
                    </fieldset>
                    <button type="submit">Aplicar</button>
                </form>
            </aside>

            <div class="catalogo-info">
                <p>
                    ${meta.query
                        ? html`${meta.total} resultado(s) para "<strong>${meta.query}</strong>" · <a href="#/catalogo">Ver todos</a>`
                        : html`${meta.total} libros en el catálogo`}
                </p>
                <a href="${exportar}" download>Descargar CSV</a>
            </div>

            <p class="alerta-error" role="alert" hidden data-alerta></p>

            ${libros.length === 0
                ? html`<p class="sin-resultados">No encontramos libros que coincidan con tu búsqueda.</p>`
                : html`
                    <section id="catalogo">
                        ${libros.map((libro) => html`
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
                        `)}
                    </section>
                `}

            ${meta.total_pages > 1 && html`
                <nav class="paginacion" aria-label="Páginas del catálogo">
                    <ul>
                        ${meta.page > 1 && html`<li><a href="${urlPagina(filtros, meta.page - 1)}" rel="prev">Anterior</a></li>`}
                        ${paginas.map((pagina) => html`
                            <li>
                                ${pagina === meta.page
                                    ? html`<span aria-current="page">${pagina}</span>`
                                    : html`<a href="${urlPagina(filtros, pagina)}">${pagina}</a>`}
                            </li>
                        `)}
                        ${meta.page < meta.total_pages && html`<li><a href="${urlPagina(filtros, meta.page + 1)}" rel="next">Siguiente</a></li>`}
                    </ul>
                </nav>
            `}
        `;
    },

    montar(main, datos, { navegar }) {
        // Aplicar filtros: se cambia la URL y el router vuelve a pedir el listado.
        main.querySelector('[data-filtros]').addEventListener('submit', (evento) => {
            evento.preventDefault();
            const form = evento.currentTarget;
            const filtros = {};
            const q = form.elements.q.value.trim();
            if (q) filtros.q = q;
            if (form.elements.orden.value) filtros.orden = form.elements.orden.value;
            navegar(`/catalogo?${new URLSearchParams(filtros)}`);
        });

        // Añadir al carrito y llevar al usuario al carrito.
        main.querySelectorAll('[data-agregar]').forEach((form) => {
            form.addEventListener('submit', async (evento) => {
                evento.preventDefault();
                try {
                    await conBotonDeshabilitado(form.querySelector('button'), () => agregarAlCarrito(form.elements.libro.value));
                    navegar('/carrito');
                } catch (error) {
                    mostrarAlerta(main.querySelector('[data-alerta]'), error.message);
                }
            });
        });
    },
};
