import { api } from '../api.js';
import { html, urlTapa } from '../html.js';
import { Carousel } from '../lib/carousel.js';

/**
 * Página de inicio (#/).
 * Destacados: carousel con libros de la API (se oculta si la API no responde).
 * Más vendidos: contenido estático.
 */
export default {
    titulo: 'Inicio',
    estilos: ['css/paginas/index.css'],

    render: () => html`
        <div class="hero-banner">
            <h1>Bienvenidos a tu librería de confianza</h1>
            <p>En PAWPrints vas a encontrar tus libros y colecciones favoritas de manera simple, rápida y segura.</p>
        </div>

        <section class="info-callout reserva-callout">
            <h2>Comprá desde donde estés</h2>
            <p>
                Nuestra tienda online está disponible las 24 horas para que explores el catálogo completo y compres tus próximas lecturas sin salir de casa.
            </p>
        </section>

        <!-- Oculta hasta que la API responda. -->
        <section hidden data-destacados-seccion>
            <h2>Destacados</h2>
            <div data-destacados data-efecto="aleatorio" data-ratio="16/9" data-etiqueta="Libros destacados"></div>
        </section>

        <section>
            <h2>Nuestros libros más vendidos del mes</h2>
            <div class="grid-mas-vendidos">
                <article>
                    <img src="media/librosmasvendidos/libro1.png" alt="Portada de La psicología del dinero" width="100" height="100">
                    <p>La psicología del dinero - Morgan Housel</p>
                </article>
                <article>
                    <img src="media/librosmasvendidos/libro2.png" alt="Portada de La paciente silenciosa" width="100" height="100">
                    <p>La paciente silenciosa - Alex Michaelides</p>
                </article>
                <article>
                    <img src="media/librosmasvendidos/libro3.png" alt="Portada de El principito" width="100" height="100">
                    <p>El principito - Antoine de Saint-Exupéry</p>
                </article>
            </div>
        </section>

        <div class="grid-dos-columnas">
            <section class="info-callout">
                <h2>Visitanos</h2>
                <p>
                    Además de nuestra tienda online, podés encontrarnos en nuestra tienda física en:
                    <strong>Av. Principal 123, Luján</strong>. ¡Vení a conocernos y charlar de libros!
                </p>
            </section>
            <section class="info-callout">
                <h2>Descubrí</h2>
                <p>
                    Tenemos novedades todas las semanas. Descubrí las últimas incorporaciones a nuestro catálogo y promociones exclusivas de la página para nuestra comunidad lectora.
                </p>
            </section>
        </div>
    `,

    // Se ejecuta con el HTML ya insertado en <main>.
    montar: async (main) => {
        const seccion = main.querySelector('[data-destacados-seccion]');
        const contenedor = main.querySelector('[data-destacados]');
        try {
            const { data: libros } = await api('/libros');
            // El usuario pudo cambiar de vista mientras se pedían los libros.
            if (!contenedor.isConnected) return;

            const conTapa = libros.filter((libro) => libro.cover);
            if (conTapa.length === 0) return;

            contenedor.innerHTML = String(html`${conTapa.map((libro) => html`
                <figure>
                    <a href="#/catalogo/${encodeURIComponent(libro.slug)}">
                        <img src="${urlTapa(libro)}" alt="Portada de ${libro.title}">
                    </a>
                    <figcaption>${libro.title} — ${libro.author}</figcaption>
                </figure>
            `)}`);
            seccion.hidden = false;
            new Carousel(contenedor);
        } catch {
            // Sin API, el inicio se ve igual, sin la sección de destacados.
        }
    },
};