/**
 * Plantillas HTML seguras.
 *
 * Las vistas arman su HTML con la "tagged template" html`...`. Cada valor interpolado
 * con ${...} se escapa automáticamente (igual que hacía e() en PHP), así un título
 * como "<script>" se muestra como texto y no se ejecuta (previene XSS).
 *
 *   html`<h2>${libro.title}</h2>`             -> el título se escapa
 *   html`<ul>${items.map(i => html`<li>${i}</li>`)}</ul>`  -> listas: arrays de html``
 *   html`${hayError && html`<p>Error</p>`}`   -> false, null y undefined no imprimen nada
 */

// HTML ya escapado (resultado de html``): no se vuelve a escapar al anidarlo.
class HtmlSeguro {
    constructor(texto) {
        this.texto = texto;
    }

    toString() {
        return this.texto;
    }
}

const ENTIDADES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };

export function escapar(valor) {
    return String(valor).replace(/[&<>"']/g, (c) => ENTIDADES[c]);
}

function convertir(valor) {
    if (valor === null || valor === undefined || valor === false) return '';
    if (Array.isArray(valor)) return valor.map(convertir).join('');
    if (valor instanceof HtmlSeguro) return valor.texto;
    return escapar(valor);
}

export function html(partes, ...valores) {
    let salida = partes[0];
    valores.forEach((valor, i) => {
        salida += convertir(valor) + partes[i + 1];
    });
    return new HtmlSeguro(salida);
}

/** Precio en pesos: 30499 -> "$30.499". */
export const dinero = (monto) => '$' + Math.round(monto).toLocaleString('es-AR');

/** URL de la tapa de un libro (las imágenes están en media/); si no tiene, la genérica. */
export const urlTapa = (libro) =>
    libro.cover ? `media/libros/${encodeURIComponent(libro.cover)}` : 'media/sinfoto.png';
