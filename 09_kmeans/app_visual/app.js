const svgNamespace = "http://www.w3.org/2000/svg";

const clientPairs = [
  [1.8, 68],
  [2.0, 90],
  [2.1, 118],
  [2.2, 142],
  [2.4, 154],
  [2.5, 76],
  [2.7, 132],
  [2.8, 174],
  [3.0, 96],
  [3.1, 58],
  [3.2, 120],
  [3.3, 186],
  [3.5, 72],
  [3.6, 136],
  [3.8, 154],
  [4.0, 88],
  [4.1, 198],
  [4.3, 64],
  [4.4, 162],
  [4.6, 214],
  [4.8, 106],
  [5.0, 56],
  [5.1, 178],
  [5.2, 92],
  [5.4, 148],
  [5.6, 118],
  [5.8, 44],
  [6.0, 138],
  [6.2, 88],
  [6.4, 156],
  [6.6, 112],
  [6.8, 72],
  [7.0, 126],
  [7.2, 98],
  [7.4, 146],
  [7.6, 42],
  [7.8, 12],
  [8.0, 118],
  [8.2, 176],
  [8.4, 84],
  [8.6, 152],
  [8.8, 104],
  [9.0, 62],
  [9.2, 126],
  [9.4, 192],
  [9.6, 54],
  [9.8, 96],
  [10.0, 118],
  [10.2, 170],
  [10.4, 132],
  [10.6, 32],
  [10.8, 88],
  [11.0, 114],
  [11.2, 184],
  [11.4, 150],
  [11.6, 106],
  [11.8, 72],
  [12.0, 168],
  [12.2, 130],
  [12.4, 58],
  [12.8, 100],
  [13.2, 72],
  [13.6, 44],
  [13.8, 166],
  [14.0, 62],
  [14.4, 18],
  [14.6, 64],
  [15.0, 0],
  [15.2, 124],
  [15.6, 66],
  [16.4, 0],
  [17.0, 116],
  [17.2, 48],
  [18.0, 36],
  [18.4, 54],
  [19.6, 132],
  [20.6, 144],
  [24.2, 42],
];

const points = clientPairs.map(([x, y], index) => ({
  id: `P${index + 1}`,
  x,
  y,
}));

const initialCenters = [
  { x: 4, y: 200 },
  { x: 8, y: 160 },
  { x: 12, y: 120 },
  { x: 16, y: 80 },
];

const clusterColors = ["cluster-0", "cluster-1", "cluster-2", "cluster-3"];
const colorHex = ["#2563eb", "#16a34a", "#ea580c", "#e11d48"];

const chart = {
  width: 920,
  height: 620,
  margin: { top: 42, right: 42, bottom: 82, left: 82 },
  xDomain: [0, 25],
  yDomain: [0, 250],
  xTicks: [0, 5, 10, 15, 20, 25],
  yTicks: [0, 50, 100, 150, 200, 250],
};

chart.plotWidth = chart.width - chart.margin.left - chart.margin.right;
chart.plotHeight = chart.height - chart.margin.top - chart.margin.bottom;

const state = {
  step: 0,
  playing: false,
  timer: null,
};

const elements = {
  previousCycle: document.getElementById("previousCycle"),
  playPause: document.getElementById("playPause"),
  nextCycle: document.getElementById("nextCycle"),
  cycleRange: document.getElementById("cycleRange"),
  cycleOutput: document.getElementById("cycleOutput"),
  cycleSummary: document.getElementById("cycleSummary"),
  stageLabel: document.getElementById("stageLabel"),
  chart: document.getElementById("kmeansChart"),
  statusBadge: document.getElementById("statusBadge"),
  cycleMetric: document.getElementById("cycleMetric"),
  changedMetric: document.getElementById("changedMetric"),
  shiftMetric: document.getElementById("shiftMetric"),
  resultText: document.getElementById("resultText"),
  cycleSteps: document.getElementById("cycleSteps"),
  centroidRows: document.getElementById("centroidRows"),
  historyList: document.getElementById("historyList"),
};

function svgEl(tag, attributes = {}, text = "") {
  const element = document.createElementNS(svgNamespace, tag);

  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });

  if (text) element.textContent = text;
  return element;
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

function distance(first, second) {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

function toScaled(point) {
  return {
    x: point.x / chart.xDomain[1],
    y: point.y / chart.yDomain[1],
  };
}

function fromScaled(point) {
  return {
    x: point.x * chart.xDomain[1],
    y: point.y * chart.yDomain[1],
  };
}

function nearestCenterIndex(point, centers) {
  let bestIndex = 0;
  let bestDistance = Infinity;

  centers.forEach((center, index) => {
    const currentDistance = distance(point, center);
    if (currentDistance < bestDistance) {
      bestDistance = currentDistance;
      bestIndex = index;
    }
  });

  return bestIndex;
}

function meanPoint(group) {
  if (group.length === 0) return null;

  const total = group.reduce(
    (acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }),
    { x: 0, y: 0 },
  );

  return {
    x: total.x / group.length,
    y: total.y / group.length,
  };
}

function formatNumber(value, digits = 2) {
  return value.toFixed(digits).replace(/\.?0+$/, "");
}

function formatPoint(point) {
  return `(${formatNumber(point.x, 1)}, ${formatNumber(point.y, 1)})`;
}

function cloneCenters(centers) {
  return centers.map((center) => ({ ...center }));
}

function changedLabels(previousLabels, labels) {
  if (!previousLabels) return labels.length;
  return labels.filter((label, index) => label !== previousLabels[index]).length;
}

function runKMeans() {
  const scaledPoints = points.map(toScaled);
  const scaledInitialCenters = initialCenters.map(toScaled);
  const history = [
    {
      cycle: 0,
      before: null,
      centers: cloneCenters(initialCenters),
      labels: points.map(() => null),
      clusterSizes: initialCenters.map(() => 0),
      shifts: initialCenters.map(() => 0),
      totalShift: 0,
      changed: 0,
      converged: false,
    },
  ];

  let centers = cloneCenters(scaledInitialCenters);
  let previousLabels = null;

  for (let cycle = 1; cycle <= 24; cycle += 1) {
    const labels = scaledPoints.map((point) => nearestCenterIndex(point, centers));
    const groups = centers.map((_, index) =>
      scaledPoints.filter((point, pointIndex) => labels[pointIndex] === index),
    );
    const nextCenters = centers.map((center, index) => meanPoint(groups[index]) || center);
    const shifts = centers.map((center, index) => distance(center, nextCenters[index]));
    const maxShift = Math.max(...shifts);

    history.push({
      cycle,
      before: centers.map(fromScaled),
      centers: nextCenters.map(fromScaled),
      labels,
      clusterSizes: groups.map((group) => group.length),
      shifts,
      totalShift: shifts.reduce((sum, shift) => sum + shift, 0),
      changed: changedLabels(previousLabels, labels),
      converged: maxShift < 0.001,
    });

    centers = cloneCenters(nextCenters);
    previousLabels = labels;

    if (maxShift < 0.001) break;
  }

  return history;
}

const history = runKMeans();
elements.cycleRange.max = String(history.length - 1);

function drawAxes() {
  const plotLeft = chart.margin.left;
  const plotRight = chart.margin.left + chart.plotWidth;
  const plotTop = chart.margin.top;
  const plotBottom = chart.margin.top + chart.plotHeight;

  chart.xTicks.forEach((tick) => {
    const x = xScale(tick);

    elements.chart.appendChild(
      svgEl("line", {
        class: "grid-line",
        x1: x,
        y1: plotTop,
        x2: x,
        y2: plotBottom,
      }),
    );
    elements.chart.appendChild(
      svgEl(
        "text",
        {
          class: "tick-label",
          x,
          y: plotBottom + 28,
          "text-anchor": "middle",
        },
        String(tick),
      ),
    );
  });

  chart.yTicks.forEach((tick) => {
    const y = yScale(tick);

    elements.chart.appendChild(
      svgEl(
        "line",
        {
          class: "grid-line",
          x1: plotLeft,
          y1: y,
          x2: plotRight,
          y2: y,
        },
      ),
    );
    elements.chart.appendChild(
      svgEl(
        "text",
        {
          class: "tick-label",
          x: plotLeft - 16,
          y: y + 4,
          "text-anchor": "end",
        },
        `S/${tick}`,
      ),
    );
  });

  elements.chart.appendChild(
    svgEl("line", {
      class: "axis",
      x1: plotLeft,
      y1: plotBottom,
      x2: plotRight,
      y2: plotBottom,
    }),
  );
  elements.chart.appendChild(
    svgEl("line", {
      class: "axis",
      x1: plotLeft,
      y1: plotBottom,
      x2: plotLeft,
      y2: plotTop,
    }),
  );

  elements.chart.appendChild(
    svgEl(
      "text",
      {
        class: "axis-label",
        x: (plotLeft + plotRight) / 2,
        y: chart.height - 26,
        "text-anchor": "middle",
      },
      "visitas",
    ),
  );
  elements.chart.appendChild(
    svgEl(
      "text",
      {
        class: "axis-label",
        x: -chart.height / 2,
        y: 24,
        transform: "rotate(-90)",
        "text-anchor": "middle",
      },
      "gasto mensual",
    ),
  );
}

function diamondPoints(center, size) {
  const x = xScale(center.x);
  const y = yScale(center.y);

  return [
    `${x},${y - size}`,
    `${x + size},${y}`,
    `${x},${y + size}`,
    `${x - size},${y}`,
  ].join(" ");
}

function drawAssignmentLines(step) {
  if (!step.before) return;

  points.forEach((point, index) => {
    const label = step.labels[index];
    const center = step.before[label];

    elements.chart.appendChild(
      svgEl("line", {
        class: `assignment-line ${clusterColors[label]}`,
        x1: xScale(point.x),
        y1: yScale(point.y),
        x2: xScale(center.x),
        y2: yScale(center.y),
      }),
    );
  });
}

function drawMovement(step) {
  if (!step.before) return;

  step.centers.forEach((center, index) => {
    const previous = step.before[index];
    const previousX = xScale(previous.x);
    const previousY = yScale(previous.y);
    const currentX = xScale(center.x);
    const currentY = yScale(center.y);

    elements.chart.appendChild(
      svgEl("line", {
        class: `movement-line ${clusterColors[index]}`,
        x1: previousX,
        y1: previousY,
        x2: currentX,
        y2: currentY,
      }),
    );
    elements.chart.appendChild(
      svgEl("circle", {
        class: `movement-end ${clusterColors[index]}`,
        cx: currentX,
        cy: currentY,
        r: 5,
      }),
    );
    elements.chart.appendChild(
      svgEl("polygon", {
        class: "center-marker previous",
        points: diamondPoints(previous, 9),
      }),
    );
  });
}

function drawPoints(step) {
  points.forEach((point, index) => {
    const label = step.labels[index];
    const className =
      label === null
        ? "client-point unassigned"
        : `client-point ${clusterColors[label]}`;

    elements.chart.appendChild(
      svgEl("circle", {
        class: className,
        cx: xScale(point.x),
        cy: yScale(point.y),
        r: points.length > 40 ? 4.8 : 6.4,
      }),
    );
  });
}

function drawCenters(step) {
  step.centers.forEach((center, index) => {
    const x = xScale(center.x);
    const y = yScale(center.y);

    elements.chart.appendChild(
      svgEl("polygon", {
        class: "center-marker current",
        points: diamondPoints(center, 11),
      }),
    );
    elements.chart.appendChild(
      svgEl(
        "text",
        {
          class: "center-label",
          x,
          y: y + 4,
        },
        `C${index + 1}`,
      ),
    );
  });
}

function drawChart(step) {
  elements.chart.replaceChildren();
  drawAxes();
  drawAssignmentLines(step);
  drawMovement(step);
  drawPoints(step);
  drawCenters(step);
}

function cycleSummary(step) {
  if (step.cycle === 0) {
    return "Se colocan cuatro centroides iniciales antes de asignar puntos.";
  }

  if (step.converged) {
    return "Las asignaciones ya no cambian y los centroides casi no se mueven.";
  }

  return `Ciclo ${step.cycle}: se asignan puntos y cada centroide se mueve al promedio de su grupo.`;
}

function updateSteps(step) {
  const items =
    step.cycle === 0
      ? [
          "Elegir k = 4.",
          "Colocar centroides iniciales en el plano.",
          "Empezar el primer ciclo para medir distancias.",
        ]
      : [
          "Asignar cada punto al centroide anterior mas cercano.",
          "Formar cuatro grupos con esas asignaciones.",
          "Mover cada centroide al promedio (x, y) de su grupo.",
          step.converged
            ? "Detener: el movimiento es practicamente cero."
            : "Repetir el proceso con las nuevas posiciones.",
        ];

  elements.cycleSteps.replaceChildren(
    ...items.map((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      return li;
    }),
  );
}

function updateCentroidRows(step) {
  const rows = step.centers.map((center, index) => {
    const row = document.createElement("div");
    row.className = "centroid-row";

    const key = document.createElement("span");
    key.className = "centroid-key";
    key.style.background = colorHex[index];
    key.textContent = String(index + 1);

    const text = document.createElement("div");
    text.className = "centroid-text";

    const strong = document.createElement("strong");
    strong.textContent = `Centroide ${index + 1}: ${formatPoint(center)}`;

    const detail = document.createElement("span");
    if (step.before) {
      detail.textContent = `Antes ${formatPoint(step.before[index])}; movimiento ${formatNumber(step.shifts[index], 3)} normalizado. Grupo: ${step.clusterSizes[index]} puntos.`;
    } else {
      detail.textContent = "Posicion inicial sin puntos asignados.";
    }

    text.append(strong, detail);
    row.append(key, text);
    return row;
  });

  elements.centroidRows.replaceChildren(...rows);
}

function updateHistoryButtons() {
  const buttons = history.map((step, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `history-button${state.step === index ? " active" : ""}`;
    button.textContent = index === 0 ? "Inicio" : `C${index}`;
    button.addEventListener("click", () => {
      stopPlayback();
      setStep(index);
    });
    return button;
  });

  elements.historyList.replaceChildren(...buttons);
}

function updatePanel(step) {
  elements.cycleRange.value = String(state.step);
  elements.cycleOutput.value = String(step.cycle);
  elements.cycleOutput.textContent = String(step.cycle);
  elements.cycleSummary.textContent = cycleSummary(step);
  elements.stageLabel.textContent = step.cycle === 0 ? "Inicializacion" : "Asignar y actualizar";
  elements.statusBadge.textContent = step.converged ? "Convergio" : step.cycle === 0 ? "Inicio" : "Iterando";
  elements.statusBadge.classList.toggle("done", step.converged);
  elements.cycleMetric.textContent = String(step.cycle);
  elements.changedMetric.textContent =
    step.cycle === 0 ? "-" : `${step.changed} de ${points.length}`;
  elements.shiftMetric.textContent =
    step.cycle === 0 ? "-" : formatNumber(step.totalShift, 3);
  elements.resultText.textContent =
    step.cycle === 0
      ? "Todavia no hay clusters: solo posiciones iniciales."
      : `Los grupos tienen ${step.clusterSizes.join(", ")} puntos.`;

  elements.previousCycle.disabled = state.step === 0;
  elements.nextCycle.disabled = state.step === history.length - 1;
  elements.playPause.textContent = state.playing ? "Pausar" : "Reproducir";

  updateSteps(step);
  updateCentroidRows(step);
  updateHistoryButtons();
}

function render() {
  const step = history[state.step];
  drawChart(step);
  updatePanel(step);
}

function setStep(nextStep) {
  state.step = Math.min(Math.max(nextStep, 0), history.length - 1);
  render();
}

function stopPlayback() {
  state.playing = false;
  window.clearInterval(state.timer);
  state.timer = null;
  elements.playPause.textContent = "Reproducir";
}

function startPlayback() {
  state.playing = true;
  elements.playPause.textContent = "Pausar";

  state.timer = window.setInterval(() => {
    if (state.step >= history.length - 1) {
      stopPlayback();
      return;
    }

    setStep(state.step + 1);
  }, 1200);
}

elements.previousCycle.addEventListener("click", () => {
  stopPlayback();
  setStep(state.step - 1);
});

elements.nextCycle.addEventListener("click", () => {
  stopPlayback();
  setStep(state.step + 1);
});

elements.playPause.addEventListener("click", () => {
  if (state.playing) {
    stopPlayback();
    return;
  }

  if (state.step >= history.length - 1) setStep(0);
  startPlayback();
});

elements.cycleRange.addEventListener("input", (event) => {
  stopPlayback();
  setStep(Number(event.target.value));
});

render();
