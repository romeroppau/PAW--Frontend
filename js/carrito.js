import { api } from './api.js';
import { Redireccion } from './router.js';
import { sesionInicial, sesionVencida, usuario } from './sesion.js';

/**
 * Operaciones del carrito. El carrito vive en el servidor (sesión de PHP) y es de cada usuario:
 * todas las operaciones requieren la sesión iniciada (la API responde 401 si no hay).
 * Cada operación devuelve el carrito actualizado:
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

/*
 * Libro pendiente de agregar: si alguien sin sesión toca "Añadir al carrito", se recuerda el libro,
 * se lo lleva a iniciar sesión y, al volver al carrito, se agrega solo.
 * sessionStorage: dura mientras la pestaña esté abierta. try/catch porque el navegador puede
 * bloquearlo (ej. algunos modos privados): en ese caso solo se pierde el agregado automático.
 */
const PENDIENTE = 'carrito:libroPendiente';

export function hayLibroPendiente() {
    try {
        return sessionStorage.getItem(PENDIENTE) !== null;
    } catch {
        return false;
    }
}

/** Devuelve el libro pendiente (y lo olvida), o null. */
export function tomarLibroPendiente() {
    try {
        const slug = sessionStorage.getItem(PENDIENTE);
        sessionStorage.removeItem(PENDIENTE);
        return slug;
    } catch {
        return null;
    }
}

/** Ruta del login que, después de entrar, vuelve a esta ruta. */
export const rutaDeLogin = (volver) => `/iniciar-sesion?${new URLSearchParams({ volver })}`;

/**
 * Para el cargar() de las vistas que requieren sesión (carrito, compra).
 * Sin sesión, o si la API responde 401, lleva al login (y después vuelve a `volver`).
 */
export async function exigirSesion(volver, accion) {
    await sesionInicial();
    if (!usuario()) {
        throw new Redireccion(rutaDeLogin(volver));
    }
    try {
        return await accion();
    } catch (error) {
        if (error.status === 401) {
            sesionVencida();
            throw new Redireccion(rutaDeLogin(volver));
        }
        throw error;
    }
}

/**
 * Botón "Añadir al carrito" del catálogo y del detalle de un libro.
 * - Con sesión: agrega el libro y lleva al carrito.
 * - Sin sesión: recuerda el libro y lleva a iniciar sesión; después vuelve al carrito, que lo agrega.
 * Si la sesión venció mientras navegaba, la API responde 401 y se hace lo mismo.
 */
export async function agregarOIniciarSesion(slug, navegar) {
    await sesionInicial();
    if (usuario()) {
        try {
            await agregarAlCarrito(slug);
            navegar('/carrito');
            return;
        } catch (error) {
            if (error.status !== 401) throw error;
            sesionVencida();
        }
    }
    try {
        sessionStorage.setItem(PENDIENTE, slug);
    } catch {
        // sin sessionStorage: igual se pide el inicio de sesión
    }
    navegar(rutaDeLogin('/carrito'));
}
