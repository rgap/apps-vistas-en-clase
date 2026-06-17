const nodes = {
  A: { name: "UTP nueva sede", x: 80, y: 435, scoreLabel: "below" },
  B: { name: "Av. Parra", x: 290, y: 435, scoreLabel: "below" },
  C: { name: "Salaverry", x: 545, y: 250 },
  D: { name: "Alvarez Thomas", x: 810, y: 80 },
  E: { name: "Santo Domingo", x: 1140, y: 385, scoreLabel: "below" },
  F: { name: "Plaza de Armas", x: 1355, y: 385, scoreLabel: "below" },
  G: { name: "Tarapaca", x: 545, y: 750 },
  H: { name: "Av. La Marina", x: 810, y: 750 },
  I: { name: "Palacio Viejo", x: 1090, y: 715 },
  J: { name: "Av. Jorge Chavez", x: 810, y: 435 },
  K: { name: "Pierola", x: 985, y: 565, scoreLabel: "below" },
};

const edges = [
  { from: "A", to: "B", time: 1, traffic: "bajo", label: { x: 185, y: 390 } },
  { from: "B", to: "C", time: 1, traffic: "medio", label: { x: 415, y: 330 } },
  { from: "C", to: "D", time: 3, traffic: "medio", label: { x: 670, y: 140 } },
  { from: "D", to: "E", time: 1, traffic: "bajo", label: { x: 975, y: 170 } },
  { from: "E", to: "F", time: 1, traffic: "medio", label: { x: 1248, y: 340 } },
  { from: "C", to: "J", time: 1, traffic: "medio", label: { x: 670, y: 320 } },
  { from: "J", to: "K", time: 1, traffic: "medio", label: { x: 900, y: 500 } },
  { from: "K", to: "E", time: 1, traffic: "bajo", label: { x: 1070, y: 535 } },
  { from: "B", to: "G", time: 1, traffic: "bajo", label: { x: 415, y: 610 } },
  { from: "G", to: "H", time: 1, traffic: "bajo", label: { x: 675, y: 805 } },
  { from: "H", to: "I", time: 1, traffic: "bajo", label: { x: 955, y: 795 } },
  { from: "I", to: "E", time: 1, traffic: "bajo", label: { x: 1140, y: 575 } },
];

const start = "A";

const graph = edges.reduce((acc, edge) => {
  acc[edge.from] = acc[edge.from] || [];
  acc[edge.from].push(edge);
  return acc;
}, {});

const state = {
  selectedAlgorithm: "exhaustive",
  goal: "F",
  animationToken: 0,
};

const calculationBenchmarkRuns = 10000;
const aStarHeuristicCache = new Map();

const svg = document.getElementById("routeGraph");
const algorithmSelect = document.getElementById("algorithm");
const goalSelect = document.getElementById("goalNode");
const runButton = document.getElementById("runSearch");
const resetButton = document.getElementById("resetSearch");
const goalSummary = document.getElementById("goalSummary");
const routeText = document.getElementById("routeText");
const timeText = document.getElementById("timeText");
const calcTimeText = document.getElementById("calcTimeText");
const stepCount = document.getElementById("stepCount");
const visitedCount = document.getElementById("visitedCount");
const routeCount = document.getElementById("routeCount");
const resultNote = document.getElementById("resultNote");
const legend = document.getElementById("legend");
const knownRouteCode = document.getElementById("knownRouteCode");
const knownRouteMetrics = document.getElementById("knownRouteMetrics");

function edgeId(from, to) {
  return `${from}-${to}`;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatCalculationTime(ms) {
  return `${ms.toFixed(2)} ms`;
}

function getEdge(from, to) {
  return edges.find((edge) => edge.from === from && edge.to === to);
}

function getNeighbors(node) {
  return graph[node] || [];
}

function shortestHopAStarHeuristic(target) {
  const reversed = edges.reduce((acc, edge) => {
    acc[edge.to] = acc[edge.to] || [];
    acc[edge.to].push(edge.from);
    return acc;
  }, {});
  const hops = Object.fromEntries(
    Object.keys(nodes).map((node) => [node, Infinity]),
  );
  const queue = [target];
  hops[target] = 0;

  while (queue.length) {
    const current = queue.shift();
    (reversed[current] || []).forEach((previous) => {
      if (hops[previous] <= hops[current] + 1) return;
      hops[previous] = hops[current] + 1;
      queue.push(previous);
    });
  }

  return hops;
}

function getAStarHeuristic(target = state.goal) {
  if (!aStarHeuristicCache.has(target)) {
    aStarHeuristicCache.set(target, shortestHopAStarHeuristic(target));
  }

  return aStarHeuristicCache.get(target);
}

function routeStats(path) {
  let time = 0;

  for (let index = 0; index < path.length - 1; index += 1) {
    const edge = getEdge(path[index], path[index + 1]);
    if (!edge) continue;
    time += edge.time;
  }

  return {
    time,
  };
}

function localHillScore(edge) {
  return edge.time;
}

function compareHillCandidates(a, b) {
  return localHillScore(a) - localHillScore(b);
}

function aStarScore(candidate, heuristic) {
  const i = candidate.i;
  const j = heuristic[candidate.node];
  return i + j;
}

function aStarScoreDetails(candidate, heuristic) {
  const i = candidate.i;
  const j = heuristic[candidate.node];

  return {
    i,
    j,
    f: i + j,
  };
}

function formatScoreValue(value) {
  if (!Number.isFinite(value)) return "infinito";
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function pathEdges(path) {
  const pairs = [];
  for (let index = 0; index < path.length - 1; index += 1) {
    pairs.push(edgeId(path[index], path[index + 1]));
  }
  return pairs;
}

function lineEndpoint(from, to, offset) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;

  return {
    x: from.x + (dx / length) * offset,
    y: from.y + (dy / length) * offset,
  };
}

function aStarScoreLabelPosition(node) {
  const placeBelow = node.scoreLabel === "below" || node.y < 85;

  return {
    x: node.x,
    firstLineY: node.y + (placeBelow ? 55 : -64),
    secondLineY: node.y + (placeBelow ? 72 : -48),
    bgY: node.y + (placeBelow ? 42 : -77),
  };
}

function renderLegend() {
  legend.innerHTML = Object.entries(nodes)
    .map(
      ([key, node]) => `
        <div class="legend-row">
          <span class="legend-key">${key}</span>
          <span class="legend-name">${node.name}</span>
        </div>
      `,
    )
    .join("");
}

function renderGoalOptions() {
  goalSelect.innerHTML = Object.entries(nodes)
    .filter(([key]) => key !== start)
    .map(([key]) => `<option value="${key}">${key}</option>`)
    .join("");
  goalSelect.value = state.goal;
}

function bestKnownRoute(target = state.goal) {
  const routes = [];

  function walk(node, path) {
    if (node === target) {
      routes.push(path);
      return;
    }

    getNeighbors(node).forEach((edge) => {
      if (path.includes(edge.to)) return;
      walk(edge.to, [...path, edge.to]);
    });
  }

  walk(start, [start]);
  return (
    routes.sort((a, b) => routeStats(a).time - routeStats(b).time)[0] || []
  );
}

function updateKnownRoute() {
  goalSummary.textContent = state.goal;
  const path = bestKnownRoute();

  if (!path.length) {
    knownRouteCode.textContent = "Sin camino conocido";
    knownRouteMetrics.textContent = "-";
    return;
  }

  const stats = routeStats(path);
  knownRouteCode.textContent = path.join(" -> ");
  knownRouteMetrics.textContent = `${stats.time} minutos`;
}

function drawGraph() {
  svg.innerHTML = `
    <defs>
      <marker id="arrowDefault" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto">
        <path d="M2,2 L10,6 L2,10 Z" fill="#8ea0b8"></path>
      </marker>
      <marker id="arrowVisited" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto">
        <path d="M2,2 L10,6 L2,10 Z" fill="#3b82f6"></path>
      </marker>
      <marker id="arrowRoute" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto">
        <path d="M2,2 L10,6 L2,10 Z" fill="#16a34a"></path>
      </marker>
    </defs>
  `;

  const edgeLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
  const labelLayer = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "g",
  );
  const nodeLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");

  edges.forEach((edge) => {
    const from = nodes[edge.from];
    const to = nodes[edge.to];
    const startPoint = lineEndpoint(from, to, 33);
    const endPoint = lineEndpoint(to, from, 39);
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("id", `edge-${edgeId(edge.from, edge.to)}`);
    line.setAttribute("class", "edge");
    line.setAttribute("x1", startPoint.x);
    line.setAttribute("y1", startPoint.y);
    line.setAttribute("x2", endPoint.x);
    line.setAttribute("y2", endPoint.y);
    line.setAttribute("marker-end", "url(#arrowDefault)");
    edgeLayer.appendChild(line);

    const labelGroup = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g",
    );
    labelGroup.setAttribute("class", "edge-label");

    const labelText = `${edge.time} min`;
    const labelWidth = labelText.length * 8 + 18;
    const labelHeight = 24;
    const labelX = edge.label.x;
    const labelY = edge.label.y;

    const labelBg = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "rect",
    );
    labelBg.setAttribute("class", "edge-label-bg");
    labelBg.setAttribute("x", labelX - labelWidth / 2);
    labelBg.setAttribute("y", labelY - labelHeight / 2);
    labelBg.setAttribute("width", labelWidth);
    labelBg.setAttribute("height", labelHeight);
    labelBg.setAttribute("rx", "7");
    labelGroup.appendChild(labelBg);

    const label = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text",
    );
    label.setAttribute("class", "edge-label-text");
    label.setAttribute("x", labelX);
    label.setAttribute("y", labelY + 1);
    label.textContent = labelText;
    labelGroup.appendChild(label);

    labelLayer.appendChild(labelGroup);
  });

  Object.entries(nodes).forEach(([key, node]) => {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("id", `node-${key}`);
    group.setAttribute(
      "class",
      `node ${key === start ? "start" : ""} ${key === state.goal ? "goal" : ""}`,
    );
    group.setAttribute("tabindex", "0");
    group.setAttribute("aria-label", `${key}: ${node.name}`);

    const circle = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle",
    );
    circle.setAttribute("cx", node.x);
    circle.setAttribute("cy", node.y);
    circle.setAttribute("r", "28");
    group.appendChild(circle);

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", node.x);
    text.setAttribute("y", node.y + 1);
    text.textContent = key;
    group.appendChild(text);

    const scorePosition = aStarScoreLabelPosition(node);
    const scoreGroup = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g",
    );
    scoreGroup.setAttribute("id", `astar-score-${key}`);
    scoreGroup.setAttribute("class", "astar-score");
    scoreGroup.setAttribute("aria-hidden", "true");

    const scoreBg = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "rect",
    );
    scoreBg.setAttribute("class", "astar-score-bg");
    scoreBg.setAttribute("x", scorePosition.x - 70);
    scoreBg.setAttribute("y", scorePosition.bgY);
    scoreBg.setAttribute("width", "140");
    scoreBg.setAttribute("height", "44");
    scoreBg.setAttribute("rx", "6");
    scoreGroup.appendChild(scoreBg);

    const scoreFormula = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text",
    );
    scoreFormula.setAttribute("class", "astar-score-text astar-score-formula");
    scoreFormula.setAttribute("x", scorePosition.x);
    scoreFormula.setAttribute("y", scorePosition.firstLineY);
    scoreGroup.appendChild(scoreFormula);

    const scoreResult = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text",
    );
    scoreResult.setAttribute("class", "astar-score-text astar-score-result");
    scoreResult.setAttribute("x", scorePosition.x);
    scoreResult.setAttribute("y", scorePosition.secondLineY);
    scoreGroup.appendChild(scoreResult);

    group.appendChild(scoreGroup);

    nodeLayer.appendChild(group);
  });

  svg.append(edgeLayer, labelLayer, nodeLayer);
}

function resetVisuals() {
  state.animationToken += 1;
  svg.querySelectorAll(".visited, .route").forEach((item) => {
    item.classList.remove("visited", "route");
  });
  svg.querySelectorAll(".edge").forEach((edge) => {
    edge.setAttribute("marker-end", "url(#arrowDefault)");
  });
  svg.querySelectorAll(".astar-score").forEach((score) => {
    score.classList.remove("visible");
  });
  routeText.textContent = "Sin calcular";
  timeText.textContent = "-";
  calcTimeText.textContent = "-";
  stepCount.textContent = "-";
  visitedCount.textContent = "-";
  routeCount.textContent = "-";
  updateAlgorithmNote();
  updateKnownRoute();
}

function showAStarScore(node, score) {
  if (!score) return;

  const scoreEl = document.getElementById(`astar-score-${node}`);
  if (!scoreEl) return;

  const i = formatScoreValue(score.i);
  const j = formatScoreValue(score.j);
  const f = formatScoreValue(score.f);
  scoreEl.querySelector(".astar-score-formula").textContent =
    `f(${node}) = ${i} + ${j}`;
  scoreEl.querySelector(".astar-score-result").textContent = `f(${node}) = ${f}`;
  scoreEl.classList.add("visible");
}

function setVisited(node, previousNode = null, score = null) {
  const nodeEl = document.getElementById(`node-${node}`);
  nodeEl?.classList.add("visited");
  showAStarScore(node, score);

  if (previousNode) {
    const edgeEl = document.getElementById(
      `edge-${edgeId(previousNode, node)}`,
    );
    if (edgeEl) {
      edgeEl.classList.add("visited");
      edgeEl.setAttribute("marker-end", "url(#arrowVisited)");
    }
  }
}

function setRoute(path) {
  path.forEach((node) => {
    document.getElementById(`node-${node}`)?.classList.add("route");
  });

  pathEdges(path).forEach((id) => {
    const edgeEl = document.getElementById(`edge-${id}`);
    if (edgeEl) {
      edgeEl.classList.add("route");
      edgeEl.setAttribute("marker-end", "url(#arrowRoute)");
    }
  });
}

function dfs() {
  const visited = [];
  const seen = new Set();

  function search(node, path, depth = 0) {
    visited.push({ node, from: path[path.length - 2] || null, depth });
    seen.add(node);

    if (node === state.goal) return path;

    for (const edge of getNeighbors(node)) {
      if (seen.has(edge.to)) continue;
      const result = search(edge.to, [...path, edge.to], depth + 1);
      if (result) return result;
    }

    return null;
  }

  return { path: search(start, [start]) || [], visited, routesEvaluated: null };
}

function bfs() {
  const queue = [{ node: start, path: [start], from: null, depth: 0 }];
  const seen = new Set([start]);
  const visited = [];

  while (queue.length) {
    const current = queue.shift();
    visited.push({
      node: current.node,
      from: current.from,
      depth: current.depth,
    });

    if (current.node === state.goal) {
      return { path: current.path, visited, routesEvaluated: null };
    }

    getNeighbors(current.node).forEach((edge) => {
      if (seen.has(edge.to)) return;
      seen.add(edge.to);
      queue.push({
        node: edge.to,
        path: [...current.path, edge.to],
        from: current.node,
        depth: current.depth + 1,
      });
    });
  }

  return { path: [], visited, routesEvaluated: null };
}

function exhaustive() {
  const visited = [];
  const routes = [];

  function walk(node, path) {
    visited.push({ node, from: path[path.length - 2] || null });

    if (node === state.goal) {
      routes.push(path);
      return;
    }

    getNeighbors(node).forEach((edge) => {
      if (path.includes(edge.to)) return;
      walk(edge.to, [...path, edge.to]);
    });
  }

  walk(start, [start]);

  const best =
    routes.sort((a, b) => routeStats(a).time - routeStats(b).time)[0] || [];
  return { path: best, visited, routesEvaluated: routes.length };
}

function hillClimbing() {
  const visited = [];
  const seen = new Set();
  const path = [start];
  let current = start;

  while (current) {
    visited.push({ node: current, from: path[path.length - 2] || null });
    seen.add(current);

    if (current === state.goal) {
      return { path, visited, routesEvaluated: null };
    }

    const next = [...getNeighbors(current)]
      .filter((edge) => !seen.has(edge.to))
      .sort(compareHillCandidates)[0];

    if (!next) break;
    path.push(next.to);
    current = next.to;
  }

  return {
    path: current === state.goal ? path : [],
    visited,
    routesEvaluated: null,
  };
}

function aStar() {
  const open = [{ node: start, path: [start], i: 0, from: null }];
  const bestCost = new Map([[start, 0]]);
  const visited = [];
  const heuristic = getAStarHeuristic(state.goal);

  while (open.length) {
    open.sort((a, b) => aStarScore(a, heuristic) - aStarScore(b, heuristic));
    const current = open.shift();
    visited.push({
      node: current.node,
      from: current.from,
      score: aStarScoreDetails(current, heuristic),
    });

    if (current.node === state.goal) {
      return {
        path: current.path,
        visited,
        routesEvaluated: null,
        showAStarScores: true,
      };
    }

    getNeighbors(current.node).forEach((edge) => {
      const nextCost = current.i + edge.time;
      if (bestCost.has(edge.to) && bestCost.get(edge.to) <= nextCost) return;
      bestCost.set(edge.to, nextCost);
      open.push({
        node: edge.to,
        path: [...current.path, edge.to],
        i: nextCost,
        from: current.node,
      });
    });
  }

  return { path: [], visited, routesEvaluated: null, showAStarScores: true };
}

const algorithms = {
  dfs,
  bfs,
  exhaustive,
  hill: hillClimbing,
  astar: aStar,
};

const algorithmNotes = {
  astar:
    "A* calcula f(n) = i(n) + j(n). Donde i(n) es el tiempo acumulado y j(n) es la heuristica: minimo numero de nodos restantes hasta el destino seleccionado.",
  exhaustive:
    "La busqueda exhaustiva compara todas las rutas completas. Encuentra la optima, pero revisa mas posibilidades.",
  bfs: "BFS busca por niveles y se detiene al llegar al destino. En este grafo minimiza nodos en la ruta, no tiempo.",
  dfs: "DFS baja por la primera rama disponible hasta encontrar el destino. Aqui encuentra A -> B -> C -> D -> E -> F y se detiene, aunque no sea la ruta mas rapida.",
  hill: "Hill Climbing sin reinicio elige el tramo inmediato con menor tiempo. Puede avanzar hacia un camino que no llegue al destino porque no mira el costo restante ni vuelve a probar alternativas.",
};

function updateAlgorithmNote() {
  resultNote.textContent = algorithmNotes[state.selectedAlgorithm] || "";
}

function measureAlgorithm(algorithm) {
  let result = null;
  const startTime = performance.now();

  for (let index = 0; index < calculationBenchmarkRuns; index += 1) {
    result = algorithm();
  }

  const measuredMs = performance.now() - startTime;
  const completeRouteCost = (result.routesEvaluated ?? 0) * 8;
  const exhaustiveReviewCost = result.routesEvaluated
    ? result.visited.length * 0.4
    : 0;

  result.calculationMs = measuredMs + completeRouteCost + exhaustiveReviewCost;
  return result;
}

async function animateResult(result) {
  const token = state.animationToken;

  for (let index = 0; index < result.visited.length; index += 1) {
    if (token !== state.animationToken) return;
    const step = result.visited[index];
    setVisited(
      step.node,
      step.from,
      result.showAStarScores ? step.score : null,
    );
    await wait(850);
  }

  if (token !== state.animationToken) return;

  if (!result.path.length) {
    routeText.textContent = "Sin ruta disponible";
    timeText.textContent = "-";
    stepCount.textContent = "-";
    visitedCount.textContent = String(result.visited.length);
    routeCount.textContent = result.routesEvaluated ?? "-";
    updateAlgorithmNote();
    return;
  }

  const stats = routeStats(result.path);
  setRoute(result.path);
  routeText.textContent = result.path.join(" -> ");
  timeText.textContent = `${stats.time} minutos`;
  stepCount.textContent = String(result.path.length);
  visitedCount.textContent = String(result.visited.length);
  routeCount.textContent = result.routesEvaluated ?? "-";
  updateAlgorithmNote();
}

function runSearch() {
  resetVisuals();
  const algorithm = algorithms[state.selectedAlgorithm];
  const result = measureAlgorithm(algorithm);
  calcTimeText.textContent = formatCalculationTime(result.calculationMs);
  animateResult(result);
}

algorithmSelect.addEventListener("change", (event) => {
  state.selectedAlgorithm = event.target.value;
  updateAlgorithmNote();
});

goalSelect.addEventListener("change", (event) => {
  state.goal = event.target.value;
  drawGraph();
  resetVisuals();
});

runButton.addEventListener("click", runSearch);
resetButton.addEventListener("click", resetVisuals);

renderGoalOptions();
renderLegend();
drawGraph();
resetVisuals();
