import { api } from '../api.js';
import { exigirSesion, rutaDeLogin } from '../carrito.js';
import { conBotonDeshabilitado, datosDelFormulario, mostrarAlerta } from '../formularios.js';
import { dinero, html, urlTapa } from '../html.js';
import { Validador } from '../lib/validador.js';
import { ZonaImagen } from '../lib/zonaImagen.js';
import { esDuenio, sesionVencida } from '../sesion.js';
import { LIBRO as R, TAPA } from '../validaciones.js';

/**
 * Formulario de un libro, para cargarlo o editarlo. Solo el dueño de la librería.
 * - #/libros/nuevo            -> carga un libro nuevo   (POST /api/libros)
 * - #/libros/{slug}/editar    -> edita uno que ya existe (PATCH /api/libros/{slug}), con los datos actuales
 *
 * - Sin sesión: lleva a iniciar sesión (y después vuelve acá).
 * - Cliente: muestra que no tiene permiso (la API también lo rechaza con 403: ocultar el formulario
 *   es solo para no ofrecer algo que no puede usar).
 * - Dueño: formulario -> detalle del libro, con un aviso de que se guardó.
 *
 * Validación en línea con js/lib/validador.js (igual en todos los navegadores). Las reglas salen
 * de js/validaciones.js, que replica las de App\Models\Book. La API valida todo de nuevo.
 *
 * Tapa (opcional): se arrastra y suelta, o se elige con el selector de archivos (js/lib/zonaImagen.js).
 * Viaja dentro del mismo JSON, como data URL: la API solo acepta JSON (protección CSRF).
 * Al editar: si no se toca, se mantiene; se puede reemplazar o quitar.
 */
export default {
    titulo: ({ permitido, libro }) => {
        if (!permitido) return 'Sin permiso';
        return libro ? `Editar «${libro.title}»` : 'Cargar un libro';
    },
    estilos: ['css/lib/validador.css', 'css/lib/zonaImagen.css', 'css/paginas/libroFormulario.css'],

    cargar: ({ params }) => exigirSesion(rutaDelFormulario(params.slug), async () => {
        if (!esDuenio()) {
            return { permitido: false, editando: params.slug !== undefined };
        }
        // Géneros que ya usa el catálogo, como sugerencias (si la API no responde, el formulario se usa
        // igual, sin sugerencias). Al editar, además, el libro: si no existe, la API responde 404 y el
        // router muestra "Página no encontrada".
        const [catalogo, libro] = await Promise.all([
            api('/libros/todos').catch(() => ({ data: [] })),
            params.slug ? api(`/libros/${encodeURIComponent(params.slug)}`).then((r) => r.data) : null,
        ]);
        const generos = [...new Set(catalogo.data.map((l) => l.genre))].sort((a, b) => a.localeCompare(b, 'es'));
        return { permitido: true, generos, libro };
    }),

    render: ({ permitido, editando, generos, libro }) =>
        (permitido ? formulario(generos, libro) : sinPermiso(editando)),

    montar(main, { permitido, libro }, { navegar, recargar }) {
        if (!permitido) return;

        const form = main.querySelector('[data-libro]');
        const alerta = main.querySelector('[data-alerta]');
        const validador = new Validador(form);

        // La revisión de la imagen (tipo, peso, medidas) es asíncrona: cuando termina, el validador
        // muestra o quita el error en el campo, como con los demás.
        const tapa = new ZonaImagen(form.elements.tapa, {
            tipos: TAPA.TIPOS,
            maxBytes: TAPA.MAX_BYTES,
            minLado: TAPA.MIN_LADO,
            maxLado: TAPA.MAX_LADO,
            // Al editar, la tapa que ya tiene el libro (si tiene).
            actual: libro?.cover ? { url: urlTapa(libro), descripcion: 'Tapa actual' } : null,
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
            const cuerpo = { ...datos, precio: Number(datos.precio) };
            try {
                const { data: guardado } = await conBotonDeshabilitado(form.querySelector('button[type="submit"]'), async () => {
                    // La tapa: una nueva va como data URL; al editar, null la quita y sin el campo se mantiene.
                    if (tapa.cambio() === 'nueva') cuerpo.tapa = await tapa.dataUrl();
                    if (tapa.cambio() === 'quitada') cuerpo.tapa = null;

                    return libro
                        ? api(`/libros/${encodeURIComponent(libro.slug)}`, { method: 'PATCH', body: cuerpo })
                        : api('/libros', { method: 'POST', body: cuerpo });
                });
                navegar(`/catalogo/${encodeURIComponent(guardado.slug)}?${libro ? 'editado' : 'cargado'}=1`);
            } catch (error) {
                if (error.status === 401) {
                    // La sesión venció mientras completaba el formulario.
                    sesionVencida();
                    navegar(rutaDeLogin(rutaDelFormulario(libro?.slug)));
                    return;
                }
                if (error.status === 403 || error.status === 404) {
                    recargar(); // ya no es el dueño ("sin permiso"), o el libro ya no existe ("no encontrada")
                    return;
                }
                // 422: errores de cada campo (ej. "Ya existe un libro con ese título y autor", o la tapa).
                // 503: no se pudo guardar la tapa (el libro no se guardó: se puede volver a intentar).
                const sinCampo = validador.mostrarErrores(error.campos ?? {});
                mostrarAlerta(alerta, [error.message, ...sinCampo].join(' '));
            }
        });
    },
};

// Ruta de este formulario (para volver después de iniciar sesión).
function rutaDelFormulario(slug) {
    return slug ? `/libros/${slug}/editar` : '/libros/nuevo';
}

function sinPermiso(editando) {
    return html`
        <h1>No tenés permiso para ${editando ? 'editar' : 'cargar'} libros</h1>
        <p>Solo el dueño de la librería puede cargar y editar los libros del catálogo.</p>
        <p><a href="#/catalogo">Volver al catálogo</a></p>
    `;
}

/** @param {object|null} libro  al editar, el libro con sus datos actuales; al cargar, null */
function formulario(generos, libro) {
    // Precio: el catálogo base puede tener centavos (ej. 30499.0); el formulario pide un entero.
    const precio = libro ? Math.round(libro.price) : '';
    return html`
        ${libro ? html`
            <h1>Editar libro</h1>
            <p>
                Estás editando <a href="#/catalogo/${encodeURIComponent(libro.slug)}">«${libro.title}»</a>.
                Todos los campos son obligatorios, salvo la tapa. Los cambios se ven en el catálogo apenas los guardás.
            </p>
        ` : html`
            <h1>Cargar un libro</h1>
            <p>Todos los campos son obligatorios, salvo la tapa. El libro aparece en el catálogo apenas lo cargás.</p>
        `}

        <form data-libro>
            <p class="alerta-error" role="alert" hidden data-alerta></p>

            <fieldset>
                <legend>Datos del libro</legend>

                <label for="titulo">Título</label>
                <input type="text" id="titulo" name="titulo" required autocomplete="off"
                       minlength="${R.TITULO_MIN}" maxlength="${R.TITULO_MAX}" value="${libro?.title ?? ''}">

                <label for="autor">Autor</label>
                <input type="text" id="autor" name="autor" required autocomplete="off"
                       minlength="${R.AUTOR_MIN}" maxlength="${R.AUTOR_MAX}" pattern="${R.AUTOR_PATRON}"
                       data-mensaje-patron="Usá solo letras, espacios, punto, apóstrofo y guion."
                       aria-describedby="ayuda-autor" value="${libro?.author ?? ''}">
                <p class="ayuda-campo" id="ayuda-autor">Nombre y apellido. Solo letras, espacios, punto, apóstrofo y guion.</p>

                <label for="genero">Género</label>
                <input type="text" id="genero" name="genero" required autocomplete="off" list="generos"
                       minlength="${R.GENERO_MIN}" maxlength="${R.GENERO_MAX}" pattern="${R.GENERO_PATRON}"
                       data-mensaje-patron='Usá solo letras, espacios, "/" y guion.'
                       aria-describedby="ayuda-genero" value="${libro?.genre ?? ''}">
                <datalist id="generos">
                    ${generos.map((genero) => html`<option value="${genero}"></option>`)}
                </datalist>
                <p class="ayuda-campo" id="ayuda-genero">Elegí uno de los sugeridos o escribí otro. Para dos géneros: Novela / Suspenso.</p>

                <label for="precio">Precio en pesos</label>
                <input type="number" id="precio" name="precio" required inputmode="numeric"
                       min="${R.PRECIO_MIN}" max="${R.PRECIO_MAX}" step="1"
                       aria-describedby="ayuda-precio" value="${precio}">
                <p class="ayuda-campo" id="ayuda-precio">Número entero, sin puntos: entre ${dinero(R.PRECIO_MIN)} y ${dinero(R.PRECIO_MAX)}.</p>
            </fieldset>

            <fieldset>
                <legend>Descripción</legend>

                <label for="resumen">Resumen</label>
                <textarea id="resumen" name="resumen" rows="3" required data-contador
                          minlength="${R.RESUMEN_MIN}" maxlength="${R.RESUMEN_MAX}"
                          aria-describedby="ayuda-resumen">${libro?.summary ?? ''}</textarea>
                <p class="ayuda-campo" id="ayuda-resumen">Una o dos oraciones. Se muestra debajo del título, en la página del libro.</p>

                <label for="sinopsis">Sinopsis</label>
                <textarea id="sinopsis" name="sinopsis" rows="8" required data-contador
                          minlength="${R.SINOPSIS_MIN}" maxlength="${R.SINOPSIS_MAX}">${libro?.synopsis ?? ''}</textarea>
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
                    <span class="zona-imagen__puntero">Arrastrá ${libro ? 'una imagen nueva' : 'la imagen'} acá o <span class="zona-imagen__accion">elegí un archivo</span></span>
                    <span class="zona-imagen__tactil"><span class="zona-imagen__accion">Tocá para elegir una imagen</span></span>
                </label>

                <figure class="vista-previa" hidden data-vista-previa>
                    <img src="" alt="Vista previa de la tapa">
                    <figcaption></figcaption>
                </figure>
                <button type="button" class="quitar-imagen" hidden data-quitar-imagen>Quitar imagen</button>
                <p class="solo-lectores" role="status" data-estado-imagen></p>
            </fieldset>

            <button type="submit">${libro ? 'Guardar cambios' : 'Cargar libro'}</button>
            ${libro && html`<p class="cancelar"><a href="#/catalogo/${encodeURIComponent(libro.slug)}">Cancelar y volver al libro</a></p>`}
        </form>
    `;
}
