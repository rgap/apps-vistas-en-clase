const svgNamespace = "http://www.w3.org/2000/svg";

const classOrder = ["abandon", "browse", "cart", "buy"];

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

const featureNames = {
  x: "clics",
  y: "duración",
};

const criterionLabels = {
  gini: "Gini",
  entropy: "Entropía",
  error: "Error de clasificación",
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
  criterion: "gini",
  maxDepth: 3,
  minLeaf: 3,
  probe: { x: 12, y: 13 },
  tree: null,
};

const trainingChart = document.getElementById("trainingChart");
const criterionSelect = document.getElementById("criterionSelect");
const maxDepthInput = document.getElementById("maxDepthInput");
const maxDepthOutput = document.getElementById("maxDepthOutput");
const minLeafInput = document.getElementById("minLeafInput");
const minLeafOutput = document.getElementById("minLeafOutput");
const clickInput = document.getElementById("clickInput");
const clickOutput = document.getElementById("clickOutput");
const durationInput = document.getElementById("durationInput");
const durationOutput = document.getElementById("durationOutput");
const statusBadge = document.getElementById("statusBadge");
const probeValue = document.getElementById("probeValue");
const predictionValue = document.getElementById("predictionValue");
const pathText = document.getElementById("pathText");
const criterionValue = document.getElementById("criterionValue");
const rootSplitValue = document.getElementById("rootSplitValue");
const leafCountValue = document.getElementById("leafCountValue");
const accuracyValue = document.getElementById("accuracyValue");
const treeContainer = document.getElementById("treeContainer");

let nextNodeId = 1;

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

function countsOf(rows) {
  const counts = Object.fromEntries(classOrder.map((className) => [className, 0]));
  rows.forEach((row) => {
    counts[row.className] += 1;
  });
  return counts;
}

function majorityClass(rows) {
  const counts = countsOf(rows);

  return classOrder
    .map((className) => ({ className, count: counts[className] }))
    .sort((first, second) => {
      if (first.count !== second.count) return second.count - first.count;
      return classOrder.indexOf(first.className) - classOrder.indexOf(second.className);
    })[0].className;
}

function impurity(rows, criterion) {
  if (rows.length === 0) return 0;

  const counts = countsOf(rows);
  const probabilities = classOrder.map((className) => counts[className] / rows.length);

  if (criterion === "entropy") {
    return probabilities.reduce((total, probability) => {
      if (probability === 0) return total;
      return total - probability * Math.log2(probability);
    }, 0);
  }

  if (criterion === "error") {
    return 1 - Math.max(...probabilities);
  }

  return 1 - probabilities.reduce((total, probability) => total + probability ** 2, 0);
}

function candidateThresholds(rows, feature) {
  const values = [...new Set(rows.map((row) => row[feature]))].sort((a, b) => a - b);
  const thresholds = [];

  for (let index = 1; index < values.length; index += 1) {
    thresholds.push((values[index - 1] + values[index]) / 2);
  }

  return thresholds;
}

function splitRows(rows, feature, threshold) {
  const left = [];
  const right = [];

  rows.forEach((row) => {
    if (row[feature] < threshold) {
      left.push(row);
    } else {
      right.push(row);
    }
  });

  return { left, right };
}

function bestSplit(rows) {
  const parentImpurity = impurity(rows, state.criterion);
  let best = null;

  ["x", "y"].forEach((feature) => {
    candidateThresholds(rows, feature).forEach((threshold) => {
      const { left, right } = splitRows(rows, feature, threshold);

      if (left.length < state.minLeaf || right.length < state.minLeaf) return;

      const weightedImpurity =
        (left.length / rows.length) * impurity(left, state.criterion) +
        (right.length / rows.length) * impurity(right, state.criterion);
      const gain = parentImpurity - weightedImpurity;
      const candidate = { feature, threshold, gain, left, right };

      if (
        !best ||
        candidate.gain > best.gain + 1e-10 ||
        (Math.abs(candidate.gain - best.gain) <= 1e-10 &&
          `${candidate.feature}${candidate.threshold}` < `${best.feature}${best.threshold}`)
      ) {
        best = candidate;
      }
    });
  });

  return best;
}

function trainNode(rows, depth) {
  const node = {
    id: nextNodeId,
    depth,
    samples: rows.length,
    counts: countsOf(rows),
    prediction: majorityClass(rows),
    impurity: impurity(rows, state.criterion),
    isLeaf: true,
  };
  nextNodeId += 1;

  const pure = classOrder.some((className) => node.counts[className] === rows.length);

  if (pure || depth >= state.maxDepth || rows.length < state.minLeaf * 2) {
    return node;
  }

  const split = bestSplit(rows);

  if (!split || split.gain <= 1e-10) {
    return node;
  }

  node.isLeaf = false;
  node.feature = split.feature;
  node.threshold = split.threshold;
  node.gain = split.gain;
  node.left = trainNode(split.left, depth + 1);
  node.right = trainNode(split.right, depth + 1);
  return node;
}

function trainTree() {
  nextNodeId = 1;
  return trainNode(points, 0);
}

function predict(node, point) {
  const path = [];
  const steps = [];
  let current = node;

  while (!current.isLeaf) {
    path.push(current.id);
    const value = point[current.feature];
    const goesLeft = value < current.threshold;
    steps.push(
      `${featureNames[current.feature]} < ${formatNumber(current.threshold)} → ${
        goesLeft ? "sí" : "no"
      }`,
    );
    current = goesLeft ? current.left : current.right;
  }

  path.push(current.id);

  return {
    className: current.prediction,
    leaf: current,
    path,
    steps,
  };
}

function treeStats(node) {
  if (node.isLeaf) {
    return { nodes: 1, leaves: 1 };
  }

  const left = treeStats(node.left);
  const right = treeStats(node.right);
  return {
    nodes: 1 + left.nodes + right.nodes,
    leaves: left.leaves + right.leaves,
  };
}

function trainingAccuracy(tree) {
  const correct = points.filter((point) => predict(tree, point).className === point.className);
  return correct.length / points.length;
}

function collectRegions(node, bounds, regions = []) {
  if (node.isLeaf) {
    regions.push({
      bounds,
      className: node.prediction,
    });
    return regions;
  }

  if (node.feature === "x") {
    collectRegions(
      node.left,
      { ...bounds, xMax: Math.min(bounds.xMax, node.threshold) },
      regions,
    );
    collectRegions(
      node.right,
      { ...bounds, xMin: Math.max(bounds.xMin, node.threshold) },
      regions,
    );
  } else {
    collectRegions(
      node.left,
      { ...bounds, yMax: Math.min(bounds.yMax, node.threshold) },
      regions,
    );
    collectRegions(
      node.right,
      { ...bounds, yMin: Math.max(bounds.yMin, node.threshold) },
      regions,
    );
  }

  return regions;
}

function collectSplits(node, bounds, splits = []) {
  if (node.isLeaf) return splits;

  splits.push({
    feature: node.feature,
    threshold: node.threshold,
    depth: node.depth,
    bounds,
  });

  if (node.feature === "x") {
    collectSplits(
      node.left,
      { ...bounds, xMax: Math.min(bounds.xMax, node.threshold) },
      splits,
    );
    collectSplits(
      node.right,
      { ...bounds, xMin: Math.max(bounds.xMin, node.threshold) },
      splits,
    );
  } else {
    collectSplits(
      node.left,
      { ...bounds, yMax: Math.min(bounds.yMax, node.threshold) },
      splits,
    );
    collectSplits(
      node.right,
      { ...bounds, yMin: Math.max(bounds.yMin, node.threshold) },
      splits,
    );
  }

  return splits;
}

function drawRegion(region) {
  const { bounds, className } = region;
  const x = xScale(bounds.xMin);
  const y = yScale(bounds.yMax);
  const width = xScale(bounds.xMax) - xScale(bounds.xMin);
  const height = yScale(bounds.yMin) - yScale(bounds.yMax);

  if (width <= 0 || height <= 0) return;

  trainingChart.appendChild(
    svgEl("rect", {
      class: classes[className].regionClass,
      x,
      y,
      width,
      height,
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
    trainingChart.appendChild(
      svgEl("line", {
        class: "grid-line",
        x1: x,
        y1: plotTop,
        x2: x,
        y2: plotBottom,
      }),
    );
    trainingChart.appendChild(
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
    trainingChart.appendChild(
      svgEl("line", {
        class: "grid-line",
        x1: plotLeft,
        y1: y,
        x2: plotRight,
        y2: y,
      }),
    );
    trainingChart.appendChild(
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

  trainingChart.appendChild(
    svgEl("line", {
      class: "axis",
      x1: plotLeft,
      y1: plotBottom,
      x2: plotRight,
      y2: plotBottom,
    }),
  );
  trainingChart.appendChild(
    svgEl("line", {
      class: "axis",
      x1: plotLeft,
      y1: plotBottom,
      x2: plotLeft,
      y2: plotTop,
    }),
  );

  trainingChart.appendChild(
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
  trainingChart.appendChild(
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

function drawSplit(split) {
  if (split.feature === "x") {
    trainingChart.appendChild(
      svgEl("line", {
        class: "split-line",
        x1: xScale(split.threshold),
        y1: yScale(split.bounds.yMin),
        x2: xScale(split.threshold),
        y2: yScale(split.bounds.yMax),
      }),
    );
  } else {
    trainingChart.appendChild(
      svgEl("line", {
        class: "split-line",
        x1: xScale(split.bounds.xMin),
        y1: yScale(split.threshold),
        x2: xScale(split.bounds.xMax),
        y2: yScale(split.threshold),
      }),
    );
  }

  if (split.depth > 1) return;

  const labelX =
    split.feature === "x"
      ? xScale(split.threshold) + 12
      : (xScale(split.bounds.xMin) + xScale(split.bounds.xMax)) / 2;
  const labelY =
    split.feature === "x"
      ? (yScale(split.bounds.yMin) + yScale(split.bounds.yMax)) / 2
      : yScale(split.threshold) - 8;

  trainingChart.appendChild(
    svgEl(
      "text",
      {
        class: "split-label",
        x: labelX,
        y: labelY,
        "text-anchor": "middle",
      },
      `${featureNames[split.feature]} < ${formatNumber(split.threshold)}`,
    ),
  );
}

function drawPoints() {
  points.forEach((point) => {
    trainingChart.appendChild(
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

  trainingChart.appendChild(
    svgEl("polygon", {
      class: "probe",
      points: pointsAttr,
    }),
  );
  trainingChart.appendChild(
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

function drawChart(tree) {
  trainingChart.replaceChildren();
  const bounds = { xMin: 0, xMax: 25, yMin: 0, yMax: 25 };

  collectRegions(tree, bounds).forEach(drawRegion);
  drawAxes();
  collectSplits(tree, bounds).forEach(drawSplit);
  drawPoints();
  drawProbe();
}

function renderTreeNode(node, activePath) {
  const card = document.createElement("div");
  const classNames = ["tree-card"];
  if (activePath.has(node.id)) classNames.push("active");

  if (node.isLeaf) {
    classNames.push("leaf", node.prediction);
    card.className = classNames.join(" ");
    const title = document.createElement("p");
    title.className = "tree-title";
    title.textContent = `Hoja: ${classes[node.prediction].label}`;

    const meta = document.createElement("p");
    meta.className = "tree-meta";
    meta.textContent = `${node.samples} obs. · impureza ${formatNumber(node.impurity, 3)}`;
    card.append(title, meta);
    return card;
  }

  card.className = classNames.join(" ");
  const title = document.createElement("p");
  title.className = "tree-title";
  title.textContent = `¿${featureNames[node.feature]} < ${formatNumber(node.threshold)}?`;

  const meta = document.createElement("p");
  meta.className = "tree-meta";
  meta.textContent = `${node.samples} obs. · ganancia ${formatNumber(node.gain, 3)}`;

  const children = document.createElement("div");
  children.className = "tree-children";

  const leftBranch = document.createElement("div");
  leftBranch.className = "tree-branch";
  const leftLabel = document.createElement("span");
  leftLabel.className = "branch-label";
  leftLabel.textContent = "sí";
  leftBranch.append(leftLabel, renderTreeNode(node.left, activePath));

  const rightBranch = document.createElement("div");
  rightBranch.className = "tree-branch";
  const rightLabel = document.createElement("span");
  rightLabel.className = "branch-label";
  rightLabel.textContent = "no";
  rightBranch.append(rightLabel, renderTreeNode(node.right, activePath));

  children.append(leftBranch, rightBranch);
  card.append(title, meta, children);
  return card;
}

function renderTree(tree, prediction) {
  treeContainer.replaceChildren(renderTreeNode(tree, new Set(prediction.path)));
}

function renderSummary(tree, prediction) {
  const stats = treeStats(tree);
  const classInfo = classes[prediction.className];
  const accuracy = trainingAccuracy(tree);

  maxDepthOutput.textContent = String(state.maxDepth);
  minLeafOutput.textContent = String(state.minLeaf);
  clickOutput.textContent = formatNumber(state.probe.x);
  durationOutput.textContent = formatNumber(state.probe.y);
  criterionValue.textContent = criterionLabels[state.criterion];
  rootSplitValue.textContent = tree.isLeaf
    ? "Sin corte"
    : `${featureNames[tree.feature]} < ${formatNumber(tree.threshold)}`;
  leafCountValue.textContent = String(stats.leaves);
  accuracyValue.textContent = `${Math.round(accuracy * 100)}%`;
  probeValue.textContent = `${formatNumber(state.probe.x)} clics, ${formatNumber(
    state.probe.y,
  )} min`;
  statusBadge.textContent = classInfo.label;
  statusBadge.className = `status-badge ${prediction.className}`;
  predictionValue.textContent = classInfo.label;
  pathText.textContent =
    prediction.steps.length > 0
      ? `${prediction.steps.join("; ")}. Hoja: ${classInfo.label}.`
      : `El árbol quedó como una sola hoja: ${classInfo.label}.`;
}

function retrainAndRender() {
  state.tree = trainTree();
  const prediction = predict(state.tree, state.probe);
  drawChart(state.tree);
  renderTree(state.tree, prediction);
  renderSummary(state.tree, prediction);
}

function updateProbeFromInputs() {
  state.probe.x = Number(clickInput.value);
  state.probe.y = Number(durationInput.value);
}

criterionSelect.addEventListener("change", () => {
  state.criterion = criterionSelect.value;
  retrainAndRender();
});

maxDepthInput.addEventListener("input", () => {
  state.maxDepth = Number(maxDepthInput.value);
  retrainAndRender();
});

minLeafInput.addEventListener("input", () => {
  state.minLeaf = Number(minLeafInput.value);
  retrainAndRender();
});

clickInput.addEventListener("input", () => {
  updateProbeFromInputs();
  retrainAndRender();
});

durationInput.addEventListener("input", () => {
  updateProbeFromInputs();
  retrainAndRender();
});

trainingChart.addEventListener("click", (event) => {
  const rect = trainingChart.getBoundingClientRect();
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
  retrainAndRender();
});

retrainAndRender();
