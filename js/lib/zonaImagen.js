/**
 * zonaImagen.js — Elegir una imagen arrastrándola y soltándola (drag & drop) o con el selector
 * de archivos, con vista previa y validación. Sin dependencias.
 *
 * La vista escribe el HTML (así es semántico y accesible) y el componente le agrega el comportamiento:
 *
 *   <input type="file" id="tapa" name="tapa" accept="image/jpeg,image/png,image/webp" class="zona-imagen__campo">
 *   <label for="tapa" class="zona-imagen" data-junto-al-campo>Arrastrá la imagen acá o elegí un archivo</label>
 *   <figure data-vista-previa hidden><img alt="Vista previa"><figcaption></figcaption></figure>
 *   <button type="button" data-quitar-imagen hidden>Quitar imagen</button>
 *   <p class="solo-lectores" role="status" data-estado-imagen></p>
 *
 *   const zona = new ZonaImagen(input, { tipos, maxBytes, minLado, maxLado, alCambiar });
 *   zona.error          // mensaje de error de la imagen elegida, o null
 *   await zona.listo    // termina cuando se revisó la última imagen elegida
 *   await zona.dataUrl()  // la imagen como "data:image/...;base64,..." (null si no hay)
 *
 * - La zona es el <label> del campo: hacer clic (o tocarla en el celular) abre el selector de
 *   archivos del sistema, y con el teclado se llega al campo con Tab y se abre con Enter o Espacio.
 *   Arrastrar es una forma más de elegir, no la única: no todos pueden arrastrar (teclado,
 *   lector de pantalla, pantallas táctiles).
 * - Al soltar, el archivo se pasa al <input type="file">: el formulario tiene un solo lugar de
 *   donde leerlo, se haya elegido como se haya elegido.
 * - Revisa el tipo, el peso y las medidas reales (las lee al abrir la imagen). Los mensajes son
 *   los mismos que los de la API (App\Services\Covers\CoverImage), que valida todo de nuevo.
 * - alCambiar() se llama cada vez que cambia la imagen o su revisión (ej. para que js/lib/validador.js
 *   muestre el error en el campo).
 *
 * Los estilos están en css/lib/zonaImagen.css.
 */

const NOMBRES_TIPOS = { 'image/jpeg': 'JPG', 'image/png': 'PNG', 'image/webp': 'WebP', 'image/gif': 'GIF' };

export class ZonaImagen {
    /**
     * @param {HTMLInputElement} input  el <input type="file">
     * @param {{tipos: string[], maxBytes: number, minLado: number, maxLado: number, alCambiar?: () => void}} opciones
     */
    constructor(input, { tipos, maxBytes, minLado, maxLado, alCambiar = () => {} }) {
        this.input = input;
        this.opciones = { tipos, maxBytes, minLado, maxLado };
        this.alCambiar = alCambiar;
        this.error = null;
        this.listo = Promise.resolve();
        this.urlVistaPrevia = null;
        this.turno = 0; // si se eligen dos imágenes seguidas, la revisión de la primera se descarta

        const grupo = input.closest('fieldset') ?? input.form;
        this.zona = input.labels[0];
        this.vistaPrevia = grupo.querySelector('[data-vista-previa]');
        this.botonQuitar = grupo.querySelector('[data-quitar-imagen]');
        this.estado = grupo.querySelector('[data-estado-imagen]');

        input.addEventListener('change', () => this.elegir(input.files[0] ?? null));
        this.botonQuitar.addEventListener('click', () => {
            this.quitar();
            this.anunciar('Se quitó la imagen.');
            input.focus(); // el botón se oculta: el foco vuelve a la zona
        });

        // Arrastrar y soltar sobre la zona.
        // dragover tiene que cancelarse (preventDefault) para que el navegador permita soltar ahí.
        this.zona.addEventListener('dragenter', (evento) => this.arrastrando(evento, true));
        this.zona.addEventListener('dragover', (evento) => this.arrastrando(evento, true));
        this.zona.addEventListener('dragleave', (evento) => {
            // dragleave también ocurre al pasar sobre un elemento de adentro de la zona: solo cuenta al salir.
            if (!this.zona.contains(evento.relatedTarget)) this.arrastrando(evento, false);
        });
        this.zona.addEventListener('drop', (evento) => {
            if (!traeArchivos(evento)) return;
            evento.preventDefault(); // si no, el navegador abre la imagen y se pierde el formulario
            this.arrastrando(evento, false);
            const archivo = evento.dataTransfer.files[0];
            if (!archivo) return;
            // El archivo pasa al <input type="file">, como si se hubiera elegido con el selector.
            // (Si se sueltan varios, se usa el primero: el campo admite uno.)
            const transferencia = new DataTransfer();
            transferencia.items.add(archivo);
            this.input.files = transferencia.files;
            this.elegir(archivo);
        });

        protegerPagina();
    }

    /** La imagen elegida como data URL (lo que recibe la API), o null si no hay una. */
    dataUrl() {
        const archivo = this.input.files[0];
        if (!archivo) return Promise.resolve(null);
        return new Promise((resolver, rechazar) => {
            const lector = new FileReader();
            lector.addEventListener('load', () => resolver(lector.result));
            lector.addEventListener('error', () => rechazar(new Error('No se pudo leer la imagen.')));
            lector.readAsDataURL(archivo);
        });
    }

    /** Vuelve al estado inicial: sin imagen. */
    quitar() {
        this.input.value = '';
        this.elegir(null);
    }

    // ─── Internos ─────────────────────────────────────────────────────────────────────────────

    arrastrando(evento, activo) {
        if (!traeArchivos(evento)) return; // ej. un texto o un enlace arrastrado: no se puede soltar acá
        evento.preventDefault();
        this.zona.classList.toggle('zona-imagen--arrastrando', activo);
    }

    elegir(archivo) {
        const turno = ++this.turno;
        this.mostrarVistaPrevia(null);
        this.botonQuitar.hidden = archivo === null;
        this.error = null;

        if (!archivo) {
            this.listo = Promise.resolve();
            this.alCambiar();
            return;
        }

        this.listo = this.revisar(archivo).then(({ error, ancho, alto, url }) => {
            if (turno !== this.turno) {
                URL.revokeObjectURL(url); // ya se eligió otra imagen
                return;
            }
            this.error = error;
            if (error) {
                URL.revokeObjectURL(url);
                this.anunciar('');
            } else {
                this.mostrarVistaPrevia(url, `${archivo.name} · ${peso(archivo.size)} · ${ancho} × ${alto} px`);
                this.anunciar(`Imagen elegida: ${archivo.name}, ${ancho} por ${alto} píxeles.`);
            }
            this.alCambiar();
        });
        this.alCambiar();
    }

    // Tipo y peso (sin abrir el archivo); después, las medidas (abriéndolo como imagen).
    async revisar(archivo) {
        const { tipos, maxBytes, minLado, maxLado } = this.opciones;
        if (!tipos.includes(archivo.type)) {
            return { error: `Tiene que ser una imagen ${listaTipos(tipos)}.` };
        }
        if (archivo.size > maxBytes) {
            return { error: `La imagen pesa más de ${peso(maxBytes)}.` };
        }

        const url = URL.createObjectURL(archivo);
        const imagen = new Image();
        imagen.src = url;
        try {
            await imagen.decode(); // falla si el archivo no es realmente una imagen (ej. un .png renombrado)
        } catch {
            return { error: 'El archivo no es una imagen válida.', url };
        }

        const ancho = imagen.naturalWidth;
        const alto = imagen.naturalHeight;
        if (ancho < minLado || alto < minLado) {
            return { error: `La imagen es muy chica: tiene que medir al menos ${minLado} × ${minLado} píxeles.`, url };
        }
        if (ancho > maxLado || alto > maxLado) {
            return { error: `La imagen es muy grande: puede medir hasta ${maxLado} × ${maxLado} píxeles.`, url };
        }
        return { error: null, ancho, alto, url };
    }

    mostrarVistaPrevia(url, descripcion = '') {
        if (this.urlVistaPrevia) URL.revokeObjectURL(this.urlVistaPrevia); // libera la imagen anterior de la memoria
        this.urlVistaPrevia = url;
        this.vistaPrevia.hidden = url === null;
        this.vistaPrevia.querySelector('img').src = url ?? '';
        this.vistaPrevia.querySelector('figcaption').textContent = descripcion; // textContent: el nombre no es HTML
    }

    // Para lectores de pantalla: la vista previa es visual; esto la anuncia en palabras.
    anunciar(mensaje) {
        if (this.estado) this.estado.textContent = mensaje;
    }
}

// true si lo que se arrastra son archivos (y no texto, un enlace o una imagen de la misma página).
function traeArchivos(evento) {
    return [...(evento.dataTransfer?.types ?? [])].includes('Files');
}

// Si se suelta un archivo fuera de la zona, el navegador lo abriría en lugar del sitio y se perdería
// lo escrito en el formulario. Se evita una sola vez para toda la página.
let paginaProtegida = false;
function protegerPagina() {
    if (paginaProtegida) return;
    paginaProtegida = true;
    for (const tipo of ['dragover', 'drop']) {
        window.addEventListener(tipo, (evento) => {
            if (traeArchivos(evento)) evento.preventDefault();
        });
    }
}

// ['image/jpeg', 'image/png', 'image/webp'] -> "JPG, PNG o WebP"
function listaTipos(tipos) {
    const nombres = tipos.map((tipo) => NOMBRES_TIPOS[tipo] ?? tipo);
    return nombres.length > 1 ? `${nombres.slice(0, -1).join(', ')} o ${nombres.at(-1)}` : nombres[0];
}

// 348160 -> "340 KB"; 2097152 -> "2 MB"
function peso(bytes) {
    return bytes >= 1024 * 1024
        ? `${(bytes / 1024 / 1024).toLocaleString('es-AR', { maximumFractionDigits: 1 })} MB`
        : `${Math.ceil(bytes / 1024)} KB`;
}
