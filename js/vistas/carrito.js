import { actualizarCantidad, obtenerCarrito, quitarDelCarrito } from '../carrito.js';
import { conBotonDeshabilitado, mostrarAlerta } from '../formularios.js';
import { dinero, html, urlTapa } from '../html.js';

/**
 * Carrito (#/carrito). Datos de GET /api/carrito.
 * Al cambiar una cantidad o eliminar un libro se vuelve a mostrar la vista con el carrito actualizado.
 */
export default {
    titulo: 'Carrito',
    estilos: ['css/paginas/carrito.css'],

    cargar: () => obtenerCarrito(),

    render: (carrito) => html`
        <section class="seccion-carrito" aria-labelledby="carrito-heading">
            <h1 id="carrito-heading">Carrito de compras</h1>

            <p class="alerta-error" role="alert" hidden data-alerta></p>

            ${carrito.items.length === 0 && html`
                <p>Tu carrito está vacío. <a href="#/catalogo">Ver el catálogo</a></p>
            `}

            ${carrito.items.map(({ book: libro, quantity: cantidad }, i) => html`
                <article>
                    <figure>
                        <img src="${urlTapa(libro)}" alt="Portada de ${libro.title}">
                    </figure>
                    <h3>${libro.title} — ${libro.author}</h3>
                    <p>Precio: <data value="${libro.price}">${dinero(libro.price)}</data></p>
                    <form class="form-cantidad" data-libro="${libro.slug}">
                        <label for="cantidad-${i}">Cantidad</label>
                        <input type="number" id="cantidad-${i}" name="cantidad"
                               value="${cantidad}" min="1" max="${carrito.max_quantity}" required>
                        <button type="submit">Actualizar</button>
                    </form>
                    <form class="form-eliminar" data-libro="${libro.slug}">
                        <button type="submit">Eliminar</button>
                    </form>
                </article>
            `)}
        </section>

        ${carrito.items.length > 0 && html`
            <section class="seccion-resumen" aria-labelledby="resumen-heading">
                <h2 id="resumen-heading">Resumen de compra</h2>
                <dl>
                    ${carrito.items.map(({ book: libro, quantity: cantidad, subtotal }) => html`
                        <dt>${libro.title} × ${cantidad}</dt>
                        <dd>${dinero(subtotal)}</dd>
                    `)}
                    <dt>Total</dt>
                    <dd>${dinero(carrito.total)}</dd>
                </dl>
                <a href="#/compra">Finalizar compra</a>
            </section>
        `}
    `,

    montar(main, carrito, { recargar }) {
        const alerta = main.querySelector('[data-alerta]');

        // Envía la operación a la API; si sale bien, vuelve a mostrar el carrito; si no, el mensaje de error.
        const alEnviar = (form, operacion) => {
            form.addEventListener('submit', async (evento) => {
                evento.preventDefault();
                try {
                    await conBotonDeshabilitado(form.querySelector('button'), operacion);
                    recargar();
                } catch (error) {
                    mostrarAlerta(alerta, error.campos?.cantidad ?? error.message);
                }
            });
        };

        main.querySelectorAll('.form-cantidad').forEach((form) => {
            alEnviar(form, () => actualizarCantidad(form.dataset.libro, Number(form.elements.cantidad.value)));
        });
        main.querySelectorAll('.form-eliminar').forEach((form) => {
            alEnviar(form, () => quitarDelCarrito(form.dataset.libro));
        });
    },
};
