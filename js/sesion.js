import { api } from './api.js';

/**
 * Sesión del usuario.
 *
 * El token (JWT) viaja en una cookie HttpOnly que JavaScript NO puede leer: el frontend no sabe
 * si hay sesión mirando cookies, se lo pregunta a la API (GET /api/auth/yo). La respuesta se
 * guarda acá para que el menú y las vistas sepan quién está conectado sin volver a preguntar.
 *
 * Cada cambio (iniciar o cerrar sesión, registrarse) dispara el evento 'sesion:cambio' en
 * document con el usuario ({id, username, email, phone}) o null; el menú lo escucha.
 */

let usuarioActual = null;
let cargaInicial = null;

function avisar(usuario) {
    usuarioActual = usuario;
    document.dispatchEvent(new CustomEvent('sesion:cambio', { detail: usuario }));
    return usuario;
}

/** Usuario conectado, o null. */
export const usuario = () => usuarioActual;

/**
 * Pregunta a la API si hay sesión (una sola vez, al abrir el sitio).
 * Las vistas que dependen de la sesión la esperan con: await sesionInicial().
 * Si la API no responde, se sigue como si no hubiera sesión.
 */
export function sesionInicial() {
    cargaInicial ??= api('/auth/yo')
        .then((respuesta) => avisar(respuesta.data))
        .catch(() => avisar(null)); // 401 (sin sesión) o API caída
    return cargaInicial;
}

/**
 * Ruta a la que volver después de iniciar sesión o registrarse: #/iniciar-sesion?volver=/compra
 * Solo se aceptan rutas internas del sitio ("/algo"); cualquier otra cosa lleva al inicio.
 */
export function rutaDeVuelta(query) {
    const volver = query.get('volver') ?? '';
    return volver.startsWith('/') && !volver.startsWith('//') ? volver : '/';
}

/** POST /api/auth/login {username, contrasenia}. La API deja la cookie; acá se guarda el usuario. */
export const iniciarSesion = async (datos) =>
    avisar((await api('/auth/login', { method: 'POST', body: datos })).data);

/** POST /api/auth/registro. Registrarse deja la sesión iniciada. */
export const registrarse = async (datos) =>
    avisar((await api('/auth/registro', { method: 'POST', body: datos })).data);

/**
 * La API respondió 401 en medio del uso (el token venció o se borró la cookie):
 * el frontend pasa a "sin sesión" para que el menú y las vistas se actualicen.
 */
export function sesionVencida() {
    if (usuarioActual !== null) avisar(null);
}

/** POST /api/auth/logout: la API borra la cookie. */
export async function cerrarSesion() {
    await api('/auth/logout', { method: 'POST' });
    avisar(null);
}
