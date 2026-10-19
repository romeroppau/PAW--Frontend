import inicio from './vistas/inicio.js';
import nosotros from './vistas/nosotros.js';
import catalogo from './vistas/catalogo.js';
import libro from './vistas/libro.js';
import promociones from './vistas/promociones.js';
import contacto from './vistas/contacto.js';
import carrito from './vistas/carrito.js';
import compra from './vistas/compra.js';
import compraConfirmada from './vistas/compraConfirmada.js';
import iniciarSesion from './vistas/iniciarSesion.js';
import registrarse from './vistas/registrarse.js';

/**
 * Mapa de rutas del sitio (lo que va después de # en la URL) -> vista.
 * Los segmentos :nombre se capturan y llegan a la vista en ctx.params.
 */
export const rutas = [
    { patron: '/', vista: inicio },
    { patron: '/nosotros', vista: nosotros },
    { patron: '/catalogo', vista: catalogo },
    { patron: '/catalogo/:slug', vista: libro },
    { patron: '/promociones', vista: promociones },
    { patron: '/contacto', vista: contacto },
    { patron: '/carrito', vista: carrito },
    { patron: '/compra', vista: compra },
    { patron: '/compra/confirmada', vista: compraConfirmada },
    { patron: '/iniciar-sesion', vista: iniciarSesion },
    { patron: '/registrarse', vista: registrarse },
];
