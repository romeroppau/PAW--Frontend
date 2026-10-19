import { api } from '../api.js';
import { exigirSesion, obtenerCarrito, rutaDeLogin } from '../carrito.js';
import { conBotonDeshabilitado, datosDelFormulario, limpiarErrores, mostrarAlerta, mostrarErrores } from '../formularios.js';
import { dinero, html } from '../html.js';
import { Redireccion } from '../router.js';
import { sesionVencida, usuario } from '../sesion.js';
import { COMPRA as R } from '../validaciones.js';

/**
 * Finalizar compra (#/compra): datos del cliente y resumen del carrito.
 * Al enviar: POST /api/compra con JSON. La API valida de nuevo y manda el pedido por mail
 * al personal de la librería. Requiere la sesión iniciada (sin sesión, lleva al login).
 *
 * Los atributos de validación (required, minlength, pattern...) salen de js/validaciones.js,
 * que replica las reglas del backend (App\Models\Order).
 */
export default {
    titulo: 'Finalizar compra',
    estilos: ['css/paginas/formulario.css', 'css/paginas/compra.css'],

    cargar: () => exigirSesion('/compra', async () => {
        const carrito = await obtenerCarrito();
        if (carrito.items.length === 0) {
            throw new Redireccion('/carrito'); // no se puede comprar con el carrito vacío
        }
        return carrito;
    }),

    render: (carrito) => html`
        <h1>Finalizar compra</h1>

        <form data-compra>
            <p class="alerta-error" role="alert" hidden data-alerta></p>

            <fieldset>
                <legend>1. Datos personales</legend>
                <label for="nombre">Nombre</label>
                <input type="text" id="nombre" name="nombre" required autocomplete="given-name"
                       minlength="${R.NOMBRE_MIN}" maxlength="${R.NOMBRE_MAX}"
                       pattern="${R.NOMBRE_PATRON}" title="Solo letras y espacios"
                       placeholder="Juan">

                <label for="apellido">Apellido</label>
                <input type="text" id="apellido" name="apellido" required autocomplete="family-name"
                       minlength="${R.NOMBRE_MIN}" maxlength="${R.NOMBRE_MAX}"
                       pattern="${R.NOMBRE_PATRON}" title="Solo letras y espacios"
                       placeholder="Pérez">

                <label for="documento">Documento</label>
                <input type="text" id="documento" name="documento" required inputmode="numeric"
                       pattern="${R.DNI_PATRON}" maxlength="8" title="7 u 8 números, sin puntos">
            </fieldset>

            <fieldset>
                <legend>2. Contacto</legend>
                <label for="email">Email</label>
                <!-- Email y teléfono se precargan con los datos de la cuenta (se pueden cambiar). -->
                <input type="email" id="email" name="email" required autocomplete="email"
                       maxlength="${R.EMAIL_MAX}" placeholder="tu@email.com" value="${usuario()?.email ?? ''}">

                <label for="telefono">Teléfono</label>
                <input type="tel" id="telefono" name="telefono" required autocomplete="tel"
                       minlength="${R.TELEFONO_MIN}" maxlength="${R.TELEFONO_MAX}"
                       pattern="${R.TELEFONO_PATRON}" title="Solo números y espacios, con + inicial opcional"
                       placeholder="2323 123456" value="${usuario()?.phone ?? ''}">
            </fieldset>

            <fieldset>
                <legend>3. Pago</legend>
                <p>El pago se realiza con <strong>${R.MEDIO_DE_PAGO}</strong>.</p>
            </fieldset>

            <button type="submit">Finalizar compra</button>
        </form>

        <aside>
            <h2>Resumen de compra</h2>
            <dl>
                ${carrito.items.map(({ book: libro, quantity: cantidad, subtotal }) => html`
                    <dt>${libro.title} × ${cantidad}</dt>
                    <dd>${dinero(subtotal)}</dd>
                `)}
                <dt>Total</dt>
                <dd>${dinero(carrito.total)}</dd>
            </dl>
            <p><a href="#/carrito">Modificar carrito</a></p>
        </aside>
    `,

    montar(main, carrito, { navegar }) {
        const form = main.querySelector('[data-compra]');
        const alerta = main.querySelector('[data-alerta]');

        // El evento submit solo ocurre si el navegador ya validó los campos (required, pattern...).
        form.addEventListener('submit', async (evento) => {
            evento.preventDefault();
            limpiarErrores(form);
            mostrarAlerta(alerta, '');

            try {
                await conBotonDeshabilitado(form.querySelector('button'), () =>
                    api('/compra', { method: 'POST', body: datosDelFormulario(form) }));
                // La API vació el carrito: se actualiza el contador del menú.
                obtenerCarrito().catch(() => {});
                navegar('/compra/confirmada');
            } catch (error) {
                if (error.status === 401) {
                    // La sesión venció mientras completaba el formulario.
                    sesionVencida();
                    navegar(rutaDeLogin('/compra'));
                    return;
                }
                // 422: errores de cada campo. 503: no se pudo enviar el mail (el carrito sigue igual,
                // se puede reintentar). 409: el carrito quedó vacío.
                mostrarAlerta(alerta, error.message);
                mostrarErrores(form, error.campos ?? {});
            }
        });
    },
};
