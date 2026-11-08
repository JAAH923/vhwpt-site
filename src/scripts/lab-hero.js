/**
 * The home hero's movement lab (hero option A, chosen by Justin 2026-11-08). A body
 * drawn only as motion-capture markers leaves a chronophotograph trail behind it
 * (Marey's plates). Three sets play in order, named for Bruce's services: recovery
 * (standing windmills), balance and walking (a walk), then strength (kettlebell
 * swings). The floor is the pulse line from his logo, beating once under every step
 * and every rep; it is the only crimson in the motion. One measurement is drawn live
 * in ink, and the instrument under it reads the same numbers in plain words.
 *
 * Markup and styles: src/components/MotionHero.astro. The body itself: ./body.js.
 * Plain JavaScript on purpose, so `astro check` leaves the canvas code alone.
 */
import { GAIT, walkPose, swingPose, windmillPose, blendPose, fk, contact, BONES, MARKERS, makeCamera, angleAt, ease, clamp } from "./body.js";

// The current tokens (contrast pass, 11/7): grey #52525b, hairline #d4d4d8.
const INK = "#18181b", GREY = "#52525b", CRIMSON = "#c41230", WHITE = "#ffffff";
// The heartbeat from Bruce's logo (src/components/Pulse.astro), [dx, dy] in px at full size.
const BEAT = [[-150, 0], [-120, -14], [-106, 0], [-88, 0], [-72, 36], [-50, -54],
  [-28, 48], [-12, -20], [0, 0], [30, 0], [44, -9], [58, 0]];
const BEAT_SPIKE = -40; // where the tall spike sits in BEAT, so it lands under the foot
const hero = document.querySelector(".lab-hero");
const canvas = hero.querySelector(".lab-canvas");
const ctx = canvas.getContext("2d");
const copy = hero.querySelector(".lab-copy");
const nav = document.querySelector(".site-nav");
const slot = hero.querySelector(".lab-slot");
const fills = [...hero.querySelectorAll(".track i")];
const stageBtns = [...hero.querySelectorAll(".stages button")];
const keys = [...hero.querySelectorAll("[data-k]")];
const vals = [...hero.querySelectorAll("[data-v]")];
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

let W = 0, H = 0, dpr = 1, layout = { cx: 0, floorY: 0, scale: 150, mobile: false, from: 0 };
function resize() {
  dpr = Math.min(2, devicePixelRatio || 1);
  const r = hero.getBoundingClientRect();
  W = r.width; H = r.height;
  canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
  const mobile = W < 1024; // stacked: the figure has its own band
  const c = copy.getBoundingClientRect(), n = nav.getBoundingClientRect();
  let floorY, scale, cx, from;
  if (mobile) {
    const s = slot.getBoundingClientRect();
    floorY = s.bottom - r.top - 32;
    scale = Math.min((s.height - 48) / 1.95, (W - 48) / 1.9);
    cx = W * 0.5; from = 0;
  } else {
    // Side by side: the body stands on the buttons' baseline, as tall as the
    // space from the nav down allows, and starts just past the copy.
    const b = copy.querySelector(".btn-primary").getBoundingClientRect();
    floorY = b.bottom - r.top;
    from = c.right - r.left;
    const top = n.bottom - r.top + 24;
    const left = from + 40;
    const tall = (floorY - top) / 2.0;      // a raised hand reaches about 2 m
    const wide = (W - 24 - left) / 1.9;     // the windmill's arm span, with a little air
    scale = Math.max(90, Math.min(340, tall, wide));
    cx = Math.min(left + 0.95 * scale, W - 24 - 0.95 * scale);
  }
  layout = { cx, floorY, scale, mobile, from };
  if (reduce) drawStill();
}

/* ---------- Simulation ---------- */
const STAGES = [{ dur: 7.2 }, { dur: 7 }, { dur: 8.5 }];
const WM = 3.6;     // seconds per windmill (one reach to each side)
const SWING = 1.5;  // seconds per swing
// Camera: a raised three-quarter view for the windmill, then side on for the walk.
const VIEW = { windmill: { yaw: 32, pitch: 0 }, walk: { yaw: 16, pitch: 0 } };
let S;
function fresh(stage = 0) {
  const keep = S ? { worldX: S.worldX, camX: S.camX, t: S.t } : { worldX: 0, camX: 0, t: 0 };
  return {
    stage, st: 0, mode: stage === 0 ? "windmill" : "walk", wu: 0, phi: 0.05, pending: stage === 2,
    blend: 0, sphi: 0, reps: 0, ...(stage === 0 ? VIEW.windmill : VIEW.walk),
    ...keep, prevJ: null, prevC: null, ghosts: [], lastGhost: 0, alpha: 0, fading: null, v: 0,
    J: null, pose: null, bell: null, bellA: 0, beats: [], side: null, repBeat: false, lastGap: null,
  };
}
S = fresh(0);

function jump(i) {
  if (S.fading) return;
  S.fading = { dir: -1, then: i };
}

function step(dt) {
  S.t += dt; S.st += dt;
  // Fades: out, reset to a stage, back in.
  if (S.fading) {
    S.alpha += S.fading.dir * dt / 0.45;
    if (S.fading.dir < 0 && S.alpha <= 0) S = Object.assign(fresh(S.fading.then), { fading: { dir: 1 } });
    else if (S.fading.dir > 0 && S.alpha >= 1) { S.alpha = 1; S.fading = null; }
  } else S.alpha = Math.min(1, S.alpha + dt / 0.6);

  if (!S.fading) {
    if (S.stage === 1 && S.st > STAGES[1].dur) { S.stage = 2; S.st = 0; S.pending = true; }
    else if (S.stage === 2 && S.st > STAGES[2].dur) jump(0);
  }

  const gait = GAIT.steady;
  const prevPhi = S.phi;
  if (S.mode === "walk" || S.mode === "toWalk") S.phi = (S.phi + dt / gait.cycle) % 1;
  if (S.pending && S.mode === "walk" && prevPhi < 0.2 && S.phi >= 0.2) { S.mode = "toSwing"; S.blend = 0; S.sphi = 0.74; S.pending = false; }

  let pose;
  if (S.mode === "windmill") {
    const before = S.wu;
    S.wu += dt / WM;
    // A rep is each hand reaching its foot.
    if (Math.floor(before * 2 + 0.5) !== Math.floor(S.wu * 2 + 0.5)) { S.reps++; S.repBeat = true; }
    // After the set, stand tall and walk out of it.
    if (S.st >= STAGES[0].dur - 0.05 && Math.floor(before) !== Math.floor(S.wu)) {
      S.stage = 1; S.st = 0; S.mode = "toWalk"; S.blend = 0; S.phi = 0.1; S.wu = 0; S.reps = 0;
    }
    pose = windmillPose(S.wu % 1);
  } else if (S.mode === "toWalk") {
    S.blend = Math.min(1, S.blend + dt / 0.8);
    const b = ease(S.blend);
    pose = blendPose(windmillPose(0), walkPose(S.phi, gait), b);
    if (S.blend >= 1) S.mode = "walk";
  } else if (S.mode === "walk") pose = walkPose(S.phi, gait);
  else {
    const before = S.sphi;
    S.sphi += dt / SWING;
    if (Math.floor(before - 0.5) !== Math.floor(S.sphi - 0.5)) { S.reps++; S.repBeat = true; }
    if (S.mode === "toSwing") {
      S.blend = Math.min(1, S.blend + dt / 0.65);
      const b = ease(S.blend);
      pose = blendPose(walkPose(S.phi, gait), swingPose(S.sphi % 1), b);
      // The trailing foot steps up beside the other instead of sliding.
      const lift = Math.sin(Math.PI * b);
      pose.legs[1].thigh += 16 * lift; pose.legs[1].knee += 32 * lift;
      if (S.blend >= 1) S.mode = "swing";
    } else pose = swingPose(S.sphi % 1);
  }
  S.bellA = S.mode === "toSwing" ? ease(S.blend) : S.mode === "swing" ? 1 : 0;
  S.pose = pose;

  const J = fk(pose);
  // No slip: the foot on the floor stays put, so the body travels.
  if (S.prevJ && S.prevC) S.worldX -= J[S.prevC][0] - S.prevJ[S.prevC][0];
  S.prevJ = J; S.prevC = contact(J, pose);
  const world = {};
  for (const k in J) world[k] = [J[k][0] + S.worldX, J[k][1], J[k][2]];
  S.J = world;
  // The pulse: a beat on the floor under every footstrike, and under the body on every rep.
  if (S.mode === "walk" || S.mode === "toWalk") {
    const side = S.prevC[0];
    if (S.side && side !== S.side) S.beats.push({ x: world[S.prevC][0], t: S.t });
    S.side = side;
  } else S.side = null;
  if (S.repBeat) { S.beats.push({ x: (world.lankle[0] + world.rankle[0]) / 2, t: S.t }); S.repBeat = false; }
  while (S.beats.length && S.t - S.beats[0].t > 2) S.beats.shift();
  S.bell = S.bellA > 0 ? bellAt(world) : null;
  S.v += ((dt > 0 ? (S.worldX - (S.lastX ?? S.worldX)) / dt : 0) - S.v) * Math.min(1, dt * 2);
  S.lastX = S.worldX;
  S.camX += (S.worldX - S.camX) * (1 - Math.exp(-dt * 2.4));
  const view = S.mode === "windmill" ? VIEW.windmill : VIEW.walk, ek = 1 - Math.exp(-dt * 1.8);
  S.yaw += (view.yaw - S.yaw) * ek; S.pitch += (view.pitch - S.pitch) * ek;

  if (S.t - S.lastGhost > 0.1) {
    S.ghosts.push({ J: world, bell: S.bell, t: S.t, a: S.alpha });
    S.lastGhost = S.t;
  }
  while (S.ghosts.length && S.t - S.ghosts[0].t > 1.15) S.ghosts.shift();
}

/** The windmill's live numbers: which hand, how far it still is from the foot. */
function reachState() {
  const P = S.pose;
  if (!P || P.side === undefined || S.mode !== "windmill") return null;
  const hand = P.side > 0 ? "rwrist" : "lwrist", foot = P.side > 0 ? "ltoe" : "rtoe";
  const gap = Math.max(0, Math.hypot(...S.J[hand].map((v, i) => v - S.J[foot][i])) - 0.1);
  return { hand, foot, gap, depth: P.depth, side: P.side, twist: Math.abs(P.twist) };
}

function bellAt(J) {
  const w = J.rwrist.map((v, i) => (v + J.lwrist[i]) / 2);
  const e = J.relbow.map((v, i) => (v + J.lelbow[i]) / 2);
  const d = w.map((v, i) => v - e[i]);
  const m = Math.hypot(...d) || 1;
  return w.map((v, i) => v + (d[i] / m) * 0.15);
}

/* ---------- Drawing ---------- */
function cam() {
  // Lead the figure by its speed so a walking body stays centred.
  return makeCamera({ yaw: S.yaw, pitch: S.pitch, dist: 7, scale: layout.scale, cx: layout.cx, cy: layout.floorY, focus: [S.camX + S.v / 2.4, 0, 0] });
}

/** The floor is the pulse line: flat crimson, with a heartbeat wherever a step or rep just landed. */
function drawFloor(C) {
  const y = Math.round(layout.floorY) + 0.5;
  const from = layout.from;
  const a = Math.min(1, layout.scale / 300) * (layout.mobile ? 0.7 : 0.85); // the beat's size follows the body
  let end = -Infinity;
  const pts = [[from, y]];
  const live = S.beats.map((b) => {
    const age = S.t - b.t;
    const k = age < 0.12 ? ease(age / 0.12) : Math.exp(-(age - 0.12) / 0.5);
    return { x: C.project([b.x, 0, 0])[0], k };
  }).sort((p, q) => p.x - q.x);
  for (const b of live) {
    if (b.k < 0.02) continue;
    const x0 = b.x + (BEAT[0][0] - BEAT_SPIKE) * a;
    if (x0 <= end || x0 < from) continue; // never fold the line back over itself
    for (const [dx, dy] of BEAT) pts.push([b.x + (dx - BEAT_SPIKE) * a, y + dy * a * b.k]);
    end = pts[pts.length - 1][0];
  }
  pts.push([W, y]);
  // On wide screens the line fades in past the copy, so it never runs under the text.
  const grad = ctx.createLinearGradient(from, 0, from + 0.8 * layout.scale, 0);
  grad.addColorStop(0, "rgba(196,18,48,0)"); grad.addColorStop(1, CRIMSON);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = layout.mobile ? CRIMSON : grad; ctx.lineWidth = 2; ctx.lineJoin = "round";
  ctx.beginPath();
  pts.forEach(([x, py], i) => (i ? ctx.lineTo(x, py) : ctx.moveTo(x, py)));
  ctx.stroke();
}

function drawBones(P, color, width, alphaNear, alphaFar, alpha) {
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = "round";
  for (const [a, b] of BONES) {
    const far = (P[a][2] + P[b][2]) / 2 < -0.03;
    ctx.globalAlpha = alpha * (far ? alphaFar : alphaNear);
    ctx.beginPath(); ctx.moveTo(P[a][0], P[a][1]); ctx.lineTo(P[b][0], P[b][1]); ctx.stroke();
  }
}

function project(C, J) {
  const P = {};
  for (const k in J) P[k] = C.project(J[k]);
  return P;
}

function drawBell(C, bell, wristsMid, fill, alpha) {
  const [bx, by, , k] = C.project(bell);
  const r = 0.07 * layout.scale * k;
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = fill ? INK : GREY; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(wristsMid[0], wristsMid[1]); ctx.lineTo(bx, by); ctx.stroke();
  ctx.beginPath(); ctx.arc(bx, by, r, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = INK; ctx.fill(); } else ctx.stroke();
}

function measure(P, from, at, to, name) {
  const [fx, fy] = P[from], [ax, ay] = P[at], [tx, ty] = P[to];
  const ex = ax - fx, ey = ay - fy, em = Math.hypot(ex, ey) || 1;
  const ux = ex / em, uy = ey / em;
  const len = 0.2 * layout.scale, r = 0.1 * layout.scale;
  ctx.globalAlpha = 1;
  ctx.strokeStyle = GREY; ctx.lineWidth = 1.25;
  ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + ux * len, ay + uy * len); ctx.stroke();
  ctx.setLineDash([]);
  const a1 = Math.atan2(uy, ux), a2 = Math.atan2(ty - ay, tx - ax);
  let d = a2 - a1; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
  ctx.beginPath(); ctx.arc(ax, ay, r, a1, a1 + d, d < 0); ctx.stroke();
  ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(ax, ay, 4, 0, Math.PI * 2); ctx.fill();
  // The tag: an ink label with the live value, on a short leader.
  const deg = Math.round(180 - angleAt(S.J[from], S.J[at], S.J[to]));
  const text = `${name} ${deg}°`;
  ctx.font = "12px 'Space Mono', monospace"; ctx.textBaseline = "middle"; ctx.textAlign = "left";
  const tw = ctx.measureText(text).width + 12;
  const lx = Math.min(ax + 0.3 * layout.scale, W - tw - 12), ly = ay - 0.06 * layout.scale;
  ctx.strokeStyle = INK; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(ax + r + 2, ay); ctx.lineTo(lx, ly); ctx.stroke();
  ctx.beginPath(); ctx.roundRect(lx, ly - 10, tw, 20, 5); ctx.fill();
  ctx.fillStyle = WHITE; ctx.fillText(text, lx + 6, ly + 1);
  return deg;
}

/** The windmill measure: a dashed line from the reaching hand to the foot. */
function measureGap(P, r) {
  const [hx, hy] = P[r.hand], [fx, fy] = P[r.foot];
  ctx.globalAlpha = clamp((r.depth - 0.55) / 0.15) * S.alpha;
  ctx.strokeStyle = GREY; ctx.fillStyle = INK; ctx.lineWidth = 1.25;
  ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(fx, fy); ctx.stroke();
  ctx.setLineDash([]);
  for (const [x, y] of [[hx, hy], [fx, fy]]) { ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill(); }
  const text = `HAND TO FOOT ${Math.round(r.gap * 100)} CM`;
  ctx.strokeStyle = INK;
  ctx.font = "12px 'Space Mono', monospace"; ctx.textBaseline = "middle"; ctx.textAlign = "left";
  const tw = ctx.measureText(text).width + 12;
  // Tag sits outside the body, on the side the hand is reaching to.
  const out = hx < P.rhip[0] / 2 + P.lhip[0] / 2 ? -1 : 1;
  // ...but never off the edge of the screen or back over the copy.
  const lx = clamp(out > 0 ? Math.max(hx, fx) + 0.22 * layout.scale : Math.min(hx, fx) - 0.22 * layout.scale - tw,
    layout.from + 40, W - tw - 12);
  const ly = (hy + fy) / 2 - 0.12 * layout.scale;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo((hx + fx) / 2, (hy + fy) / 2); ctx.lineTo(out > 0 ? lx : lx + tw, ly); ctx.stroke();
  ctx.beginPath(); ctx.roundRect(lx, ly - 10, tw, 20, 5); ctx.fill();
  ctx.fillStyle = WHITE; ctx.fillText(text, lx + 6, ly + 1);
  ctx.globalAlpha = 1;
}

let measured = 0;
function draw() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  const C = cam();
  drawFloor(C);
  // The chronophotograph: earlier positions, oldest faintest.
  for (const g of S.ghosts) {
    const age = (S.t - g.t) / 1.15;
    const a = Math.pow(1 - age, 1.6) * 0.38 * g.a * S.alpha;
    if (a < 0.01) continue;
    const P = project(C, g.J);
    drawBones(P, GREY, 1, 1, 0.6, a);
    if (g.bell) drawBell(C, g.bell, mid(P.rwrist, P.lwrist), false, a);
  }
  const P = project(C, S.J);
  drawBones(P, INK, 1.25, 0.9, 0.32, S.alpha);
  if (S.bell) drawBell(C, S.bell, mid(P.rwrist, P.lwrist), true, S.alpha * S.bellA);
  for (const k of MARKERS) {
    const [x, y, z, s] = P[k];
    ctx.globalAlpha = S.alpha * (z < -0.03 ? 0.4 : 1);
    ctx.fillStyle = INK;
    ctx.beginPath(); ctx.arc(x, y, (k === "head" ? 4.6 : 3.4) * s, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  if (S.alpha > 0.6) {
    const r = reachState();
    if (S.mode === "windmill") {
      // Track the closest reach of this rep in the same frame the tag draws, so the readout never lags it.
      if (r && r.depth > 0.55) {
        measureGap(P, r);
        S.repGap = Math.min(S.repGap ?? Infinity, Math.round(r.gap * 100));
        if (S.repGap !== S.lastGap) { S.lastGap = S.repGap; if (S.stage === 0) vals[3].textContent = `${S.lastGap} cm`; }
      } else S.repGap = null;
    }
    else if (S.mode === "toWalk") {}
    else measured = S.mode === "walk" ? measure(P, "rhip", "rknee", "rankle", "KNEE BEND") : measure(P, "neck", "rhip", "rknee", "HIP HINGE");
  }
  // Side by side, nothing drawn may reach back over the copy: wipe anything left of its edge.
  if (!layout.mobile) {
    const g = ctx.createLinearGradient(layout.from - 8, 0, layout.from + 32, 0);
    g.addColorStop(0, "rgba(0,0,0,1)"); g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.save(); ctx.globalCompositeOperation = "destination-out"; ctx.fillStyle = g;
    ctx.fillRect(0, 0, layout.from + 32, H); ctx.restore();
  }
}
const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

/* ---------- Readouts ---------- */
let lastUi = 0;
function ui(now) {
  if (now - lastUi < 160) return;
  lastUi = now;
  fills.forEach((f, i) => {
    const p = S.stage > i ? 1 : S.stage === i ? clamp(S.st / STAGES[i].dur) : 0;
    f.style.width = `${(p * 100).toFixed(1)}%`;
    stageBtns[i].toggleAttribute("aria-current", S.stage === i);
    if (S.stage === i) stageBtns[i].setAttribute("aria-current", "step");
  });
  const g = GAIT.steady;
  const set = (i, k, v) => { keys[i].textContent = k; vals[i].textContent = v; };
  // Plain words for a patient: what the exercise is, how many, and one or two measures.
  const r = reachState();
  const reps = String(S.reps).padStart(2, "0");
  if (S.stage === 0 && r) {
    // The closest reach of the rep in progress (tracked per frame in draw), held between reps.
    set(0, "Exercise", "Windmill");
    set(1, "Reps", reps);
    set(2, "Turn", `${Math.round(r.twist)}°`);
    set(3, "Hand to foot", S.lastGap === null ? "–" : `${S.lastGap} cm`);
  } else if (S.mode === "walk" || S.mode === "toWalk") {
    const speed = Math.max(0, S.v);
    set(0, "Exercise", "Walk");
    set(1, "Steps a minute", `${Math.round(120 / g.cycle)}`);
    set(2, "Stride", `${(speed * g.cycle).toFixed(2)} m`);
    set(3, "Knee bend", `${measured}°`);
  } else {
    set(0, "Exercise", "Swing");
    set(1, "Reps", reps);
    set(2, "Weight", "12 kg");
    set(3, "Hip hinge", `${measured}°`);
  }
}

stageBtns.forEach((b, i) => b.addEventListener("click", () => jump(i)));

/* ---------- Loop ---------- */
let last = 0, running = false, visible = true;
function frame(now) {
  if (!running) return;
  const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
  last = now;
  step(dt);
  draw();
  ui(now);
  requestAnimationFrame(frame);
}
function start() { if (running || reduce) return; running = true; last = performance.now(); requestAnimationFrame(frame); }
function stop() { running = false; }

// Reduced motion: one still chronophotograph of the steady walk, no loop.
function drawStill() {
  S = fresh(1); S.alpha = 1;
  for (let i = 0; i < 150; i++) step(1 / 60);
  S.ghosts.forEach((g) => (g.t = S.t - 0.4));
  // Keep the last two footsteps' beats on the floor, the nearest one strongest.
  S.beats = S.beats.slice(-2).map((b, i, all) => ({ x: b.x, t: S.t - (i === all.length - 1 ? 0.12 : 0.5) }));
  draw(); ui(Infinity);
}

addEventListener("resize", resize);
document.fonts.ready.then(() => {
  resize();
  if (reduce) return;
  for (let i = 0; i < 40; i++) step(1 / 60);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? start() : stop(); }).observe(hero);
});
