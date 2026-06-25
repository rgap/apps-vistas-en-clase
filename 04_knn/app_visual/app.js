const svgNamespace = "http://www.w3.org/2000/svg";

const classes = {
  abandon: {
    label: "Abandonar",
    color: "#2563eb",
    soft: "#dbeafe",
    order: 0,
  },
  browse: {
    label: "Seguir navegando",
    color: "#16a34a",
    soft: "#dcfce7",
    order: 1,
  },
  cart: {
    label: "Agregar al carrito",
    color: "#ea580c",
    soft: "#ffedd5",
    order: 2,
  },
  buy: {
    label: "Comprar",
    color: "#e11d48",
    soft: "#ffe4e6",
    order: 3,
  },
};

const points = [];

function addPoints(className, pairs) {
  pairs.forEach(([clicks, durationTimesTen], index) => {
    points.push({
      id: `${className}-${index}`,
      className,
      label: classes[className].label,
      x: clicks,
      y: durationTimesTen / 10,
    });
  });
}

addPoints("abandon", [
  [2, 70],
  [2.5, 85],
  [3, 65],
  [3.2, 35],
  [4, 75],
  [4.5, 90],
  [5, 55],
  [5.5, 82],
  [6, 45],
  [6.5, 70],
  [7, 12],
  [7, 62],
  [8, 78],
  [8.5, 88],
  [9, 58],
  [9.5, 72],
  [6, 135],
  [12, 155],
  [17, 75],
]);

addPoints("browse", [
  [2.5, 150],
  [3, 125],
  [3, 165],
  [3.5, 110],
  [4, 145],
  [4.2, 180],
  [4.5, 120],
  [5, 160],
  [5.5, 135],
  [6, 150],
  [6.5, 115],
  [7, 140],
  [7.5, 175],
  [8, 125],
  [8.5, 155],
  [9, 190],
  [9.5, 120],
  [7, 75],
  [12.5, 80],
  [16, 135],
]);

addPoints("cart", [
  [10.5, 30],
  [11, 75],
  [12, 85],
  [12.5, 45],
  [13, 65],
  [13.5, 18],
  [14, 55],
  [14.5, 65],
  [15, 0],
  [16, 40],
  [16.5, 0],
  [18, 50],
  [24, 42],
  [8, 145],
  [13, 155],
  [18, 125],
]);

addPoints("buy", [
  [10.5, 180],
  [11, 120],
  [11.5, 190],
  [12, 130],
  [12.5, 170],
  [13.5, 125],
  [14, 168],
  [15.5, 120],
  [17, 110],
  [19, 130],
  [20, 145],
  [8.8, 85],
  [12, 70],
  [6, 120],
]);

const chart = {
  width: 920,
  height: 600,
  margin: { top: 38, right: 40, bottom: 78, left: 88 },
  xDomain: [0, 25],
  yDomain: [0, 25],
  xTicks: [0, 5, 10, 15, 20, 25],
  yTicks: [0, 5, 10, 15, 20, 25],
};

chart.plotWidth = chart.width - chart.margin.left - chart.margin.right;
chart.plotHeight = chart.height - chart.margin.top - chart.margin.bottom;

const state = {
  k: 9,
  distance: "euclidean",
  probe: { x: 11.2, y: 10.8 },
};

const knnChart = document.getElementById("knnChart");
const kValue = document.getElementById("kValue");
const kOutput = document.getElementById("kOutput");
const distanceMetric = document.getElementById("distanceMetric");
const clickInput = document.getElementById("clickInput");
const clickOutput = document.getElementById("clickOutput");
const durationInput = document.getElementById("durationInput");
const durationOutput = document.getElementById("durationOutput");
const statusBadge = document.getElementById("statusBadge");
const probeValue = document.getElementById("probeValue");
const predictionValue = document.getElementById("predictionValue");
const nearestValue = document.getElementById("nearestValue");
const winnerReason = document.getElementById("winnerReason");
const votesList = document.getElementById("votesList");
const neighborsTable = document.getElementById("neighborsTable");
const kMeaning = document.getElementById("kMeaning");
const distanceMeaning = document.getElementById("distanceMeaning");

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

function formatNumber(value, digits = 1) {
  return value.toFixed(digits).replace(/\.?0+$/, "");
}

function distanceBetween(first, second) {
  const dx = Math.abs(first.x - second.x);
  const dy = Math.abs(first.y - second.y);

  if (state.distance === "manhattan") return dx + dy;
  return Math.hypot(dx, dy);
}

function classOrder(className) {
  return classes[className].order;
}

function classify() {
  const neighbors = points
    .map((point) => ({
      ...point,
      distance: distanceBetween(point, state.probe),
    }))
    .sort((first, second) => {
      if (first.distance !== second.distance) {
        return first.distance - second.distance;
      }

      return classOrder(first.className) - classOrder(second.className);
    });

  const selected = neighbors.slice(0, state.k);
  const votes = Object.fromEntries(
    Object.keys(classes).map((className) => [
      className,
      { count: 0, distanceSum: 0 },
    ]),
  );

  selected.forEach((neighbor) => {
    votes[neighbor.className].count += 1;
    votes[neighbor.className].distanceSum += neighbor.distance;
  });

  const winner = Object.keys(classes)
    .map((className) => ({
      className,
      count: votes[className].count,
      averageDistance:
        votes[className].count > 0
          ? votes[className].distanceSum / votes[className].count
          : Infinity,
    }))
    .sort((first, second) => {
      if (first.count !== second.count) return second.count - first.count;
      if (first.averageDistance !== second.averageDistance) {
        return first.averageDistance - second.averageDistance;
      }

      return classOrder(first.className) - classOrder(second.className);
    })[0];

  return { neighbors, selected, votes, winner };
}

function drawAxes() {
  const plotLeft = chart.margin.left;
  const plotRight = chart.margin.left + chart.plotWidth;
  const plotTop = chart.margin.top;
  const plotBottom = chart.margin.top + chart.plotHeight;

  knnChart.appendChild(
    svgEl("rect", {
      class: "plot-bg",
      x: plotLeft,
      y: plotTop,
      width: chart.plotWidth,
      height: chart.plotHeight,
      rx: 8,
    }),
  );

  chart.xTicks.forEach((tick) => {
    const x = xScale(tick);
    knnChart.appendChild(
      svgEl("line", {
        class: "grid-line",
        x1: x,
        y1: plotTop,
        x2: x,
        y2: plotBottom,
      }),
    );
    knnChart.appendChild(
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
    knnChart.appendChild(
      svgEl("line", {
        class: "grid-line",
        x1: plotLeft,
        y1: y,
        x2: plotRight,
        y2: y,
      }),
    );
    knnChart.appendChild(
      svgEl(
        "text",
        {
          class: "tick-label",
          x: plotLeft - 18,
          y: y + 4,
          "text-anchor": "end",
        },
        String(tick),
      ),
    );
  });

  knnChart.appendChild(
    svgEl("line", {
      class: "axis",
      x1: plotLeft,
      y1: plotBottom,
      x2: plotRight,
      y2: plotBottom,
    }),
  );
  knnChart.appendChild(
    svgEl("line", {
      class: "axis",
      x1: plotLeft,
      y1: plotBottom,
      x2: plotLeft,
      y2: plotTop,
    }),
  );

  knnChart.appendChild(
    svgEl(
      "text",
      {
        class: "axis-label",
        x: (plotLeft + plotRight) / 2,
        y: chart.height - 22,
        "text-anchor": "middle",
      },
      "clics",
    ),
  );
  knnChart.appendChild(
    svgEl(
      "text",
      {
        class: "axis-label",
        x: -chart.height / 2,
        y: 24,
        transform: "rotate(-90)",
        "text-anchor": "middle",
      },
      "duración (min)",
    ),
  );
}

function drawProbe() {
  const x = xScale(state.probe.x);
  const y = yScale(state.probe.y);
  const size = 9;
  const pointsAttr = [
    `${x},${y - size}`,
    `${x + size},${y}`,
    `${x},${y + size}`,
    `${x - size},${y}`,
  ].join(" ");

  knnChart.appendChild(
    svgEl("polygon", {
      class: "probe",
      points: pointsAttr,
    }),
  );
  knnChart.appendChild(
    svgEl(
      "text",
      {
        class: "chart-label probe-label",
        x: x + 18,
        y: y - 14,
      },
      "sesión nueva",
    ),
  );
}

function drawChart(result) {
  knnChart.replaceChildren();
  drawAxes();

  const selectedIds = new Map(
    result.selected.map((neighbor, index) => [neighbor.id, index + 1]),
  );

  result.selected.forEach((neighbor) => {
    knnChart.appendChild(
      svgEl("line", {
        class: "neighbor-link",
        x1: xScale(state.probe.x),
        y1: yScale(state.probe.y),
        x2: xScale(neighbor.x),
        y2: yScale(neighbor.y),
      }),
    );
  });

  points.forEach((point) => {
    const isNeighbor = selectedIds.has(point.id);
    const x = xScale(point.x);
    const y = yScale(point.y);

    knnChart.appendChild(
      svgEl("circle", {
        class: `point ${isNeighbor ? "neighbor" : "dimmed"}`,
        cx: x,
        cy: y,
        r: 5,
        fill: classes[point.className].color,
      }),
    );
  });

  drawProbe();
}

function renderVotes(result) {
  votesList.replaceChildren();

  Object.entries(classes).forEach(([className, classInfo]) => {
    const count = result.votes[className].count;
    const row = document.createElement("div");
    row.className = "vote-row";

    const label = document.createElement("div");
    label.className = "vote-label";

    const dot = document.createElement("i");
    dot.className = `dot ${className}`;
    if (className === "browse") dot.className = "dot browse";
    if (className === "cart") dot.className = "dot cart";
    if (className === "buy") dot.className = "dot buy";
    if (className === "abandon") dot.className = "dot abandon";

    const text = document.createElement("span");
    text.textContent = classInfo.label;
    label.append(dot, text);

    const countElement = document.createElement("div");
    countElement.className = "vote-count";
    countElement.textContent = `${count}/${state.k}`;

    const track = document.createElement("div");
    track.className = "vote-track";

    const bar = document.createElement("div");
    bar.className = "vote-bar";
    bar.style.width = `${(count / state.k) * 100}%`;
    bar.style.background = classInfo.color;
    track.appendChild(bar);

    row.append(label, countElement, track);
    votesList.appendChild(row);
  });
}

function renderNeighbors(result) {
  neighborsTable.replaceChildren();

  result.selected.forEach((neighbor, index) => {
    const row = document.createElement("tr");
    const rank = document.createElement("td");
    const label = document.createElement("td");
    const clicks = document.createElement("td");
    const minutes = document.createElement("td");

    const classCell = document.createElement("div");
    classCell.className = "class-cell";

    const dot = document.createElement("span");
    dot.className = `dot ${neighbor.className}`;
    dot.style.background = classes[neighbor.className].color;

    const labelText = document.createElement("span");
    labelText.textContent = neighbor.label;

    classCell.append(dot, labelText);
    rank.textContent = String(index + 1);
    label.appendChild(classCell);
    clicks.textContent = formatNumber(neighbor.x);
    minutes.textContent = formatNumber(neighbor.y);

    row.append(rank, label, clicks, minutes);
    neighborsTable.appendChild(row);
  });
}

function renderSummary(result) {
  const winner = result.winner.className;
  const winnerInfo = classes[winner];
  const nearest = result.selected[0];
  const metricText =
    state.distance === "euclidean" ? "distancia euclidiana" : "distancia Manhattan";

  kOutput.textContent = String(state.k);
  clickOutput.textContent = formatNumber(state.probe.x);
  durationOutput.textContent = formatNumber(state.probe.y);
  probeValue.textContent = `${formatNumber(state.probe.x)} clics, ${formatNumber(
    state.probe.y,
  )} min`;

  statusBadge.textContent = winnerInfo.label;
  statusBadge.className = `status-badge ${winner}`;
  predictionValue.textContent = winnerInfo.label;
  nearestValue.textContent = `${nearest.label} (${formatNumber(
    nearest.x,
  )} clics, ${formatNumber(nearest.y)} min)`;
  winnerReason.textContent = `Con k = ${state.k}, ${winnerInfo.label} recibe ${result.winner.count} votos usando ${metricText}.`;

  kMeaning.textContent = `${state.k} observaciones históricas participan en la votación.`;
  distanceMeaning.textContent =
    state.distance === "euclidean"
      ? "Euclidiana mide la cercanía como una línea recta."
      : "Manhattan suma cambios horizontales y verticales.";
}

function render() {
  const result = classify();
  drawChart(result);
  renderVotes(result);
  renderNeighbors(result);
  renderSummary(result);
}

function updateProbeFromInputs() {
  state.probe.x = Number(clickInput.value);
  state.probe.y = Number(durationInput.value);
}

kValue.addEventListener("input", () => {
  state.k = Number(kValue.value);
  render();
});

distanceMetric.addEventListener("change", () => {
  state.distance = distanceMetric.value;
  render();
});

clickInput.addEventListener("input", () => {
  updateProbeFromInputs();
  render();
});

durationInput.addEventListener("input", () => {
  updateProbeFromInputs();
  render();
});

knnChart.addEventListener("click", (event) => {
  const rect = knnChart.getBoundingClientRect();
  const scaleX = chart.width / rect.width;
  const scaleY = chart.height / rect.height;
  const svgX = (event.clientX - rect.left) * scaleX;
  const svgY = (event.clientY - rect.top) * scaleY;

  const nextX = clamp(xInvert(svgX), chart.xDomain[0], chart.xDomain[1]);
  const nextY = clamp(yInvert(svgY), chart.yDomain[0], chart.yDomain[1]);

  state.probe.x = Number(nextX.toFixed(1));
  state.probe.y = Number(nextY.toFixed(1));
  clickInput.value = String(state.probe.x);
  durationInput.value = String(state.probe.y);
  render();
});

render();
