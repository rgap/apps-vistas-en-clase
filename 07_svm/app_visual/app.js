const svgNamespace = "http://www.w3.org/2000/svg";

const points = [
  { x: 1.0, y: 1.0, label: -1, className: "abandon", text: "Abandonar" },
  { x: 1.4, y: 1.8, label: -1, className: "abandon", text: "Abandonar" },
  { x: 2.0, y: 1.2, label: -1, className: "abandon", text: "Abandonar" },
  { x: 2.4, y: 2.3, label: -1, className: "abandon", text: "Abandonar" },
  { x: 3.0, y: 1.6, label: -1, className: "abandon", text: "Abandonar" },
  { x: 3.2, y: 2.8, label: -1, className: "abandon", text: "Abandonar" },
  { x: 4.0, y: 4.8, label: 1, className: "buy", text: "Comprar" },
  { x: 4.5, y: 4.0, label: 1, className: "buy", text: "Comprar" },
  { x: 4.9, y: 5.3, label: 1, className: "buy", text: "Comprar" },
  { x: 5.4, y: 4.3, label: 1, className: "buy", text: "Comprar" },
  { x: 5.9, y: 5.5, label: 1, className: "buy", text: "Comprar" },
  { x: 6.3, y: 3.9, label: 1, className: "buy", text: "Comprar" },
];

const presets = {
  "linear-c10": {
    label: "Recta estricta",
    kernel: "linear",
    kernelLabel: "Lineal",
    C: 10,
    gamma: null,
    summary: "Usa una línea recta, pero intenta equivocarse menos.",
    explanation:
      "Sigue siendo una recta, pero ahora la SVM es más estricta con los puntos cercanos.",
    kernelMeaning: "Recta.",
    cMeaning: "Estricto: castiga más los errores.",
    gammaMeaning: "",
  },
  "rbf-c1": {
    label: "Curva flexible",
    kernel: "rbf",
    kernelLabel: "RBF",
    C: 1,
    gamma: 0.8,
    summary: "Permite una frontera curva cuando una recta no alcanza.",
    explanation:
      "La SVM puede doblar la frontera para separar mejor los grupos.",
    kernelMeaning: "Curva.",
    cMeaning: "Intermedio.",
    gammaMeaning: "Más gamma, más curva.",
  },
};

const chart = {
  width: 920,
  height: 600,
  margin: { top: 38, right: 40, bottom: 78, left: 88 },
  xDomain: [0, 7],
  yDomain: [0, 6.4],
  xTicks: [0, 1, 2, 3, 4, 5, 6, 7],
  yTicks: [0, 1, 2, 3, 4, 5, 6],
};

chart.plotWidth = chart.width - chart.margin.left - chart.margin.right;
chart.plotHeight = chart.height - chart.margin.top - chart.margin.bottom;

const state = {
  preset: "linear-c10",
  probe: { x: 4.8, y: 4.6 },
};

const modelPreset = document.getElementById("modelPreset");
const presetSummary = document.getElementById("presetSummary");
const svmChart = document.getElementById("svmChart");
const statusBadge = document.getElementById("statusBadge");
const probeValue = document.getElementById("probeValue");
const predictionValue = document.getElementById("predictionValue");
const predictionHelp = document.getElementById("predictionHelp");
const explanationText = document.getElementById("explanationText");
const kernelMeaningText = document.getElementById("kernelMeaning");
const cMeaningText = document.getElementById("cMeaning");
const gammaItem = document.getElementById("gammaItem");
const gammaMeaningText = document.getElementById("gammaMeaning");

function svgEl(tag, attributes = {}, text = "") {
  const element = document.createElementNS(svgNamespace, tag);

  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });

  if (text) element.textContent = text;
  return element;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function scale(value, domainMin, domainMax, rangeMin, rangeMax) {
  return (
    rangeMin +
    ((value - domainMin) / (domainMax - domainMin)) *
      (rangeMax - rangeMin)
  );
}

function xScale(value) {
  return scale(
    value,
    chart.xDomain[0],
    chart.xDomain[1],
    chart.margin.left,
    chart.margin.left + chart.plotWidth,
  );
}

function yScale(value) {
  return scale(
    value,
    chart.yDomain[0],
    chart.yDomain[1],
    chart.margin.top + chart.plotHeight,
    chart.margin.top,
  );
}

function xInvert(value) {
  return scale(
    value,
    chart.margin.left,
    chart.margin.left + chart.plotWidth,
    chart.xDomain[0],
    chart.xDomain[1],
  );
}

function yInvert(value) {
  return scale(
    value,
    chart.margin.top + chart.plotHeight,
    chart.margin.top,
    chart.yDomain[0],
    chart.yDomain[1],
  );
}

function formatNumber(value, digits = 2) {
  return value.toFixed(digits).replace(/\.?0+$/, "");
}

function buildStats(dataset) {
  const meanX =
    dataset.reduce((total, point) => total + point.x, 0) / dataset.length;
  const meanY =
    dataset.reduce((total, point) => total + point.y, 0) / dataset.length;
  const varianceX =
    dataset.reduce((total, point) => total + (point.x - meanX) ** 2, 0) /
    dataset.length;
  const varianceY =
    dataset.reduce((total, point) => total + (point.y - meanY) ** 2, 0) /
    dataset.length;

  return {
    meanX,
    meanY,
    stdX: Math.sqrt(varianceX) || 1,
    stdY: Math.sqrt(varianceY) || 1,
  };
}

const stats = buildStats(points);

function normalizePoint(point) {
  return [
    (point.x - stats.meanX) / stats.stdX,
    (point.y - stats.meanY) / stats.stdY,
  ];
}

const trainingX = points.map(normalizePoint);
const trainingY = points.map((point) => point.label);

function dot(first, second) {
  return first[0] * second[0] + first[1] * second[1];
}

function squaredDistance(first, second) {
  return (first[0] - second[0]) ** 2 + (first[1] - second[1]) ** 2;
}

function makeKernel(preset) {
  if (preset.kernel === "linear") {
    return (first, second) => dot(first, second);
  }

  return (first, second) =>
    Math.exp(-preset.gamma * squaredDistance(first, second));
}

function precomputeKernelMatrix(dataset, kernel) {
  return dataset.map((first) => dataset.map((second) => kernel(first, second)));
}

function trainSvm(preset) {
  const kernel = makeKernel(preset);
  const kernelMatrix = precomputeKernelMatrix(trainingX, kernel);
  const count = trainingX.length;
  const alphas = new Array(count).fill(0);
  let b = 0;
  let passes = 0;
  let iteration = 0;
  const tolerance = 0.0008;
  const eps = 0.00001;
  const maxPasses = 80;
  const maxIterations = 20000;

  function scoreAtIndex(index) {
    let score = b;
    for (let i = 0; i < count; i += 1) {
      if (alphas[i] > 0) score += alphas[i] * trainingY[i] * kernelMatrix[i][index];
    }
    return score;
  }

  function errorAtIndex(index) {
    return scoreAtIndex(index) - trainingY[index];
  }

  function candidateIndices(i, Ei) {
    return [...Array(count).keys()]
      .filter((index) => index !== i)
      .map((index) => ({
        index,
        distance: Math.abs(Ei - errorAtIndex(index)),
        active: alphas[index] > eps && alphas[index] < preset.C - eps,
      }))
      .sort((first, second) => {
        if (first.active !== second.active) return first.active ? -1 : 1;
        return second.distance - first.distance;
      })
      .map((candidate) => candidate.index);
  }

  while (passes < maxPasses && iteration < maxIterations) {
    let changed = 0;

    for (let i = 0; i < count; i += 1) {
      const Ei = errorAtIndex(i);
      const yiEi = trainingY[i] * Ei;

      if (
        !(
          (yiEi < -tolerance && alphas[i] < preset.C - eps) ||
          (yiEi > tolerance && alphas[i] > eps)
        )
      ) {
        continue;
      }

      const candidates = candidateIndices(i, Ei);

      for (const j of candidates) {
        const Ej = errorAtIndex(j);
        const oldAlphaI = alphas[i];
        const oldAlphaJ = alphas[j];

        let lower = 0;
        let upper = 0;

        if (trainingY[i] !== trainingY[j]) {
          lower = Math.max(0, oldAlphaJ - oldAlphaI);
          upper = Math.min(preset.C, preset.C + oldAlphaJ - oldAlphaI);
        } else {
          lower = Math.max(0, oldAlphaI + oldAlphaJ - preset.C);
          upper = Math.min(preset.C, oldAlphaI + oldAlphaJ);
        }

        if (Math.abs(lower - upper) < eps) continue;

        const eta =
          2 * kernelMatrix[i][j] - kernelMatrix[i][i] - kernelMatrix[j][j];

        if (eta >= -eps) continue;

        alphas[j] = oldAlphaJ - (trainingY[j] * (Ei - Ej)) / eta;
        alphas[j] = clamp(alphas[j], lower, upper);

        if (Math.abs(alphas[j] - oldAlphaJ) < eps) {
          alphas[j] = oldAlphaJ;
          continue;
        }

        alphas[i] =
          oldAlphaI + trainingY[i] * trainingY[j] * (oldAlphaJ - alphas[j]);

        const b1 =
          b -
          Ei -
          trainingY[i] * (alphas[i] - oldAlphaI) * kernelMatrix[i][i] -
          trainingY[j] * (alphas[j] - oldAlphaJ) * kernelMatrix[i][j];
        const b2 =
          b -
          Ej -
          trainingY[i] * (alphas[i] - oldAlphaI) * kernelMatrix[i][j] -
          trainingY[j] * (alphas[j] - oldAlphaJ) * kernelMatrix[j][j];

        if (alphas[i] > eps && alphas[i] < preset.C - eps) {
          b = b1;
        } else if (alphas[j] > eps && alphas[j] < preset.C - eps) {
          b = b2;
        } else {
          b = (b1 + b2) / 2;
        }

        changed += 1;
        break;
      }
    }

    passes = changed === 0 ? passes + 1 : 0;
    iteration += 1;
  }

  const supportIndices = alphas
    .map((alpha, index) => ({ alpha, index }))
    .filter(({ alpha }) => alpha > 0.0001)
    .map(({ index }) => index);

  function decision(rawPoint) {
    const normalized = normalizePoint(rawPoint);
    let score = b;

    for (let i = 0; i < count; i += 1) {
      if (alphas[i] > 0.0000001) {
        score += alphas[i] * trainingY[i] * kernel(trainingX[i], normalized);
      }
    }

    return score;
  }

  return {
    preset,
    alphas,
    b,
    supportIndices,
    decision,
    iterations: iteration,
  };
}

const models = Object.fromEntries(
  Object.entries(presets).map(([key, preset]) => [key, trainSvm(preset)]),
);

function activePreset() {
  return presets[state.preset];
}

function activeModel() {
  return models[state.preset];
}

function appendDefs() {
  const defs = svgEl("defs");

  const clipPath = svgEl("clipPath", { id: "plotClip" });
  clipPath.append(
    svgEl("rect", {
      x: chart.margin.left,
      y: chart.margin.top,
      width: chart.plotWidth,
      height: chart.plotHeight,
    }),
  );

  defs.append(clipPath);
  svmChart.append(defs);
}

function drawAxes() {
  chart.xTicks.forEach((tick) => {
    const x = xScale(tick);
    svmChart.append(
      svgEl("line", {
        class: "grid-line",
        x1: x,
        y1: chart.margin.top,
        x2: x,
        y2: chart.margin.top + chart.plotHeight,
      }),
    );
    svmChart.append(
      svgEl("text", {
        class: "tick-label",
        x,
        y: chart.margin.top + chart.plotHeight + 28,
        "text-anchor": "middle",
      }, String(tick)),
    );
  });

  chart.yTicks.forEach((tick) => {
    const y = yScale(tick);
    svmChart.append(
      svgEl("line", {
        class: "grid-line",
        x1: chart.margin.left,
        y1: y,
        x2: chart.margin.left + chart.plotWidth,
        y2: y,
      }),
    );
    svmChart.append(
      svgEl("text", {
        class: "tick-label",
        x: chart.margin.left - 18,
        y: y + 4,
        "text-anchor": "end",
      }, String(tick)),
    );
  });

  svmChart.append(
    svgEl("line", {
      class: "axis",
      x1: chart.margin.left,
      y1: chart.margin.top + chart.plotHeight,
      x2: chart.margin.left + chart.plotWidth,
      y2: chart.margin.top + chart.plotHeight,
    }),
  );
  svmChart.append(
    svgEl("line", {
      class: "axis",
      x1: chart.margin.left,
      y1: chart.margin.top,
      x2: chart.margin.left,
      y2: chart.margin.top + chart.plotHeight,
    }),
  );

  svmChart.append(
    svgEl("text", {
      class: "axis-label",
      x: chart.margin.left + chart.plotWidth / 2,
      y: chart.height - 22,
      "text-anchor": "middle",
    }, "clics"),
  );

  const yLabel = svgEl("text", {
    class: "axis-label",
    x: 22,
    y: chart.margin.top + chart.plotHeight / 2,
    transform: `rotate(-90 22 ${chart.margin.top + chart.plotHeight / 2})`,
    "text-anchor": "middle",
  }, "duración");
  svmChart.append(yLabel);
}

function computeGrid(model, columns = 86, rows = 72) {
  const values = [];

  for (let row = 0; row <= rows; row += 1) {
    const y =
      chart.yDomain[0] +
      ((chart.yDomain[1] - chart.yDomain[0]) * row) / rows;
    const line = [];

    for (let column = 0; column <= columns; column += 1) {
      const x =
        chart.xDomain[0] +
        ((chart.xDomain[1] - chart.xDomain[0]) * column) / columns;
      line.push({ x, y, value: model.decision({ x, y }) });
    }

    values.push(line);
  }

  return { values, columns, rows };
}

function drawDecisionRegions(grid) {
  const cellWidth = chart.plotWidth / grid.columns;
  const cellHeight = chart.plotHeight / grid.rows;
  const group = svgEl("g", { "clip-path": "url(#plotClip)" });

  for (let row = 0; row < grid.rows; row += 1) {
    for (let column = 0; column < grid.columns; column += 1) {
      const average =
        (grid.values[row][column].value +
          grid.values[row][column + 1].value +
          grid.values[row + 1][column].value +
          grid.values[row + 1][column + 1].value) /
        4;

      group.append(
        svgEl("rect", {
          class: average >= 0 ? "region-buy" : "region-abandon",
          x: chart.margin.left + column * cellWidth,
          y: chart.margin.top + chart.plotHeight - (row + 1) * cellHeight,
          width: cellWidth + 0.8,
          height: cellHeight + 0.8,
        }),
      );
    }
  }

  svmChart.append(group);
}

function interpolate(first, second, level) {
  const denominator = second.value - first.value;
  const ratio =
    Math.abs(denominator) < 0.0000001
      ? 0.5
      : (level - first.value) / denominator;

  return {
    x: first.x + (second.x - first.x) * ratio,
    y: first.y + (second.y - first.y) * ratio,
  };
}

function contourSegments(grid, level) {
  const segments = [];

  for (let row = 0; row < grid.rows; row += 1) {
    for (let column = 0; column < grid.columns; column += 1) {
      const bottomLeft = grid.values[row][column];
      const bottomRight = grid.values[row][column + 1];
      const topRight = grid.values[row + 1][column + 1];
      const topLeft = grid.values[row + 1][column];
      const corners = [bottomLeft, bottomRight, topRight, topLeft];
      const edges = [
        [bottomLeft, bottomRight],
        [bottomRight, topRight],
        [topRight, topLeft],
        [topLeft, bottomLeft],
      ];
      const intersections = [];

      if (corners.every((corner) => Math.abs(corner.value - level) < 0.000001)) {
        continue;
      }

      edges.forEach(([first, second]) => {
        const firstValue = first.value - level;
        const secondValue = second.value - level;

        if (firstValue === 0 && secondValue === 0) return;
        if (firstValue === 0 || firstValue * secondValue < 0) {
          intersections.push(interpolate(first, second, level));
        } else if (secondValue === 0) {
          intersections.push(interpolate(first, second, level));
        }
      });

      if (intersections.length === 2) {
        segments.push([intersections[0], intersections[1]]);
      } else if (intersections.length === 4) {
        segments.push([intersections[0], intersections[1]]);
        segments.push([intersections[2], intersections[3]]);
      }
    }
  }

  return segments;
}

function drawContours(grid, level, className) {
  const group = svgEl("g", { "clip-path": "url(#plotClip)" });
  const segments = contourSegments(grid, level);

  segments.forEach(([first, second]) => {
    group.append(
      svgEl("line", {
        class: className,
        x1: xScale(first.x),
        y1: yScale(first.y),
        x2: xScale(second.x),
        y2: yScale(second.y),
      }),
    );
  });

  svmChart.append(group);
}

function drawDataPoints() {
  points.forEach((point) => {
    svmChart.append(
      svgEl("circle", {
        class: `data-point ${point.className}`,
        cx: xScale(point.x),
        cy: yScale(point.y),
        r: 8.5,
      }),
    );
  });
}

function drawProbe(model) {
  const score = model.decision(state.probe);
  const predictedClass = score >= 0 ? "buy" : "abandon";

  svmChart.append(
    svgEl("circle", {
      class: "probe-guide",
      cx: xScale(state.probe.x),
      cy: yScale(state.probe.y),
      r: 21,
    }),
  );
  svmChart.append(
    svgEl("circle", {
      class: "probe-point",
      cx: xScale(state.probe.x),
      cy: yScale(state.probe.y),
      r: 9,
    }),
  );

  return { score, predictedClass };
}

function describePrediction(score, predictedLabel) {
  const distance = Math.abs(score);

  return distance < 0.35
    ? `Está cerca de la frontera, así que la decisión no es tan clara.`
    : `Está del lado de ${predictedLabel.toLowerCase()}.`;
}

function updatePanel(probeResult) {
  const preset = activePreset();
  const predictedLabel =
    probeResult.predictedClass === "buy" ? "Comprar" : "Abandonar";

  presetSummary.textContent = preset.summary;
  statusBadge.textContent = predictedLabel;
  statusBadge.className = `status-badge ${probeResult.predictedClass}`;
  probeValue.textContent = `clics = ${formatNumber(
    state.probe.x,
    1,
  )}, duración = ${formatNumber(state.probe.y, 1)}`;
  predictionValue.textContent = predictedLabel;
  predictionHelp.textContent = describePrediction(
    probeResult.score,
    predictedLabel,
  );
  explanationText.textContent = preset.explanation;
  kernelMeaningText.textContent = preset.kernelMeaning;
  cMeaningText.textContent = preset.cMeaning;
  gammaItem.hidden = preset.gamma === null;
  if (preset.gamma !== null) {
    gammaMeaningText.textContent = preset.gammaMeaning;
  }
}

function render() {
  const model = activeModel();
  const grid = computeGrid(model);

  svmChart.replaceChildren();
  appendDefs();
  drawDecisionRegions(grid);
  drawContours(grid, 0, "boundary-line");
  drawAxes();
  drawDataPoints();
  const probeResult = drawProbe(model);
  updatePanel(probeResult);
}

function handleChartClick(event) {
  const rect = svmChart.getBoundingClientRect();
  const viewX = ((event.clientX - rect.left) / rect.width) * chart.width;
  const viewY = ((event.clientY - rect.top) / rect.height) * chart.height;

  if (
    viewX < chart.margin.left ||
    viewX > chart.margin.left + chart.plotWidth ||
    viewY < chart.margin.top ||
    viewY > chart.margin.top + chart.plotHeight
  ) {
    return;
  }

  state.probe = {
    x: clamp(xInvert(viewX), chart.xDomain[0], chart.xDomain[1]),
    y: clamp(yInvert(viewY), chart.yDomain[0], chart.yDomain[1]),
  };

  render();
}

modelPreset.addEventListener("change", () => {
  state.preset = modelPreset.value;
  render();
});

svmChart.addEventListener("click", handleChartClick);

render();
