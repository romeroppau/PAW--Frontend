import { Router } from './router.js';
import { rutas } from './rutas.js';
import { noEncontrada, error } from './vistas/errores.js';
import { obtenerCarrito } from './carrito.js';

/**
 * Punto de entrada del SPA.
 * El header, el menú y el footer están fijos en index.html; el router cambia el contenido de <main>.
 */
const router = new Router(document.querySelector('#app'), rutas, { noEncontrada, error });

// Cantidad de ejemplares en el carrito, junto al enlace del menú.
const contador = document.querySelector('[data-carrito-cantidad]');
document.addEventListener('carrito:cambio', ({ detail: carrito }) => {
    contador.textContent = carrito.count > 0 ? ` (${carrito.count})` : '';
});
obtenerCarrito().catch(() => {
    // Si la API no responde, el menú queda sin contador; la vista actual muestra el error si lo necesita.
});

// Buscador del menú: lleva al catálogo con la búsqueda en la URL.
document.querySelector('[data-buscador]').addEventListener('submit', (evento) => {
    evento.preventDefault();
    const q = evento.currentTarget.elements.q.value.trim();
    router.navegar(`/catalogo?${new URLSearchParams({ q })}`);
});

document.querySelector('[data-anio]').textContent = new Date().getFullYear();

router.iniciar();
