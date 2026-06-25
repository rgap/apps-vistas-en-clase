# 06. Entrenamiento de un arbol de decision clasificador

Aplicativo visual que entrena un arbol de decision clasificador con los datos
de sesiones web usados en S27.

## Historia de usuario

**Como** estudiante,  
**quiero** cambiar el criterio de division y los hiperparametros del arbol,  
**para** observar como se entrenan las preguntas `if-else` que clasifican una
sesion nueva.

## Datos

```txt
x1 = clics de la sesion
x2 = duracion en minutos
y  = siguiente accion del usuario
```

Clases:

- Abandonar.
- Seguir navegando.
- Agregar al carrito.
- Comprar.

## Metodos simples incluidos

El arbol prueba cortes candidatos sobre las variables numericas:

```txt
clics < umbral
duracion < umbral
```

Para elegir el mejor corte, puede usar:

- Gini.
- Entropia.
- Error de clasificacion.

En cada nodo:

1. Calcula la impureza actual.
2. Prueba cortes posibles entre valores observados.
3. Divide los datos en izquierda y derecha.
4. Elige el corte que mas reduce la impureza.
5. Repite el proceso hasta llegar a una hoja.

## Hiperparametros

- Criterio de division.
- Profundidad maxima.
- Minimo de observaciones por hoja.

## Interaccion

- Cambiar criterio de division.
- Cambiar profundidad maxima.
- Cambiar minimo de observaciones por hoja.
- Mover la sesion nueva con controles o haciendo clic en la grafica.
- Ver regiones entrenadas, cortes aprendidos, precision en entrenamiento y ruta de prediccion.

## Ejecucion

Abrir:

```txt
app_visual/index.html
```
