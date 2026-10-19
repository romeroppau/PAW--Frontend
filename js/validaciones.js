/**
 * Reglas de validación de los formularios, para los atributos HTML (minlength, pattern...).
 *
 * El backend valida lo mismo de nuevo (nunca se confía solo en el navegador).
 * Estos valores DEBEN coincidir con las constantes de App\Models\Order del backend:
 * si se cambia una regla, hay que cambiarla en los dos repositorios.
 */
export const COMPRA = {
    NOMBRE_MIN: 2,
    NOMBRE_MAX: 50,
    NOMBRE_PATRON: "[\\p{L} ']+",   // letras (con acentos), espacios y apóstrofo
    DNI_PATRON: '[0-9]{7,8}',
    EMAIL_MAX: 100,
    TELEFONO_MIN: 8,
    TELEFONO_MAX: 20,
    TELEFONO_PATRON: '\\+?[0-9 ]+', // dígitos y espacios, con + inicial opcional
    MEDIO_DE_PAGO: 'Mercado Pago',
};
