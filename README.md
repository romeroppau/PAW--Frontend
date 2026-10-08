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

## Organización del proyecto

La estructura general del proyecto se encuentra organizada de la siguiente manera:

```text
PAW--Frontend--TP2/
│
├── .vscode/
│
├── carrito/
│   ├── carrito.css
│   └── carrito.html
│
├── catalogo/
│   ├── catalogo.css
│   └── catalogo.html
│
├── contacto/
│   ├── contacto.css
│   └── contacto.html
│
├── css/
│   ├── reset.css
│   └── style.css
│
├── docs/
│   └── wireframes/
│       └── TP1 - PAW.png
│
├── formulario/
│   ├── formulario.css
│   └── formulario.html
│
├── index/
│   ├── index.css
│   └── index.html
│
├── inicioSesion/
│   ├── iniciarSesion.css
│   └── iniciarSesion.html
│
├── libros/
│   ├── libros.css
│   ├── monje-ferrari.html
│   ├── poder-ahora.html
│   ├── revolucion-abundancia.html
│   └── sutil-arte.html
│
├── media/
│   ├── libros/
│   │   ├── monje-ferrari.jpg
│   │   ├── poder-ahora.jpg
│   │   ├── revolucion-abundancia.jpg
│   │   └── sutil-arte.jpg
│   │
│   ├── librosmasvendidos/
│   │   ├── libro1.png
│   │   ├── libro2.png
│   │   └── libro3.png
│   │
│   ├── logo.png
│   └── sinfoto.png
│
├── nosotros/
│   ├── nosotros.css
│   └── nosotros.html
│
├── promociones/
│   ├── promociones.css
│   └── promociones.html
│
├── registrarse/
│   ├── registrarse.css
│   └── registrarse.html
│
├── autores.txt
├── README.md
├── Sitemap-Libreria.png
└── VERSION
```
Instalación y ejecución
Para visualizar el sitio:
1. Clonar el repositorio:
git clone https://github.com/romeroppau/PAW--Frontend.git

2. Ingresar a la carpeta del proyecto:
cd PAW--Frontend

3. Abrir el archivo index/index.html en tu navegador web.
También puede utilizarse un servidor local para visualizar el sitio.

RECOMENDACIÓN: para una mejor experiencia de desarrollo, podés utilizar la extensión **Live Server** en VS Code para servir los archivos estáticos automáticamente.

