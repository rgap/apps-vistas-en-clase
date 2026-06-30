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

const clients = clientPairs.map(([x, y], index) => ({ id: index, x, y }));

const colors = ["cluster-0", "cluster-1", "cluster-2", "cluster-3", "cluster-4", "cluster-5"];

const methodConfig = {
  kmeans: {
    label: "K-means",
    summary: "Fija k = 4 y acerca cada cliente al centroide mas cercano.",
    explanation:
      "Empieza con centroides, asigna cada cliente al mas cercano y recalcula los centros varias veces.",
    result: "K-means reparte todos los clientes en cuatro grupos.",
    paramOneLabel: "k",
    paramOneValue: "4 segmentos",
    paramTwoLabel: "Centros",
    paramTwoValue: "centroides recalculados",
  },
  meanshift: {
    label: "Mean Shift",
    summary: "Mueve cada punto hacia la zona con mas clientes cercanos.",
    explanation:
      "Cada cliente se desplaza al promedio de sus vecinos dentro de una ventana hasta llegar a una zona densa.",
    result: "Mean Shift encuentra segmentos por concentracion de clientes.",
    paramOneLabel: "Ventana",
    paramOneValue: "radio 0.22 normalizado",
    paramTwoLabel: "k",
    paramTwoValue: "no se fija antes",
  },
  dbscan: {
    label: "DBSCAN",
    summary: "Une clientes densos y deja aparte puntos atipicos.",
    explanation:
      "Un cliente forma parte de un segmento si tiene suficientes vecinos cerca; si no, puede quedar como ruido.",
    result: "DBSCAN separa zonas densas y marca clientes aislados como ruido.",
    paramOneLabel: "eps",
    paramOneValue: "0.08 normalizado",
    paramTwoLabel: "minPts",
    paramTwoValue: "5 clientes",
  },
};

const chart = {
  width: 920,
  height: 600,
  margin: { top: 36, right: 42, bottom: 78, left: 88 },
  xDomain: [0, 25],
  yDomain: [0, 250],
  xTicks: [0, 5, 10, 15, 20, 25],
  yTicks: [0, 50, 100, 150, 200, 250],
};

chart.plotWidth = chart.width - chart.margin.left - chart.margin.right;
chart.plotHeight = chart.height - chart.margin.top - chart.margin.bottom;

const state = {
  method: "kmeans",
};

const methodSelect = document.getElementById("methodSelect");
const methodSummary = document.getElementById("methodSummary");
const clusterChart = document.getElementById("clusterChart");
const methodBadge = document.getElementById("methodBadge");
const clusterCount = document.getElementById("clusterCount");
const noiseCount = document.getElementById("noiseCount");
const largestCluster = document.getElementById("largestCluster");
const resultText = document.getElementById("resultText");
const explanationText = document.getElementById("explanationText");
const paramOneLabel = document.getElementById("paramOneLabel");
const paramOneValue = document.getElementById("paramOneValue");
const paramTwoLabel = document.getElementById("paramTwoLabel");
const paramTwoValue = document.getElementById("paramTwoValue");

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

function formatNumber(value, digits = 1) {
  return value.toFixed(digits).replace(/\.?0+$/, "");
}

function toScaled(point) {
  return [point.x / chart.xDomain[1], point.y / chart.yDomain[1]];
}

function fromScaled(point) {
  return { x: point[0] * chart.xDomain[1], y: point[1] * chart.yDomain[1] };
}

const scaledClients = clients.map(toScaled);

function distance(first, second) {
  return Math.hypot(first[0] - second[0], first[1] - second[1]);
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

function meanOf(points) {
  if (points.length === 0) return null;

  const total = points.reduce(
    (acc, point) => [acc[0] + point[0], acc[1] + point[1]],
    [0, 0],
  );

  return [total[0] / points.length, total[1] / points.length];
}

function runKMeans() {
  let centers = [
    [3.5 / 25, 78 / 250],
    [4.5 / 25, 168 / 250],
    [10.5 / 25, 96 / 250],
    [17.5 / 25, 56 / 250],
  ];
  let labels = new Array(clients.length).fill(0);

  for (let iteration = 0; iteration < 18; iteration += 1) {
    labels = scaledClients.map((point) => nearestCenterIndex(point, centers));

    centers = centers.map((center, centerIndex) => {
      const assigned = scaledClients.filter((point, index) => labels[index] === centerIndex);
      return meanOf(assigned) || center;
    });
  }

  labels = scaledClients.map((point) => nearestCenterIndex(point, centers));

  return {
    labels,
    centers: centers.map(fromScaled),
    noiseLabel: -1,
    radius: null,
  };
}

function mergeModes(modes, mergeDistance) {
  const merged = [];

  modes.forEach((mode) => {
    const match = merged.find((candidate) => distance(candidate.center, mode) <= mergeDistance);

    if (match) {
      match.count += 1;
      match.center = [
        match.center[0] + (mode[0] - match.center[0]) / match.count,
        match.center[1] + (mode[1] - match.center[1]) / match.count,
      ];
      return;
    }

    merged.push({ center: [...mode], count: 1 });
  });

  return merged
    .map((mode) => mode.center)
    .sort((first, second) => first[0] + first[1] - (second[0] + second[1]));
}

function runMeanShift() {
  const bandwidth = 0.22;
  const modes = scaledClients.map((point) => {
    let current = [...point];

    for (let iteration = 0; iteration < 24; iteration += 1) {
      const neighbors = scaledClients.filter((candidate) => distance(current, candidate) <= bandwidth);
      const next = meanOf(neighbors) || current;

      if (distance(current, next) < 0.001) break;
      current = next;
    }

    return current;
  });

  const centers = mergeModes(modes, bandwidth * 0.45);
  const labels = scaledClients.map((point) => nearestCenterIndex(point, centers));

  return {
    labels,
    centers: centers.map(fromScaled),
    noiseLabel: -1,
    radius: bandwidth,
  };
}

function regionQuery(index, epsilon) {
  return scaledClients
    .map((point, candidateIndex) => ({ candidateIndex, distance: distance(scaledClients[index], point) }))
    .filter((candidate) => candidate.distance <= epsilon)
    .map((candidate) => candidate.candidateIndex);
}

function runDbscan() {
  const epsilon = 0.08;
  const minPts = 5;
  const labels = new Array(clients.length).fill(null);
  const visited = new Array(clients.length).fill(false);
  let currentCluster = 0;

  function expandCluster(index, neighbors) {
    labels[index] = currentCluster;

    for (let position = 0; position < neighbors.length; position += 1) {
      const neighborIndex = neighbors[position];

      if (!visited[neighborIndex]) {
        visited[neighborIndex] = true;
        const neighborNeighbors = regionQuery(neighborIndex, epsilon);

        if (neighborNeighbors.length >= minPts) {
          neighborNeighbors.forEach((candidate) => {
            if (!neighbors.includes(candidate)) neighbors.push(candidate);
          });
        }
      }

      if (labels[neighborIndex] === null || labels[neighborIndex] === -1) {
        labels[neighborIndex] = currentCluster;
      }
    }
  }

  clients.forEach((client, index) => {
    if (visited[index]) return;

    visited[index] = true;
    const neighbors = regionQuery(index, epsilon);

    if (neighbors.length < minPts) {
      labels[index] = -1;
      return;
    }

    expandCluster(index, neighbors);
    currentCluster += 1;
  });

  const clusterIds = [...new Set(labels.filter((label) => label >= 0))];
  const centers = clusterIds.map((clusterId) => {
    const assigned = scaledClients.filter((point, index) => labels[index] === clusterId);
    return fromScaled(meanOf(assigned));
  });

  return {
    labels,
    centers,
    noiseLabel: -1,
    radius: epsilon,
  };
}

function activeResult() {
  if (state.method === "meanshift") return runMeanShift();
  if (state.method === "dbscan") return runDbscan();
  return runKMeans();
}

function drawAxes() {
  const plotLeft = chart.margin.left;
  const plotRight = chart.margin.left + chart.plotWidth;
  const plotTop = chart.margin.top;
  const plotBottom = chart.margin.top + chart.plotHeight;

  chart.xTicks.forEach((tick) => {
    const x = xScale(tick);
    clusterChart.appendChild(
      svgEl("line", {
        class: "grid-line",
        x1: x,
        y1: plotTop,
        x2: x,
        y2: plotBottom,
      }),
    );
    clusterChart.appendChild(
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
    clusterChart.appendChild(
      svgEl("line", {
        class: "grid-line",
        x1: plotLeft,
        y1: y,
        x2: plotRight,
        y2: y,
      }),
    );
    clusterChart.appendChild(
      svgEl(
        "text",
        {
          class: "tick-label",
          x: plotLeft - 18,
          y: y + 4,
          "text-anchor": "end",
        },
        `S/${tick}`,
      ),
    );
  });

  clusterChart.appendChild(
    svgEl("line", {
      class: "axis",
      x1: plotLeft,
      y1: plotBottom,
      x2: plotRight,
      y2: plotBottom,
    }),
  );
  clusterChart.appendChild(
    svgEl("line", {
      class: "axis",
      x1: plotLeft,
      y1: plotBottom,
      x2: plotLeft,
      y2: plotTop,
    }),
  );

  clusterChart.appendChild(
    svgEl(
      "text",
      {
        class: "axis-label",
        x: (plotLeft + plotRight) / 2,
        y: chart.height - 22,
        "text-anchor": "middle",
      },
      "visitas",
    ),
  );
  clusterChart.appendChild(
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

function drawRadius(center, radius) {
  if (!radius) return;

  const rx = Math.abs(xScale(center.x + radius * chart.xDomain[1]) - xScale(center.x));
  const ry = Math.abs(yScale(center.y + radius * chart.yDomain[1]) - yScale(center.y));

  clusterChart.appendChild(
    svgEl("ellipse", {
      class: "density-ring",
      cx: xScale(center.x),
      cy: yScale(center.y),
      rx,
      ry,
    }),
  );
}

function drawCenters(result) {
  result.centers.forEach((center) => {
    drawRadius(center, result.radius);

    const x = xScale(center.x);
    const y = yScale(center.y);
    const size = 8;
    const points = [
      `${x},${y - size}`,
      `${x + size},${y}`,
      `${x},${y + size}`,
      `${x - size},${y}`,
    ].join(" ");

    clusterChart.appendChild(
      svgEl("polygon", {
        class: "center-marker",
        points,
      }),
    );
  });
}

function drawClients(result) {
  clients.forEach((client, index) => {
    const label = result.labels[index];
    const className =
      label === result.noiseLabel
        ? "client-point noise"
        : `client-point ${colors[label % colors.length]}`;

    clusterChart.appendChild(
      svgEl("circle", {
        class: className,
        cx: xScale(client.x),
        cy: yScale(client.y),
        r: label === result.noiseLabel ? 4.5 : 5.5,
      }),
    );
  });
}

function clusterCounts(result) {
  const counts = new Map();

  result.labels.forEach((label) => {
    if (label === result.noiseLabel) return;
    counts.set(label, (counts.get(label) || 0) + 1);
  });

  return [...counts.entries()].sort((first, second) => first[0] - second[0]);
}

function updatePanel(result) {
  const config = methodConfig[state.method];
  const counts = clusterCounts(result);
  const noise = result.labels.filter((label) => label === result.noiseLabel).length;
  const largest = counts.reduce(
    (best, current) => (current[1] > best[1] ? current : best),
    [-1, 0],
  );

  methodSummary.textContent = config.summary;
  methodBadge.textContent = config.label;
  clusterCount.textContent = String(counts.length);
  noiseCount.textContent = String(noise);
  largestCluster.textContent =
    largest[0] >= 0
      ? `Segmento ${largest[0] + 1}: ${largest[1]} clientes`
      : "Sin segmento principal";
  resultText.textContent = config.result;
  explanationText.textContent = config.explanation;
  paramOneLabel.textContent = config.paramOneLabel;
  paramOneValue.textContent = config.paramOneValue;
  paramTwoLabel.textContent = config.paramTwoLabel;
  paramTwoValue.textContent = config.paramTwoValue;
}

function render() {
  const result = activeResult();

  clusterChart.replaceChildren();
  drawAxes();
  drawCenters(result);
  drawClients(result);
  updatePanel(result);
}

methodSelect.addEventListener("change", () => {
  state.method = methodSelect.value;
  render();
});

render();
