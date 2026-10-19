/**
 * Configuración del frontend.
 *
 * URL base de la API (backend PHP). Se usa el mismo host con el que se abrió el sitio
 * (localhost o 127.0.0.1) y el puerto 8000: así frontend y API son el mismo "sitio"
 * para el navegador y la cookie de sesión (carrito) viaja en cada petición.
 * Al publicar el sitio, reemplazar por la URL real de la API.
 */
export const API_URL = `${location.protocol}//${location.hostname}:8000/api`;

// Nombre del sitio, para el título de la pestaña.
export const NOMBRE_SITIO = 'PAWPrints';
