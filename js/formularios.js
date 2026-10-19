/**
 * Utilidades para los formularios de las vistas.
 */

/** Campos del formulario como objeto { nombre: valor }, sin espacios extremos. */
export function datosDelFormulario(form) {
    return Object.fromEntries(
        [...new FormData(form)].map(([nombre, valor]) => [nombre, typeof valor === 'string' ? valor.trim() : valor]),
    );
}

/**
 * Muestra debajo de cada campo el error que devolvió la API (respuesta 422).
 * Marca el campo con aria-invalid y lo asocia a su mensaje (accesibilidad).
 *
 * @param {HTMLFormElement} form
 * @param {Record<string, string>} errores  { nombreDelCampo: 'mensaje' }
 */
export function mostrarErrores(form, errores) {
    limpiarErrores(form);

    for (const [nombre, mensaje] of Object.entries(errores)) {
        const campo = form.elements.namedItem(nombre);
        if (!(campo instanceof HTMLElement)) continue;

        const parrafo = document.createElement('p');
        parrafo.className = 'error-campo';
        parrafo.id = `error-${nombre}`;
        parrafo.textContent = mensaje; // textContent: el mensaje nunca se interpreta como HTML

        campo.setAttribute('aria-invalid', 'true');
        campo.setAttribute('aria-describedby', parrafo.id);
        campo.after(parrafo);
    }

    form.querySelector('[aria-invalid="true"]')?.focus();
}

export function limpiarErrores(form) {
    form.querySelectorAll('.error-campo').forEach((p) => p.remove());
    form.querySelectorAll('[aria-invalid]').forEach((campo) => {
        campo.removeAttribute('aria-invalid');
        campo.removeAttribute('aria-describedby');
    });
}

/** Muestra (o con mensaje vacío, oculta) un aviso general, ej. <p class="alerta-error" role="alert" hidden>. */
export function mostrarAlerta(elemento, mensaje) {
    if (!elemento) return;
    elemento.textContent = mensaje ?? '';
    elemento.hidden = !mensaje;
}

/**
 * Ejecuta una acción asíncrona deshabilitando el botón mientras tanto
 * (evita que un doble clic mande la petición dos veces).
 */
export async function conBotonDeshabilitado(boton, accion) {
    if (boton) boton.disabled = true;
    try {
        return await accion();
    } finally {
        if (boton) boton.disabled = false;
    }
}
