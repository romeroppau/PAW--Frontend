import { html } from '../html.js';
import { ApiError } from '../api.js';

/**
 * Vistas de error. Las usa el router:
 * - noEncontrada: ruta inexistente, o la API respondió 404 (libro o página inexistente).
 * - error: cualquier otro error (API caída, error 500, 403 sin permiso...).
 */

export const noEncontrada = {
    titulo: 'Página no encontrada',

    render: () => html`
        <div class="error-view">
            <h2>404 - Página no encontrada</h2>
            <p>Lo sentimos, la página que buscas no existe o ha sido movida.</p>
            <a href="#/" class="btn">Volver al Inicio</a>
        </div>
    `,
};

// 403: la API sabe quién es, pero no tiene permiso (ej. el dueño de la librería entrando al carrito).
const sinPermiso = (err) => err instanceof ApiError && err.status === 403;

export const error = {
    titulo: (err) => (sinPermiso(err) ? 'Sin permiso' : 'Error'),

    // Solo se muestran los mensajes de la API (ya pensados para el usuario). Un error interno
    // de JavaScript se muestra con un texto genérico: el detalle queda en la consola.
    render: (err) => html`
        <div class="error-view">
            <h2>${sinPermiso(err) ? 'No tenés permiso' : 'Ocurrió un error'}</h2>
            <p>${err instanceof ApiError ? err.message : 'Ocurrió un error inesperado. Intentá nuevamente más tarde.'}</p>
            <a href="#/" class="btn">Volver al Inicio</a>
        </div>
    `,
};
