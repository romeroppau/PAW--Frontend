import { api, urlApi } from '../api.js';
import { agregarOIniciarSesion } from '../carrito.js';
import { conBotonDeshabilitado, mostrarAlerta } from '../formularios.js';
import { dinero, html, urlTapa } from '../html.js';

/**
 * Listado del catálogo (#/catalogo).
 * Se piden TODOS los libros una sola vez (GET /api/libros/todos): la búsqueda,
 * el orden, el rango de precio y el paginado se van a resolver acá, en JS.
 */
export default {
    titulo: 'Catálogo',
    estilos: ['css/paginas/catalogo.css', 'css/paginas/catalogo-paginado.css'],

    cargar: () => api('/libros/todos'),

    render: ({ data: libros, sorts }) => {
        const exportar = urlApi('/libros/export.csv');

        return html`
            <h1>Catálogo</h1>

            <aside>
                <h2>Filtros</h2>
                <!-- La búsqueda queda en la URL (#/catalogo?q=...): el resultado se puede compartir o guardar como enlace. -->
                <form data-filtros>
                    <fieldset>
                        <legend>Búsqueda</legend>
                        <label for="q-catalogo">Título o autor</label>
                        <input type="search" id="q-catalogo" name="q" maxlength="100">
                    </fieldset>
                    <fieldset>
                        <legend>Orden</legend>
                        <label for="orden">Ordenar por</label>
                        <select id="orden" name="orden">
                            <option value="">Predeterminado</option>
                            ${Object.entries(sorts).map(([valor, texto]) => html`
                                <option value="${valor}">${texto}</option>
                            `)}
                        </select>
                    </fieldset>
                    <button type="submit">Aplicar</button>
                </form>
            </aside>

            <div class="catalogo-info">
                <p>${libros.length} libros en el catálogo</p>
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

        // Añadir al carrito y llevar al carrito (sin sesión, primero lleva a iniciar sesión).
        main.querySelectorAll('[data-agregar]').forEach((form) => {
            form.addEventListener('submit', async (evento) => {
                evento.preventDefault();
                try {
                    await conBotonDeshabilitado(form.querySelector('button'),
                        () => agregarOIniciarSesion(form.elements.libro.value, navegar));
                } catch (error) {
                    mostrarAlerta(main.querySelector('[data-alerta]'), error.message);
                }
            });
        });
    },
};
