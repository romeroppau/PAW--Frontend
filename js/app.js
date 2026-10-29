import { Router } from './router.js';
import { rutas } from './rutas.js';
import { noEncontrada, error } from './vistas/errores.js';
import { obtenerCarrito } from './carrito.js';
import { cerrarSesion, sesionInicial } from './sesion.js';

/**
 * Punto de entrada del SPA.
 * El header, el menú y el footer están fijos en index.html; el router cambia el contenido de <main>.
 */
const router = new Router(document.querySelector('#app'), rutas, { noEncontrada, error });

// Alto del header fijo, en la variable CSS --alto-header (la usa scroll-padding-top en style.css).
// Se mide acá porque cambia según el ancho de pantalla: el menú ocupa más o menos líneas.
const header = document.querySelector('body > header');
new ResizeObserver(() => {
    document.documentElement.style.setProperty('--alto-header', `${header.offsetHeight}px`);
}).observe(header);

// Cantidad de ejemplares en el carrito, junto al enlace del menú.
const contador = document.querySelector('[data-carrito-cantidad]');
document.addEventListener('carrito:cambio', ({ detail: carrito }) => {
    contador.textContent = carrito.count > 0 ? ` (${carrito.count})` : '';
});

// Menú según la sesión: "Iniciar sesión / Registrarse" o "Hola, usuario / Cerrar sesión".
document.addEventListener('sesion:cambio', ({ detail: usuario }) => {
    document.querySelectorAll('[data-solo-invitado]').forEach((el) => { el.hidden = usuario !== null; });
    document.querySelectorAll('[data-solo-usuario]').forEach((el) => { el.hidden = usuario === null; });
    // textContent: el nombre nunca se interpreta como HTML.
    document.querySelector('[data-nombre-usuario]').textContent = usuario?.username ?? '';

    // El carrito es de cada usuario: con sesión se muestra su cantidad; sin sesión, nada.
    contador.textContent = '';
    if (usuario) {
        obtenerCarrito().catch(() => {
            // Si la API no responde, el menú queda sin contador; la vista actual muestra el error si lo necesita.
        });
    }
});
sesionInicial();

document.querySelector('[data-cerrar-sesion]').addEventListener('click', async (evento) => {
    const boton = evento.currentTarget;
    boton.disabled = true;
    try {
        await cerrarSesion();
        router.navegar('/');
    } catch (error) {
        window.alert(error.message); // ej. la API no responde: la sesión sigue abierta
    } finally {
        boton.disabled = false;
    }
});

// Buscador del menú: lleva al catálogo con la búsqueda en la URL.
document.querySelector('[data-buscador]').addEventListener('submit', (evento) => {
    evento.preventDefault();
    const q = evento.currentTarget.elements.q.value.trim();
    router.navegar(`/catalogo?${new URLSearchParams({ q })}`);
});

document.querySelector('[data-anio]').textContent = new Date().getFullYear();

router.iniciar();
