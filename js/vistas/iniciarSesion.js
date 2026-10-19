import { hayLibroPendiente } from '../carrito.js';
import { html } from '../html.js';
import { conBotonDeshabilitado, limpiarErrores, mostrarAlerta, mostrarErrores } from '../formularios.js';
import { Redireccion } from '../router.js';
import { iniciarSesion, rutaDeVuelta, sesionInicial, usuario } from '../sesion.js';
import { USUARIO as R } from '../validaciones.js';

/**
 * Iniciar sesión (#/iniciar-sesion?volver=/ruta). POST /api/auth/login: si los datos son
 * correctos, la API deja la cookie HttpOnly con el token y el menú pasa a "Hola, usuario".
 * Si ya hay sesión, lleva directamente a la ruta de vuelta (o al inicio).
 */
export default {
    titulo: 'Iniciar sesión',
    estilos: ['css/paginas/iniciarSesion.css'],

    cargar: async ({ query }) => {
        await sesionInicial();
        if (usuario()) {
            throw new Redireccion(rutaDeVuelta(query));
        }
    },

    render: (datos, { query }) => html`
        <h1>Iniciar sesión</h1>
        ${hayLibroPendiente() && html`
            <p class="aviso-sesion" role="status">Iniciá sesión (o registrate) para agregar el libro al carrito.</p>
        `}
        <section>
            <form data-login>
                <p class="alerta-error" role="alert" hidden data-alerta></p>

                <label for="username">Usuario o email</label>
                <input type="text" id="username" name="username" autocomplete="username" required maxlength="${R.EMAIL_MAX}">

                <label for="contrasenia">Contraseña</label>
                <input type="password" id="contrasenia" name="contrasenia" autocomplete="current-password" required>

                <button type="submit">Iniciar sesión</button>
            </form>
        </section>
        <p class="cambiar-formulario">
            ¿No tenés cuenta? <a href="#/registrarse?${new URLSearchParams({ volver: rutaDeVuelta(query) })}">Registrate</a>
        </p>
    `,

    montar(main, datos, { navegar, query }) {
        const form = main.querySelector('[data-login]');
        const alerta = main.querySelector('[data-alerta]');

        form.addEventListener('submit', async (evento) => {
            evento.preventDefault();
            limpiarErrores(form);
            mostrarAlerta(alerta, '');

            try {
                await conBotonDeshabilitado(form.querySelector('button'), () => iniciarSesion({
                    username: form.elements.username.value.trim(),
                    contrasenia: form.elements.contrasenia.value, // sin quitar espacios
                }));
                navegar(rutaDeVuelta(query));
            } catch (error) {
                // 401: "Usuario o contraseña incorrectos" (la API no dice cuál de los dos, a propósito).
                mostrarAlerta(alerta, error.message);
                mostrarErrores(form, error.campos ?? {});
                form.elements.contrasenia.value = '';
            }
        });
    },
};
