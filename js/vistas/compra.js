import { api } from '../api.js';
import { obtenerCarrito } from '../carrito.js';
import { conBotonDeshabilitado, datosDelFormulario, limpiarErrores, mostrarAlerta, mostrarErrores } from '../formularios.js';
import { dinero, html } from '../html.js';
import { Redireccion } from '../router.js';
import { COMPRA as R } from '../validaciones.js';

/**
 * Finalizar compra (#/compra): datos del cliente y resumen del carrito.
 * Al enviar: POST /api/compra con JSON. La API valida de nuevo y manda el pedido por mail.
 *
 * Los atributos de validación (required, minlength, pattern...) salen de js/validaciones.js,
 * que replica las reglas del backend (App\Models\Order).
 */
export default {
    titulo: 'Finalizar compra',
    estilos: ['css/paginas/formulario.css', 'css/paginas/compra.css'],

    cargar: async () => {
        const carrito = await obtenerCarrito();
        if (carrito.items.length === 0) {
            throw new Redireccion('/carrito'); // no se puede comprar con el carrito vacío
        }
        return carrito;
    },

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
                <input type="email" id="email" name="email" required autocomplete="email"
                       maxlength="${R.EMAIL_MAX}" placeholder="tu@email.com">

                <label for="telefono">Teléfono</label>
                <input type="tel" id="telefono" name="telefono" required autocomplete="tel"
                       minlength="${R.TELEFONO_MIN}" maxlength="${R.TELEFONO_MAX}"
                       pattern="${R.TELEFONO_PATRON}" title="Solo números y espacios, con + inicial opcional"
                       placeholder="2323 123456">
            </fieldset>

            <fieldset>
                <legend>3. Pago</legend>
                <p>El pago se realiza con <strong>${R.MEDIO_DE_PAGO}</strong>.</p>
            </fieldset>

            <!-- Compra desactivada por ahora: el botón no envía el formulario.
                 Para activarla: volver a type="submit", quitar "disabled" y descomentar
                 la ruta POST /api/compra en config/routes.php del backend. -->
            <button type="button" disabled aria-describedby="compra-no-disponible">Finalizar compra</button>
            <p id="compra-no-disponible">La compra online estará disponible próximamente.</p>
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
                navegar('/compra/confirmada');
            } catch (error) {
                mostrarAlerta(alerta, error.message);
                mostrarErrores(form, error.campos ?? {}); // 422: errores de cada campo
            }
        });
    },
};
