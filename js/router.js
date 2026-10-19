import { NOMBRE_SITIO } from './config.js';

/**
 * Router del SPA, basado en el hash de la URL: index.html#/catalogo?q=borges
 *
 * El navegador no pide al servidor lo que va después del #: al cambiar el hash,
 * JavaScript decide qué vista mostrar dentro de <main>. Por eso el sitio funciona
 * con cualquier servidor de archivos estáticos (Live Server, Apache...) sin configuración.
 *
 * Cada vista es un objeto:
 *   {
 *     titulo:    'Catálogo' | (datos, ctx) => string,   // título de la pestaña
 *     estilos:   ['css/paginas/catalogo.css'],          // CSS propio de la vista
 *     claseMain: 'nosotros-main',                       // clase del <main> (opcional)
 *     cargar:    async (ctx) => datos,                  // pide los datos a la API (opcional)
 *     render:    (datos, ctx) => html`...`,             // devuelve el HTML de la vista
 *     montar:    (main, datos, ctx) => {},              // agrega los eventos (opcional)
 *   }
 * ctx = { params, query, ruta, navegar, recargar }
 */

/** Lanzarla desde cargar() para ir a otra ruta (ej. compra con el carrito vacío -> carrito). */
export class Redireccion {
    constructor(ruta) {
        this.ruta = ruta;
    }
}

export class Router {
    #turno = 0;
    #rutas;

    /**
     * @param {HTMLElement} contenedor  El <main> donde se muestran las vistas.
     * @param {Array<{patron: string, vista: object}>} rutas  ej. { patron: '/catalogo/:slug', vista }
     * @param {{noEncontrada: object, error: object}} vistasDeError
     */
    constructor(contenedor, rutas, vistasDeError) {
        this.contenedor = contenedor;
        this.vistasDeError = vistasDeError;
        this.#rutas = rutas.map(({ patron, vista }) => ({ regex: aRegex(patron), vista }));
    }

    iniciar() {
        window.addEventListener('hashchange', () => this.mostrar());
        this.mostrar();
    }

    navegar(ruta) {
        location.hash = '#' + ruta;
    }

    /**
     * Muestra la vista de la URL actual.
     * @param {boolean} esNavegacion false al recargar la misma vista (no mueve el scroll ni el foco).
     */
    async mostrar(esNavegacion = true) {
        // Si el usuario navega de nuevo mientras se cargan los datos de esta vista,
        // la respuesta vieja se descarta (si no, podría pisar a la vista nueva).
        const turno = ++this.#turno;
        const vigente = () => turno === this.#turno;

        const { ruta, query } = ubicacionActual();
        const coincidencia = this.#buscar(ruta);
        const ctx = {
            params: coincidencia?.params ?? {},
            query,
            ruta,
            navegar: (destino) => this.navegar(destino),
            recargar: () => this.mostrar(false),
        };

        let vista = coincidencia?.vista ?? this.vistasDeError.noEncontrada;
        let datos;

        this.contenedor.setAttribute('aria-busy', 'true');
        try {
            datos = await vista.cargar?.(ctx);
        } catch (error) {
            if (error instanceof Redireccion) {
                if (vigente()) location.replace('#' + error.ruta); // replace: "atrás" no vuelve acá
                return;
            }
            // Libro o página inexistente (404 de la API): vista 404. Otro error: vista de error.
            vista = error.status === 404 ? this.vistasDeError.noEncontrada : this.vistasDeError.error;
            datos = error;
        }
        if (!vigente()) return;

        await aplicarEstilos(vista.estilos ?? []);
        if (!vigente()) return;

        this.#pintar(vista, datos, ctx);
        this.contenedor.removeAttribute('aria-busy');
        marcarEnlaceActivo(ruta);

        if (esNavegacion) {
            window.scrollTo(0, 0);
            // Lectores de pantalla: anuncia el contenido nuevo, como al cargar una página.
            this.contenedor.focus({ preventScroll: true });
        }
    }

    #pintar(vista, datos, ctx) {
        try {
            const titulo = typeof vista.titulo === 'function' ? vista.titulo(datos, ctx) : vista.titulo;
            document.title = titulo ? `${titulo} | ${NOMBRE_SITIO}` : NOMBRE_SITIO;
            this.contenedor.className = vista.claseMain ?? '';
            this.contenedor.innerHTML = String(vista.render(datos, ctx));
            vista.montar?.(this.contenedor, datos, ctx);
        } catch (error) {
            // Error de programación en una vista: se muestra la vista de error en lugar de una página en blanco.
            console.error(error);
            const vistaError = this.vistasDeError.error;
            if (vista === vistaError) throw error;
            this.#pintar(vistaError, error, ctx);
        }
    }

    #buscar(ruta) {
        for (const { regex, vista } of this.#rutas) {
            const match = ruta.match(regex);
            if (match) {
                const params = Object.fromEntries(
                    Object.entries(match.groups ?? {}).map(([k, v]) => [k, decodeURIComponent(v)]),
                );
                return { vista, params };
            }
        }
        return null;
    }
}

// '/catalogo/:slug' -> /^\/catalogo\/(?<slug>[^/]+)$/
function aRegex(patron) {
    const regex = patron
        .split('/')
        .map((parte) => (parte.startsWith(':') ? `(?<${parte.slice(1)}>[^/]+)` : parte.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
        .join('\\/');
    return new RegExp(`^${regex}$`);
}

// '#/catalogo/?q=x' -> { ruta: '/catalogo', query: URLSearchParams('q=x') }
function ubicacionActual() {
    const hash = location.hash.slice(1) || '/';
    const [ruta, query = ''] = hash.split('?', 2);
    const sinBarraFinal = ruta.length > 1 ? ruta.replace(/\/+$/, '') : ruta;
    return { ruta: sinBarraFinal || '/', query: new URLSearchParams(query) };
}

/**
 * Carga el CSS propio de la vista y quita el de la vista anterior.
 * Hace falta porque cada CSS de página da estilos distintos a <main>: si quedaran
 * todos cargados a la vez, se pisarían entre sí.
 * Espera a que el CSS nuevo cargue antes de mostrar la vista (evita ver la página sin estilos).
 */
async function aplicarEstilos(hrefs) {
    const actuales = [...document.querySelectorAll('link[data-estilo-vista]')];
    if (actuales.map((l) => l.getAttribute('href')).join() === hrefs.join()) return;

    const nuevos = hrefs.map((href) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.dataset.estiloVista = '';
        return link;
    });

    const cargados = nuevos.map((link) => new Promise((resolver) => {
        link.addEventListener('load', resolver, { once: true });
        link.addEventListener('error', resolver, { once: true }); // un CSS que falta no bloquea la vista
    }));
    document.head.append(...nuevos);
    await Promise.all(cargados);

    actuales.forEach((link) => link.remove());
}

// Marca en el menú el enlace de la sección actual (aria-current="page").
function marcarEnlaceActivo(ruta) {
    document.querySelectorAll('.nav-principal a[href^="#/"]').forEach((enlace) => {
        if (enlace.getAttribute('href') === '#' + ruta) {
            enlace.setAttribute('aria-current', 'page');
        } else {
            enlace.removeAttribute('aria-current');
        }
    });
}
