import { api } from '../api.js';
import { agregarOIniciarSesion } from '../carrito.js';
import { conBotonDeshabilitado, mostrarAlerta } from '../formularios.js';
import { dinero, html, urlTapa } from '../html.js';

/**
 * Detalle de un libro (#/catalogo/{slug}). Datos de GET /api/libros/{slug}.
 * Si el libro no existe, la API responde 404 y el router muestra la vista "no encontrada".
 */
export default {
    titulo: ({ data: libro }) => libro.title,
    estilos: ['css/paginas/libros.css'],

    cargar: ({ params }) => api(`/libros/${encodeURIComponent(params.slug)}`),

    render: ({ data: libro }) => html`
        <article>
            <section>
                <img src="${urlTapa(libro)}" alt="Portada de ${libro.title}" width="300">
            </section>
            <section>
                <h1>${libro.title}</h1>
                <h2>${libro.author}</h2>
                <p>${libro.summary}</p>

                <h3>Sinopsis</h3>
                <p>${libro.synopsis}</p>

                <h3>Información del libro</h3>
                <ul>
                    <li>Autor: ${libro.author}</li>
                    <li>Género: ${libro.genre}</li>
                </ul>
                <p>Precio: ${dinero(libro.price)}</p>

                <form data-agregar>
                    <button type="submit" class="btn-carrito">Añadir al carrito</button>
                </form>
                <p class="alerta-error" role="alert" hidden data-alerta></p>
                <p><a href="#/catalogo">← Volver al catálogo</a></p>
            </section>
        </article>
    `,

    montar(main, { data: libro }, { navegar }) {
        const form = main.querySelector('[data-agregar]');
        form.addEventListener('submit', async (evento) => {
            evento.preventDefault();
            try {
                // Sin sesión, primero lleva a iniciar sesión y después agrega el libro.
                await conBotonDeshabilitado(form.querySelector('button'), () => agregarOIniciarSesion(libro.slug, navegar));
            } catch (error) {
                mostrarAlerta(main.querySelector('[data-alerta]'), error.message);
            }
        });
    },
};
