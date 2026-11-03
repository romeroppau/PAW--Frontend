import { api } from '../api.js';
import { agregarOIniciarSesion } from '../carrito.js';
import { conBotonDeshabilitado, mostrarAlerta } from '../formularios.js';
import { dinero, html, urlTapa } from '../html.js';
import { esDuenio, sesionInicial } from '../sesion.js';

/**
 * Detalle de un libro (#/catalogo/{slug}). Datos de GET /api/libros/{slug}.
 * Si el libro no existe, la API responde 404 y el router muestra la vista "no encontrada".
 * Con ?cargado=1 (al venir de "Cargar un libro") avisa que el libro se cargó.
 * Al dueño de la librería no se le muestra "Añadir al carrito" (no compra).
 */
export default {
    titulo: ({ data: libro }) => libro.title,
    estilos: ['css/paginas/libros.css'],

    // Junto con el libro se espera saber quién está conectado (para el botón del carrito), en paralelo.
    cargar: async ({ params }) =>
        (await Promise.all([api(`/libros/${encodeURIComponent(params.slug)}`), sesionInicial()]))[0],

    render: ({ data: libro }, { query }) => html`
        ${query.get('cargado') === '1' && html`
            <p class="alerta-exito" role="status">El libro se cargó correctamente y ya está en el catálogo.</p>
        `}
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

                ${!esDuenio() && html`
                    <form data-agregar>
                        <button type="submit" class="btn-carrito">Añadir al carrito</button>
                    </form>
                    <p class="alerta-error" role="alert" hidden data-alerta></p>
                `}
                <p><a href="#/catalogo">← Volver al catálogo</a></p>
            </section>
        </article>
    `,

    montar(main, { data: libro }, { navegar, ruta, query }) {
        // El aviso se muestra una sola vez: se saca ?cargado de la URL (replaceState no recarga la vista),
        // así al recargar la página o compartir el enlace no vuelve a aparecer.
        if (query.has('cargado')) {
            history.replaceState(null, '', '#' + ruta);
        }

        const form = main.querySelector('[data-agregar]');
        if (!form) return; // el dueño no tiene el botón

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
