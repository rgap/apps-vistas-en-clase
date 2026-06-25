const svgNamespace = "http://www.w3.org/2000/svg";

const classes = {
  abandon: {
    label: "Abandonar",
    color: "#2563eb",
    regionClass: "region-abandon",
  },
  browse: {
    label: "Seguir navegando",
    color: "#16a34a",
    regionClass: "region-browse",
  },
  cart: {
    label: "Agregar al carrito",
    color: "#ea580c",
    regionClass: "region-cart",
  },
  buy: {
    label: "Comprar",
    color: "#e11d48",
    regionClass: "region-buy",
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

const thresholds = {
  clicks: 10,
  duration: 10,
};

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
  probe: { x: 12, y: 13 },
};

const treeChart = document.getElementById("treeChart");
const clickInput = document.getElementById("clickInput");
const clickOutput = document.getElementById("clickOutput");
const durationInput = document.getElementById("durationInput");
const durationOutput = document.getElementById("durationOutput");
const statusBadge = document.getElementById("statusBadge");
const probeValue = document.getElementById("probeValue");
const predictionValue = document.getElementById("predictionValue");
const ruleText = document.getElementById("ruleText");

const pathElements = {
  nodeRoot: document.getElementById("nodeRoot"),
  nodeLeftDuration: document.getElementById("nodeLeftDuration"),
  nodeRightDuration: document.getElementById("nodeRightDuration"),
  branchClickYes: document.getElementById("branchClickYes"),
  branchClickNo: document.getElementById("branchClickNo"),
  branchAbandon: document.getElementById("branchAbandon"),
  branchBrowse: document.getElementById("branchBrowse"),
  branchCart: document.getElementById("branchCart"),
  branchBuy: document.getElementById("branchBuy"),
  leafAbandon: document.getElementById("leafAbandon"),
  leafBrowse: document.getElementById("leafBrowse"),
  leafCart: document.getElementById("leafCart"),
  leafBuy: document.getElementById("leafBuy"),
};

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

function classify(point) {
  const lowClicks = point.x < thresholds.clicks;
  const lowDuration = point.y < thresholds.duration;

  if (lowClicks && lowDuration) {
    return {
      className: "abandon",
      path: ["nodeRoot", "branchClickYes", "nodeLeftDuration", "branchAbandon", "leafAbandon"],
      rule: "Como clics < 10 y duración < 10, la hoja activa es Abandonar.",
      firstAnswer: "sí",
      secondAnswer: "sí",
    };
  }

  if (lowClicks && !lowDuration) {
    return {
      className: "browse",
      path: ["nodeRoot", "branchClickYes", "nodeLeftDuration", "branchBrowse", "leafBrowse"],
      rule: "Como clics < 10 y duración ≥ 10, la hoja activa es Seguir navegando.",
      firstAnswer: "sí",
      secondAnswer: "no",
    };
  }

  if (!lowClicks && lowDuration) {
    return {
      className: "cart",
      path: ["nodeRoot", "branchClickNo", "nodeRightDuration", "branchCart", "leafCart"],
      rule: "Como clics ≥ 10 y duración < 10, la hoja activa es Agregar al carrito.",
      firstAnswer: "no",
      secondAnswer: "sí",
    };
  }

  return {
    className: "buy",
    path: ["nodeRoot", "branchClickNo", "nodeRightDuration", "branchBuy", "leafBuy"],
    rule: "Como clics ≥ 10 y duración ≥ 10, la hoja activa es Comprar.",
    firstAnswer: "no",
    secondAnswer: "no",
  };
}

function drawRectForRegion(className, xMin, xMax, yMin, yMax) {
  treeChart.appendChild(
    svgEl("rect", {
      class: classes[className].regionClass,
      x: xScale(xMin),
      y: yScale(yMax),
      width: xScale(xMax) - xScale(xMin),
      height: yScale(yMin) - yScale(yMax),
    }),
  );
}

function drawAxes() {
  const plotLeft = chart.margin.left;
  const plotRight = chart.margin.left + chart.plotWidth;
  const plotTop = chart.margin.top;
  const plotBottom = chart.margin.top + chart.plotHeight;

  chart.xTicks.forEach((tick) => {
    const x = xScale(tick);
    treeChart.appendChild(
      svgEl("line", {
        class: "grid-line",
        x1: x,
        y1: plotTop,
        x2: x,
        y2: plotBottom,
      }),
    );
    treeChart.appendChild(
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
    treeChart.appendChild(
      svgEl("line", {
        class: "grid-line",
        x1: plotLeft,
        y1: y,
        x2: plotRight,
        y2: y,
      }),
    );
    treeChart.appendChild(
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

  treeChart.appendChild(
    svgEl("line", {
      class: "axis",
      x1: plotLeft,
      y1: plotBottom,
      x2: plotRight,
      y2: plotBottom,
    }),
  );
  treeChart.appendChild(
    svgEl("line", {
      class: "axis",
      x1: plotLeft,
      y1: plotBottom,
      x2: plotLeft,
      y2: plotTop,
    }),
  );

  treeChart.appendChild(
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
  treeChart.appendChild(
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

function drawCuts() {
  const plotLeft = chart.margin.left;
  const plotRight = chart.margin.left + chart.plotWidth;
  const plotTop = chart.margin.top;
  const plotBottom = chart.margin.top + chart.plotHeight;
  const cutX = xScale(thresholds.clicks);
  const cutY = yScale(thresholds.duration);

  treeChart.appendChild(
    svgEl("line", {
      class: "cut-line",
      x1: cutX,
      y1: plotTop,
      x2: cutX,
      y2: plotBottom,
    }),
  );
  treeChart.appendChild(
    svgEl("line", {
      class: "cut-line",
      x1: plotLeft,
      y1: cutY,
      x2: plotRight,
      y2: cutY,
    }),
  );
  treeChart.appendChild(
    svgEl(
      "text",
      {
        class: "cut-label",
        x: cutX + 16,
        y: yScale(18.2),
        transform: `rotate(-90 ${cutX + 16} ${yScale(18.2)})`,
        "text-anchor": "middle",
      },
      "clics = 10",
    ),
  );
  treeChart.appendChild(
    svgEl(
      "text",
      {
        class: "cut-label",
        x: xScale(21),
        y: cutY - 10,
        "text-anchor": "middle",
      },
      "duración = 10",
    ),
  );
}

function drawRegionLabels() {
  const labels = [
    { className: "abandon", x: 5, y: 2.8 },
    { className: "browse", x: 5, y: 22.2 },
    { className: "cart", x: 17.8, y: 2.8 },
    { className: "buy", x: 18.5, y: 22.2 },
  ];

  labels.forEach((label) => {
    treeChart.appendChild(
      svgEl(
        "text",
        {
          class: "region-label",
          x: xScale(label.x),
          y: yScale(label.y),
          fill: classes[label.className].color,
          "text-anchor": "middle",
        },
        classes[label.className].label,
      ),
    );
  });
}

function drawPoints() {
  points.forEach((point) => {
    treeChart.appendChild(
      svgEl("circle", {
        class: "point",
        cx: xScale(point.x),
        cy: yScale(point.y),
        r: 5,
        fill: classes[point.className].color,
      }),
    );
  });
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

  treeChart.appendChild(
    svgEl("polygon", {
      class: "probe",
      points: pointsAttr,
    }),
  );
  treeChart.appendChild(
    svgEl(
      "text",
      {
        class: "probe-label",
        x: x + 16,
        y: y - 12,
      },
      "sesión nueva",
    ),
  );
}

function drawChart() {
  treeChart.replaceChildren();

  drawRectForRegion("abandon", 0, thresholds.clicks, 0, thresholds.duration);
  drawRectForRegion("browse", 0, thresholds.clicks, thresholds.duration, 25);
  drawRectForRegion("cart", thresholds.clicks, 25, 0, thresholds.duration);
  drawRectForRegion("buy", thresholds.clicks, 25, thresholds.duration, 25);
  drawAxes();
  drawCuts();
  drawRegionLabels();
  drawPoints();
  drawProbe();
}

function renderTreePath(result) {
  Object.values(pathElements).forEach((element) => {
    element.classList.remove("active");
  });

  result.path.forEach((key) => {
    pathElements[key].classList.add("active");
  });
}

function renderSummary(result) {
  const classInfo = classes[result.className];

  clickOutput.textContent = formatNumber(state.probe.x);
  durationOutput.textContent = formatNumber(state.probe.y);
  probeValue.textContent = `${formatNumber(state.probe.x)} clics, ${formatNumber(
    state.probe.y,
  )} min`;
  statusBadge.textContent = classInfo.label;
  statusBadge.className = `status-badge ${result.className}`;
  predictionValue.textContent = classInfo.label;
  ruleText.textContent = result.rule;
}

function render() {
  const result = classify(state.probe);
  drawChart();
  renderTreePath(result);
  renderSummary(result);
}

function updateProbeFromInputs() {
  state.probe.x = Number(clickInput.value);
  state.probe.y = Number(durationInput.value);
}

clickInput.addEventListener("input", () => {
  updateProbeFromInputs();
  render();
});

durationInput.addEventListener("input", () => {
  updateProbeFromInputs();
  render();
});

treeChart.addEventListener("click", (event) => {
  const rect = treeChart.getBoundingClientRect();
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
