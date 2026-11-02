/**
 * validador.js — Validación en línea de formularios, igual en todos los navegadores. Sin dependencias.
 *
 * Los navegadores validan los atributos HTML (required, pattern...) cada uno a su manera: Chrome,
 * Firefox y Safari muestran globos distintos, con textos distintos, en momentos distintos.
 * Este componente desactiva esa validación (novalidate) y la hace en JS: los mensajes, el momento
 * en que aparecen y cómo se ven son los mismos en todos.
 *
 *   import { Validador } from './lib/validador.js';
 *   const validador = new Validador(form);
 *   form.addEventListener('submit', (evento) => {
 *       evento.preventDefault();
 *       if (!validador.validar()) return;   // muestra los errores y enfoca el primero
 *       ...enviar...
 *       validador.mostrarErrores(error.campos);   // errores 422 de la API, en cada campo
 *   });
 *
 * Las reglas se leen de los atributos HTML de cada campo (el HTML sigue siendo la fuente):
 *   required              obligatorio
 *   minlength, maxlength  largo del texto (en caracteres, como mb_strlen del backend)
 *   pattern               el valor completo tiene que cumplir la expresión (con soporte de \p{L})
 *   type="email"          formato de email
 *   data-tipo="entero"    número entero, sin puntos ni comas
 *   min, max              rango del número (con type="number" o data-tipo="entero")
 * Y se configuran con:
 *   data-mensaje-patron   mensaje cuando no cumple el pattern (por defecto: "El formato no es válido.")
 *   data-contador         muestra debajo del campo "caracteres escritos / maxlength"
 *   data-sin-recortar     no quitar los espacios extremos al validar (ej. contraseñas)
 * Para reglas que no se pueden escribir en HTML (ej. "las contraseñas coinciden"):
 *   validador.regla('confirmar', (valor, form) => valor === form.elements.clave.value ? null : 'No coinciden.');
 *
 * Cuándo valida cada campo:
 *   - al salir del campo (así no marca errores mientras la persona recién empieza a escribir);
 *   - mientras escribe, si el campo ya fue tocado o tiene un error (el mensaje se va apenas se corrige);
 *   - todos juntos con validar(), al enviar.
 *
 * Los mensajes son los mismos que devuelve la API (App\Core\Validator), así no cambian según quién
 * encuentre el error. La API valida todo de nuevo: esta validación es para ayudar, no para proteger.
 *
 * Accesibilidad: cada error es un <p class="error-campo"> asociado al campo con aria-describedby,
 * el campo se marca con aria-invalid y el mensaje se anuncia (aria-live) al aparecer.
 * Los estilos están en css/lib/validador.css.
 */

const MENSAJES = {
    requerido: () => 'Este campo es obligatorio.',
    minimo: (n) => `Debe tener al menos ${n} caracteres.`,
    maximo: (n) => `Debe tener como máximo ${n} caracteres.`,
    email: () => 'Ingresá un email válido.',
    entero: () => 'Debe ser un número entero, sin puntos ni comas.',
    rango: (min, max) => `Debe ser un número entre ${formatear(min)} y ${formatear(max)}.`,
    numeroMinimo: (min) => `Debe ser un número mayor o igual a ${formatear(min)}.`,
    numeroMaximo: (max) => `Debe ser un número menor o igual a ${formatear(max)}.`,
    patron: () => 'El formato no es válido.',
};

// Entero como lo acepta PHP (FILTER_VALIDATE_INT): signo opcional y sin ceros a la izquierda.
const ENTERO = /^[+-]?(0|[1-9]\d*)$/;

// Email: algo@algo.algo, sin espacios. El backend lo verifica con más detalle.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Campos que se validan (los botones y los fieldset no).
const SELECTOR_CAMPOS = 'input:not([type="hidden"]):not([type="submit"]):not([type="button"]), select, textarea';

export class Validador {
    /** @param {HTMLFormElement} form */
    constructor(form) {
        this.form = form;
        this.reglas = new Map();    // nombre del campo -> [funciones extra]
        this.tocados = new Set();   // campos que la persona ya dejó (ver "Cuándo valida")

        // Sin globos ni mensajes propios del navegador: los muestra este componente.
        form.noValidate = true;

        for (const campo of this.campos()) {
            this.prepararCampo(campo);
        }

        // Un solo listener por evento, en el formulario (delegación): sirve para todos los campos.
        // focusout (a diferencia de blur) sube desde el campo hasta el formulario.
        form.addEventListener('focusout', (evento) => {
            const campo = this.campoDe(evento.target);
            if (!campo) return;
            this.tocados.add(campo.name);
            this.validarCampo(campo);
        });
        form.addEventListener('input', (evento) => {
            const campo = this.campoDe(evento.target);
            if (!campo) return;
            this.actualizarContador(campo);
            if (this.tocados.has(campo.name) || campo.getAttribute('aria-invalid') === 'true') {
                this.validarCampo(campo);
            }
        });
        // Al vaciar el formulario (botón reset) se borran también los errores.
        form.addEventListener('reset', () => setTimeout(() => this.limpiar()));
    }

    /**
     * Agrega una regla propia a un campo. Se evalúa después de las de los atributos HTML.
     * @param {string} nombre  name del campo
     * @param {(valor: string, form: HTMLFormElement) => string|null} funcion  mensaje de error, o null si está bien
     */
    regla(nombre, funcion) {
        this.reglas.set(nombre, [...(this.reglas.get(nombre) ?? []), funcion]);
        return this;
    }

    /**
     * Valida todos los campos, muestra los errores y enfoca el primero que tenga uno.
     * @returns {boolean} true si el formulario es válido
     */
    validar() {
        let primero = null;
        for (const campo of this.campos()) {
            this.tocados.add(campo.name);
            if (!this.validarCampo(campo) && !primero) {
                primero = campo;
            }
        }
        primero?.focus();
        return primero === null;
    }

    /**
     * Muestra los errores que devolvió la API (respuesta 422: { campo: 'mensaje' }).
     * Se borran solos cuando la persona corrige el campo.
     * @param {Record<string, string>} errores
     * @returns {string[]} mensajes de campos que no están en el formulario (para mostrarlos en un aviso general)
     */
    mostrarErrores(errores = {}) {
        const sinCampo = [];
        let primero = null;
        for (const [nombre, mensaje] of Object.entries(errores)) {
            const campo = this.campoDe(this.form.elements.namedItem(nombre));
            if (!campo) {
                sinCampo.push(mensaje);
                continue;
            }
            this.tocados.add(campo.name);
            this.marcar(campo, mensaje);
            primero ??= campo;
        }
        primero?.focus();
        return sinCampo;
    }

    /** Quita todos los errores y vuelve los campos a "no tocados". */
    limpiar() {
        this.tocados.clear();
        for (const campo of this.campos()) {
            this.marcar(campo, null);
            this.actualizarContador(campo);
        }
    }

    // ─── Internos ─────────────────────────────────────────────────────────────────────────────

    campos() {
        return [...this.form.querySelectorAll(SELECTOR_CAMPOS)].filter((campo) => campo.name);
    }

    // El campo del formulario que corresponde a un elemento (o null si no es un campo validable).
    campoDe(elemento) {
        return elemento instanceof HTMLElement && elemento.matches(SELECTOR_CAMPOS) && elemento.name
            && this.form.contains(elemento) ? elemento : null;
    }

    // Crea el contador (si se pidió) y el párrafo del error, y los asocia al campo.
    prepararCampo(campo) {
        campo.id ||= `campo-${campo.name}`;
        const descripciones = (campo.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);

        if (campo.hasAttribute('data-contador') && campo.maxLength > 0) {
            const contador = document.createElement('p');
            contador.className = 'contador-campo';
            contador.id = `contador-${campo.id}`;
            campo.after(contador);
            descripciones.push(contador.id);
            this.actualizarContador(campo);
        }

        // El error va después de la ayuda, del contador y de las sugerencias (<datalist>) del campo, si tiene.
        let ancla = campo;
        while (ancla.nextElementSibling?.matches('.ayuda-campo, .contador-campo, datalist')) {
            ancla = ancla.nextElementSibling;
        }
        const error = document.createElement('p');
        error.className = 'error-campo';
        error.id = `error-${campo.id}`;
        error.hidden = true;
        error.setAttribute('aria-live', 'polite'); // los lectores de pantalla lo leen cuando aparece
        ancla.after(error);
        descripciones.push(error.id);

        campo.setAttribute('aria-describedby', descripciones.join(' '));
    }

    // Valida un campo y muestra (o quita) su error. Devuelve true si es válido.
    validarCampo(campo) {
        const mensaje = this.error(campo);
        this.marcar(campo, mensaje);
        return mensaje === null;
    }

    // Primer error del campo según sus atributos y sus reglas propias, o null si está bien.
    error(campo) {
        const valor = campo.hasAttribute('data-sin-recortar') ? campo.value : recortar(campo.value);

        if (valor === '') {
            // En un <input type="number"> con letras (Firefox las deja escribir) el valor es ''.
            if (campo.validity?.badInput) return MENSAJES.entero();
            return campo.required ? MENSAJES.requerido() : null; // opcional y vacío: no hay más reglas
        }

        // Largo en caracteres reales (un emoji cuenta 1, como mb_strlen del backend).
        const largo = [...valor].length;
        const minimo = entero(campo.getAttribute('minlength'));
        const maximo = entero(campo.getAttribute('maxlength'));
        if (minimo !== null && largo < minimo) return MENSAJES.minimo(minimo);
        if (maximo !== null && largo > maximo) return MENSAJES.maximo(maximo);

        if (campo.type === 'email' && !EMAIL.test(valor)) return MENSAJES.email();

        if (campo.type === 'number' || campo.dataset.tipo === 'entero') {
            if (!ENTERO.test(valor)) return MENSAJES.entero();
            const numero = Number(valor);
            const min = entero(campo.getAttribute('min'));
            const max = entero(campo.getAttribute('max'));
            if ((min !== null && numero < min) || (max !== null && numero > max)) {
                if (min !== null && max !== null) return MENSAJES.rango(min, max);
                return min !== null ? MENSAJES.numeroMinimo(min) : MENSAJES.numeroMaximo(max);
            }
        }

        const patron = campo.getAttribute('pattern');
        if (patron && !compilar(patron).test(valor)) {
            return campo.dataset.mensajePatron || MENSAJES.patron();
        }

        for (const regla of this.reglas.get(campo.name) ?? []) {
            const mensaje = regla(valor, this.form);
            if (mensaje) return mensaje;
        }
        return null;
    }

    // Muestra el mensaje debajo del campo (o, con null, lo oculta).
    marcar(campo, mensaje) {
        const error = this.form.querySelector(`#error-${CSS.escape(campo.id)}`);
        if (error) {
            error.textContent = mensaje ?? ''; // textContent: nunca se interpreta como HTML
            error.hidden = !mensaje;
        }
        if (mensaje) {
            campo.setAttribute('aria-invalid', 'true');
        } else {
            campo.removeAttribute('aria-invalid');
        }
    }

    actualizarContador(campo) {
        const contador = this.form.querySelector(`#contador-${CSS.escape(campo.id)}`);
        if (!contador) return;
        const largo = [...campo.value].length;
        contador.textContent = `${largo} / ${campo.maxLength} caracteres`;
        // Cerca del límite cambia de color (ver css/lib/validador.css).
        contador.classList.toggle('contador-campo--limite', largo >= campo.maxLength * 0.9);
    }
}

// Quita los espacios extremos como trim() de PHP (el backend valida el texto recortado así).
function recortar(texto) {
    return texto.replace(/^[ \t\n\r\0\x0B]+|[ \t\n\r\0\x0B]+$/g, '');
}

function entero(texto) {
    return texto !== null && ENTERO.test(texto.trim()) ? Number(texto) : null;
}

// 1000000 -> "1.000.000"
function formatear(numero) {
    return numero.toLocaleString('es-AR');
}

// Expresiones del atributo pattern, compiladas una sola vez. Como en HTML, deben cumplirse completas
// (^...$). La bandera "u" permite \p{L} (cualquier letra, con acentos o ñ) en todos los navegadores.
const patrones = new Map();
function compilar(patron) {
    if (!patrones.has(patron)) {
        patrones.set(patron, new RegExp(`^(?:${patron})$`, 'u'));
    }
    return patrones.get(patron);
}
