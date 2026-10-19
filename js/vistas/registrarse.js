import { html } from '../html.js';
import { conBotonDeshabilitado, datosDelFormulario, limpiarErrores, mostrarAlerta, mostrarErrores } from '../formularios.js';
import { Redireccion } from '../router.js';
import { registrarse, rutaDeVuelta, sesionInicial, usuario } from '../sesion.js';
import { USUARIO as R } from '../validaciones.js';

/**
 * Registrarse (#/registrarse). POST /api/auth/registro: la API valida de nuevo, crea el
 * usuario y deja la sesión iniciada (cookie HttpOnly).
 *
 * Los atributos de validación salen de js/validaciones.js (mismas reglas que App\Models\User).
 * Si ya hay sesión, lleva al inicio.
 */
export default {
    titulo: 'Registrarse',
    estilos: ['css/paginas/registrarse.css'],

    cargar: async ({ query }) => {
        await sesionInicial();
        if (usuario()) {
            throw new Redireccion(rutaDeVuelta(query));
        }
    },

    render: (datos, { query }) => html`
        <h1>Registrarse</h1>
        <form data-registro>
            <p class="alerta-error" role="alert" hidden data-alerta></p>

            <label for="username">Usuario</label>
            <input type="text" id="username" name="username" autocomplete="username" required
                   minlength="${R.NOMBRE_MIN}" maxlength="${R.NOMBRE_MAX}" pattern="${R.NOMBRE_PATRON}"
                   title="Letras sin acentos, números, guion bajo (_) y punto" aria-describedby="ayuda-username">
            <p class="ayuda-campo" id="ayuda-username">Entre ${R.NOMBRE_MIN} y ${R.NOMBRE_MAX} caracteres: letras sin acentos, números, "_" y ".".</p>

            <label for="email">Correo electrónico</label>
            <input type="email" id="email" name="email" autocomplete="email" required maxlength="${R.EMAIL_MAX}">

            <label for="telefono">Teléfono (opcional)</label>
            <input type="tel" id="telefono" name="telefono" autocomplete="tel"
                   minlength="${R.TELEFONO_MIN}" maxlength="${R.TELEFONO_MAX}" pattern="${R.TELEFONO_PATRON}"
                   title="Solo números y espacios, con + inicial opcional">

            <label for="contrasenia">Contraseña</label>
            <input type="password" id="contrasenia" name="contrasenia" autocomplete="new-password" required
                   minlength="${R.CONTRASENIA_MIN}" maxlength="${R.CONTRASENIA_MAX}" pattern="${R.CONTRASENIA_PATRON}"
                   title="Al menos ${R.CONTRASENIA_MIN} caracteres, con una letra y un número" aria-describedby="ayuda-contrasenia">
            <p class="ayuda-campo" id="ayuda-contrasenia">Mínimo ${R.CONTRASENIA_MIN} caracteres, con al menos una letra y un número.</p>

            <label for="confirmar_contrasenia">Confirmar contraseña</label>
            <input type="password" id="confirmar_contrasenia" name="confirmar_contrasenia" autocomplete="new-password" required>

            <button type="submit">Registrarse</button>
        </form>
        <p class="cambiar-formulario">
            ¿Ya tenés cuenta? <a href="#/iniciar-sesion?${new URLSearchParams({ volver: rutaDeVuelta(query) })}">Iniciá sesión</a>
        </p>
    `,

    montar(main, datos, { navegar, query }) {
        const form = main.querySelector('[data-registro]');
        const alerta = main.querySelector('[data-alerta]');
        const contrasenia = form.elements.contrasenia;
        const confirmacion = form.elements.confirmar_contrasenia;

        // Que las contraseñas coincidan no se puede expresar con atributos HTML:
        // se marca el campo como inválido con setCustomValidity (el navegador muestra el mensaje).
        const compararContrasenias = () => {
            confirmacion.setCustomValidity(
                confirmacion.value !== '' && confirmacion.value !== contrasenia.value ? 'Las contraseñas no coinciden.' : '',
            );
        };
        contrasenia.addEventListener('input', compararContrasenias);
        confirmacion.addEventListener('input', compararContrasenias);

        // El evento submit solo ocurre si el navegador ya validó los campos.
        form.addEventListener('submit', async (evento) => {
            evento.preventDefault();
            limpiarErrores(form);
            mostrarAlerta(alerta, '');

            // Las contraseñas se envían sin quitar espacios (son parte de la contraseña).
            const datosForm = {
                ...datosDelFormulario(form),
                contrasenia: contrasenia.value,
                confirmar_contrasenia: confirmacion.value,
            };

            try {
                await conBotonDeshabilitado(form.querySelector('button'), () => registrarse(datosForm));
                navegar(rutaDeVuelta(query));
            } catch (error) {
                mostrarAlerta(alerta, error.message);
                mostrarErrores(form, error.campos ?? {}); // 422: errores de cada campo (ej. usuario ya en uso)
            }
        });
    },
};
