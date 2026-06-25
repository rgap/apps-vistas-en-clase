# 04. KNN: vecinos mas cercanos

Aplicativo visual sobre KNN usando el ejemplo de sesiones web de la S27.

## Historia de usuario

**Como** estudiante,  
**quiero** mover una sesion nueva y cambiar los hiperparametros de KNN,  
**para** observar como los vecinos mas cercanos votan por la siguiente accion.

## Datos del ejemplo

El conjunto de datos viene de los slides de S27:

```txt
x = clics de la sesion
y = duracion en minutos
etiqueta = siguiente accion del usuario
```

Clases:

- Abandonar.
- Seguir navegando.
- Agregar al carrito.
- Comprar.

La sesion nueva por defecto es:

```txt
clics = 11.2
duracion = 10.8 min
k = 9
```

Con la distancia euclidiana, los votos son:

| Clase | Votos |
| ----- | ----: |
| Abandonar | 1 |
| Seguir navegando | 2 |
| Agregar al carrito | 2 |
| Comprar | 4 |

La prediccion resultante es **Comprar**.

## Conceptos incluidos

- KNN calcula distancias entre una sesion nueva y las observaciones historicas.
- Los `k` vecinos mas cercanos votan por una clase.
- KNN no aprende pesos ni otros parametros como una regresion o una SVM.
- Solo tiene hiperparametros como `k` y la metrica de distancia.

## Interaccion

- Cambiar `k`.
- Cambiar la distancia entre euclidiana y Manhattan.
- Mover la sesion nueva con controles o haciendo clic en la grafica.
- Ver votos, vecinos consultados y prediccion final.

## Ejecucion

Abrir:

```txt
app_visual/index.html
```
