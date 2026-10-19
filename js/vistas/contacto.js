import { html } from '../html.js';
import { mostrarAlerta } from '../formularios.js';

/**
 * Contacto (#/contacto). Contenido estático.
 * El formulario de consulta todavía no tiene endpoint en la API.
 */
export default {
    titulo: 'Contacto',
    estilos: ['css/paginas/contacto.css'],

    render: () => html`
        <section class="contacto-presentacion">
            <h1>Hablemos</h1>
            <p>
                ¿Tenés alguna consulta, recomendación o simplemente querés
                hablar de libros? Estamos para escucharte.
            </p>
        </section>

        <section class="informacion-contacto">
            <h2>Encontranos</h2>
            <article>
                <!-- Los íconos son decorativos: aria-hidden evita que el lector de pantalla los lea. -->
                <span class="icono-contacto" aria-hidden="true">⌖</span>
                <h3>Visitá nuestra librería</h3>
                <address>
                    Av. Principal 123, Luján
                </address>
                <!-- Enlaces de relleno (en el TP2 eran href="#", que en el SPA llevaría al inicio). -->
                <a href="#/contacto">
                    Ver ubicación
                </a>
            </article>
            <article>
                <span class="icono-contacto" aria-hidden="true">☎</span>
                <h3>Hablemos</h3>
                <p>
                    02323-123456
                </p>
                <a href="tel:02323123456">
                    Llamanos
                </a>
            </article>
            <article>
                <span class="icono-contacto" aria-hidden="true">@</span>
                <h3>Escribinos</h3>
                <p>
                    contacto@pawprints.com
                </p>
                <a href="mailto:contacto@pawprints.com">
                    Enviar email
                </a>
            </article>
        </section>

        <section class="consulta-contacto">
            <h2>¿Tenés alguna consulta?</h2>
            <p class="frase-contacto">
                “Cada buena historia comienza con una conversación.”
            </p>
            <p>
                Completá el formulario y dejanos tu mensaje.
                Nos encanta conocer a nuestros lectores.
            </p>
            <form data-consulta>
                <label for="nombre">Nombre</label>
                <input type="text" id="nombre" name="nombre" maxlength="15" minlength="2" placeholder="Tu nombre">
                <label for="email">Email</label>
                <input type="email" id="email" name="email" placeholder="tu@email.com">
                <label for="mensaje">Mensaje</label>
                <textarea id="mensaje" name="mensaje" rows="6" placeholder="Escribí tu consulta..."></textarea>
                <button type="submit">
                    Enviar consulta
                </button>
                <p role="status" hidden data-aviso></p>
            </form>
        </section>

        <section class="redes">
            <h2>Seguinos</h2>
            <p>
                Encontrá nuestras novedades, recomendaciones y próximos lanzamientos.
            </p>
            <a href="#/contacto" class="red-social">
                Instagram
            </a>
            <a href="#/contacto" class="red-social">
                Facebook
            </a>
        </section>
    `,

    montar(main) {
        const form = main.querySelector('[data-consulta]');
        form.addEventListener('submit', (evento) => {
            evento.preventDefault();
            mostrarAlerta(form.querySelector('[data-aviso]'),
                'El envío de consultas todavía no está disponible. Escribinos a contacto@pawprints.com.');
        });
    },
};
