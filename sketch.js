/* ===========================================================
   PARTICLE FIELD INSTRUMENT — engine
   =========================================================== */

// ---- Safety caps ---------------------------------------------------------
// Prevents the "performance death spiral": when a frame stalls (tab returns
// from background, slow init, fonts loading, GC), deltaTime can balloon to
// hundreds of ms and the spawn formula would inject a tidal wave of
// particles, which slows the next frame, which makes deltaTime even bigger…
const MAX_DT = 50;          // ms — hard ceiling on per-frame spawn budget
const MAX_PARTICLES = 1500; // hard ceiling on live particle count

// ---- Colour palettes -----------------------------------------------------
const PALETTES = {
  ember:    ['#ffd166', '#f09236', '#e0451f', '#a31621', '#fef6c8'],
  glacier:  ['#caf0f8', '#90e0ef', '#48cae4', '#0096c7', '#023e8a'],
  bloom:    ['#ffd1dc', '#ff80a1', '#e84a7f', '#9b1d49', '#3a0a1f'],
  forest:   ['#b8e07a', '#6fbf6b', '#2d8a4e', '#1f5d3a', '#f3eccd'],
  midnight: ['#9c89ff', '#6c5ce7', '#3d3293', '#1b1547', '#e9e6ff'],
  paper:    ['#f4ecdc', '#c8c0b0', '#8a8275', '#3b3934', '#0b0a09'],
  citrus:   ['#fff4a3', '#ffd166', '#ff9f1c', '#e63946', '#ffefd6'],
  oceanic:  ['#001219', '#005f73', '#0a9396', '#94d2bd', '#e9d8a6'],
  candy:    ['#ff6f91', '#ff9671', '#ffc75f', '#f9f871', '#d65db1']
};

const PRESETS = {
  fountain:      { rate:12, life:180, size:30, vel:30,  spread:45,  grav:  6, wind:0,  turb:20, damp:0,  mode:'dot',     palette:'ember',   decay:18, glow:10, dir:-90 },
  vortex:        { rate:30, life:300, size:18, vel:25,  spread:360, grav:  0, wind:0,  turb:60, damp:5,  mode:'trail',   palette:'midnight',decay:8,  glow:14, dir:0   },
  fireworks:     { rate:2,  life:160, size:42, vel:90,  spread:360, grav: 12, wind:0,  turb:8,  damp:2,  mode:'trail',   palette:'citrus',  decay:6,  glow:22, dir:0,  burst:true },
  snow:          { rate:18, life:480, size:22, vel:8,   spread:30,  grav:  3, wind:4,  turb:30, damp:0,  mode:'dot',     palette:'glacier', decay:60, glow:4,  dir:90, source:'top' },
  fire:          { rate:50, life:140, size:38, vel:18,  spread:25,  grav:-15, wind:0,  turb:55, damp:0,  mode:'trail',   palette:'ember',   decay:14, glow:18, dir:-90 },
  smoke:         { rate:14, life:380, size:80, vel:12,  spread:35,  grav:-6,  wind:2,  turb:40, damp:1,  mode:'dot',     palette:'paper',   decay:30, glow:0,  dir:-90 },
  galaxy:        { rate:8,  life:500, size:14, vel:20,  spread:360, grav:  0, wind:0,  turb:15, damp:0,  mode:'trail',   palette:'midnight',decay:4,  glow:14, dir:0,  spiral:true },
  constellation: { rate:4,  life:500, size:10, vel:6,   spread:360, grav:  0, wind:0,  turb:8,  damp:1,  mode:'network', palette:'glacier', decay:30, glow:6,  dir:0   }
};

// ---- State ---------------------------------------------------------------
const S = {
  rate: 12, life: 180, size: 30, vel: 30, spread: 45,
  grav: 6, wind: 0, turb: 20, damp: 0,
  mode: 'dot', palette: 'ember',
  decay: 18, glow: 10, dir: -90,
  preset: 'fountain', burst: false, spiral: false, source: 'emitter',
  paused: false,
  mouse: { x: 0, y: 0, down: false, button: 0 },
  startTs: Date.now()
};

// ---- Particle ------------------------------------------------------------
class Particle {
  constructor(x, y, vx, vy, life, size, colorHex) {
    this.x = x; this.y = y;
    this.vx = vx; this.vy = vy;
    this.ax = 0; this.ay = 0;
    this.maxLife = life;
    this.life = life;
    this.size = size;
    this.color = colorHex;
    this.history = [];
    this.seed = Math.random() * 1000;
  }
  update(dt) {
    // Accumulate forces
    let fx = 0, fy = 0;
    fy += S.grav * 0.01;
    fx += S.wind * 0.005;
    if (S.turb > 0) {
      const t = window._t || 0;
      const n1 = (noise(this.x * 0.003, this.y * 0.003, t + this.seed) - 0.5);
      const n2 = (noise(this.x * 0.003 + 100, this.y * 0.003 + 100, t + this.seed) - 0.5);
      fx += n1 * S.turb * 0.012;
      fy += n2 * S.turb * 0.012;
    }
    // Mouse attraction / repulsion
    if (S.mouse.down) {
      const dx = S.mouse.x - this.x;
      const dy = S.mouse.y - this.y;
      const d2 = dx*dx + dy*dy + 200;
      const f = (S.mouse.button === 2 ? -1 : 1) * 700 / d2;
      fx += dx * f * 0.01;
      fy += dy * f * 0.01;
    }
    this.ax = fx; this.ay = fy;
    this.vx += this.ax;
    this.vy += this.ay;
    if (S.damp > 0) {
      const d = 1 - S.damp * 0.002;
      this.vx *= d;
      this.vy *= d;
    }
    this.x += this.vx;
    this.y += this.vy;
    if (S.mode === 'trail') {
      this.history.push([this.x, this.y]);
      if (this.history.length > 14) this.history.shift();
    }
    this.life -= dt;
  }
  alive() { return this.life > 0; }
  ageRatio() { return constrain(this.life / this.maxLife, 0, 1); }
}

// ---- Particle System -----------------------------------------------------
let particles = [];

function spawnFromPreset(srcX, srcY) {
  const palette = PALETTES[S.palette];
  const colorHex = palette[Math.floor(Math.random() * palette.length)];
  const baseDir = radians(S.dir);
  const spread = radians(S.spread);
  const angle = baseDir + (Math.random() - 0.5) * spread;
  const speed = (S.vel / 30) * (0.6 + Math.random() * 0.8);
  let vx = Math.cos(angle) * speed;
  let vy = Math.sin(angle) * speed;

  if (S.spiral) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * 60;
    srcX += Math.cos(a) * r;
    srcY += Math.sin(a) * r;
    vx = -Math.sin(a) * speed * 1.2;
    vy =  Math.cos(a) * speed * 1.2;
  }

  const life = S.life * (0.6 + Math.random() * 0.8);
  const size = (S.size / 30) * (1 + Math.random() * 1.4);
  particles.push(new Particle(srcX, srcY, vx, vy, life, size, colorHex));
}

function spawnBurst(x, y, count = 80) {
  const palette = PALETTES[S.palette];
  const budget = Math.min(count, MAX_PARTICLES - particles.length);
  for (let i = 0; i < budget; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = (S.vel / 30) * (1.5 + Math.random() * 3);
    const c = palette[Math.floor(Math.random() * palette.length)];
    const life = S.life * (0.5 + Math.random());
    const sz  = (S.size / 30) * (0.8 + Math.random() * 1.2);
    particles.push(new Particle(x, y, Math.cos(a) * sp, Math.sin(a) * sp, life, sz, c));
  }
}

// ---- p5 lifecycle --------------------------------------------------------
let canvasEl;
let runStartTs;

function setup() {
  const host = document.getElementById('canvas-host');
  canvasEl = createCanvas(window.innerWidth, window.innerHeight);
  canvasEl.parent(host);
  // pixelDensity(1): on Retina/4K displays, pixelDensity(2) quadruples the
  // backing-store pixels and makes per-particle shadowBlur (a software-
  // rasterised Canvas2D op) crushingly slow. 1× looks ~identical here.
  pixelDensity(1);
  background(11, 10, 9);
  runStartTs = Date.now();
  buildPaletteUI();
  applyPreset('fountain');
  wireControls();
  updateAllValueLabels();
  // hide hint after a moment
  setTimeout(() => {
    const h = document.getElementById('hint');
    if (h) h.style.opacity = '0';
  }, 5500);
}

function draw() {
  window._t = (window._t || 0) + 0.003;

  // Background trail (motion blur)
  noStroke();
  // The decay slider acts as alpha for the background overlay (0.02 - 0.8)
  fill(11, 10, 9, 4 + S.decay * 0.6);
  rect(0, 0, width, height);

  // Spawn from the single emitter (clamped against the death-spiral)
  if (!S.paused && particles.length < MAX_PARTICLES) {
    const [sx, sy] = currentEmitterPosition();
    const dt = Math.min(deltaTime, MAX_DT);
    const r = S.rate * (dt / 16.6);
    const intR = Math.floor(r);
    const frac = r - intR;
    const n = intR + (Math.random() < frac ? 1 : 0);
    // Fireworks: occasional bursts
    if (S.burst && Math.random() < 0.012 * (S.rate / 6)) {
      spawnBurst(random(width * 0.15, width * 0.85),
                 random(height * 0.2, height * 0.7), 60);
    } else {
      const budget = Math.min(n, MAX_PARTICLES - particles.length);
      for (let i = 0; i < budget; i++) spawnFromPreset(sx, sy);
    }
  }

  // Update + render
  if (!S.paused) {
    const dt = deltaTime;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.update(dt);
      if (!p.alive() ||
          p.x < -200 || p.x > width + 200 ||
          p.y < -200 || p.y > height + 200) {
        particles.splice(i, 1);
      }
    }
  }

  // Render
  if (S.mode === 'network') {
    drawNetwork();
  } else if (S.mode === 'trail') {
    drawTrails();
  } else {
    drawDots();
  }

  // Mouse cursor field indicator
  drawMouseField();

  updateHud();
}

// The single, global emitter — its position is dictated by the active preset.
function currentEmitterPosition() {
  if (S.source === 'top')        return [random(width), -10];           // snow
  if (S.preset === 'fire' ||
      S.preset === 'smoke' ||
      S.preset === 'fountain')   return [width / 2, height - 60];       // bottom
  return [width / 2, height / 2];                                       // center
}

// ---- Renderers -----------------------------------------------------------
function drawDots() {
  if (S.glow > 0) drawingContext.globalCompositeOperation = 'lighter';
  noStroke();
  for (const p of particles) {
    const a = p.ageRatio();
    const c = color(p.color);
    c.setAlpha(255 * a);
    fill(c);
    if (S.glow > 0) {
      drawingContext.shadowBlur = S.glow * p.size * 0.8;
      drawingContext.shadowColor = p.color;
    }
    circle(p.x, p.y, p.size * (0.6 + a * 0.8));
  }
  drawingContext.shadowBlur = 0;
  drawingContext.globalCompositeOperation = 'source-over';
}

function drawTrails() {
  drawingContext.globalCompositeOperation = 'lighter';
  noFill();
  for (const p of particles) {
    if (p.history.length < 2) continue;
    const a = p.ageRatio();
    const c = color(p.color);
    // Reset shadow before drawing line segments so they don't inherit
    // the glow set on the previous particle's circle (was a perf+visual bug).
    drawingContext.shadowBlur = 0;
    for (let i = 1; i < p.history.length; i++) {
      const t = i / p.history.length;
      c.setAlpha(255 * a * t);
      stroke(c);
      strokeWeight(p.size * 0.45 * t);
      const [x1, y1] = p.history[i - 1];
      const [x2, y2] = p.history[i];
      line(x1, y1, x2, y2);
    }
    if (S.glow > 0) {
      drawingContext.shadowBlur = S.glow * p.size * 0.6;
      drawingContext.shadowColor = p.color;
    }
    noStroke();
    c.setAlpha(255 * a);
    fill(c);
    circle(p.x, p.y, p.size * 0.7);
  }
  drawingContext.shadowBlur = 0;
  drawingContext.globalCompositeOperation = 'source-over';
}

function drawNetwork() {
  // Draw thin connections between near particles
  drawingContext.globalCompositeOperation = 'lighter';
  const maxDist = 110;
  const md2 = maxDist * maxDist;
  // Spatial hashing for performance
  const cs = maxDist;
  const grid = new Map();
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const gx = Math.floor(p.x / cs);
    const gy = Math.floor(p.y / cs);
    const key = gx + ',' + gy;
    if (!grid.has(key)) grid.set(key, []);
    grid.get(key).push(i);
  }
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const gx = Math.floor(p.x / cs);
    const gy = Math.floor(p.y / cs);
    for (let oy = -1; oy <= 1; oy++) {
      for (let ox = -1; ox <= 1; ox++) {
        const cell = grid.get((gx + ox) + ',' + (gy + oy));
        if (!cell) continue;
        for (const j of cell) {
          if (j <= i) continue;
          const q = particles[j];
          const dx = p.x - q.x, dy = p.y - q.y;
          const d2 = dx*dx + dy*dy;
          if (d2 > md2) continue;
          const t = 1 - d2 / md2;
          const c = color(p.color);
          c.setAlpha(255 * t * Math.min(p.ageRatio(), q.ageRatio()) * 0.7);
          stroke(c);
          strokeWeight(0.6);
          line(p.x, p.y, q.x, q.y);
        }
      }
    }
  }
  noStroke();
  for (const p of particles) {
    const a = p.ageRatio();
    const c = color(p.color);
    c.setAlpha(255 * a);
    fill(c);
    if (S.glow > 0) {
      drawingContext.shadowBlur = S.glow * 1.2;
      drawingContext.shadowColor = p.color;
    }
    circle(p.x, p.y, p.size * 0.7);
  }
  drawingContext.shadowBlur = 0;
  drawingContext.globalCompositeOperation = 'source-over';
}

function drawMouseField() {
  if (!S.mouse.down) return;
  push();
  noFill();
  stroke(240, 160, 70, 80);
  strokeWeight(0.8);
  const r = 60 + Math.sin(frameCount * 0.08) * 8;
  circle(S.mouse.x, S.mouse.y, r * 2);
  stroke(240, 160, 70, 36);
  circle(S.mouse.x, S.mouse.y, r * 3.4);
  pop();
}

// ---- Input ---------------------------------------------------------------
function mousePressed(e) {
  // Only register inside canvas
  if (e && e.target && e.target.tagName !== 'CANVAS') return;
  S.mouse.down = true;
  S.mouse.button = (e && e.button) || mouseButton === RIGHT ? 2 : 0;
  S.mouse.x = mouseX; S.mouse.y = mouseY;
  spawnBurst(mouseX, mouseY, 50);
}
function mouseReleased() { S.mouse.down = false; }
function mouseMoved()    { S.mouse.x = mouseX; S.mouse.y = mouseY; }
function mouseDragged()  { S.mouse.x = mouseX; S.mouse.y = mouseY; }

document.addEventListener('contextmenu', e => {
  if (e.target.tagName === 'CANVAS') e.preventDefault();
});

function keyPressed() {
  if (key === ' ')  togglePause();
  if (key === 'r' || key === 'R') clearField();
  if (key === 'c' || key === 'C') capture();
}

function windowResized() {
  resizeCanvas(window.innerWidth, window.innerHeight);
  background(11, 10, 9);
}

// ---- UI wiring -----------------------------------------------------------
function buildPaletteUI() {
  const host = document.getElementById('palettes');
  for (const name of Object.keys(PALETTES)) {
    const el = document.createElement('div');
    el.className = 'palette' + (name === S.palette ? ' active' : '');
    el.dataset.name = name;
    el.title = name;
    for (const c of PALETTES[name]) {
      const sw = document.createElement('span');
      sw.style.background = c;
      el.appendChild(sw);
    }
    el.addEventListener('click', () => {
      S.palette = name;
      [...host.children].forEach(ch => ch.classList.toggle('active', ch.dataset.name === name));
    });
    host.appendChild(el);
  }
}

function wireControls() {
  // Sliders
  const bind = (id, key, fmt) => {
    const sl = document.getElementById('s-' + id);
    const lbl = document.getElementById('v-' + id);
    sl.addEventListener('input', () => {
      const v = parseFloat(sl.value);
      S[key] = v;
      lbl.textContent = fmt(v);
    });
  };
  bind('rate', 'rate', v => v);
  bind('life', 'life', v => (v / 75).toFixed(1) + 's');
  bind('size', 'size', v => (v / 10).toFixed(1));
  bind('vel',  'vel',  v => (v / 10).toFixed(1));
  bind('spread', 'spread', v => Math.round(v) + '°');
  bind('grav', 'grav', v => (v / 100 >= 0 ? '+' : '') + (v / 100).toFixed(2));
  bind('wind', 'wind', v => (v / 100).toFixed(2));
  bind('turb', 'turb', v => (v / 100).toFixed(2));
  bind('damp', 'damp', v => (v / 1000).toFixed(3));
  bind('decay','decay',v => (v / 100).toFixed(2));
  bind('glow', 'glow', v => (v / 10).toFixed(1));

  // Presets
  document.getElementById('presets').addEventListener('click', e => {
    if (!e.target.classList.contains('chip')) return;
    const name = e.target.dataset.preset;
    [...e.currentTarget.children].forEach(ch => ch.classList.toggle('active', ch === e.target));
    applyPreset(name);
  });

  // Render modes
  document.getElementById('modes').addEventListener('click', e => {
    if (!e.target.classList.contains('chip')) return;
    [...e.currentTarget.children].forEach(ch => ch.classList.toggle('active', ch === e.target));
    S.mode = e.target.dataset.mode;
  });

  // Buttons
  document.getElementById('btn-pause').addEventListener('click', togglePause);
  document.getElementById('btn-reset').addEventListener('click', clearField);
  document.getElementById('btn-shot').addEventListener('click', capture);
}

function applyPreset(name) {
  const p = PRESETS[name];
  if (!p) return;
  S.preset = name;
  // Numeric values map back to slider scales
  setSlider('rate',   p.rate);
  setSlider('life',   p.life);
  setSlider('size',   p.size);
  setSlider('vel',    p.vel);
  setSlider('spread', p.spread);
  setSlider('grav',   p.grav);
  setSlider('wind',   p.wind);
  setSlider('turb',   p.turb);
  setSlider('damp',   p.damp);
  setSlider('decay',  p.decay);
  setSlider('glow',   p.glow);
  S.mode = p.mode;
  S.palette = p.palette;
  S.dir = p.dir;
  S.burst = !!p.burst;
  S.spiral = !!p.spiral;
  S.source = p.source || 'emitter';
  // sync UI
  document.querySelectorAll('#modes .chip').forEach(c =>
    c.classList.toggle('active', c.dataset.mode === S.mode));
  document.querySelectorAll('#palettes .palette').forEach(c =>
    c.classList.toggle('active', c.dataset.name === S.palette));
  document.getElementById('st-mode').textContent =
    name.charAt(0).toUpperCase() + name.slice(1);
  updateAllValueLabels();
}

function setSlider(id, v) {
  const sl = document.getElementById('s-' + id);
  if (sl) {
    sl.value = v;
    S[id === 'rate' ? 'rate' :
       id === 'life' ? 'life' :
       id === 'size' ? 'size' :
       id === 'vel'  ? 'vel'  :
       id === 'spread' ? 'spread' :
       id === 'grav' ? 'grav' :
       id === 'wind' ? 'wind' :
       id === 'turb' ? 'turb' :
       id === 'damp' ? 'damp' :
       id === 'decay'? 'decay':
       'glow'] = parseFloat(v);
  }
}

function updateAllValueLabels() {
  const labelers = {
    rate:  v => v,
    life:  v => (v / 75).toFixed(1) + 's',
    size:  v => (v / 10).toFixed(1),
    vel:   v => (v / 10).toFixed(1),
    spread:v => Math.round(v) + '°',
    grav:  v => (v / 100 >= 0 ? '+' : '') + (v / 100).toFixed(2),
    wind:  v => (v / 100).toFixed(2),
    turb:  v => (v / 100).toFixed(2),
    damp:  v => (v / 1000).toFixed(3),
    decay: v => (v / 100).toFixed(2),
    glow:  v => (v / 10).toFixed(1)
  };
  for (const k in labelers) {
    const lbl = document.getElementById('v-' + k);
    const sl  = document.getElementById('s-' + k);
    if (lbl && sl) lbl.textContent = labelers[k](parseFloat(sl.value));
  }
}

function togglePause() {
  S.paused = !S.paused;
  document.getElementById('btn-pause').textContent = S.paused ? 'Resume' : 'Pause';
}

function clearField() {
  particles = [];
  background(11, 10, 9);
}

function capture() {
  saveCanvas('particle-field-' + Date.now(), 'png');
}

// ---- HUD -----------------------------------------------------------------
function updateHud() {
  document.getElementById('hud-fps').textContent = Math.round(frameRate());
  document.getElementById('hud-count').textContent =
    particles.length + (particles.length >= MAX_PARTICLES ? '⚠' : '');
  const elapsed = Math.floor((Date.now() - runStartTs) / 1000);
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');
  document.getElementById('st-run').textContent = `${mm}:${ss}`;
}
