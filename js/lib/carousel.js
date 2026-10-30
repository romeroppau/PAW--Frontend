/**
 * carousel.js — Librería de carousel de imágenes, sin dependencias.
 *
 * Convierte el contenido de un contenedor en un carousel:
 *
 *   import { Carousel } from './lib/carousel.js';
 *   new Carousel(document.querySelector('.mi-contenedor'));
 *
 * Recibe UN solo parámetro: el contenedor. Cada hijo directo del contenedor es una diapositiva
 * y tiene que llevar una <img> (puede estar dentro de un <a> o un <figure>, y tener <figcaption>):
 *
 *   <div data-efecto="fade">
 *     <figure><a href="#/catalogo/el-aleph"><img src="a.jpg" alt="Tapa de El Aleph"></a>
 *             <figcaption>El Aleph — Borges</figcaption></figure>
 *     <img src="b.jpg" alt="Tapa de Ficciones">
 *   </div>
 *
 * Configuración (atributos data-* del contenedor, porque la librería no recibe otros parámetros):
 *   data-efecto      slide | fade | zoom | flip | aleatorio   (por defecto: slide)
 *   data-intervalo   milisegundos entre diapositivas           (por defecto: 4000, mínimo 1500)
 *   data-autoplay    "false" para no avanzar sola
 *   data-miniaturas  "false" para no mostrar las miniaturas
 *   data-ratio       proporción del recuadro, por ejemplo "4/3" (por defecto: 16/9)
 *   data-etiqueta    nombre del carousel para lectores de pantalla
 *
 * Qué hace:
 *   - Descarga las imágenes mostrando una barra con el porcentaje; al llegar a 100% empieza a animarse.
 *   - 4 efectos de transición (más "aleatorio").
 *   - Se maneja con botones, miniaturas, swipe (o arrastre con el mouse) y flechas del teclado.
 *   - Botón de pantalla completa: ocupa todo el viewport y las imágenes se redimensionan para entrar.
 *   - Es responsive y respeta prefers-reduced-motion (sin animaciones ni avance automático).
 *
 * En una aplicación de una sola página: si el contenedor sale del DOM, la librería se desactiva sola
 * (lo comprueba en el siguiente evento o temporizador). También se puede llamar a destroy().
 *
 * Los estilos están en css/lib/carousel.css.
 */

const DURACION = 700; // ms de cada transición
const OPCIONES_ANIMACION = { duration: DURACION, easing: 'ease-in-out', fill: 'both' };

/**
 * Efectos de transición. Cada uno recibe la dirección (1 = hacia adelante, -1 = hacia atrás)
 * y devuelve los fotogramas de la diapositiva que sale y de la que entra (Web Animations API).
 */
const EFECTOS = {
    slide: (d) => ({
        sale: [{ transform: 'translateX(0)' }, { transform: `translateX(${-100 * d}%)` }],
        entra: [{ transform: `translateX(${100 * d}%)` }, { transform: 'translateX(0)' }],
    }),
    fade: () => ({
        sale: [{ opacity: 1 }, { opacity: 0 }],
        entra: [{ opacity: 0 }, { opacity: 1 }],
    }),
    zoom: () => ({
        sale: [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(1.35)' }],
        entra: [{ opacity: 0, transform: 'scale(.7)' }, { opacity: 1, transform: 'scale(1)' }],
    }),
    flip: (d) => ({
        // Gira la que sale hasta de canto (primera mitad) y después gira la que entra (segunda mitad).
        sale: [
            { opacity: 1, transform: 'rotateY(0deg)', offset: 0 },
            { opacity: 0, transform: `rotateY(${-90 * d}deg)`, offset: 0.5 },
            { opacity: 0, transform: `rotateY(${-90 * d}deg)`, offset: 1 },
        ],
        entra: [
            { opacity: 0, transform: `rotateY(${90 * d}deg)`, offset: 0 },
            { opacity: 0, transform: `rotateY(${90 * d}deg)`, offset: 0.5 },
            { opacity: 1, transform: 'rotateY(0deg)', offset: 1 },
        ],
    }),
};

// Un contenedor tiene una sola instancia: volver a llamar a new Carousel(contenedor) devuelve la misma.
const instancias = new WeakMap();

export class Carousel {
    /** Nombres de los efectos disponibles. */
    static efectos = Object.keys(EFECTOS);

    #raiz;
    #slides = [];
    #urls = [];
    #miniaturas = [];
    #marco;
    #escenario;
    #barra;
    #porcentaje;
    #contador;
    #botonPausa;
    #botonPantalla;
    #contenedorMiniaturas = null;

    #actual = 0;
    #listo = false;
    #ocupado = false;
    #destruido = false;
    #pausadoUsuario = false;
    #pausaTemporal = false;
    #visible = true;
    #temporizador = null;
    #enPantallaApi = false;
    #limpiezas = [];

    /** @param {HTMLElement} contenedor Elemento cuyos hijos son las diapositivas. */
    constructor(contenedor) {
        if (!(contenedor instanceof HTMLElement)) {
            throw new TypeError('Carousel: hay que pasar el elemento contenedor de las imágenes.');
        }
        if (instancias.has(contenedor)) return instancias.get(contenedor);

        this.#raiz = contenedor;
        this.#slides = [...contenedor.children].map(aDiapositiva).filter(Boolean);
        if (this.#slides.length === 0) {
            console.warn('Carousel: el contenedor no tiene imágenes.');
            return;
        }

        instancias.set(contenedor, this);
        this.#construir();
        this.#conectarEventos();
        this.#descargarImagenes();
    }

    /** Pasa a la diapositiva siguiente. */
    siguiente() {
        return this.ir(this.#actual + 1, 1);
    }

    /** Pasa a la diapositiva anterior. */
    anterior() {
        return this.ir(this.#actual - 1, -1);
    }

    /**
     * Pasa a una diapositiva con el efecto elegido.
     * @param {number} destino   Índice (desde 0). Fuera de rango, da la vuelta.
     * @param {number} [direccion] 1 adelante, -1 atrás. Si falta, se deduce del índice.
     */
    async ir(destino, direccion) {
        const n = this.#slides.length;
        if (!this.#listo || this.#ocupado || n < 2) return;
        destino = ((destino % n) + n) % n;
        if (destino === this.#actual) return;
        direccion ??= destino > this.#actual ? 1 : -1;

        const sale = this.#slides[this.#actual];
        const entra = this.#slides[destino];
        this.#ocupado = true;
        this.#actual = destino;
        this.#marcarActual();

        sale.classList.replace('is-activa', 'is-saliendo');
        entra.classList.add('is-activa');

        if (!movimientoReducido()) {
            const fotogramas = EFECTOS[this.#elegirEfecto()](direccion);
            const animaciones = [
                sale.animate(fotogramas.sale, OPCIONES_ANIMACION),
                entra.animate(fotogramas.entra, OPCIONES_ANIMACION),
            ];
            try {
                await Promise.all(animaciones.map((a) => a.finished));
            } catch {
                /* animación cancelada: se sigue igual */
            }
            animaciones.forEach((a) => a.cancel());
        }

        sale.classList.remove('is-saliendo');
        this.#ocupado = false;
        this.#sincronizarReproduccion();
    }

    /** Desactiva la librería: detiene el avance, quita los eventos y libera las imágenes descargadas. */
    destroy() {
        if (this.#destruido) return;
        this.#destruido = true;
        clearInterval(this.#temporizador);
        this.#limpiezas.forEach((limpiar) => limpiar());
        this.#salirPantalla();
        this.#urls.forEach((url) => URL.revokeObjectURL(url));
        instancias.delete(this.#raiz);
    }

    /* ───────────── Construcción ───────────── */

    #construir() {
        const raiz = this.#raiz;
        const d = raiz.dataset;
        const varias = this.#slides.length > 1;

        raiz.classList.add('cr', 'cr--cargando');
        raiz.setAttribute('role', 'region');
        raiz.setAttribute('aria-roledescription', 'carrusel');
        raiz.setAttribute('aria-label', d.etiqueta ?? 'Carrusel de imágenes');
        raiz.setAttribute('aria-busy', 'true');
        raiz.tabIndex = 0;
        if (d.ratio) raiz.style.setProperty('--cr-ratio', d.ratio);

        // Escenario: acá se apilan las diapositivas.
        this.#escenario = crear('div', 'cr__escenario');
        this.#slides.forEach((slide, i) => {
            slide.classList.add('cr__slide');
            slide.setAttribute('role', 'group');
            slide.setAttribute('aria-roledescription', 'diapositiva');
            slide.setAttribute('aria-label', `${i + 1} de ${this.#slides.length}`);
            const img = slide.querySelector('img');
            img.loading = 'eager';
            img.decoding = 'async';
            img.draggable = false;
            this.#escenario.append(slide);
        });

        // Pantalla de carga con la barra de progreso.
        const carga = crear('div', 'cr__carga');
        const textoCarga = crear('p', 'cr__texto-carga');
        textoCarga.textContent = 'Cargando imágenes…';
        this.#barra = crear('div', 'cr__barra', {
            role: 'progressbar',
            'aria-label': 'Descarga de las imágenes',
            'aria-valuemin': '0',
            'aria-valuemax': '100',
            'aria-valuenow': '0',
        });
        this.#barra.append(crear('span', 'cr__barra-relleno'));
        this.#porcentaje = crear('p', 'cr__porcentaje');
        this.#porcentaje.textContent = '0%';
        carga.append(textoCarga, this.#barra, this.#porcentaje);

        // Botones, herramientas y contador.
        const anterior = boton('cr__btn cr__btn--ant', 'Diapositiva anterior', '‹');
        const siguiente = boton('cr__btn cr__btn--sig', 'Diapositiva siguiente', '›');
        anterior.hidden = siguiente.hidden = !varias;
        anterior.addEventListener('click', () => this.anterior());
        siguiente.addEventListener('click', () => this.siguiente());

        this.#botonPausa = boton('cr__herr', 'Pausar el avance automático', '⏸');
        this.#botonPausa.setAttribute('aria-pressed', 'false');
        this.#botonPausa.hidden = !varias || d.autoplay === 'false';
        this.#botonPausa.addEventListener('click', () => this.#alternarPausa());

        this.#botonPantalla = boton('cr__herr', 'Ver en pantalla completa', '⛶');
        this.#botonPantalla.setAttribute('aria-pressed', 'false');
        this.#botonPantalla.addEventListener('click', () => this.#alternarPantalla());

        const herramientas = crear('div', 'cr__herramientas');
        herramientas.append(this.#botonPausa, this.#botonPantalla);

        this.#contador = crear('p', 'cr__contador');
        this.#contador.hidden = !varias;

        this.#marco = crear('div', 'cr__marco');
        this.#marco.append(this.#escenario, carga, anterior, siguiente, herramientas, this.#contador);
        raiz.replaceChildren(this.#marco);
    }

    #conectarEventos() {
        const raiz = this.#raiz;
        const escenario = this.#escenario;

        // Swipe (dedo) y arrastre (mouse) horizontal.
        let inicio = null;
        let arrastrado = false;
        escenario.addEventListener('pointerdown', (e) => {
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            inicio = { x: e.clientX, y: e.clientY };
            arrastrado = false;
        });
        escenario.addEventListener('pointermove', (e) => {
            if (inicio && Math.abs(e.clientX - inicio.x) > 10) arrastrado = true;
        });
        escenario.addEventListener('pointerup', (e) => {
            if (!inicio) return;
            const dx = e.clientX - inicio.x;
            const dy = e.clientY - inicio.y;
            inicio = null;
            if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
                if (dx < 0) this.siguiente();
                else this.anterior();
            }
        });
        escenario.addEventListener('pointercancel', () => { inicio = null; });
        // Si el gesto fue un arrastre, el "click" que lo sigue no debe abrir el enlace al detalle del libro.
        escenario.addEventListener('click', (e) => {
            if (!arrastrado) return;
            e.preventDefault();
            e.stopPropagation();
            arrastrado = false;
        }, true);

        // Se pausa mientras el mouse o el foco de teclado están sobre el carousel.
        raiz.addEventListener('pointerenter', () => this.#pausar(true));
        raiz.addEventListener('pointerleave', () => this.#pausar(false));
        raiz.addEventListener('focusin', (e) => {
            if (e.target.matches?.(':focus-visible')) this.#pausar(true);
        });
        raiz.addEventListener('focusout', () => this.#pausar(false));

        // Eventos globales: se registran acá y se quitan en destroy().
        const global = (objetivo, tipo, funcion) => {
            objetivo.addEventListener(tipo, funcion);
            this.#limpiezas.push(() => objetivo.removeEventListener(tipo, funcion));
        };

        global(document, 'keydown', (e) => this.#alTeclear(e));
        global(document, 'visibilitychange', () => this.#sincronizarReproduccion());
        global(document, 'fullscreenchange', () => {
            // El usuario salió de la pantalla completa del navegador (por ejemplo con Escape).
            if (!document.fullscreenElement && this.#enPantallaApi) {
                this.#enPantallaApi = false;
                this.#salirPantalla();
            }
        });

        // Solo avanza sola y responde a las flechas mientras se ve en pantalla.
        const observador = new IntersectionObserver(([entrada]) => {
            this.#visible = entrada.isIntersecting;
            this.#sincronizarReproduccion();
        }, { threshold: 0.3 });
        observador.observe(raiz);
        this.#limpiezas.push(() => observador.disconnect());
    }

    #alTeclear(e) {
        if (!this.#raiz.isConnected) { this.destroy(); return; }
        if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
        // Las flechas dentro de un campo de texto (por ejemplo el buscador) son para escribir.
        if (e.target.closest?.('input, textarea, select, [contenteditable="true"]')) return;

        const enPantalla = this.#raiz.classList.contains('cr--pantalla');
        if (e.key === 'Escape' && enPantalla) { this.#salirPantalla(); return; }
        if (!enPantalla && !this.#visible) return;

        if (e.key === 'ArrowRight') { e.preventDefault(); this.siguiente(); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); this.anterior(); }
    }

    /* ───────────── Descarga de las imágenes ───────────── */

    async #descargarImagenes() {
        const imagenes = this.#slides.map((slide) => slide.querySelector('img'));
        const avance = imagenes.map(() => 0); // fracción descargada de cada imagen (0 a 1)
        const informar = () => this.#mostrarProgreso((avance.reduce((a, b) => a + b, 0) / imagenes.length) * 100);
        const fallidas = new Set();

        await Promise.all(imagenes.map(async (img, i) => {
            try {
                const blob = await descargar(img.currentSrc || img.src, (fraccion) => {
                    avance[i] = fraccion;
                    informar();
                });
                if (this.#destruido) return;
                const url = URL.createObjectURL(blob);
                this.#urls.push(url);
                await cargarEn(img, url);
                this.#slides[i].style.setProperty('--cr-img', `url("${url}")`);
            } catch {
                fallidas.add(i);
            } finally {
                avance[i] = 1;
                informar();
            }
        }));
        if (this.#destruido) return;

        // Las imágenes que no se pudieron descargar se sacan del carousel.
        this.#slides = this.#slides.filter((slide, i) => {
            if (fallidas.has(i)) slide.remove();
            return !fallidas.has(i);
        });
        if (this.#slides.length === 0) {
            this.#porcentaje.textContent = 'No se pudieron cargar las imágenes.';
            return;
        }

        await esperar(350); // deja ver el 100% antes de empezar
        if (!this.#destruido) this.#iniciar();
    }

    #mostrarProgreso(porcentaje) {
        const p = Math.round(porcentaje);
        this.#barra.style.setProperty('--cr-progreso', `${p}%`);
        this.#barra.setAttribute('aria-valuenow', String(p));
        this.#porcentaje.textContent = `${p}%`;
    }

    /** Con el 100% descargado: arma las miniaturas, muestra la primera diapositiva y empieza a animar. */
    #iniciar() {
        const n = this.#slides.length;
        this.#slides.forEach((slide, i) => slide.setAttribute('aria-label', `${i + 1} de ${n}`));
        this.#slides[0].classList.add('is-activa');

        if (n > 1 && this.#raiz.dataset.miniaturas !== 'false') this.#crearMiniaturas();
        for (const boton of this.#marco.querySelectorAll('.cr__btn')) boton.hidden = n < 2;
        this.#contador.hidden = n < 2;
        this.#botonPausa.hidden = n < 2 || this.#raiz.dataset.autoplay === 'false';

        this.#raiz.classList.replace('cr--cargando', 'cr--lista');
        this.#raiz.setAttribute('aria-busy', 'false');
        this.#listo = true;
        this.#marcarActual();
        this.#sincronizarReproduccion();
    }

    #crearMiniaturas() {
        const contenedor = crear('div', 'cr__miniaturas');
        this.#slides.forEach((slide, i) => {
            const origen = slide.querySelector('img');
            const mini = boton('cr__mini', `Ir a la diapositiva ${i + 1}${origen.alt ? `: ${origen.alt}` : ''}`);
            const img = crear('img');
            img.src = origen.src;
            img.alt = '';
            img.draggable = false;
            mini.append(img);
            mini.addEventListener('click', () => this.ir(i));
            contenedor.append(mini);
            this.#miniaturas.push(mini);
        });
        this.#contenedorMiniaturas = contenedor;
        this.#raiz.append(contenedor);
    }

    /* ───────────── Estado visible ───────────── */

    #marcarActual() {
        this.#miniaturas.forEach((mini, i) => {
            if (i === this.#actual) mini.setAttribute('aria-current', 'true');
            else mini.removeAttribute('aria-current');
        });
        this.#contador.textContent = `${this.#actual + 1} / ${this.#slides.length}`;

        // Mantiene la miniatura activa a la vista dentro de su fila (sin mover la página).
        const mini = this.#miniaturas[this.#actual];
        const fila = this.#contenedorMiniaturas;
        if (mini && fila) {
            fila.scrollTo({ left: mini.offsetLeft - (fila.clientWidth - mini.offsetWidth) / 2, behavior: 'smooth' });
        }
    }

    #elegirEfecto() {
        const nombre = this.#raiz.dataset.efecto ?? 'slide';
        if (nombre === 'aleatorio') {
            return Carousel.efectos[Math.floor(Math.random() * Carousel.efectos.length)];
        }
        return Object.hasOwn(EFECTOS, nombre) ? nombre : 'slide';
    }

    /* ───────────── Avance automático ───────────── */

    #pausar(estado) {
        this.#pausaTemporal = estado;
        this.#sincronizarReproduccion();
    }

    #alternarPausa() {
        this.#pausadoUsuario = !this.#pausadoUsuario;
        this.#botonPausa.setAttribute('aria-pressed', String(this.#pausadoUsuario));
        this.#botonPausa.textContent = this.#pausadoUsuario ? '▶' : '⏸';
        this.#botonPausa.setAttribute(
            'aria-label',
            this.#pausadoUsuario ? 'Reanudar el avance automático' : 'Pausar el avance automático',
        );
        this.#sincronizarReproduccion();
    }

    /** Arranca o detiene el temporizador según el estado. Se llama cada vez que ese estado cambia. */
    #sincronizarReproduccion() {
        clearInterval(this.#temporizador);
        this.#temporizador = null;
        if (this.#destruido) return;

        const reproduciendo = this.#listo
            && this.#slides.length > 1
            && this.#raiz.dataset.autoplay !== 'false'
            && !movimientoReducido()
            && !this.#pausadoUsuario
            && !this.#pausaTemporal
            && this.#visible
            && !document.hidden;

        // Mientras avanza sola, los lectores de pantalla no anuncian cada cambio (pauta ARIA para carousels).
        this.#escenario.setAttribute('aria-live', reproduciendo ? 'off' : 'polite');
        if (!reproduciendo) return;

        const intervalo = Math.max(1500, Number(this.#raiz.dataset.intervalo) || 4000);
        this.#temporizador = setInterval(() => {
            if (!this.#raiz.isConnected) this.destroy();
            else this.siguiente();
        }, intervalo);
    }

    /* ───────────── Pantalla completa ───────────── */

    #alternarPantalla() {
        if (this.#raiz.classList.contains('cr--pantalla')) this.#salirPantalla();
        else this.#entrarPantalla();
    }

    /**
     * Ocupa todo el viewport con la clase .cr--pantalla (position: fixed), que funciona en cualquier navegador,
     * y además pide la pantalla completa real al navegador si la ofrece.
     */
    #entrarPantalla() {
        this.#raiz.classList.add('cr--pantalla');
        document.documentElement.classList.add('cr-bloqueado'); // sin scroll detrás
        this.#botonPantalla.setAttribute('aria-pressed', 'true');
        this.#botonPantalla.setAttribute('aria-label', 'Salir de la pantalla completa');
        this.#raiz.focus({ preventScroll: true });
        Promise.resolve(this.#raiz.requestFullscreen?.())
            .then(() => { this.#enPantallaApi = document.fullscreenElement === this.#raiz; })
            .catch(() => { /* sin pantalla completa real: queda el modo viewport */ });
    }

    #salirPantalla() {
        if (!this.#raiz.classList.contains('cr--pantalla')) return;
        this.#raiz.classList.remove('cr--pantalla');
        document.documentElement.classList.remove('cr-bloqueado');
        this.#botonPantalla.setAttribute('aria-pressed', 'false');
        this.#botonPantalla.setAttribute('aria-label', 'Ver en pantalla completa');
        if (document.fullscreenElement === this.#raiz) {
            this.#enPantallaApi = false;
            document.exitFullscreen().catch(() => {});
        }
    }
}

/* ───────────── Funciones auxiliares ───────────── */

/** Devuelve el elemento que será la diapositiva, o null si el hijo no tiene imagen. */
function aDiapositiva(hijo) {
    if (hijo instanceof HTMLImageElement) {
        const envoltorio = document.createElement('figure');
        hijo.replaceWith(envoltorio);
        envoltorio.append(hijo);
        return envoltorio;
    }
    return hijo.querySelector('img') ? hijo : null;
}

function crear(etiqueta, clase = '', atributos = {}) {
    const nodo = document.createElement(etiqueta);
    if (clase) nodo.className = clase;
    for (const [nombre, valor] of Object.entries(atributos)) nodo.setAttribute(nombre, valor);
    return nodo;
}

function boton(clase, etiqueta, texto = '') {
    const nodo = crear('button', clase, { type: 'button', 'aria-label': etiqueta });
    if (texto) nodo.textContent = texto; // el texto es un símbolo; el nombre accesible es la etiqueta
    return nodo;
}

const movimientoReducido = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const esperar = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

/**
 * Descarga una imagen avisando el avance (fracción de 0 a 1).
 * Si el servidor no informa el tamaño (Content-Length), el avance salta de 0 a 1 al terminar.
 */
async function descargar(url, alAvanzar) {
    const respuesta = await fetch(url);
    if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);

    const total = Number(respuesta.headers.get('Content-Length')) || 0;
    if (!respuesta.body || !total) return respuesta.blob();

    const lector = respuesta.body.getReader();
    const partes = [];
    let recibido = 0;
    for (;;) {
        const { done, value } = await lector.read();
        if (done) break;
        partes.push(value);
        recibido += value.length;
        alAvanzar(Math.min(recibido / total, 1));
    }
    return new Blob(partes, { type: respuesta.headers.get('Content-Type') ?? '' });
}

/** Pone una imagen ya descargada (blob:) en el <img> y espera a que esté lista. */
function cargarEn(img, url) {
    return new Promise((resolver, rechazar) => {
        img.addEventListener('load', resolver, { once: true });
        img.addEventListener('error', () => rechazar(new Error('Imagen inválida')), { once: true });
        img.removeAttribute('srcset');
        img.src = url;
    });
}

export default Carousel;