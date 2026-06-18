const examples = {
  logistic: {
    title: "Regresion logistica",
    subtitle: "h(x) estima la probabilidad de que el usuario compre.",
    modelBadge: "Clasificacion",
    targetBadge: "Compra o no compra",
    equationPill: "h(x) = 1 / (1 + e^-(w_0 + w_1x))",
    xLabel: "Productos vistos",
    inputMetricLabel: "x: productos vistos",
    outputMetricLabel: "h(x): probabilidad de compra",
    decisionMetricLabel: "Resultado esperado",
    xDescription: "Numero de productos vistos",
    yDescription: "Compro o no compro",
    dataNote: "Cada punto representa una visita de usuario.",
    tableXHeader: "Productos vistos",
    tableYHeader: "Compro",
    xAxisLabel: "Numero de productos vistos",
    yAxisLabel: "Probabilidad de compra",
    xMin: 0,
    xMax: 15,
    yMin: 0,
    yMax: 1,
    step: 1,
    defaultX: 6,
    xTicks: [0, 3, 6, 9, 12, 15],
    yTicks: [0, 0.25, 0.5, 0.75, 1],
    weights: { w0: -4.1, w1: 0.72 },
    data: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
      { x: 4, y: 0 },
      { x: 5, y: 0 },
      { x: 6, y: 1 },
      { x: 7, y: 0 },
      { x: 7, y: 1 },
      { x: 8, y: 1 },
      { x: 10, y: 1 },
      { x: 11, y: 1 },
      { x: 12, y: 1 },
    ],
    predict(x) {
      const z = this.weights.w0 + this.weights.w1 * x;
      const value = 1 / (1 + Math.exp(-z));

      return {
        z,
        value,
        decision: value >= 0.5 ? "Compro" : "No compro",
      };
    },
    formatInput(x) {
      return `${x} ${x === 1 ? "producto" : "productos"}`;
    },
    formatOutput(value) {
      return `${(value * 100).toFixed(1)}%`;
    },
    formatTick(value, axis) {
      if (axis === "y") return value.toFixed(value === 0 || value === 1 ? 0 : 2);
      return String(value);
    },
    formatTableY(value) {
      return value === 1 ? "1 - compro" : "0 - no compro";
    },
  },
  linear: {
    title: "Regresion lineal",
    subtitle: "h_w(x) estima los ingresos segun la inversion en anuncios.",
    modelBadge: "Prediccion",
    targetBadge: "Ingresos en soles",
    equationPill: "h_w(x) = w_0 + w_1x",
    xLabel: "Inversion en anuncios",
    inputMetricLabel: "x: inversion en anuncios",
    outputMetricLabel: "h_w(x): ingresos estimados",
    decisionMetricLabel: "Interpretacion",
    xDescription: "Inversion en anuncios en soles",
    yDescription: "Total de ingresos en soles",
    dataNote: "Cada punto representa un periodo con anuncios.",
    tableXHeader: "Inversion en anuncios",
    tableYHeader: "Ingresos",
    xAxisLabel: "Inversion en anuncios (S/)",
    yAxisLabel: "Total de ingresos (S/)",
    xMin: 0,
    xMax: 1200,
    yMin: 0,
    yMax: 6500,
    step: 50,
    defaultX: 600,
    xTicks: [0, 300, 600, 900, 1200],
    yTicks: [0, 1500, 3000, 4500, 6000],
    weights: { w0: 450, w1: 4.8 },
    data: [
      { x: 0, y: 280 },
      { x: 100, y: 860 },
      { x: 200, y: 690 },
      { x: 350, y: 1980 },
      { x: 500, y: 1560 },
      { x: 650, y: 3820 },
      { x: 800, y: 3210 },
      { x: 950, y: 5120 },
      { x: 1100, y: 6240 },
      { x: 1200, y: 5480 },
    ],
    predict(x) {
      const value = this.weights.w0 + this.weights.w1 * x;

      return {
        value,
        decision: `Por cada S/ 1 adicional, el modelo suma S/ ${this.weights.w1.toFixed(2)} de ingresos.`,
      };
    },
    formatInput(x) {
      return formatSoles(x);
    },
    formatOutput(value) {
      return formatSoles(value);
    },
    formatTick(value, axis) {
      if (axis === "x") return `S/${formatPlain(value)}`;
      return `S/${formatPlain(value)}`;
    },
    formatTableY(value) {
      return formatSoles(value);
    },
  },
};

const state = {
  problem: "logistic",
  x: examples.logistic.defaultX,
};

const chartWidth = 920;
const chartHeight = 560;
const margin = { top: 42, right: 54, bottom: 82, left: 86 };
const plotWidth = chartWidth - margin.left - margin.right;
const plotHeight = chartHeight - margin.top - margin.bottom;
const svgNamespace = "http://www.w3.org/2000/svg";

const problemType = document.getElementById("problemType");
const xRange = document.getElementById("xRange");
const xNumber = document.getElementById("xNumber");
const resetExample = document.getElementById("resetExample");
const modelBadge = document.getElementById("modelBadge");
const targetBadge = document.getElementById("targetBadge");
const xLabel = document.getElementById("xLabel");
const chartTitle = document.getElementById("chartTitle");
const chartSubtitle = document.getElementById("chartSubtitle");
const equationPill = document.getElementById("equationPill");
const modelChart = document.getElementById("modelChart");
const inputMetricLabel = document.getElementById("inputMetricLabel");
const inputMetric = document.getElementById("inputMetric");
const outputMetricLabel = document.getElementById("outputMetricLabel");
const outputMetric = document.getElementById("outputMetric");
const decisionMetricLabel = document.getElementById("decisionMetricLabel");
const decisionMetric = document.getElementById("decisionMetric");
const formulaLine = document.getElementById("formulaLine");
const calculationLine = document.getElementById("calculationLine");
const xDescription = document.getElementById("xDescription");
const yDescription = document.getElementById("yDescription");
const dataNote = document.getElementById("dataNote");
const tableXHeader = document.getElementById("tableXHeader");
const tableYHeader = document.getElementById("tableYHeader");
const dataRows = document.getElementById("dataRows");

function formatPlain(value) {
  return Number(value).toLocaleString("es-PE", {
    maximumFractionDigits: 0,
  });
}

function formatSoles(value) {
  return `S/ ${formatPlain(Math.round(value))}`;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function svgEl(tag, attributes = {}, text = "") {
  const element = document.createElementNS(svgNamespace, tag);

  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });

  if (text) {
    element.textContent = text;
  }

  return element;
}

function createScale(example) {
  return {
    x(value) {
      return (
        margin.left +
        ((value - example.xMin) / (example.xMax - example.xMin)) * plotWidth
      );
    },
    y(value) {
      return (
        chartHeight -
        margin.bottom -
        ((value - example.yMin) / (example.yMax - example.yMin)) * plotHeight
      );
    },
  };
}

function drawAxes(example, scale) {
  const plotLeft = margin.left;
  const plotRight = chartWidth - margin.right;
  const plotTop = margin.top;
  const plotBottom = chartHeight - margin.bottom;

  example.yTicks.forEach((tick) => {
    const y = scale.y(tick);
    modelChart.appendChild(
      svgEl("line", {
        class: "grid-line",
        x1: plotLeft,
        y1: y,
        x2: plotRight,
        y2: y,
      }),
    );
    modelChart.appendChild(
      svgEl(
        "text",
        {
          class: "tick-label",
          x: plotLeft - 14,
          y: y + 4,
          "text-anchor": "end",
        },
        example.formatTick(tick, "y"),
      ),
    );
  });

  example.xTicks.forEach((tick) => {
    const x = scale.x(tick);
    modelChart.appendChild(
      svgEl("line", {
        class: "grid-line",
        x1: x,
        y1: plotTop,
        x2: x,
        y2: plotBottom,
      }),
    );
    modelChart.appendChild(
      svgEl(
        "text",
        {
          class: "tick-label",
          x,
          y: plotBottom + 28,
          "text-anchor": "middle",
        },
        example.formatTick(tick, "x"),
      ),
    );
  });

  modelChart.appendChild(
    svgEl("line", {
      class: "axis",
      x1: plotLeft,
      y1: plotBottom,
      x2: plotRight,
      y2: plotBottom,
    }),
  );
  modelChart.appendChild(
    svgEl("line", {
      class: "axis",
      x1: plotLeft,
      y1: plotTop,
      x2: plotLeft,
      y2: plotBottom,
    }),
  );

  modelChart.appendChild(
    svgEl(
      "text",
      {
        class: "axis-label",
        x: plotLeft + plotWidth / 2,
        y: chartHeight - 26,
        "text-anchor": "middle",
      },
      example.xAxisLabel,
    ),
  );

  modelChart.appendChild(
    svgEl(
      "text",
      {
        class: "axis-label",
        x: 28,
        y: plotTop + plotHeight / 2,
        transform: `rotate(-90 28 ${plotTop + plotHeight / 2})`,
        "text-anchor": "middle",
      },
      example.yAxisLabel,
    ),
  );
}

function pathFromPoints(points) {
  return points
    .map((point, index) => {
      const command = index === 0 ? "M" : "L";
      return `${command} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
    })
    .join(" ");
}

function drawModel(example, scale) {
  if (state.problem === "logistic") {
    const samples = Array.from({ length: 121 }, (_, index) => {
      const x = example.xMin + ((example.xMax - example.xMin) * index) / 120;
      return { x: scale.x(x), y: scale.y(example.predict(x).value) };
    });
    const boundary = -example.weights.w0 / example.weights.w1;
    const boundaryX = scale.x(boundary);

    modelChart.appendChild(
      svgEl("path", {
        class: "model-line",
        d: pathFromPoints(samples),
      }),
    );

    modelChart.appendChild(
      svgEl("line", {
        class: "decision-boundary",
        x1: boundaryX,
        y1: margin.top,
        x2: boundaryX,
        y2: chartHeight - margin.bottom,
      }),
    );
    modelChart.appendChild(
      svgEl(
        "text",
        {
          class: "guide-label",
          x: boundaryX + 10,
          y: margin.top + 18,
        },
        "umbral 0.5",
      ),
    );
    return;
  }

  const linePoints = [example.xMin, example.xMax].map((x) => ({
    x: scale.x(x),
    y: scale.y(example.predict(x).value),
  }));

  modelChart.appendChild(
    svgEl("path", {
      class: "model-line",
      d: pathFromPoints(linePoints),
    }),
  );
}

function drawData(example, scale) {
  example.data.forEach((point) => {
    const className =
      state.problem === "logistic"
        ? `training-point ${point.y === 1 ? "positive" : "negative"}`
        : "training-point linear";

    modelChart.appendChild(
      svgEl("circle", {
        class: className,
        cx: scale.x(point.x),
        cy: scale.y(point.y),
        r: 8,
      }),
    );
  });
}

function drawPrediction(example, scale, result) {
  const px = scale.x(state.x);
  const py = scale.y(result.value);
  const plotBottom = chartHeight - margin.bottom;
  const plotLeft = margin.left;

  modelChart.appendChild(
    svgEl("line", {
      class: "guide-line",
      x1: px,
      y1: py,
      x2: px,
      y2: plotBottom,
    }),
  );
  modelChart.appendChild(
    svgEl("line", {
      class: "guide-line",
      x1: plotLeft,
      y1: py,
      x2: px,
      y2: py,
    }),
  );
  modelChart.appendChild(
    svgEl("circle", {
      class: "prediction-point",
      cx: px,
      cy: py,
      r: 10,
    }),
  );

  const label = `${state.problem === "linear" ? "h_w" : "h"}(${formatPlain(state.x)}) = ${example.formatOutput(result.value)}`;
  const useEndAnchor = px > chartWidth - margin.right - 220;
  const labelX = useEndAnchor ? px - 16 : px + 16;
  const labelY = py < margin.top + 26 ? py + 34 : py - 18;

  modelChart.appendChild(
    svgEl(
      "text",
      {
        class: "point-label",
        x: labelX,
        y: labelY,
        "text-anchor": useEndAnchor ? "end" : "start",
      },
      label,
    ),
  );
}

function drawChart(example, result) {
  modelChart.innerHTML = "";
  modelChart.setAttribute(
    "aria-label",
    `${example.title}. ${example.xAxisLabel}. ${example.yAxisLabel}.`,
  );

  const scale = createScale(example);
  drawAxes(example, scale);
  drawModel(example, scale);
  drawData(example, scale);
  drawPrediction(example, scale, result);
}

function renderTable(example) {
  dataRows.innerHTML = example.data
    .map(
      (point) => `
        <tr>
          <td>${state.problem === "linear" ? formatSoles(point.x) : point.x}</td>
          <td>${example.formatTableY(point.y)}</td>
        </tr>
      `,
    )
    .join("");
}

function renderFormula(example, result) {
  const x = formatPlain(state.x);

  if (state.problem === "logistic") {
    const w0 = example.weights.w0.toFixed(2);
    const w1 = example.weights.w1.toFixed(2);
    formulaLine.textContent = `z = w_0 + w_1x = ${w0} + ${w1}(${x})`;
    calculationLine.textContent = `h(x) = 1 / (1 + e^-z) = ${example.formatOutput(result.value)}; z = ${result.z.toFixed(2)}`;
    return;
  }

  const w0 = formatPlain(example.weights.w0);
  const w1 = example.weights.w1.toFixed(2);
  formulaLine.textContent = `h_w(x) = w_0 + w_1x = ${w0} + ${w1}(${x})`;
  calculationLine.textContent = `h_w(${x}) = ${example.formatOutput(result.value)}`;
}

function syncControlAttributes(example) {
  [xRange, xNumber].forEach((input) => {
    input.min = example.xMin;
    input.max = example.xMax;
    input.step = example.step;
    input.value = state.x;
  });
}

function render() {
  const example = examples[state.problem];
  const result = example.predict(state.x);

  problemType.value = state.problem;
  syncControlAttributes(example);
  modelBadge.textContent = example.modelBadge;
  targetBadge.textContent = example.targetBadge;
  xLabel.textContent = example.xLabel;
  chartTitle.textContent = example.title;
  chartSubtitle.textContent = example.subtitle;
  equationPill.textContent = example.equationPill;
  inputMetricLabel.textContent = example.inputMetricLabel;
  outputMetricLabel.textContent = example.outputMetricLabel;
  decisionMetricLabel.textContent = example.decisionMetricLabel;
  inputMetric.textContent = example.formatInput(state.x);
  outputMetric.textContent = example.formatOutput(result.value);
  decisionMetric.textContent = result.decision;
  xDescription.textContent = example.xDescription;
  yDescription.textContent = example.yDescription;
  dataNote.textContent = example.dataNote;
  tableXHeader.textContent = example.tableXHeader;
  tableYHeader.textContent = example.tableYHeader;

  renderFormula(example, result);
  renderTable(example);
  drawChart(example, result);
}

function setX(value) {
  const example = examples[state.problem];
  const parsed = Number.parseFloat(value);
  const fallback = Number.isFinite(parsed) ? parsed : example.defaultX;
  const stepped =
    example.step === 1
      ? Math.round(fallback)
      : Math.round(fallback / example.step) * example.step;

  state.x = clamp(stepped, example.xMin, example.xMax);
  render();
}

problemType.addEventListener("change", (event) => {
  state.problem = event.target.value;
  state.x = examples[state.problem].defaultX;
  render();
});

xRange.addEventListener("input", (event) => {
  setX(event.target.value);
});

xNumber.addEventListener("change", (event) => {
  setX(event.target.value);
});

resetExample.addEventListener("click", () => {
  state.x = examples[state.problem].defaultX;
  render();
});

render();
