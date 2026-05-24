import type p5 from 'p5';
import { PALETTES } from './palettes';
import type { PFIState } from './store';

type GetState = () => PFIState;
type SetStats = (fps: number, count: number) => void;

export interface EngineHandle {
  destroy: () => void;
  clear: () => void;
  capture: () => void;
}

class Particle {
  x: number; y: number;
  vx: number; vy: number;
  ax = 0; ay = 0;
  maxLife: number;
  life: number;
  size: number;
  color: string;
  history: Array<[number, number]> = [];
  seed: number;

  constructor(x: number, y: number, vx: number, vy: number, life: number, size: number, color: string) {
    this.x = x; this.y = y;
    this.vx = vx; this.vy = vy;
    this.maxLife = life;
    this.life = life;
    this.size = size;
    this.color = color;
    this.seed = Math.random() * 1000;
  }

  update(p: p5, S: PFIState, dt: number, t: number) {
    let fx = 0, fy = 0;
    fy += S.grav * 0.01;
    fx += S.wind * 0.005;

    if (S.turb > 0) {
      const n1 = p.noise(this.x * 0.003, this.y * 0.003, t + this.seed) - 0.5;
      const n2 = p.noise(this.x * 0.003 + 100, this.y * 0.003 + 100, t + this.seed) - 0.5;
      fx += n1 * S.turb * 0.012;
      fy += n2 * S.turb * 0.012;
    }

    if (S.mouse.down) {
      const dx = S.mouse.x - this.x;
      const dy = S.mouse.y - this.y;
      const d2 = dx * dx + dy * dy + 200;
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

  ageRatio(p: p5) { return p.constrain(this.life / this.maxLife, 0, 1); }
}

export function createEngine(
  container: HTMLElement,
  getState: GetState,
  setStats: SetStats,
): Promise<EngineHandle> {
  return new Promise((resolve) => {
    let p5Instance: p5 | null = null;

    // Dynamic import p5 (it depends on `window`, so cannot run on server)
    import('p5').then((mod) => {
      const P5 = mod.default;
      let particles: Particle[] = [];
      let t = 0;

      const sketch = (p: p5) => {
        const spawnFromState = (srcX: number, srcY: number) => {
          const S = getState();
          const palette = PALETTES[S.palette];
          const colorHex = palette[Math.floor(Math.random() * palette.length)];
          const baseDir = p.radians(S.dir);
          const spread = p.radians(S.spread);
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
        };

        const spawnBurst = (x: number, y: number, count = 80) => {
          const S = getState();
          const palette = PALETTES[S.palette];
          for (let i = 0; i < count; i++) {
            const a = Math.random() * Math.PI * 2;
            const sp = (S.vel / 30) * (1.5 + Math.random() * 3);
            const c = palette[Math.floor(Math.random() * palette.length)];
            const life = S.life * (0.5 + Math.random());
            const sz = (S.size / 30) * (0.8 + Math.random() * 1.2);
            particles.push(new Particle(x, y, Math.cos(a) * sp, Math.sin(a) * sp, life, sz, c));
          }
        };

        const currentEmitterPositions = (): Array<[number, number]> => {
          const S = getState();
          const list: Array<[number, number]> = [];
          if (S.source === 'top') {
            list.push([p.random(p.width), -10]);
          } else if (S.spiral) {
            list.push([p.width / 2, p.height / 2]);
          } else if (S.preset === 'fire' || S.preset === 'smoke' || S.preset === 'fountain') {
            list.push([p.width / 2, p.height - 60]);
          } else {
            list.push([p.width / 2, p.height / 2]);
          }
          for (const e of S.emitters) list.push([e.x, e.y]);
          return list;
        };

        const drawDots = (S: PFIState) => {
          const ctx = (p as unknown as { drawingContext: CanvasRenderingContext2D }).drawingContext;
          if (S.glow > 0) ctx.globalCompositeOperation = 'lighter';
          p.noStroke();
          for (const part of particles) {
            const a = part.ageRatio(p);
            const c = p.color(part.color);
            c.setAlpha(255 * a);
            p.fill(c);
            if (S.glow > 0) {
              ctx.shadowBlur = S.glow * part.size * 0.8;
              ctx.shadowColor = part.color;
            }
            p.circle(part.x, part.y, part.size * (0.6 + a * 0.8));
          }
          ctx.shadowBlur = 0;
          ctx.globalCompositeOperation = 'source-over';
        };

        const drawTrails = (S: PFIState) => {
          const ctx = (p as unknown as { drawingContext: CanvasRenderingContext2D }).drawingContext;
          ctx.globalCompositeOperation = 'lighter';
          p.noFill();
          for (const part of particles) {
            if (part.history.length < 2) continue;
            const a = part.ageRatio(p);
            const c = p.color(part.color);
            for (let i = 1; i < part.history.length; i++) {
              const tt = i / part.history.length;
              c.setAlpha(255 * a * tt);
              p.stroke(c);
              p.strokeWeight(part.size * 0.45 * tt);
              const [x1, y1] = part.history[i - 1];
              const [x2, y2] = part.history[i];
              p.line(x1, y1, x2, y2);
            }
            if (S.glow > 0) {
              ctx.shadowBlur = S.glow * part.size * 0.6;
              ctx.shadowColor = part.color;
            }
            p.noStroke();
            c.setAlpha(255 * a);
            p.fill(c);
            p.circle(part.x, part.y, part.size * 0.7);
          }
          ctx.shadowBlur = 0;
          ctx.globalCompositeOperation = 'source-over';
        };

        const drawNetwork = (S: PFIState) => {
          const ctx = (p as unknown as { drawingContext: CanvasRenderingContext2D }).drawingContext;
          ctx.globalCompositeOperation = 'lighter';
          const maxDist = 110;
          const md2 = maxDist * maxDist;
          const cs = maxDist;
          const grid = new Map<string, number[]>();
          for (let i = 0; i < particles.length; i++) {
            const part = particles[i];
            const gx = Math.floor(part.x / cs);
            const gy = Math.floor(part.y / cs);
            const key = gx + ',' + gy;
            const arr = grid.get(key);
            if (arr) arr.push(i); else grid.set(key, [i]);
          }
          for (let i = 0; i < particles.length; i++) {
            const part = particles[i];
            const gx = Math.floor(part.x / cs);
            const gy = Math.floor(part.y / cs);
            for (let oy = -1; oy <= 1; oy++) {
              for (let ox = -1; ox <= 1; ox++) {
                const cell = grid.get((gx + ox) + ',' + (gy + oy));
                if (!cell) continue;
                for (const j of cell) {
                  if (j <= i) continue;
                  const q = particles[j];
                  const dx = part.x - q.x, dy = part.y - q.y;
                  const d2 = dx * dx + dy * dy;
                  if (d2 > md2) continue;
                  const tt = 1 - d2 / md2;
                  const c = p.color(part.color);
                  c.setAlpha(255 * tt * Math.min(part.ageRatio(p), q.ageRatio(p)) * 0.7);
                  p.stroke(c);
                  p.strokeWeight(0.6);
                  p.line(part.x, part.y, q.x, q.y);
                }
              }
            }
          }
          p.noStroke();
          for (const part of particles) {
            const a = part.ageRatio(p);
            const c = p.color(part.color);
            c.setAlpha(255 * a);
            p.fill(c);
            if (S.glow > 0) {
              ctx.shadowBlur = S.glow * 1.2;
              ctx.shadowColor = part.color;
            }
            p.circle(part.x, part.y, part.size * 0.7);
          }
          ctx.shadowBlur = 0;
          ctx.globalCompositeOperation = 'source-over';
        };

        const drawMouseField = (S: PFIState) => {
          if (!S.mouse.down) return;
          p.push();
          p.noFill();
          p.stroke(240, 160, 70, 80);
          p.strokeWeight(0.8);
          const r = 60 + Math.sin(p.frameCount * 0.08) * 8;
          p.circle(S.mouse.x, S.mouse.y, r * 2);
          p.stroke(240, 160, 70, 36);
          p.circle(S.mouse.x, S.mouse.y, r * 3.4);
          p.pop();
        };

        let statTick = 0;

        p.setup = () => {
          const c = p.createCanvas(window.innerWidth, window.innerHeight);
          c.parent(container);
          p.pixelDensity(Math.min(2, window.devicePixelRatio || 1));
          p.background(11, 10, 9);
        };

        p.draw = () => {
          const S = getState();
          t += 0.003;

          // Background trail (motion blur)
          p.noStroke();
          p.fill(11, 10, 9, 4 + S.decay * 0.6);
          p.rect(0, 0, p.width, p.height);

          // Spawn
          if (!S.paused) {
            const sources = currentEmitterPositions();
            for (const [sx, sy] of sources) {
              const rate = S.rate * (1 / sources.length);
              const r = rate * (p.deltaTime / 16.6);
              const intR = Math.floor(r);
              const frac = r - intR;
              const n = intR + (Math.random() < frac ? 1 : 0);
              if (S.burst && Math.random() < 0.012 * (S.rate / 6)) {
                spawnBurst(
                  p.random(p.width * 0.15, p.width * 0.85),
                  p.random(p.height * 0.2, p.height * 0.7),
                  60,
                );
              } else {
                for (let i = 0; i < n; i++) spawnFromState(sx, sy);
              }
            }
          }

          // Update
          if (!S.paused) {
            const dt = p.deltaTime;
            for (let i = particles.length - 1; i >= 0; i--) {
              const part = particles[i];
              part.update(p, S, dt, t);
              if (!part.alive() ||
                  part.x < -200 || part.x > p.width + 200 ||
                  part.y < -200 || part.y > p.height + 200) {
                particles.splice(i, 1);
              }
            }
          }

          // Render
          if (S.mode === 'network') drawNetwork(S);
          else if (S.mode === 'trail') drawTrails(S);
          else drawDots(S);

          drawMouseField(S);

          // Push stats ~6 times/sec to avoid React thrash
          statTick++;
          if (statTick % 10 === 0) {
            setStats(Math.round(p.frameRate()), particles.length);
          }
        };

        p.mousePressed = (e?: MouseEvent) => {
          if (e && (e.target as HTMLElement | null)?.tagName !== 'CANVAS') return;
          spawnBurst(p.mouseX, p.mouseY, 50);
        };

        p.windowResized = () => {
          p.resizeCanvas(window.innerWidth, window.innerHeight);
          p.background(11, 10, 9);
        };

        // Expose handle once initialised
        const handle: EngineHandle = {
          destroy: () => {
            particles = [];
            p.remove();
            p5Instance = null;
          },
          clear: () => {
            particles = [];
            p.background(11, 10, 9);
          },
          capture: () => {
            p.saveCanvas('particle-field-' + Date.now(), 'png');
          },
        };

        // Resolve once setup runs (next tick)
        setTimeout(() => resolve(handle), 0);
      };

      p5Instance = new P5(sketch);
    });
  });
}
