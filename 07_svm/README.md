# 05. SVM simple

Aplicativo visual sobre aprendizaje supervisado con máquinas de soporte vectorial.

## Propósito

El ejemplo usa los datos 2D de la sesión S27:

- eje x: clics;
- eje y: duración;
- clase azul: abandonar;
- clase roja: comprar.

La visualización muestra cómo una SVM separa dos grupos con una frontera. Está
pensada para personas con poca experiencia técnica, por eso usa textos cortos y
evita fórmulas.

## Interacción

El usuario compara tres formas de separar:

- recta suave;
- recta estricta;
- curva flexible.

Los hiperparámetros se explican como perillas:

- `kernel`: forma de la frontera;
- `C`: qué tan exigente es el modelo;
- `gamma`: qué tanto puede curvarse, solo en la opción curva.

## Archivos

- `app_visual/index.html`: estructura de la app.
- `app_visual/styles.css`: estilos.
- `app_visual/app.js`: entrenamiento SVM, frontera e interacción.
