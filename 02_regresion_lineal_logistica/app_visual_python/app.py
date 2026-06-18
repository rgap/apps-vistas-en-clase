from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import numpy as np
from flask import Flask, jsonify, render_template, request
from sklearn.linear_model import LinearRegression, LogisticRegression


app = Flask(__name__)


LOGISTIC_DATA = [
    {"x": 0, "y": 0},
    {"x": 1, "y": 0},
    {"x": 2, "y": 0},
    {"x": 3, "y": 0},
    {"x": 4, "y": 0},
    {"x": 5, "y": 0},
    {"x": 6, "y": 1},
    {"x": 7, "y": 0},
    {"x": 7, "y": 1},
    {"x": 8, "y": 1},
    {"x": 10, "y": 1},
    {"x": 11, "y": 1},
    {"x": 12, "y": 1},
]

LINEAR_DATA = [
    {"x": 0, "y": 280},
    {"x": 100, "y": 860},
    {"x": 200, "y": 690},
    {"x": 350, "y": 1980},
    {"x": 500, "y": 1560},
    {"x": 650, "y": 3820},
    {"x": 800, "y": 3210},
    {"x": 950, "y": 5120},
    {"x": 1100, "y": 6240},
    {"x": 1200, "y": 5480},
]


@dataclass(frozen=True)
class Example:
    model: Any
    data: list[dict[str, float]]
    metadata: dict[str, Any]

    @property
    def weights(self) -> dict[str, float]:
        if isinstance(self.model, LogisticRegression):
            return {
                "w0": float(self.model.intercept_[0]),
                "w1": float(self.model.coef_[0][0]),
            }

        return {
            "w0": float(self.model.intercept_),
            "w1": float(self.model.coef_[0]),
        }


def train_logistic_model() -> LogisticRegression:
    x = np.array([point["x"] for point in LOGISTIC_DATA]).reshape(-1, 1)
    y = np.array([point["y"] for point in LOGISTIC_DATA])
    model = LogisticRegression(C=1_000_000, max_iter=1_000, solver="lbfgs")
    model.fit(x, y)
    return model


def train_linear_model() -> LinearRegression:
    x = np.array([point["x"] for point in LINEAR_DATA]).reshape(-1, 1)
    y = np.array([point["y"] for point in LINEAR_DATA])
    model = LinearRegression()
    model.fit(x, y)
    return model


EXAMPLES = {
    "logistic": Example(
        model=train_logistic_model(),
        data=LOGISTIC_DATA,
        metadata={
            "title": "Regresion logistica",
            "subtitle": "h(x) estima la probabilidad de que el usuario compre.",
            "modelBadge": "Clasificacion",
            "targetBadge": "Compra o no compra",
            "equationPill": "h(x) = 1 / (1 + e^-(w_0 + w_1x))",
            "xLabel": "Productos vistos",
            "inputMetricLabel": "x: productos vistos",
            "outputMetricLabel": "h(x): probabilidad de compra",
            "decisionMetricLabel": "Resultado esperado",
            "xDescription": "Numero de productos vistos",
            "yDescription": "Compro o no compro",
            "dataNote": "Cada punto representa una visita de usuario.",
            "tableXHeader": "Productos vistos",
            "tableYHeader": "Compro",
            "xAxisLabel": "Numero de productos vistos",
            "yAxisLabel": "Probabilidad de compra",
            "xMin": 0,
            "xMax": 15,
            "yMin": 0,
            "yMax": 1,
            "step": 1,
            "defaultX": 6,
            "xTicks": [0, 3, 6, 9, 12, 15],
            "yTicks": [0, 0.25, 0.5, 0.75, 1],
        },
    ),
    "linear": Example(
        model=train_linear_model(),
        data=LINEAR_DATA,
        metadata={
            "title": "Regresion lineal",
            "subtitle": (
                "h_w(x) estima los ingresos segun la inversion en anuncios."
            ),
            "modelBadge": "Prediccion",
            "targetBadge": "Ingresos en soles",
            "equationPill": "h_w(x) = w_0 + w_1x",
            "xLabel": "Inversion en anuncios",
            "inputMetricLabel": "x: inversion en anuncios",
            "outputMetricLabel": "h_w(x): ingresos estimados",
            "decisionMetricLabel": "Interpretacion",
            "xDescription": "Inversion en anuncios en soles",
            "yDescription": "Total de ingresos en soles",
            "dataNote": "Cada punto representa un periodo con anuncios.",
            "tableXHeader": "Inversion en anuncios",
            "tableYHeader": "Ingresos",
            "xAxisLabel": "Inversion en anuncios (S/)",
            "yAxisLabel": "Total de ingresos (S/)",
            "xMin": 0,
            "xMax": 1200,
            "yMin": 0,
            "yMax": 6500,
            "step": 50,
            "defaultX": 600,
            "xTicks": [0, 300, 600, 900, 1200],
            "yTicks": [0, 1500, 3000, 4500, 6000],
        },
    ),
}


def normalize_x(example: Example, raw_value: str | None) -> float:
    default_x = float(example.metadata["defaultX"])

    try:
        value = float(raw_value) if raw_value is not None else default_x
    except ValueError:
        value = default_x

    minimum = float(example.metadata["xMin"])
    maximum = float(example.metadata["xMax"])
    step = float(example.metadata["step"])
    value = min(max(value, minimum), maximum)
    value = round(value / step) * step

    if step.is_integer():
        return float(round(value))
    return value


def predict(example_name: str, x_value: float) -> dict[str, Any]:
    example = EXAMPLES[example_name]
    model_input = np.array([[x_value]])

    if example_name == "logistic":
        probability = float(example.model.predict_proba(model_input)[0][1])
        z = float(example.model.decision_function(model_input)[0])
        return {
            "x": x_value,
            "value": probability,
            "z": z,
            "decision": "Compro" if probability >= 0.5 else "No compro",
        }

    prediction = float(example.model.predict(model_input)[0])
    return {
        "x": x_value,
        "value": prediction,
        "decision": (
            "Por cada S/ 1 adicional, el modelo suma "
            f"S/ {example.weights['w1']:.2f} de ingresos."
        ),
    }


def serialize_example(name: str, example: Example) -> dict[str, Any]:
    metadata = dict(example.metadata)
    sample_count = 121 if name == "logistic" else 2
    x_values = np.linspace(metadata["xMin"], metadata["xMax"], sample_count)
    curve = [
        {
            "x": float(x_value),
            "y": predict(name, float(x_value))["value"],
        }
        for x_value in x_values
    ]

    return {
        **metadata,
        "data": example.data,
        "weights": example.weights,
        "curve": curve,
    }


@app.get("/")
def index():
    return render_template("index.html")


@app.get("/api/examples")
def examples():
    return jsonify(
        {
            name: serialize_example(name, example)
            for name, example in EXAMPLES.items()
        }
    )


@app.get("/api/predict/<example_name>")
def prediction(example_name: str):
    example = EXAMPLES.get(example_name)
    if example is None:
        return jsonify({"error": "Ejemplo no encontrado."}), 404

    x_value = normalize_x(example, request.args.get("x"))
    return jsonify(predict(example_name, x_value))


if __name__ == "__main__":
    app.run(debug=True, port=5000)
