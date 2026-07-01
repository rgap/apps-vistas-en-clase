# 09. K-means ciclo a ciclo

Aplicativo visual enfocado solo en K-means. Usa los mismos datos de clientes de
`08_clusterizacion` y muestra que pasa en cada ciclo del algoritmo.

## Proposito

El ejemplo usa una nube de clientes en dos variables:

- eje x: numero de visitas;
- eje y: gasto mensual en soles;
- cada cliente empieza sin etiqueta;
- se fija `k = 4`;
- cada ciclo asigna clientes al centroide mas cercano;
- cada centroide se mueve al promedio de los clientes asignados.

## Interaccion

El usuario puede avanzar, retroceder o reproducir los ciclos. La visualizacion
colorea los puntos por cluster, dibuja la posicion anterior de cada centroide y
muestra una linea de movimiento hasta la nueva posicion.

## Archivos

- `app_visual/index.html`: estructura de la app.
- `app_visual/styles.css`: estilos.
- `app_visual/app.js`: datos, calculo de K-means y render SVG.
