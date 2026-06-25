const svgNamespace = "http://www.w3.org/2000/svg";

function lossUnimodal1d(w) {
  return (w - 2) ** 2 + 1;
}

function gradientUnimodal1d(w) {
  return 2 * (w - 2);
}

function lossMultimodal1d(w) {
  return 0.03 * (w * w - 9) ** 2 + 0.25 * w + 2.2;
}

function gradientMultimodal1d(w) {
  return 0.12 * w * (w * w - 9) + 0.25;
}

function secondDerivativeMultimodal1d(w) {
  return 0.36 * w * w - 1.08;
}

function lossUnimodal2d(x, y) {
  return (x - 1) ** 2 + 1.3 * (y + 1) ** 2;
}

function gradientUnimodal2d(x, y) {
  return {
    x: 2 * (x - 1),
    y: 2.6 * (y + 1),
  };
}

function lossMultimodal2d(x, y) {
  return lossMultimodal1d(x) + (y + 1) ** 2;
}

function gradientMultimodal2d(x, y) {
  return {
    x: gradientMultimodal1d(x),
    y: 2 * (y + 1),
  };
}

function findMultimodalMinima() {
  const roots = [];
  const min = -5.5;
  const max = 5.5;
  const steps = 500;
  let previousX = min;
  let previousValue = gradientMultimodal1d(previousX);

  for (let index = 1; index <= steps; index += 1) {
    const x = min + ((max - min) * index) / steps;
    const value = gradientMultimodal1d(x);

    if (previousValue * value < 0) {
      let left = previousX;
      let right = x;

      for (let iteration = 0; iteration < 50; iteration += 1) {
        const middle = (left + right) / 2;
        const middleValue = gradientMultimodal1d(middle);

        if (gradientMultimodal1d(left) * middleValue <= 0) {
          right = middle;
        } else {
          left = middle;
        }
      }

      const root = (left + right) / 2;
      if (secondDerivativeMultimodal1d(root) > 0) roots.push(root);
    }

    previousX = x;
    previousValue = value;
  }

  return roots
    .map((w) => ({ w, loss: lossMultimodal1d(w) }))
    .sort((first, second) => first.loss - second.loss)
    .map((minimum, index) => ({
      ...minimum,
      type: index === 0 ? "global" : "local",
    }));
}

const multimodalMinima = findMultimodalMinima();

const modes = {
  "1d-unimodal": {
    dimension: 1,
    modal: "unimodal",
    stage: "Una dimensión · Función unimodal",
    title: "Una función con un solo mínimo",
    subtitle: "Haz clic sobre la curva para seleccionar el valor inicial de w.",
    formula: "L(w) = (w - 2)² + 1",
    loss: lossUnimodal1d,
    gradient: gradientUnimodal1d,
    xDomain: [-5, 6],
    yDomain: [0, 52],
    xTicks: [-4, -2, 0, 2, 4, 6],
    yTicks: [0, 10, 20, 30, 40, 50],
    rates: { short: 0.08, balanced: 0.2, large: 0.38 },
    minima: [{ w: 2, loss: 1, type: "global" }],
  },
  "1d-multimodal": {
    dimension: 1,
    modal: "multimodal",
    stage: "Una dimensión · Función multimodal",
    title: "Una función con dos mínimos",
    subtitle:
      "El inicio decide si el descenso llega al mínimo global o al mínimo local.",
    formula: "L(w) = 0.03(w² - 9)² + 0.25w + 2.2",
    loss: lossMultimodal1d,
    gradient: gradientMultimodal1d,
    xDomain: [-5.5, 5.5],
    yDomain: [0, 16],
    xTicks: [-5, -3, -1, 1, 3, 5],
    yTicks: [0, 4, 8, 12, 16],
    rates: { short: 0.04, balanced: 0.1, large: 0.18 },
    minima: multimodalMinima,
  },
  "2d-unimodal": {
    dimension: 2,
    modal: "unimodal",
    stage: "Dos dimensiones · Función unimodal",
    title: "Una superficie con un solo mínimo",
    subtitle:
      "Haz clic en el plano para seleccionar los valores iniciales de w₁ y w₂.",
    formula: "L(w₁, w₂) = (w₁ - 1)² + 1.3(w₂ + 1)²",
    loss: lossUnimodal2d,
    gradient: gradientUnimodal2d,
    xDomain: [-5, 5],
    yDomain: [-5, 5],
    xTicks: [-4, -2, 0, 2, 4],
    yTicks: [-4, -2, 0, 2, 4],
    rates: { short: 0.08, balanced: 0.2, large: 0.38 },
    minima: [{ x: 1, y: -1, loss: 0, type: "global" }],
    contourLevels: [3, 8, 18, 32],
    heatRange: [0, 55],
  },
  "2d-multimodal": {
    dimension: 2,
    modal: "multimodal",
    stage: "Dos dimensiones · Función multimodal",
    title: "Una superficie con dos valles",
    subtitle:
      "El punto inicial determina si el recorrido termina en el valle global o local.",
    formula: "L(w₁, w₂) = 0.03(w₁² - 9)² + 0.25w₁ + (w₂ + 1)² + 2.2",
    loss: lossMultimodal2d,
    gradient: gradientMultimodal2d,
    xDomain: [-5.5, 5.5],
    yDomain: [-5, 5],
    xTicks: [-5, -3, -1, 1, 3, 5],
    yTicks: [-4, -2, 0, 2, 4],
    rates: { short: 0.04, balanced: 0.1, large: 0.18 },
    minima: multimodalMinima.map((minimum) => ({
      x: minimum.w,
      y: -1,
      loss: minimum.loss,
      type: minimum.type,
    })),
    contourLevels: [
      multimodalMinima[0].loss + 0.8,
      multimodalMinima[0].loss + 2.2,
      multimodalMinima[0].loss + 5,
      multimodalMinima[0].loss + 10,
      multimodalMinima[0].loss + 20,
    ],
    heatRange: [multimodalMinima[0].loss, 48],
  },
};

const state = {
  mode: "1d-unimodal",
  rate: "balanced",
  histories: Object.fromEntries(Object.keys(modes).map((key) => [key, []])),
  running: false,
  timer: null,
  lastUpdate: null,
};

const chart = {
  width: 920,
  height: 600,
  margin: { top: 40, right: 42, bottom: 78, left: 88 },
};

chart.plotWidth = chart.width - chart.margin.left - chart.margin.right;
chart.plotHeight = chart.height - chart.margin.top - chart.margin.bottom;

const gradientChart = document.getElementById("gradientChart");
const learningRate = document.getElementById("learningRate");
const stepButton = document.getElementById("stepButton");
const runButton = document.getElementById("runButton");
const resetButton = document.getElementById("resetButton");
const scenarioButtons = document.querySelectorAll(".scenario-button");
const stageLabel = document.getElementById("stageLabel");
const chartTitle = document.getElementById("chartTitle");
const chartSubtitle = document.getElementById("chartSubtitle");
const formulaPill = document.getElementById("formulaPill");
const localLegend = document.getElementById("localLegend");
const statusBadge = document.getElementById("statusBadge");
const iterationValue = document.getElementById("iterationValue");
const positionLabel = document.getElementById("positionLabel");
const positionValue = document.getElementById("positionValue");
const lossValue = document.getElementById("lossValue");
const gradientLabel = document.getElementById("gradientLabel");
const gradientValue = document.getElementById("gradientValue");
const updateFormula = document.getElementById("updateFormula");
const updateCalculation = document.getElementById("updateCalculation");
const explanationTitle = document.getElementById("explanationTitle");
const explanationText = document.getElementById("explanationText");

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

function currentMode() {
  return modes[state.mode];
}

function currentHistory() {
  return state.histories[state.mode];
}

function currentPoint() {
  const history = currentHistory();
  return history.length > 0 ? history[history.length - 1] : null;
}

function selectedStart() {
  return currentHistory().length > 0;
}

function currentAlpha() {
  return currentMode().rates[state.rate];
}

function gradientAt(point) {
  const mode = currentMode();
  return mode.dimension === 1
    ? mode.gradient(point.w)
    : mode.gradient(point.x, point.y);
}

function gradientNorm() {
  const point = currentPoint();
  if (!point) return Infinity;

  const gradient = gradientAt(point);
  return currentMode().dimension === 1
    ? Math.abs(gradient)
    : Math.hypot(gradient.x, gradient.y);
}

function hasConverged() {
  return (
    selectedStart() &&
    (gradientNorm() < 0.02 || currentHistory().length - 1 >= 80)
  );
}

function distanceToMinimum(point, minimum) {
  if (currentMode().dimension === 1) return Math.abs(point.w - minimum.w);
  return Math.hypot(point.x - minimum.x, point.y - minimum.y);
}

function convergenceType() {
  if (!hasConverged()) return null;

  const point = currentPoint();
  const nearest = currentMode().minima
    .map((minimum) => ({
      minimum,
      distance: distanceToMinimum(point, minimum),
    }))
    .sort((first, second) => first.distance - second.distance)[0];

  if (nearest.distance < 0.25) return nearest.minimum.type;
  if (gradientNorm() < 0.02) return "stationary";
  return "stopped";
}

function stopRunning() {
  if (state.timer) window.clearInterval(state.timer);
  state.timer = null;
  state.running = false;
  runButton.textContent = "Ejecutar";
}

function clearStart() {
  stopRunning();
  state.histories[state.mode] = [];
  state.lastUpdate = null;
  render();
}

function chooseStart(x, y = null) {
  stopRunning();
  const mode = currentMode();

  if (mode.dimension === 1) {
    const w = clamp(x, mode.xDomain[0], mode.xDomain[1]);
    state.histories[state.mode] = [{ w, loss: mode.loss(w) }];
  } else {
    const startX = clamp(x, mode.xDomain[0], mode.xDomain[1]);
    const startY = clamp(y, mode.yDomain[0], mode.yDomain[1]);
    state.histories[state.mode] = [
      { x: startX, y: startY, loss: mode.loss(startX, startY) },
    ];
  }

  state.lastUpdate = null;
  render();
}

function takeStep() {
  if (!selectedStart() || hasConverged()) {
    stopRunning();
    render();
    return;
  }

  const mode = currentMode();
  const point = currentPoint();
  const alpha = currentAlpha();

  if (mode.dimension === 1) {
    const gradient = mode.gradient(point.w);
    const nextW = clamp(
      point.w - alpha * gradient,
      mode.xDomain[0],
      mode.xDomain[1],
    );
    state.lastUpdate = {
      mode: state.mode,
      from: point.w,
      gradient,
      to: nextW,
    };
    currentHistory().push({ w: nextW, loss: mode.loss(nextW) });
  } else {
    const gradient = mode.gradient(point.x, point.y);
    const nextX = clamp(
      point.x - alpha * gradient.x,
      mode.xDomain[0],
      mode.xDomain[1],
    );
    const nextY = clamp(
      point.y - alpha * gradient.y,
      mode.yDomain[0],
      mode.yDomain[1],
    );
    state.lastUpdate = {
      mode: state.mode,
      from: { x: point.x, y: point.y },
      gradient,
      to: { x: nextX, y: nextY },
    };
    currentHistory().push({
      x: nextX,
      y: nextY,
      loss: mode.loss(nextX, nextY),
    });
  }

  if (hasConverged()) stopRunning();
  render();
}

function toggleRunning() {
  if (state.running) {
    stopRunning();
    render();
    return;
  }

  if (!selectedStart() || hasConverged()) return;

  state.running = true;
  runButton.textContent = "Pausar";
  takeStep();

  if (state.running) {
    state.timer = window.setInterval(takeStep, 420);
  }
}

function setMode(mode) {
  stopRunning();
  state.mode = mode;
  state.histories[mode] = [];
  state.lastUpdate = null;
  render();
}

function addDefinitions() {
  const definitions = svgEl("defs");

  const arrowhead = svgEl("marker", {
    id: "arrowhead",
    viewBox: "0 0 10 10",
    refX: "8",
    refY: "5",
    markerWidth: "6",
    markerHeight: "6",
    orient: "auto-start-reverse",
  });
  arrowhead.appendChild(
    svgEl("path", { d: "M 0 0 L 10 5 L 0 10 z", fill: "#7c3aed" }),
  );

  const gradientArrow = svgEl("marker", {
    id: "gradientArrow",
    viewBox: "0 0 10 10",
    refX: "8",
    refY: "5",
    markerWidth: "6",
    markerHeight: "6",
    orient: "auto-start-reverse",
  });
  gradientArrow.appendChild(
    svgEl("path", { d: "M 0 0 L 10 5 L 0 10 z", fill: "#ea580c" }),
  );

  const plotClip = svgEl("clipPath", { id: "plotClip" });
  plotClip.appendChild(
    svgEl("rect", {
      x: chart.margin.left,
      y: chart.margin.top,
      width: chart.plotWidth,
      height: chart.plotHeight,
    }),
  );

  definitions.appendChild(arrowhead);
  definitions.appendChild(gradientArrow);
  definitions.appendChild(plotClip);
  gradientChart.appendChild(definitions);
}

function pathFromPoints(points) {
  return points
    .map((point, index) => {
      const command = index === 0 ? "M" : "L";
      return `${command} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
    })
    .join(" ");
}

function createScales(mode) {
  const left = chart.margin.left;
  const right = chart.width - chart.margin.right;
  const top = chart.margin.top;
  const bottom = chart.height - chart.margin.bottom;

  return {
    x(value) {
      return scale(value, mode.xDomain[0], mode.xDomain[1], left, right);
    },
    y(value) {
      return scale(value, mode.yDomain[0], mode.yDomain[1], bottom, top);
    },
    invertX(value) {
      return scale(value, left, right, mode.xDomain[0], mode.xDomain[1]);
    },
    invertY(value) {
      return scale(value, bottom, top, mode.yDomain[0], mode.yDomain[1]);
    },
  };
}

function drawAxes(mode, scales, labels) {
  const left = chart.margin.left;
  const right = chart.width - chart.margin.right;
  const top = chart.margin.top;
  const bottom = chart.height - chart.margin.bottom;

  mode.yTicks.forEach((tick) => {
    const y = scales.y(tick);
    gradientChart.appendChild(
      svgEl("line", {
        class: "grid-line",
        x1: left,
        y1: y,
        x2: right,
        y2: y,
      }),
    );
    gradientChart.appendChild(
      svgEl(
        "text",
        {
          class: "tick-label",
          x: left - 14,
          y: y + 4,
          "text-anchor": "end",
        },
        String(tick),
      ),
    );
  });

  mode.xTicks.forEach((tick) => {
    const x = scales.x(tick);
    gradientChart.appendChild(
      svgEl("line", {
        class: "grid-line",
        x1: x,
        y1: top,
        x2: x,
        y2: bottom,
      }),
    );
    gradientChart.appendChild(
      svgEl(
        "text",
        {
          class: "tick-label",
          x,
          y: bottom + 28,
          "text-anchor": "middle",
        },
        String(tick),
      ),
    );
  });

  gradientChart.appendChild(
    svgEl("line", {
      class: "axis",
      x1: left,
      y1: bottom,
      x2: right,
      y2: bottom,
    }),
  );
  gradientChart.appendChild(
    svgEl("line", {
      class: "axis",
      x1: left,
      y1: top,
      x2: left,
      y2: bottom,
    }),
  );
  gradientChart.appendChild(
    svgEl(
      "text",
      {
        class: "axis-label",
        x: left + chart.plotWidth / 2,
        y: chart.height - 24,
        "text-anchor": "middle",
      },
      labels.x,
    ),
  );
  gradientChart.appendChild(
    svgEl(
      "text",
      {
        class: "axis-label",
        x: 27,
        y: top + chart.plotHeight / 2,
        transform: `rotate(-90 27 ${top + chart.plotHeight / 2})`,
        "text-anchor": "middle",
      },
      labels.y,
    ),
  );
}

function drawHistory(points, getCoordinates) {
  const coordinates = points.map(getCoordinates);

  if (coordinates.length > 1) {
    gradientChart.appendChild(
      svgEl("path", {
        class: "route-line",
        d: pathFromPoints(coordinates),
      }),
    );
  }

  coordinates.forEach((point, index) => {
    gradientChart.appendChild(
      svgEl("circle", {
        class: index === 0 ? "start-point" : "route-point",
        cx: point.x,
        cy: point.y,
        r: index === 0 ? 8 : 6,
      }),
    );
  });
}

function drawMinimum(point, scales, dimension) {
  const x = dimension === 1 ? scales.x(point.w) : scales.x(point.x);
  const y = dimension === 1 ? scales.y(point.loss) : scales.y(point.y);
  const isGlobal = point.type === "global";
  const label = isGlobal ? "mínimo global" : "mínimo local";
  const useEndAnchor =
    (dimension === 1 ? point.w : point.x) >
    (currentMode().xDomain[0] + currentMode().xDomain[1]) / 2;

  gradientChart.appendChild(
    svgEl("circle", {
      class: isGlobal ? "minimum-point" : "local-minimum-point",
      cx: x,
      cy: y,
      r: 10,
    }),
  );
  gradientChart.appendChild(
    svgEl(
      "text",
      {
        class: "chart-label",
        x: useEndAnchor ? x - 14 : x + 14,
        y: y - 14,
        "text-anchor": useEndAnchor ? "end" : "start",
      },
      label,
    ),
  );
}

function drawSelectionPrompt(mode) {
  if (selectedStart()) return;

  const centerX = chart.margin.left + chart.plotWidth / 2;
  const centerY = chart.margin.top + chart.plotHeight / 2;
  const group = svgEl("g", { "pointer-events": "none" });
  group.appendChild(
    svgEl("rect", {
      class: "selection-overlay",
      x: centerX - 180,
      y: centerY - 52,
      width: 360,
      height: 104,
      rx: 12,
    }),
  );
  group.appendChild(
    svgEl(
      "text",
      {
        class: "selection-title",
        x: centerX,
        y: centerY - 8,
        "text-anchor": "middle",
      },
      "Selecciona el punto inicial",
    ),
  );
  group.appendChild(
    svgEl(
      "text",
      {
        class: "selection-subtitle",
        x: centerX,
        y: centerY + 22,
        "text-anchor": "middle",
      },
      mode.dimension === 1
        ? "Haz clic en cualquier posición de la curva"
        : "Haz clic en cualquier posición del plano",
    ),
  );
  gradientChart.appendChild(group);
}

function draw1d(mode) {
  const scales = createScales(mode);
  drawAxes(mode, scales, {
    x: "Valor del parámetro w",
    y: "Pérdida L(w)",
  });

  const curve = Array.from({ length: 220 }, (_, index) => {
    const w =
      mode.xDomain[0] +
      ((mode.xDomain[1] - mode.xDomain[0]) * index) / 219;
    return { x: scales.x(w), y: scales.y(mode.loss(w)) };
  });
  gradientChart.appendChild(
    svgEl("path", {
      class: "loss-curve",
      "clip-path": "url(#plotClip)",
      d: pathFromPoints(curve),
    }),
  );

  mode.minima.forEach((minimum) => drawMinimum(minimum, scales, 1));

  const history = currentHistory();
  const point = currentPoint();

  if (point) {
    const gradient = mode.gradient(point.w);
    const tangentHalfWidth = 1.1;
    const tangent = (w) => point.loss + gradient * (w - point.w);

    gradientChart.appendChild(
      svgEl("line", {
        class: "tangent-line",
        "clip-path": "url(#plotClip)",
        x1: scales.x(point.w - tangentHalfWidth),
        y1: scales.y(tangent(point.w - tangentHalfWidth)),
        x2: scales.x(point.w + tangentHalfWidth),
        y2: scales.y(tangent(point.w + tangentHalfWidth)),
      }),
    );

    drawHistory(history, (item) => ({
      x: scales.x(item.w),
      y: scales.y(item.loss),
    }));
    gradientChart.appendChild(
      svgEl("circle", {
        class: "current-point",
        cx: scales.x(point.w),
        cy: scales.y(point.loss),
        r: 11,
      }),
    );
  }

  drawSelectionPrompt(mode);
}

function heatColor(value, range) {
  const normalized = clamp(
    (value - range[0]) / (range[1] - range[0]),
    0,
    1,
  );
  const hue = 205 - normalized * 165;
  const lightness = 95 - normalized * 32;
  return `hsl(${hue} 78% ${lightness}%)`;
}

function edgeCrossing(first, second, level) {
  const firstValue = first.value - level;
  const secondValue = second.value - level;
  if ((firstValue < 0) === (secondValue < 0)) return null;
  const ratio = firstValue / (firstValue - secondValue);

  return {
    x: first.x + ratio * (second.x - first.x),
    y: first.y + ratio * (second.y - first.y),
  };
}

function drawContourLines(mode, scales) {
  const columns = 64;
  const rows = 56;
  const values = [];

  for (let row = 0; row <= rows; row += 1) {
    const line = [];
    const y =
      mode.yDomain[0] +
      (row / rows) * (mode.yDomain[1] - mode.yDomain[0]);

    for (let column = 0; column <= columns; column += 1) {
      const x =
        mode.xDomain[0] +
        (column / columns) * (mode.xDomain[1] - mode.xDomain[0]);
      line.push({ x, y, value: mode.loss(x, y) });
    }

    values.push(line);
  }

  mode.contourLevels.forEach((level) => {
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const bottomLeft = values[row][column];
        const bottomRight = values[row][column + 1];
        const topRight = values[row + 1][column + 1];
        const topLeft = values[row + 1][column];
        const crossings = [
          edgeCrossing(bottomLeft, bottomRight, level),
          edgeCrossing(bottomRight, topRight, level),
          edgeCrossing(topRight, topLeft, level),
          edgeCrossing(topLeft, bottomLeft, level),
        ].filter(Boolean);

        const pairs =
          crossings.length === 2
            ? [[0, 1]]
            : crossings.length === 4
              ? [[0, 1], [2, 3]]
              : [];

        pairs.forEach(([first, second]) => {
          gradientChart.appendChild(
            svgEl("line", {
              class: "contour-line",
              x1: scales.x(crossings[first].x),
              y1: scales.y(crossings[first].y),
              x2: scales.x(crossings[second].x),
              y2: scales.y(crossings[second].y),
            }),
          );
        });
      }
    }
  });
}

function draw2d(mode) {
  const scales = createScales(mode);
  const columns = 48;
  const rows = 42;
  const cellWidth = chart.plotWidth / columns + 0.6;
  const cellHeight = chart.plotHeight / rows + 0.6;

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const x =
        mode.xDomain[0] +
        ((column + 0.5) / columns) *
          (mode.xDomain[1] - mode.xDomain[0]);
      const y =
        mode.yDomain[1] -
        ((row + 0.5) / rows) *
          (mode.yDomain[1] - mode.yDomain[0]);
      gradientChart.appendChild(
        svgEl("rect", {
          class: "contour-cell",
          x: chart.margin.left + (column * chart.plotWidth) / columns,
          y: chart.margin.top + (row * chart.plotHeight) / rows,
          width: cellWidth,
          height: cellHeight,
          fill: heatColor(mode.loss(x, y), mode.heatRange),
        }),
      );
    }
  }

  drawAxes(mode, scales, {
    x: "Parámetro w₁",
    y: "Parámetro w₂",
  });
  drawContourLines(mode, scales);
  mode.minima.forEach((minimum) => drawMinimum(minimum, scales, 2));

  const history = currentHistory();
  const point = currentPoint();

  if (point) {
    const gradient = mode.gradient(point.x, point.y);
    const norm = Math.hypot(gradient.x, gradient.y) || 1;
    const arrowLength = Math.min(1.25, norm * 0.08 + 0.45);

    drawHistory(history, (item) => ({
      x: scales.x(item.x),
      y: scales.y(item.y),
    }));

    if (!hasConverged()) {
      gradientChart.appendChild(
        svgEl("line", {
          class: "gradient-arrow",
          x1: scales.x(point.x),
          y1: scales.y(point.y),
          x2: scales.x(point.x - (gradient.x / norm) * arrowLength),
          y2: scales.y(point.y - (gradient.y / norm) * arrowLength),
        }),
      );
    }

    gradientChart.appendChild(
      svgEl("circle", {
        class: "current-point",
        cx: scales.x(point.x),
        cy: scales.y(point.y),
        r: 11,
      }),
    );
  }

  drawSelectionPrompt(mode);
}

function renderChart() {
  gradientChart.innerHTML = "";
  addDefinitions();

  if (currentMode().dimension === 1) {
    draw1d(currentMode());
  } else {
    draw2d(currentMode());
  }
}

function formatNumber(value) {
  const rounded = Math.abs(value) < 0.0005 ? 0 : value;
  return rounded.toFixed(3);
}

function renderUpdate() {
  const mode = currentMode();

  if (!selectedStart()) {
    updateCalculation.textContent =
      "Primero selecciona un punto inicial en la gráfica.";
    return;
  }

  if (!state.lastUpdate || state.lastUpdate.mode !== state.mode) {
    updateCalculation.textContent =
      "Presiona “Siguiente paso” o “Ejecutar” para comenzar.";
    return;
  }

  const update = state.lastUpdate;
  const alpha = currentAlpha();

  if (mode.dimension === 1) {
    updateCalculation.textContent =
      `${formatNumber(update.from)} - ${alpha} × ` +
      `(${formatNumber(update.gradient)}) = ${formatNumber(update.to)}`;
  } else {
    updateCalculation.textContent =
      `(${formatNumber(update.from.x)}, ${formatNumber(update.from.y)}) → ` +
      `(${formatNumber(update.to.x)}, ${formatNumber(update.to.y)})`;
  }
}

function renderStatus() {
  statusBadge.className = "status-badge";

  if (!selectedStart()) {
    statusBadge.textContent = "Selecciona inicio";
    statusBadge.classList.add("waiting");
    return;
  }

  const type = convergenceType();

  if (type === "global") {
    statusBadge.textContent = "Mínimo global";
    statusBadge.classList.add("done");
  } else if (type === "local") {
    statusBadge.textContent = "Mínimo local";
    statusBadge.classList.add("local");
  } else if (type === "stationary") {
    statusBadge.textContent = "Punto estacionario";
    statusBadge.classList.add("stationary");
  } else if (type === "stopped") {
    statusBadge.textContent = "Máximo de pasos";
    statusBadge.classList.add("stationary");
  } else {
    statusBadge.textContent = "Buscando";
  }
}

function renderMetrics() {
  const mode = currentMode();
  const history = currentHistory();
  const point = currentPoint();
  const done = hasConverged();

  stepButton.disabled = !point || done;
  runButton.disabled = !point || done;
  iterationValue.textContent = point ? String(history.length - 1) : "-";
  lossValue.textContent = point ? formatNumber(point.loss) : "-";
  renderStatus();

  if (mode.dimension === 1) {
    positionLabel.textContent = "Valor de w";
    gradientLabel.textContent = "Pendiente dL/dw";
    updateFormula.textContent = "w nuevo = w - α × gradiente";
    positionValue.textContent = point ? formatNumber(point.w) : "-";
    gradientValue.textContent = point
      ? formatNumber(mode.gradient(point.w))
      : "-";
  } else {
    positionLabel.textContent = "Posición (w₁, w₂)";
    gradientLabel.textContent = "Gradiente (∂L/∂w₁, ∂L/∂w₂)";
    updateFormula.textContent =
      "(w₁, w₂) nuevos = (w₁, w₂) - α × gradiente";

    if (point) {
      const gradient = mode.gradient(point.x, point.y);
      positionValue.textContent =
        `(${formatNumber(point.x)}, ${formatNumber(point.y)})`;
      gradientValue.textContent =
        `(${formatNumber(gradient.x)}, ${formatNumber(gradient.y)})`;
    } else {
      positionValue.textContent = "-";
      gradientValue.textContent = "-";
    }
  }

  renderUpdate();
}

function renderContent() {
  const mode = currentMode();

  stageLabel.textContent = mode.stage;
  chartTitle.textContent = mode.title;
  chartSubtitle.textContent = selectedStart()
    ? mode.subtitle
    : mode.dimension === 1
      ? "Haz clic sobre la curva para seleccionar el valor inicial de w."
      : "Haz clic en el plano para seleccionar los valores iniciales de w₁ y w₂.";
  formulaPill.textContent = mode.formula;
  localLegend.classList.toggle("hidden", mode.modal !== "multimodal");
  explanationTitle.textContent =
    mode.modal === "unimodal" ? "Función unimodal" : "Función multimodal";
  explanationText.textContent =
    mode.modal === "unimodal"
      ? "Tiene un solo mínimo. Desde cualquier inicio, el descenso busca el mismo mínimo global."
      : "Tiene dos mínimos: uno global y uno local. El punto inicial decide en cuál cuenca termina el descenso.";

  scenarioButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === state.mode);
  });
  gradientChart.classList.toggle(
    "selecting",
    currentHistory().length <= 1 && !state.running,
  );
}

function render() {
  learningRate.value = state.rate;
  renderContent();
  renderChart();
  renderMetrics();

  const point = currentPoint();
  gradientChart.setAttribute(
    "aria-label",
    point
      ? `${currentMode().stage}, iteración ${currentHistory().length - 1}.`
      : `${currentMode().stage}. Selecciona un punto inicial con el mouse.`,
  );
}

function pointerToSvg(event) {
  const matrix = gradientChart.getScreenCTM();
  if (!matrix) return null;

  const point = gradientChart.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  return point.matrixTransform(matrix.inverse());
}

gradientChart.addEventListener("click", (event) => {
  if (state.running || currentHistory().length > 1) return;

  const svgPoint = pointerToSvg(event);
  if (!svgPoint) return;

  const left = chart.margin.left;
  const right = chart.width - chart.margin.right;
  const top = chart.margin.top;
  const bottom = chart.height - chart.margin.bottom;

  if (
    svgPoint.x < left ||
    svgPoint.x > right ||
    svgPoint.y < top ||
    svgPoint.y > bottom
  ) {
    return;
  }

  const scales = createScales(currentMode());
  const x = scales.invertX(svgPoint.x);

  if (currentMode().dimension === 1) {
    chooseStart(x);
  } else {
    chooseStart(x, scales.invertY(svgPoint.y));
  }
});

scenarioButtons.forEach((button) => {
  button.addEventListener("click", () => setMode(button.dataset.mode));
});

learningRate.addEventListener("change", (event) => {
  stopRunning();
  state.rate = event.target.value;

  if (selectedStart()) {
    const initial = currentHistory()[0];
    state.histories[state.mode] = [{ ...initial }];
  }

  state.lastUpdate = null;
  render();
});

stepButton.addEventListener("click", takeStep);
runButton.addEventListener("click", toggleRunning);
resetButton.addEventListener("click", clearStart);

render();
