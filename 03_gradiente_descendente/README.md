# 03. Gradiente descendente en una y dos dimensiones

## Historia de usuario

**Como** estudiante,  
**quiero** observar cómo el gradiente descendente busca un mínimo,  
**para** comprender primero el proceso en una dimensión y después extenderlo
a dos dimensiones.

## Escenarios

- Una dimensión, función unimodal: un mínimo global.
- Una dimensión, función multimodal: un mínimo global y un mínimo local.
- Dos dimensiones, función unimodal: un mínimo global.
- Dos dimensiones, función multimodal: un mínimo global y un mínimo local.

El algoritmo calcula la pendiente o gradiente y actualiza:

```txt
w_nuevo = w - alpha * gradiente
```

## Interacción

- Cambiar entre las cuatro funciones.
- Seleccionar el punto inicial haciendo clic sobre la gráfica.
- Elegir una velocidad de aprendizaje predefinida.
- Avanzar una iteración o ejecutar el recorrido automáticamente.
- Elegir otro inicio para comparar el resultado.

## Ejecución

Abrir:

```txt
app_visual/index.html
```
