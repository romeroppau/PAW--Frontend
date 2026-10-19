import { html } from '../html.js';
import { mostrarAlerta } from '../formularios.js';

/**
 * Registrarse (#/registrarse).
 * Formulario migrado del TP2. Falta conectarlo con la API (rama feat/auth-jwt).
 */
export default {
    titulo: 'Registrarse',
    estilos: ['css/paginas/registrarse.css'],

    render: () => html`
        <h1>Registrarse</h1>
        <form data-registro>
            <label for="username">Usuario</label>
            <input type="text" id="username" name="username" autocomplete="username" required>

            <label for="email">Correo electrónico</label>
            <input type="email" id="email" name="email" autocomplete="email" required>

            <label for="telefono">Teléfono</label>
            <input type="tel" id="telefono" name="telefono" autocomplete="tel"> <!-- opcional -->

            <label for="contrasenia">Contraseña</label>
            <input type="password" id="contrasenia" name="contrasenia" autocomplete="new-password" required>

            <label for="confirmar_contrasenia">Confirmar contraseña</label>
            <input type="password" id="confirmar_contrasenia" name="confirmar_contrasenia" autocomplete="new-password" required>

            <button type="submit">Registrarse</button>
            <p class="alerta-error" role="alert" hidden data-alerta></p>
        </form>
    `,

    montar(main) {
        const form = main.querySelector('[data-registro]');
        form.addEventListener('submit', (evento) => {
            evento.preventDefault();
            // TODO (feat/auth-jwt): validar, enviar a la API y mostrar los errores de cada campo.
            mostrarAlerta(form.querySelector('[data-alerta]'), 'El registro todavía no está disponible.');
        });
    },
};
