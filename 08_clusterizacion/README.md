# 08. Clusterizacion de clientes

Aplicativo visual sobre clusterizacion no supervisada con datos de clientes
segun visitas y gasto mensual.

## Proposito

El ejemplo parte de una nube de clientes historicos:

- eje x: numero de visitas;
- eje y: gasto mensual en soles;
- cada punto: un cliente anterior.

El problema es encontrar segmentos de clientes con comportamientos similares sin
tener etiquetas previas.

## Interaccion

El usuario compara tres metodos:

- `K-means`: fija un numero de grupos y mueve centroides;
- `Mean Shift`: busca zonas densas sin elegir k;
- `DBSCAN`: une puntos densos y marca ruido.

La visualizacion colorea los segmentos encontrados y muestra parametros,
cantidad de grupos y puntos marcados como ruido.

## Archivos

- `app_visual/index.html`: estructura de la app.
- `app_visual/styles.css`: estilos.
- `app_visual/app.js`: datos, algoritmos y render SVG.
