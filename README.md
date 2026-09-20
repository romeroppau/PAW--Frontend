# PAW--Frontend--TP1
# PAWPrints — Trabajo Práctico 1 - PAW 2026 - UNLu

## Introducción

Este repositorio contiene el desarrollo del **Trabajo Práctico N.º 1** de la asignatura **Programación de Aplicaciones Web (PAW)**.

El proyecto consiste en el desarrollo incremental de un sitio web para una librería ficticia denominada **PAWPrints**, desarrollado por el grupo **La 25**.

En esta primera etapa se trabajó sobre la estructura y maquetación del sitio utilizando exclusivamente **HTML5**, sin implementar funcionalidades del lado del cliente ni del servidor.

---


---

## Objetivos

El objetivo principal de este trabajo es aplicar los conceptos fundamentales de **maquetación y estructuración semántica de sitios web mediante HTML5**.

En particular, se buscó:

* Definir la estructura y jerarquía del sitio mediante un **Sitemap**.
* Diseñar los **wireframes low-fi** de las principales páginas.
* Implementar las páginas utilizando exclusivamente **HTML5**.
* Utilizar correctamente los **elementos semánticos de HTML5**.
* Implementar un **formulario de reserva de libros**, utilizando tipos de campos y atributos adecuados para facilitar la validación.

---


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

La funcionalidad de procesamiento de reservas no se encuentra implementada en esta etapa, ya que el objetivo del trabajo se centra exclusivamente en la **maquetación mediante HTML5**.

---


---

## Estructura del sitio

El sitio se encuentra organizado en diferentes secciones y páginas, siguiendo la jerarquía definida en el Sitemap:

* **Inicio:** presentación de PAWPrints, servicios, tienda física y tienda online, además de promociones y novedades.
* **Catálogo:** listado de libros disponibles con información básica.
* **Detalle de libro:** información ampliada de cada ejemplar, incluyendo descripción, autor y opciones de compra o reserva.
* **Nosotros:** historia, misión y servicios ofrecidos por la librería.
* **Contacto:** información de contacto, redes sociales y formulario de consulta/reserva.

---


---

## Tecnologías utilizadas

Para el desarrollo de este Trabajo Práctico se utilizaron:

* **HTML5** — estructura y maquetación del sitio.
* **Figma** — diseño de wireframes low-fi.
* **Git / GitHub** — control de versiones y trabajo colaborativo.

No se utilizaron tecnologías de estilos ni funcionalidades de programación del lado del cliente o servidor, de acuerdo con los objetivos establecidos para esta etapa.

---


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


---

## Organización del proyecto

La estructura general del proyecto se encuentra organizada de la siguiente manera:

```text
PAWPrints/
│
├── index.html
│
├── catalogo/
│   └── catalogo.html
│
├── libros/
│   ├── monje-ferrari.html
│   ├── revolucion-abundancia.html
│   ├── sutil-arte.html
│   └── poder-ahora.html
│
├── nosotros/
│   └── nosotros.html
│
├── contacto/
│   └── contacto.html
│
├── media/
│   └── imágenes y recursos multimedia
│
├── css/
│   └── recursos de estilos para futuras etapas
│
└── js/
    └── recursos de JavaScript para futuras etapas
```

La estructura se plantea de manera modular para facilitar la incorporación de nuevas funcionalidades en los próximos trabajos prácticos.

---


---

## WireFrames

https://www.figma.com/design/bes5asi7LB9SEXOv93DPJ7/TP1---PAW?node-id=4-63&t=TVVFWESKudebklfp-0

---


---

## Equipo

**Grupo: La 25**

**Proyecto: PAWPrints — Librería**

Trabajo realizado en el marco de la asignatura **Programación de Aplicaciones Web (PAW)**.

---

## Instalación y ejecución

Como este proyecto consiste únicamente en archivos estáticos HTML y CSS, no requiere ningún entorno de ejecución backend (como PHP) ni gestores de dependencias (como Composer).

Para visualizar el sitio:

1. Cloná el repositorio:
   ```bash
   git clone https://github.com/romeroppau/PAW--Frontend--TP1.git
   cd PAW--Frontend--TP1
   ```

2. Abrí el archivo `index.html` directamente en tu navegador web.

*Recomendación:* Para una mejor experiencia de desarrollo, podés utilizar la extensión **Live Server** en VS Code para servir los archivos estáticos automáticamente.

---
