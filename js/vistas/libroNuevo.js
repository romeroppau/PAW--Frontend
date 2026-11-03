import { api } from '../api.js';
import { exigirSesion, rutaDeLogin } from '../carrito.js';
import { conBotonDeshabilitado, datosDelFormulario, mostrarAlerta } from '../formularios.js';
import { dinero, html } from '../html.js';
import { Validador } from '../lib/validador.js';
import { ZonaImagen } from '../lib/zonaImagen.js';
import { esDuenio, sesionVencida } from '../sesion.js';
import { LIBRO as R, TAPA } from '../validaciones.js';

/**
 * Cargar un libro nuevo (#/libros/nuevo). Solo el dueño de la librería.
 * - Sin sesión: lleva a iniciar sesión (y después vuelve acá).
 * - Cliente: muestra que no tiene permiso (la API también lo rechaza con 403: ocultar el formulario
 *   es solo para no ofrecer algo que no puede usar).
 * - Dueño: formulario -> POST /api/libros -> detalle del libro nuevo.
 *
 * Validación en línea con js/lib/validador.js (igual en todos los navegadores). Las reglas salen
 * de js/validaciones.js, que replica las de App\Models\Book. La API valida todo de nuevo.
 *
 * Tapa (opcional): se arrastra y suelta, o se elige con el selector de archivos (js/lib/zonaImagen.js).
 * Viaja dentro del mismo JSON, como data URL: la API solo acepta JSON (protección CSRF).
 */
export default {
    titulo: ({ permitido }) => (permitido ? 'Cargar un libro' : 'Sin permiso'),
    estilos: ['css/lib/validador.css', 'css/lib/zonaImagen.css', 'css/paginas/libroNuevo.css'],

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

        // La revisión de la imagen (tipo, peso, medidas) es asíncrona: cuando termina, el validador
        // muestra o quita el error en el campo, como con los demás.
        const tapa = new ZonaImagen(form.elements.tapa, {
            tipos: TAPA.TIPOS,
            maxBytes: TAPA.MAX_BYTES,
            minLado: TAPA.MIN_LADO,
            maxLado: TAPA.MAX_LADO,
            alCambiar: () => validador.revisar('tapa'),
        });
        validador.regla('tapa', () => tapa.error);

        form.addEventListener('submit', async (evento) => {
            evento.preventDefault();
            mostrarAlerta(alerta, '');
            await tapa.listo; // si se acaba de elegir la imagen, que termine de revisarse
            if (!validador.validar()) return; // muestra los errores y enfoca el primero

            // FormData trae la tapa como archivo (File), que no se puede pasar a JSON: va aparte, como data URL.
            const { tapa: _archivo, ...datos } = datosDelFormulario(form);
            try {
                const { data: libro } = await conBotonDeshabilitado(form.querySelector('button[type="submit"]'), async () => {
                    const imagen = await tapa.dataUrl();
                    return api('/libros', {
                        method: 'POST',
                        body: { ...datos, precio: Number(datos.precio), ...(imagen && { tapa: imagen }) },
                    });
                });
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
                // 422: errores de cada campo (ej. "Ya existe un libro con ese título y autor", o la tapa).
                // 503: no se pudo guardar la tapa (el libro no se creó: se puede volver a intentar).
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
        <p>Todos los campos son obligatorios, salvo la tapa. El libro aparece en el catálogo apenas lo cargás.</p>

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

            <fieldset>
                <legend>Tapa (opcional)</legend>
                <p class="ayuda-campo" id="ayuda-tapa">
                    JPG, PNG o WebP, de hasta ${TAPA.MAX_BYTES / 1024 / 1024} MB y de al menos ${TAPA.MIN_LADO} × ${TAPA.MIN_LADO} píxeles.
                    Sin tapa, el libro se muestra con una imagen genérica.
                </p>

                <!-- La zona es el label del campo: se suelta la imagen ahí, o se hace clic (o Enter con el
                     teclado) para abrir el selector de archivos. El campo queda oculto a la vista, pero no
                     para el teclado ni para los lectores de pantalla. -->
                <input type="file" id="tapa" name="tapa" class="zona-imagen__campo"
                       accept="${TAPA.TIPOS.join(',')}" aria-describedby="ayuda-tapa">
                <label for="tapa" class="zona-imagen" data-junto-al-campo>
                    <span class="zona-imagen__puntero">Arrastrá la imagen acá o <span class="zona-imagen__accion">elegí un archivo</span></span>
                    <span class="zona-imagen__tactil"><span class="zona-imagen__accion">Tocá para elegir una imagen</span></span>
                </label>

                <figure class="vista-previa" hidden data-vista-previa>
                    <img src="" alt="Vista previa de la tapa elegida">
                    <figcaption></figcaption>
                </figure>
                <button type="button" class="quitar-imagen" hidden data-quitar-imagen>Quitar imagen</button>
                <p class="solo-lectores" role="status" data-estado-imagen></p>
            </fieldset>

            <button type="submit">Cargar libro</button>
        </form>
    `;
}
