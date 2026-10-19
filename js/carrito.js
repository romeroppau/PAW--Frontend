import { api } from './api.js';

/**
 * Operaciones del carrito. El carrito vive en el servidor (sesión de PHP);
 * cada operación devuelve el carrito actualizado:
 *   { items: [{ book, quantity, subtotal }], total, count, max_quantity }
 *
 * Después de cada operación se dispara el evento 'carrito:cambio' en document,
 * así el menú actualiza la cantidad sin que cada vista tenga que acordarse.
 */

function avisar(respuesta) {
    const carrito = respuesta.data;
    document.dispatchEvent(new CustomEvent('carrito:cambio', { detail: carrito }));
    return carrito;
}

const item = (slug) => `/carrito/items/${encodeURIComponent(slug)}`;

export const obtenerCarrito = async () => avisar(await api('/carrito'));

export const agregarAlCarrito = async (slug, cantidad = 1) =>
    avisar(await api('/carrito/items', { method: 'POST', body: { libro: slug, cantidad } }));

export const actualizarCantidad = async (slug, cantidad) =>
    avisar(await api(item(slug), { method: 'PATCH', body: { cantidad } }));

export const quitarDelCarrito = async (slug) =>
    avisar(await api(item(slug), { method: 'DELETE' }));
