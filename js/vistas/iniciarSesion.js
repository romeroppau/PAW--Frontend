import { html } from '../html.js';
import { mostrarAlerta } from '../formularios.js';

/**
 * Iniciar sesión (#/iniciar-sesion).
 * Formulario migrado del TP2. Falta conectarlo con la API (rama feat/auth-jwt).
 */
export default {
    titulo: 'Iniciar sesión',
    estilos: ['css/paginas/iniciarSesion.css'],

    render: () => html`
        <h1>Iniciar sesión</h1>
        <section>
            <form data-login>
                <label for="username">Usuario</label>
                <input type="text" id="username" name="username" autocomplete="username" required>

                <label for="contrasenia">Contraseña</label>
                <input type="password" id="contrasenia" name="contrasenia" autocomplete="current-password" required>

                <button type="submit">Iniciar sesión</button>
                <p class="alerta-error" role="alert" hidden data-alerta></p>
            </form>
        </section>
    `,

    montar(main) {
        const form = main.querySelector('[data-login]');
        form.addEventListener('submit', (evento) => {
            evento.preventDefault();
            // TODO (feat/auth-jwt): enviar a la API y guardar la sesión.
            mostrarAlerta(form.querySelector('[data-alerta]'), 'El inicio de sesión todavía no está disponible.');
        });
    },
};
