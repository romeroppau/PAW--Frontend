import { api } from '../api.js';
import { exigirSesion, rutaDeLogin } from '../carrito.js';
import { conBotonDeshabilitado, datosDelFormulario, mostrarAlerta } from '../formularios.js';
import { dinero, html } from '../html.js';
import { Validador } from '../lib/validador.js';
import { esDuenio, sesionVencida } from '../sesion.js';
import { LIBRO as R } from '../validaciones.js';

/**
 * Cargar un libro nuevo (#/libros/nuevo). Solo el dueño de la librería.
 * - Sin sesión: lleva a iniciar sesión (y después vuelve acá).
 * - Cliente: muestra que no tiene permiso (la API también lo rechaza con 403: ocultar el formulario
 *   es solo para no ofrecer algo que no puede usar).
 * - Dueño: formulario -> POST /api/libros -> detalle del libro nuevo.
 *
 * Validación en línea con js/lib/validador.js (igual en todos los navegadores). Las reglas salen
 * de js/validaciones.js, que replica las de App\Models\Book. La API valida todo de nuevo.
 */
export default {
    titulo: ({ permitido }) => (permitido ? 'Cargar un libro' : 'Sin permiso'),
    estilos: ['css/lib/validador.css', 'css/paginas/libroNuevo.css'],

    cargar: () => exigirSesion('/libros/nuevo', async () => {
        if (!esDuenio()) {
            return { permitido: false };
        }
        // Géneros que ya usa el catálogo, como sugerencias. Si la API no responde, el formulario
        // se puede usar igual (sin sugerencias).
        const catalogo = await api('/libros/todos').catch(() => ({ data: [] }));
        const generos = [...new Set(catalogo.data.map((libro) => libro.genre))].sort((a, b) => a.localeCompare(b, 'es'));
        return { permitido: true, generos };
    }),

    render: ({ permitido, generos }) => (permitido ? formulario(generos) : sinPermiso()),

    montar(main, { permitido }, { navegar, recargar }) {
        if (!permitido) return;

        const form = main.querySelector('[data-libro-nuevo]');
        const alerta = main.querySelector('[data-alerta]');
        const validador = new Validador(form);

        form.addEventListener('submit', async (evento) => {
            evento.preventDefault();
            mostrarAlerta(alerta, '');
            if (!validador.validar()) return; // muestra los errores y enfoca el primero

            const datos = datosDelFormulario(form);
            try {
                const { data: libro } = await conBotonDeshabilitado(form.querySelector('button[type="submit"]'), () =>
                    api('/libros', { method: 'POST', body: { ...datos, precio: Number(datos.precio) } }));
                navegar(`/catalogo/${encodeURIComponent(libro.slug)}?cargado=1`);
            } catch (error) {
                if (error.status === 401) {
                    // La sesión venció mientras completaba el formulario.
                    sesionVencida();
                    navegar(rutaDeLogin('/libros/nuevo'));
                    return;
                }
                if (error.status === 403) {
                    recargar(); // ya no es el dueño: muestra la vista "sin permiso"
                    return;
                }
                // 422: errores de cada campo (ej. "Ya existe un libro con ese título y autor").
                const sinCampo = validador.mostrarErrores(error.campos ?? {});
                mostrarAlerta(alerta, [error.message, ...sinCampo].join(' '));
            }
        });
    },
};

function sinPermiso() {
    return html`
        <h1>No tenés permiso para cargar libros</h1>
        <p>Solo el dueño de la librería puede cargar libros nuevos en el catálogo.</p>
        <p><a href="#/catalogo">Volver al catálogo</a></p>
    `;
}

function formulario(generos) {
    return html`
        <h1>Cargar un libro</h1>
        <p>Todos los campos son obligatorios. El libro aparece en el catálogo apenas lo cargás.</p>

        <form data-libro-nuevo>
            <p class="alerta-error" role="alert" hidden data-alerta></p>

            <fieldset>
                <legend>Datos del libro</legend>

                <label for="titulo">Título</label>
                <input type="text" id="titulo" name="titulo" required autocomplete="off"
                       minlength="${R.TITULO_MIN}" maxlength="${R.TITULO_MAX}">

                <label for="autor">Autor</label>
                <input type="text" id="autor" name="autor" required autocomplete="off"
                       minlength="${R.AUTOR_MIN}" maxlength="${R.AUTOR_MAX}" pattern="${R.AUTOR_PATRON}"
                       data-mensaje-patron="Usá solo letras, espacios, punto, apóstrofo y guion."
                       aria-describedby="ayuda-autor">
                <p class="ayuda-campo" id="ayuda-autor">Nombre y apellido. Solo letras, espacios, punto, apóstrofo y guion.</p>

                <label for="genero">Género</label>
                <input type="text" id="genero" name="genero" required autocomplete="off" list="generos"
                       minlength="${R.GENERO_MIN}" maxlength="${R.GENERO_MAX}" pattern="${R.GENERO_PATRON}"
                       data-mensaje-patron='Usá solo letras, espacios, "/" y guion.'
                       aria-describedby="ayuda-genero">
                <datalist id="generos">
                    ${generos.map((genero) => html`<option value="${genero}"></option>`)}
                </datalist>
                <p class="ayuda-campo" id="ayuda-genero">Elegí uno de los sugeridos o escribí otro. Para dos géneros: Novela / Suspenso.</p>

                <label for="precio">Precio en pesos</label>
                <input type="number" id="precio" name="precio" required inputmode="numeric"
                       min="${R.PRECIO_MIN}" max="${R.PRECIO_MAX}" step="1"
                       aria-describedby="ayuda-precio">
                <p class="ayuda-campo" id="ayuda-precio">Número entero, sin puntos: entre ${dinero(R.PRECIO_MIN)} y ${dinero(R.PRECIO_MAX)}.</p>
            </fieldset>

            <fieldset>
                <legend>Descripción</legend>

                <label for="resumen">Resumen</label>
                <textarea id="resumen" name="resumen" rows="3" required data-contador
                          minlength="${R.RESUMEN_MIN}" maxlength="${R.RESUMEN_MAX}"
                          aria-describedby="ayuda-resumen"></textarea>
                <p class="ayuda-campo" id="ayuda-resumen">Una o dos oraciones. Se muestra debajo del título, en la página del libro.</p>

                <label for="sinopsis">Sinopsis</label>
                <textarea id="sinopsis" name="sinopsis" rows="8" required data-contador
                          minlength="${R.SINOPSIS_MIN}" maxlength="${R.SINOPSIS_MAX}"></textarea>
            </fieldset>

            <button type="submit">Cargar libro</button>
        </form>
    `;
}
