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

/**
 * Registro de usuarios. Deben coincidir con las constantes de App\Models\User del backend.
 */
export const USUARIO = {
    NOMBRE_MIN: 3,
    NOMBRE_MAX: 30,
    NOMBRE_PATRON: '[A-Za-z0-9_.]+',            // letras sin acentos, números, "_" y "."
    EMAIL_MAX: 100,
    TELEFONO_MIN: COMPRA.TELEFONO_MIN,          // opcional, mismas reglas que en la compra
    TELEFONO_MAX: COMPRA.TELEFONO_MAX,
    TELEFONO_PATRON: COMPRA.TELEFONO_PATRON,
    CONTRASENIA_MIN: 8,
    // El backend limita a 72 bytes (lo que usa bcrypt); maxlength cuenta caracteres, así que con
    // letras con acento el backend puede rechazar una contraseña de menos de 72 caracteres.
    CONTRASENIA_MAX: 72,
    CONTRASENIA_PATRON: '(?=.*\\p{L})(?=.*\\d).+', // al menos una letra y un número
};
