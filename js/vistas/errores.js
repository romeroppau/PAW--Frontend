import { html } from '../html.js';
import { ApiError } from '../api.js';

/**
 * Vistas de error. Las usa el router:
 * - noEncontrada: ruta inexistente, o la API respondió 404 (libro o página inexistente).
 * - error: cualquier otro error (API caída, error 500...).
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

export const error = {
    titulo: 'Error',

    // Solo se muestran los mensajes de la API (ya pensados para el usuario). Un error interno
    // de JavaScript se muestra con un texto genérico: el detalle queda en la consola.
    render: (err) => html`
        <div class="error-view">
            <h2>Ocurrió un error</h2>
            <p>${err instanceof ApiError ? err.message : 'Ocurrió un error inesperado. Intentá nuevamente más tarde.'}</p>
            <a href="#/" class="btn">Volver al Inicio</a>
        </div>
    `,
};
