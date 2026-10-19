import { html } from '../html.js';

/**
 * Promociones (#/promociones). Maqueta estática del TP2: los filtros y los botones
 * todavía no tienen funcionalidad (no hay promociones en la API).
 */
export default {
    titulo: 'Promociones',
    estilos: ['css/paginas/promociones.css'],
    claseMain: 'promociones-main',

    render: () => html`
        <aside class="filtros" aria-label="Filtros de promociones">
            <form>
                <fieldset class="filtro">
                    <legend>% Descuento</legend>
                    <div class="rango">
                        <label for="desc-min">Mínimo</label>
                        <div class="rango-control">
                            <input type="range" id="desc-min" name="desc-min" min="0" max="100" value="0">
                            <output id="desc-min-value">0%</output>
                        </div>

                        <label for="desc-max">Máximo</label>
                        <div class="rango-control">
                            <input type="range" id="desc-max" name="desc-max" min="0" max="100" value="100">
                            <output id="desc-max-value">100%</output>
                        </div>
                    </div>
                </fieldset>
                <fieldset class="filtro">
                    <legend>Categoría</legend>
                    <div class="categorias">
                        <label>
                            <input type="checkbox" name="categoria" value="terror">
                            Terror
                        </label>
                        <label>
                            <input type="checkbox" name="categoria" value="fantasia">
                            Fantasía
                        </label>
                        <label>
                            <input type="checkbox" name="categoria" value="accion">
                            Acción
                        </label>
                        <label>
                            <input type="checkbox" name="categoria" value="drama">
                            Drama
                        </label>
                        <label>
                            <input type="checkbox" name="categoria" value="comedia">
                            Comedia
                        </label>
                    </div>
                </fieldset>
                <fieldset class="filtro">
                    <legend>Precio</legend>
                    <div class="rango">
                        <label for="precio-min">Mínimo</label>
                        <div class="rango-control">
                            <input type="range" id="precio-min" name="precio-min" min="0" max="1000" value="0">
                            <output>$0</output>
                        </div>
                        <label for="precio-max">Máximo</label>
                        <div class="rango-control">
                            <input type="range" id="precio-max" name="precio-max" min="0" max="1000" value="1000">
                            <output>$100.000</output>
                        </div>
                    </div>
                </fieldset>
            </form>
        </aside>
        <section class="lista-promociones" aria-labelledby="promociones-heading">
            <h2 id="promociones-heading">Promociones</h2>
            <div class="productos-promocion">
                <article class="promocion">
                    <h3>El monje que vendió su Ferrari</h3>
                    <figure>
                        <img src="media/libros/monje-ferrari.jpg" alt="Portada de El monje que vendió su Ferrari" width="150">
                    </figure>
                    <p class="descuento">
                        <mark>-20%</mark>
                    </p>
                    <p>
                        Precio:
                        <data value="0">$10000</data>
                    </p>
                    <button type="button" class="btn-carrito">
                        Añadir al carrito
                    </button>
                </article>
                <article class="promocion">
                    <h3>El poder del ahora</h3>
                    <figure>
                        <img src="media/libros/poder-ahora.jpg" alt="Portada de El poder del ahora" width="150">
                    </figure>
                    <p class="descuento">
                        <mark>-15%</mark>
                    </p>
                    <p>
                        Precio:
                        <data value="0">$12000</data>
                    </p>
                    <button type="button" class="btn-carrito">
                        Añadir al carrito
                    </button>
                </article>
            </div>
        </section>
    `,
};
