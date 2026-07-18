// ---- Mobile nav toggle ----
const toggleBtn = document.getElementById('nav-toggle');
const sidebar = document.getElementById('sidebar');
if (toggleBtn && sidebar) {
  toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });
}

// ---- Boot line stagger ----
document.querySelectorAll('.boot-line').forEach((el, i) => {
  el.style.animationDelay = `${i * 0.12}s`;
});

// ---- Sidebar mini terminal ----
const TERMINAL_COMMANDS = {
  whoami: 'Luis Angel Guardia Vega',
  ls: ['InvuPos', 'Cinepolis'],
  skills: 'Python · Linux (CLI / Server) · Docker · Azure · Redes · Ciberseguridad · Web scraping',
};

const TERMINAL_SUGGESTIONS = ['whoami', 'ls', 'skills'];

(function initSidebarTerminal() {
  const trigger = document.querySelector('.sidebar .terminal-trigger');
  const inputEl = document.querySelector('.sidebar .terminal-input');
  const outputEl = document.querySelector('.sidebar .terminal-output');
  const cmdList = document.querySelector('.sidebar .terminal-cmd-list');
  if (!trigger || !inputEl || !outputEl || !cmdList) return;

  let busy = false;
  let suggestionIndex = 0;

  const charDelay = () => 40 + Math.random() * 20;
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function getNextSuggestion() {
    return TERMINAL_SUGGESTIONS[suggestionIndex % TERMINAL_SUGGESTIONS.length];
  }

  function updateTriggerLabel() {
    trigger.setAttribute('aria-label', `Ejecutar siguiente comando sugerido: ${getNextSuggestion()}`);
  }

  function setBusy(isBusy) {
    busy = isBusy;
    trigger.classList.toggle('busy', isBusy);
    cmdList.querySelectorAll('.terminal-cmd-btn').forEach((btn) => {
      btn.disabled = isBusy;
    });
  }

  function showOutput(cmd) {
    const data = TERMINAL_COMMANDS[cmd];
    if (data == null) return;

    const lines = Array.isArray(data) ? data : [data];
    outputEl.innerHTML = '';

    lines.forEach((line, i) => {
      const el = document.createElement('div');
      el.className = 'boot-line terminal-out-line';
      el.textContent = line;
      el.style.animationDelay = `${i * 0.12}s`;
      outputEl.appendChild(el);
    });
  }

  async function typeCommand(cmd) {
    inputEl.textContent = '';
    for (const char of cmd) {
      inputEl.textContent += char;
      await sleep(charDelay());
    }
  }

  async function runTerminalSequence(cmd = null) {
    if (busy) return;
    setBusy(true);
    outputEl.innerHTML = '';

    const command = cmd ?? getNextSuggestion();
    if (!cmd) suggestionIndex += 1;

    await typeCommand(command);
    showOutput(command);
    updateTriggerLabel();
    setBusy(false);
  }

  Object.keys(TERMINAL_COMMANDS).forEach((cmd) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'terminal-cmd-btn';
    btn.textContent = cmd;
    btn.addEventListener('click', () => runTerminalSequence(cmd));
    cmdList.appendChild(btn);
  });

  trigger.addEventListener('click', () => runTerminalSequence());
  updateTriggerLabel();
})();

// ---- Three.js network background (nodes + connecting lines) ----
(function initBackground() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.getElementById('bg-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 60;

  const NODE_COUNT = window.innerWidth < 700 ? 34 : 60;
  const SPREAD = 70;
  const nodes = [];

  for (let i = 0; i < NODE_COUNT; i++) {
    nodes.push({
      pos: new THREE.Vector3(
        (Math.random() - 0.5) * SPREAD * 2,
        (Math.random() - 0.5) * SPREAD,
        (Math.random() - 0.5) * 40
      ),
      vel: new THREE.Vector3(
        (Math.random() - 0.5) * 0.03,
        (Math.random() - 0.5) * 0.03,
        (Math.random() - 0.5) * 0.03
      )
    });
  }

  const pointsGeo = new THREE.BufferGeometry();
  const pointsPos = new Float32Array(NODE_COUNT * 3);
  pointsGeo.setAttribute('position', new THREE.BufferAttribute(pointsPos, 3));
  const pointsMat = new THREE.PointsMaterial({ color: 0xf5a94e, size: 0.9, transparent: true, opacity: 0.85 });
  const pointCloud = new THREE.Points(pointsGeo, pointsMat);
  scene.add(pointCloud);

  const lineMat = new THREE.LineBasicMaterial({ color: 0x4fd9c4, transparent: true, opacity: 0.15 });
  const maxLines = NODE_COUNT * 6;
  const linePos = new Float32Array(maxLines * 2 * 3);
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
  const lineSegments = new THREE.LineSegments(lineGeo, lineMat);
  scene.add(lineSegments);

  const LINK_DIST = 16;

  function animate() {
    requestAnimationFrame(animate);

    nodes.forEach(n => {
      n.pos.add(n.vel);
      if (Math.abs(n.pos.x) > SPREAD) n.vel.x *= -1;
      if (Math.abs(n.pos.y) > SPREAD / 2) n.vel.y *= -1;
      if (Math.abs(n.pos.z) > 20) n.vel.z *= -1;
    });

    const posAttr = pointsGeo.attributes.position;
    nodes.forEach((n, i) => {
      posAttr.setXYZ(i, n.pos.x, n.pos.y, n.pos.z);
    });
    posAttr.needsUpdate = true;

    let lineIdx = 0;
    for (let i = 0; i < nodes.length && lineIdx < maxLines; i++) {
      for (let j = i + 1; j < nodes.length && lineIdx < maxLines; j++) {
        const d = nodes[i].pos.distanceTo(nodes[j].pos);
        if (d < LINK_DIST) {
          const base = lineIdx * 6;
          linePos[base] = nodes[i].pos.x;
          linePos[base + 1] = nodes[i].pos.y;
          linePos[base + 2] = nodes[i].pos.z;
          linePos[base + 3] = nodes[j].pos.x;
          linePos[base + 4] = nodes[j].pos.y;
          linePos[base + 5] = nodes[j].pos.z;
          lineIdx++;
        }
      }
    }
    lineGeo.setDrawRange(0, lineIdx * 2);
    lineGeo.attributes.position.needsUpdate = true;

    scene.rotation.y += 0.0006;
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();
