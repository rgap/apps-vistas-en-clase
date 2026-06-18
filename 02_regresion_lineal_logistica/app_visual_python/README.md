# App visual con Python y scikit-learn

Esta version conserva la interfaz de la app visual original, pero entrena y
ejecuta los modelos en Python:

- `LogisticRegression` para productos vistos y compra.
- `LinearRegression` para inversion en anuncios e ingresos.
- Flask para servir la interfaz y los endpoints JSON.

## Ejecutar

```bash
cd 02_regresion_lineal_logistica/app_visual_python
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

Abrir `http://127.0.0.1:5000`.

## Endpoints

```txt
GET /api/examples
GET /api/predict/logistic?x=6
GET /api/predict/linear?x=600
```
