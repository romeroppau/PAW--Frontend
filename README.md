# PAW--Frontend--TP2

# PAWPrints — Trabajo Práctico 2 - PAW 2026 - UNLu

## Introducción

Este repositorio contiene el desarrollo del **Trabajo Práctico N.º 2** de la asignatura **Programación de Aplicaciones Web (PAW)**.

El proyecto consiste en el desarrollo incremental de un sitio web para una librería ficticia denominada **PAWPrints**, desarrollado por el grupo **La 25**.

En la primera etapa se trabajó sobre la estructura y maquetación del sitio utilizando exclusivamente **HTML5**. En esta segunda etapa se incorporaron los estilos **CSS** necesarios para adaptar las páginas a los wireframes y al manual de identidad visual seleccionado.

---

## Objetivos TP1

Como base para este trabajo se tomó la estructura desarrollada durante el Trabajo Práctico N.º 1.

En dicha etapa se buscó:

* Definir la estructura y jerarquía del sitio mediante un **Sitemap**.
* Diseñar los **wireframes low-fi** de las principales páginas.
* Implementar las páginas utilizando **HTML5**.
* Utilizar correctamente los **elementos semánticos de HTML5**.
* Implementar un **formulario de reserva de libros**, utilizando tipos de campos y atributos adecuados para facilitar la validación.

---

## Objetivos TP2

Tomando como base las maquetaciones presentadas en el TP1, el objetivo de este trabajo es incorporar los estilos **CSS** necesarios para lograr que el sitio se adapte visualmente a los wireframes diseñados.

Además, se busca:

* Aplicar el **Manual de Identidad Corporativa — Opción Violeta**.
* Definir una guía de estilos común para todo el sitio.
* Utilizar variables CSS para mantener la consistencia visual.
* Adaptar las diferentes páginas a distintas resoluciones.
* Generar versiones responsive para dispositivos móviles y desktop.
* Adaptar las páginas para su correcta visualización en impresión.
* Mantener una estructura de estilos ordenada y reutilizable.

---

## Manual de identidad visual

Para el desarrollo del sitio se seleccionó la **Opción Violeta** del manual de identidad corporativa.

Los principales elementos utilizados son:

* **Color principal:** `#5c068c`.
* **Tipografía:** Argentum Sans.
* **Color de apoyo:** tonos derivados del violeta y colores neutros.
* **Variables CSS:** utilizadas para centralizar colores, tipografías, bordes, sombras y otros elementos visuales.

La guía de estilos se encuentra principalmente definida en `style.css`, mientras que cada página cuenta con su propio archivo CSS para los estilos específicos.

---

## Descripción del sitio

**PAWPrints** es una librería que cuenta con una propuesta de venta de libros tanto **online como física**.

El sitio permite a los usuarios:

* Conocer la librería y sus servicios.
* Explorar el catálogo de libros disponibles.
* Consultar información detallada de cada libro.
* Conocer promociones, novedades y propuestas de la librería.
* Conocer la historia y misión de PAWPrints.
* Consultar los medios de contacto y redes sociales.
* Solicitar la reserva de un libro mediante un formulario.

La funcionalidad de procesamiento de reservas no se encuentra implementada en esta etapa, ya que el objetivo del trabajo se centra en la **maquetación y presentación visual mediante HTML5 y CSS**.

---

## Organización de los estilos

El proyecto organiza los estilos en diferentes niveles.

El archivo `reset.css` establece una base común para normalizar los elementos HTML y reducir diferencias entre navegadores.

El archivo `style.css` contiene los estilos generales y compartidos por todo el sitio, como el header, navegación, footer, colores, tipografías y estética general.

Finalmente, cada página cuenta con su propio archivo CSS, como `catalogo.css`, `promociones.css`, `nosotros.css`, `contacto.css` y `formulario.css`, donde se definen los estilos específicos de cada sección sin repetir los estilos generales.

De esta manera, se mantiene una estructura ordenada, se evita duplicar código y resulta más sencillo modificar y mantener el diseño del sitio.

---

## Estructura del sitio

El sitio se encuentra organizado en diferentes secciones y páginas, siguiendo la jerarquía definida en el Sitemap:

* **Inicio:** presentación de PAWPrints, servicios, tienda física y tienda online, además de promociones y novedades.
* **Catálogo:** listado de libros disponibles con información básica.
* **Detalle de libro:** información ampliada de cada ejemplar, incluyendo descripción, autor y opciones de compra o reserva.
* **Nosotros:** historia, misión y servicios ofrecidos por la librería.
* **Contacto:** información de contacto, redes sociales y formulario de consulta/reserva.

---

## Tecnologías utilizadas

Para el desarrollo de este Trabajo Práctico se utilizaron:

* **HTML5** — estructura y maquetación del sitio.
* **CSS3** — estilos, diseño visual, responsive y adaptación para impresión.
* **JavaScript (ES modules)** — SPA: router, vistas y comunicación con la API.
* **Figma** — diseño de wireframes low-fi.
* **Git / GitHub** — control de versiones y trabajo colaborativo.

---

## Elementos semánticos

Se priorizó el uso de elementos semánticos de HTML5 de acuerdo con el contenido y propósito de cada sección.

Entre ellos:

* `<header>` para encabezados y navegación.
* `<nav>` para los elementos de navegación.
* `<main>` para el contenido principal.
* `<section>` para agrupar contenidos relacionados.
* `<article>` para representar unidades independientes, como los libros.
* `<footer>` para información complementaria y de contacto.
* `<form>` para el formulario de reserva.
* `<label>`, `<input>`, `<select>`, `<textarea>` y `<button>` para la construcción del formulario.

---

## Formulario de reserva

El sitio incluye un formulario destinado a que los usuarios puedan solicitar la reserva de un libro.

El formulario contempla los siguientes datos:

* Nombre.
* Correo electrónico.
* Teléfono.
* Cantidad de ejemplares.
* Título del libro a reservar.

Se utilizaron diferentes tipos de campos HTML5 y atributos como `required` para favorecer la validación de los datos ingresados.

El formulario tiene carácter demostrativo y **no realiza el procesamiento efectivo de las reservas**.

---

## SPA (Entrega 3)

Desde la entrega 3 el sitio es una **SPA (Single Page Application)**:

* Hay un único `index.html` con el header, el menú y el footer.
* El contenido de `<main>` lo arma JavaScript según la ruta, que va después del `#` en la URL
  (ej. `index.html#/catalogo?q=borges`). Cambiar el hash no recarga la página.
* Los datos (libros, carrito, compra) se piden con `fetch` a la **API del backend** (`PAW--Backend`), que responde JSON.
* Cada vista carga su propio CSS (`css/paginas/*.css`) y quita el de la vista anterior, porque cada uno da estilos distintos a `<main>`.

```
Usuario ──▶ index.html + js/app.js ──fetch──▶ API PHP (http://localhost:8000/api) ──▶ JSON
                    │
                    └── router.js elige la vista ──▶ vista.render(datos) ──▶ HTML en <main>
```

### Rutas

| URL | Vista | Datos de la API |
|---|---|---|
| `#/` | `vistas/inicio.js` | — |
| `#/catalogo?q=&orden=&page=` | `vistas/catalogo.js` | `GET /api/libros` |
| `#/catalogo/{slug}` | `vistas/libro.js` | `GET /api/libros/{slug}` |
| `#/carrito` (requiere sesión) | `vistas/carrito.js` | `GET/POST/PATCH/DELETE /api/carrito...` |
| `#/compra` (requiere sesión) | `vistas/compra.js` | `POST /api/compra` (envía el mail al personal) |
| `#/compra/confirmada` | `vistas/compraConfirmada.js` | — |
| `#/nosotros`, `#/contacto`, `#/promociones` | estáticas | — |
| `#/iniciar-sesion?volver=` | `vistas/iniciarSesion.js` | `POST /api/auth/login` |
| `#/registrarse?volver=` | `vistas/registrarse.js` | `POST /api/auth/registro` |
| cualquier otra | `vistas/errores.js` (404) | — |

### Sesión de usuario

* Al registrarse o iniciar sesión, la API guarda un **JWT** en una cookie **`HttpOnly`** (`auth_token`).
  JavaScript no puede leerla: el navegador la envía sola en cada petición (`credentials: 'include'`).
* Para saber si hay sesión, `js/sesion.js` consulta `GET /api/auth/yo` al abrir el sitio. El menú muestra
  *Iniciar sesión / Registrarse* o *Hola, usuario / Cerrar sesión*.
* Las reglas de los formularios (`js/validaciones.js`, `USUARIO`) son las mismas que valida el backend
  (`App\Models\User`). La coincidencia de contraseñas se controla con `setCustomValidity`.
* `?volver=/ruta` en el login o el registro lleva a esa ruta después de entrar (solo rutas del sitio).
* **El carrito y la compra requieren la sesión iniciada.** "Añadir al carrito" sin sesión guarda el libro en
  `sessionStorage`, lleva al login (con un aviso) y, al volver al carrito, lo agrega solo. `#/carrito` y `#/compra`
  sin sesión (o con la sesión vencida) llevan al login y después vuelven. Cada usuario tiene su propio carrito.
* En la compra, el email y el teléfono se precargan con los datos de la cuenta.

## Organización del proyecto

```text
PAW--Frontend--TP1/
│
├── index.html               ← única página: header, menú, <main id="app"> y footer
├── vercel.json              ← despliegue: reenvía /api/* a la API en Render
│
├── css/
│   ├── reset.css
│   ├── style.css            ← estilos globales (header, menú, footer, variables)
│   └── paginas/             ← CSS propio de cada vista (lo carga el router)
│       ├── index.css, catalogo.css, catalogo-paginado.css, libros.css
│       ├── carrito.css, formulario.css, compra.css
│       └── nosotros.css, contacto.css, promociones.css, iniciarSesion.css, registrarse.css
│
├── js/
│   ├── app.js               ← punto de entrada: crea el router, buscador y contador del carrito
│   ├── config.js            ← URL de la API
│   ├── router.js            ← router por hash, CSS por vista, títulos, vistas de error
│   ├── rutas.js             ← mapa ruta → vista
│   ├── api.js               ← fetch a la API (JSON, cookies, errores)
│   ├── html.js              ← plantillas html`` con escape automático (previene XSS), formato de precios
│   ├── carrito.js           ← operaciones del carrito, libro pendiente y exigirSesion() (avisa al menú con 'carrito:cambio')
│   ├── sesion.js            ← sesión del usuario: login, registro, logout (avisa al menú con 'sesion:cambio')
│   ├── formularios.js       ← errores por campo, avisos, botones mientras se envía
│   ├── validaciones.js      ← reglas de validación (las mismas que el backend)
│   └── vistas/              ← una vista por página
│
├── media/                   ← imágenes (tapas, logo)
├── docs/                    ← sitemap y wireframes
├── autores.txt
├── README.md
└── VERSION
```

## Instalación y ejecución

El sitio necesita la API funcionando:

1. Backend (repositorio `PAW--Backend`):
   ```bash
   composer install
   cp .env.example .env          # CORS_ORIGINS debe incluir la URL del frontend
   php -S localhost:8000 -t public public/index.php
   ```
2. Frontend (este repositorio), servido por HTTP en el puerto 5501
   (los módulos de JavaScript no funcionan abriendo el archivo con doble clic):
   * Con la extensión **Live Server** de VS Code (ya configurada en `.vscode/settings.json`): *Open with Live Server*.
   * O desde la terminal: `php -S localhost:5501` (o `npx serve -l 5501`).
3. Abrir `http://localhost:5501`.

Abrir siempre con `localhost` (no `127.0.0.1`). El frontend pide la API al mismo host con el que se abrió
(así el navegador envía la cookie de sesión del carrito), y `php -S localhost:8000` en Windows escucha solo en
`localhost` (IPv6): desde `127.0.0.1` la API no responde y el sitio muestra "No pudimos conectar con el servidor".
Live Server ya está configurado para abrir en `localhost`.

## Despliegue

Frontend en **Vercel**, API en **Render** (`https://pawprints-api-ehd1.onrender.com`); la base de datos (**Aiven**)
llega en la próxima entrega.

* `js/config.js` elige la URL de la API: `http://localhost:8000/api` en desarrollo y `/api` en producción.
* `vercel.json` hace que Vercel reenvíe `/api/*` a la API en Render. Para el navegador todo está en el mismo
  dominio (el de Vercel), así las cookies de sesión son propias del sitio y no "de terceros"
  (que Safari, el modo incógnito y otros navegadores bloquean).
* En Vercel: proyecto importado desde este repositorio, *Framework Preset* **Other**, sin comando de build
  (es un sitio estático).
* El dominio de Vercel tiene que estar en `CORS_ORIGINS` (variables de entorno de Render): la API rechaza con 403
  los POST cuyo `Origin` no esté en esa lista (protección CSRF).
* El plan gratis de Render se duerme tras 15 minutos sin uso: la primera petición puede tardar entre 30 y 60 segundos.

