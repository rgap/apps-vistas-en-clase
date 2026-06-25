# 05. Arbol de decision

Aplicativo visual sobre arboles de decision usando el ejemplo de sesiones web
de la S27.

## Historia de usuario

**Como** estudiante,  
**quiero** mover una sesion nueva por el plano de clics y duracion,  
**para** observar como un arbol de decision aplica preguntas `if-else` hasta
llegar a una hoja.

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

## Arbol mostrado en los slides

El ejemplo usa dos cortes:

```txt
clics < 10
duracion < 10 min
```

Reglas:

| Clics | Duracion | Siguiente accion |
| ----- | -------- | ---------------- |
| < 10 | < 10 min | Abandonar |
| < 10 | >= 10 min | Seguir navegando |
| >= 10 | < 10 min | Agregar al carrito |
| >= 10 | >= 10 min | Comprar |

Para una sesion con:

```txt
clics = 12
duracion = 13 min
```

el camino es:

```txt
12 < 10 -> no
13 < 10 -> no
prediccion -> Comprar
```

## Conceptos incluidos

- Un arbol aprende preguntas `if-else`.
- Cada pregunta usa una variable y un punto de corte.
- Para predecir, la observacion recorre un solo camino desde la raiz hasta una hoja.
- Las hojas contienen la clase predicha.
- Hiperparametros como profundidad maxima y minimo de observaciones por hoja ayudan a evitar reglas demasiado especificas.

## Interaccion

- Cambiar clics y duracion de la sesion nueva.
- Hacer clic sobre la grafica para mover la sesion nueva.
- Ver las regiones generadas por los cortes del arbol.
- Ver el camino resaltado dentro del arbol.
- Ver la regla final y la prediccion.

## Ejecucion

Abrir:

```txt
app_visual/index.html
```
