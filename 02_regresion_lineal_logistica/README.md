# 02. Regresion lineal y regresion logistica

## Historia de usuario

**Titulo:** Comparacion de modelos de regresion

**Como** estudiante,  
**quiero** seleccionar un ejemplo de regresion lineal o regresion logistica,  
**para** observar como cambia la prediccion segun el valor de entrada `x`.

## Criterios de aceptacion

```gherkin
Scenario: Predecir una compra con regresion logistica
  Given selecciono "Regresion logistica"
  And x representa el numero de productos vistos
  When cambio el valor de x
  Then veo la probabilidad de compra h(x)
  And veo si el resultado esperado es "Compro" o "No compro"
  And veo la curva sigmoide y el punto calculado

Scenario: Predecir ingresos con regresion lineal
  Given selecciono "Regresion lineal"
  And x representa la inversion en anuncios en soles
  When cambio el valor de x
  Then veo el total de ingresos estimados en soles
  And veo la recta h_w(x) = w_0 + w_1x
  And veo el punto calculado en la grafica
```

## Tema del curso

Este proyecto trata de aprendizaje supervisado:

- Regresion logistica para clasificacion binaria.
- Regresion lineal para predecir un valor numerico.

## Ejemplo 1: regresion logistica

Problema:

```txt
x = numero de productos vistos
y = compro o no compro
```

La hipotesis calcula una probabilidad:

```txt
z = w_0 + w_1x
h(x) = 1 / (1 + e^(-z))
```

El ejemplo usa:

```txt
w_0 = -4.10
w_1 = 0.72
```

Regla de clasificacion:

```txt
si h(x) >= 0.5 -> compro
si h(x) < 0.5  -> no compro
```

## Ejemplo 2: regresion lineal

Problema:

```txt
x = inversion en anuncios en soles
y = total de ingresos en soles
```

La hipotesis es:

```txt
h_w(x) = w_0 + w_1x
```

El ejemplo usa:

```txt
w_0 = 450
w_1 = 4.80
```

Interpretacion:

- `w_0` es el ingreso base estimado cuando la inversion es cero.
- `w_1` indica cuanto aumenta el ingreso estimado por cada sol adicional invertido.

## Funciones de la app

- Selector entre regresion logistica y regresion lineal.
- Control numerico para modificar `x`.
- Grafica SVG con los datos de entrenamiento.
- Curva sigmoide para clasificacion.
- Recta de regresion para prediccion de ingresos.
- Formula y calculo actualizados en tiempo real.
- Tabla con los datos usados en cada ejemplo.

## Ejecucion

Abrir:

```txt
app_visual/index.html
```

## Version con Python y scikit-learn

La carpeta `app_visual_python` contiene la misma interfaz con modelos
entrenados en Python mediante scikit-learn y servidos con Flask.

```bash
cd app_visual_python
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```
