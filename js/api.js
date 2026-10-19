import { API_URL } from './config.js';

/**
 * Error devuelto por la API (o falla de conexión).
 * - status: código HTTP (0 si no hubo respuesta).
 * - campos: mensaje de error de cada campo inválido (respuestas 422).
 */
export class ApiError extends Error {
    constructor(status, message, campos = {}) {
        super(message);
        this.status = status;
        this.campos = campos;
    }
}

/**
 * Hace una petición a la API y devuelve el JSON de la respuesta.
 *
 * - credentials: 'include' envía la cookie de sesión (la API está en otro origen).
 * - body se envía como JSON.
 * - Si la respuesta no es 2xx, lanza ApiError con el mensaje que manda la API
 *   ({"error": {"message": "...", "fields": {...}}}).
 *
 * Uso: const { data, meta } = await api('/libros?q=borges');
 *      await api('/carrito/items', { method: 'POST', body: { libro: 'rayuela' } });
 */
export async function api(ruta, { method = 'GET', body } = {}) {
    const opciones = { method, credentials: 'include', headers: { Accept: 'application/json' } };
    if (body !== undefined) {
        opciones.headers['Content-Type'] = 'application/json';
        opciones.body = JSON.stringify(body);
    }

    let respuesta;
    try {
        respuesta = await fetch(API_URL + ruta, opciones);
    } catch {
        // fetch solo falla si no hubo respuesta: servidor apagado, sin conexión o CORS rechazado.
        throw new ApiError(0, 'No pudimos conectar con el servidor. Intentá nuevamente más tarde.');
    }

    // 204 o un cuerpo que no es JSON: null.
    const datos = await respuesta.json().catch(() => null);

    if (!respuesta.ok) {
        throw new ApiError(
            respuesta.status,
            datos?.error?.message ?? 'Ocurrió un error inesperado. Intentá nuevamente más tarde.',
            datos?.error?.fields ?? {},
        );
    }
    return datos;
}

// URL absoluta de un recurso de la API (para enlaces, ej. la descarga del CSV).
export const urlApi = (ruta) => API_URL + ruta;
