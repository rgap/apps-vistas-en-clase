let examples = {};

const state = {
  problem: "logistic",
  x: 0,
  requestId: 0,
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

function formatInput(value) {
  if (state.problem === "linear") return formatSoles(value);
  return `${value} ${value === 1 ? "producto" : "productos"}`;
}

function formatOutput(value) {
  if (state.problem === "linear") return formatSoles(value);
  return `${(value * 100).toFixed(1)}%`;
}

function formatTick(value, axis) {
  if (state.problem === "linear") return `S/${formatPlain(value)}`;
  if (axis === "y") {
    return value.toFixed(value === 0 || value === 1 ? 0 : 2);
  }
  return String(value);
}

function formatTableY(value) {
  if (state.problem === "linear") return formatSoles(value);
  return value === 1 ? "1 - compro" : "0 - no compro";
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function svgEl(tag, attributes = {}, text = "") {
  const element = document.createElementNS(svgNamespace, tag);

  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });

  if (text) element.textContent = text;
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
        formatTick(tick, "y"),
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
        formatTick(tick, "x"),
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
  const curve = example.curve.map((point) => ({
    x: scale.x(point.x),
    y: scale.y(point.y),
  }));

  modelChart.appendChild(
    svgEl("path", {
      class: "model-line",
      d: pathFromPoints(curve),
    }),
  );

  if (state.problem !== "logistic") return;

  const boundary = -example.weights.w0 / example.weights.w1;
  const boundaryX = scale.x(boundary);
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
  const px = scale.x(result.x);
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

  const functionName = state.problem === "linear" ? "h_w" : "h";
  const label = `${functionName}(${formatPlain(result.x)}) = ${formatOutput(result.value)}`;
  const useEndAnchor = px > chartWidth - margin.right - 220;

  modelChart.appendChild(
    svgEl(
      "text",
      {
        class: "point-label",
        x: useEndAnchor ? px - 16 : px + 16,
        y: py < margin.top + 26 ? py + 34 : py - 18,
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
          <td>${formatTableY(point.y)}</td>
        </tr>
      `,
    )
    .join("");
}

function renderFormula(example, result) {
  const x = formatPlain(result.x);
  const w0 = example.weights.w0.toFixed(2);
  const w1 = example.weights.w1.toFixed(2);

  if (state.problem === "logistic") {
    formulaLine.textContent = `z = w_0 + w_1x = ${w0} + ${w1}(${x})`;
    calculationLine.textContent = `h(x) = 1 / (1 + e^-z) = ${formatOutput(result.value)}; z = ${result.z.toFixed(2)}`;
    return;
  }

  formulaLine.textContent = `h_w(x) = w_0 + w_1x = ${w0} + ${w1}(${x})`;
  calculationLine.textContent = `h_w(${x}) = ${formatOutput(result.value)}`;
}

function syncControlAttributes(example) {
  [xRange, xNumber].forEach((input) => {
    input.min = example.xMin;
    input.max = example.xMax;
    input.step = example.step;
    input.value = state.x;
  });
}

function renderMetadata(example) {
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
  xDescription.textContent = example.xDescription;
  yDescription.textContent = example.yDescription;
  dataNote.textContent = example.dataNote;
  tableXHeader.textContent = example.tableXHeader;
  tableYHeader.textContent = example.tableYHeader;
  renderTable(example);
}

function renderPrediction(example, result) {
  state.x = result.x;
  syncControlAttributes(example);
  inputMetric.textContent = formatInput(result.x);
  outputMetric.textContent = formatOutput(result.value);
  decisionMetric.textContent = result.decision;
  renderFormula(example, result);
  drawChart(example, result);
}

async function requestPrediction() {
  const requestId = ++state.requestId;
  const example = examples[state.problem];
  const response = await fetch(
    `/api/predict/${state.problem}?x=${encodeURIComponent(state.x)}`,
  );

  if (!response.ok) {
    throw new Error("No se pudo calcular la prediccion.");
  }

  const result = await response.json();
  if (requestId !== state.requestId) return;
  renderPrediction(example, result);
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
  syncControlAttributes(example);
  requestPrediction().catch(showError);
}

function showError(error) {
  outputMetric.textContent = "-";
  decisionMetric.textContent = error.message;
}

async function initialize() {
  try {
    const response = await fetch("/api/examples");
    if (!response.ok) throw new Error("No se pudieron cargar los modelos.");

    examples = await response.json();
    state.x = examples[state.problem].defaultX;
    renderMetadata(examples[state.problem]);
    await requestPrediction();
  } catch (error) {
    showError(error);
  }
}

problemType.addEventListener("change", (event) => {
  state.problem = event.target.value;
  state.x = examples[state.problem].defaultX;
  renderMetadata(examples[state.problem]);
  requestPrediction().catch(showError);
});

xRange.addEventListener("input", (event) => {
  setX(event.target.value);
});

xNumber.addEventListener("change", (event) => {
  setX(event.target.value);
});

resetExample.addEventListener("click", () => {
  setX(examples[state.problem].defaultX);
});

initialize();
