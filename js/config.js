/**
 * Configuración del frontend.
 *
 * URL base de la API (backend PHP), según dónde se esté ejecutando el sitio:
 *
 * - Desarrollo (localhost / 127.0.0.1): la API corre aparte, en el puerto 8000 del mismo host.
 *   Front (puerto 5501) y API (8000) son el mismo "sitio" para el navegador, así que las
 *   cookies (sesión, token) viajan en cada petición.
 *
 * - Producción (Vercel): '/api', en el mismo dominio que el front. Vercel reenvía esas
 *   peticiones al backend en Render (ver vercel.json). Así las cookies son del propio sitio
 *   y no "de terceros", que muchos navegadores bloquean.
 */
const ES_DESARROLLO = ['localhost', '127.0.0.1'].includes(location.hostname);

export const API_URL = ES_DESARROLLO ? `${location.protocol}//${location.hostname}:8000/api` : '/api';

// Nombre del sitio, para el título de la pestaña.
export const NOMBRE_SITIO = 'PAWPrints';
