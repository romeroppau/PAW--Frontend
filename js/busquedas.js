/**
 * Últimas búsquedas del catálogo, guardadas en localStorage.
 *
 * localStorage queda en el navegador aunque se cierre la pestaña (a diferencia de sessionStorage):
 * las búsquedas siguen ahí al volver al sitio. Son de este navegador, no de la cuenta, y nunca
 * se envían al servidor.
 *
 * Se guardan como JSON: ["borges", "cortázar", ...], la más reciente primero, sin repetidas
 * (sin distinguir mayúsculas ni acentos) y como máximo MAXIMO.
 *
 * Cada cambio dispara el evento 'busquedas:cambio' en document con la lista nueva:
 * app.js lo escucha para actualizar las sugerencias de los buscadores.
 */

const CLAVE = 'busquedas:recientes';
export const MAXIMO = 5;
const LARGO_MAXIMO = 100; // igual que el máximo del buscador (y del backend)

/** Las últimas búsquedas, la más reciente primero ([] si no hay o no se pueden leer). */
export function ultimasBusquedas() {
    try {
        const guardadas = JSON.parse(localStorage.getItem(CLAVE) ?? '[]');
        // localStorage se puede editar desde las herramientas del navegador: solo se aceptan textos.
        return Array.isArray(guardadas)
            ? guardadas.filter((busqueda) => typeof busqueda === 'string' && busqueda.trim() !== '').slice(0, MAXIMO)
            : [];
    } catch {
        return []; // JSON inválido, o el navegador bloquea el almacenamiento (ej. algunos modos privados)
    }
}

/** Guarda una búsqueda como la más reciente. Una vacía no se guarda; una repetida pasa adelante. */
export function guardarBusqueda(texto) {
    const busqueda = texto.trim().slice(0, LARGO_MAXIMO);
    if (busqueda === '') return;

    const clave = normalizar(busqueda);
    const otras = ultimasBusquedas().filter((anterior) => normalizar(anterior) !== clave);
    escribir([busqueda, ...otras].slice(0, MAXIMO));
}

/** Borra todas las búsquedas guardadas. */
export function borrarBusquedas() {
    escribir([]);
}

function escribir(busquedas) {
    try {
        if (busquedas.length === 0) {
            localStorage.removeItem(CLAVE);
        } else {
            localStorage.setItem(CLAVE, JSON.stringify(busquedas));
        }
    } catch {
        // Sin almacenamiento disponible, el sitio funciona igual: solo no recuerda las búsquedas.
    }
    document.dispatchEvent(new CustomEvent('busquedas:cambio', { detail: ultimasBusquedas() }));
}

// "Cortázar" y "cortazar" son la misma búsqueda.
function normalizar(texto) {
    return texto.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}
