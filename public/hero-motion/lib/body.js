/**
 * A small kinematic body for the motion directions. No libraries.
 *
 * World: metres, y up, x is the way the body faces, z is the body's right side
 * (toward the camera in a side view). Poses are joint angles; fk() turns a pose
 * into 3D joint positions with the lowest point of either foot on the floor.
 *
 * Angles are degrees. Segment angles are absolute (measured from straight down,
 * positive = the far end swings forward), except knee and elbow, which are
 * flexion. Proportions are an average adult, 1.75 m.
 */

export const SEG = {
  thigh: 0.43, shank: 0.42, ankleH: 0.075, heel: 0.055, toe: 0.17,
  trunk: 0.5, head: 0.2, upper: 0.29, fore: 0.27, shW: 0.18,
};

const R = Math.PI / 180;
export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const smooth = (t) => t * t * (3 - 2 * t);
export const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const wrap = (d) => d - Math.round(d);
/** A periodic bump centred on c with width w, for gait curves. */
export const bump = (p, c, w) => {
  const d = wrap(p - c);
  return Math.exp(-(d * d) / (2 * w * w));
};

/** Catmull-Rom through evenly spaced keys, t in 0..1. */
function spline(keys, t) {
  const n = keys.length - 1;
  const x = clamp(t) * n;
  const i = Math.min(n - 1, Math.floor(x));
  const u = x - i;
  const p0 = keys[Math.max(0, i - 1)], p1 = keys[i], p2 = keys[i + 1], p3 = keys[Math.min(n, i + 2)];
  return 0.5 * ((2 * p1) + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (-p0 + 3 * p1 - 3 * p2 + p3) * u * u * u);
}

/** Foot pitch over one gait cycle from heel strike (+ = toes up). */
function footPitch(p, toeOff) {
  const K = [[0, 14], [0.09, 0], [0.42, 0], [0.62, toeOff], [0.74, -10], [0.88, 3], [1, 14]];
  for (let i = 0; i < K.length - 1; i++) {
    const [a, va] = K[i], [b, vb] = K[i + 1];
    if (p >= a && p <= b) return lerp(va, vb, smooth((p - a) / (b - a)));
  }
  return 14;
}

/**
 * Gait parameter sets. `cycle` is seconds per stride (two steps).
 * guarded: short, flat, crouched steps with the arms held out; steady: a
 * normal adult walk.
 */
export const GAIT = {
  guarded: { cycle: 1.62, amp: 0.5, load: 5, knee: 34, crouch: 9, lean: 11, arm: 0.2, armOff: 10, elbow: 30, spread: 0.07, toeOff: -22, head: 14, hipW: 0.105, sway: 1.3 },
  steady: { cycle: 1.08, amp: 1, load: 15, knee: 58, crouch: 0, lean: 4, arm: 1, armOff: 4, elbow: 16, spread: 0, toeOff: -44, head: 0, hipW: 0.09, sway: 1 },
};

export function blendGait(a, b, t) {
  const g = {};
  for (const k in a) g[k] = lerp(a[k], b[k], t);
  return g;
}

/** A walking pose at gait phase phi (0 = right heel strike). */
export function walkPose(phi, g) {
  const legs = [0, 0.5].map((off) => {
    const p = (phi + off) % 1;
    const thigh = 6 + g.crouch + g.amp * 22 * Math.cos(2 * Math.PI * (p - 0.97));
    const knee = 4 + g.crouch * 0.8 + g.load * bump(p, 0.15, 0.07) + g.knee * bump(p, 0.72, 0.1);
    // stance: this foot carries weight from heel strike to toe-off.
    return { thigh, knee, foot: footPitch(p, g.toeOff), stance: p < 0.62 ? 1 : 0, abd: 0 };
  });
  const mean = 6 + g.crouch;
  const arms = legs.map((l) => {
    const upper = g.armOff - 0.6 * g.arm * (l.thigh - mean);
    return { upper, elbow: g.elbow + 12 * g.arm * Math.max(0, upper - g.armOff) / 13, spread: g.spread, hands: 0, tee: 0 };
  });
  return {
    lean: g.lean,
    head: g.head,
    hipW: g.hipW,
    sway: 0.022 * g.sway * Math.sin(2 * Math.PI * phi),
    yaw: 5 * g.amp * Math.cos(2 * Math.PI * phi),
    hingeDir: 0,
    twist: 0,
    legs,
    arms,
  };
}

/** A two-handed kettlebell swing at phase phi (0 = bell back between the legs). */
export function swingPose(phi) {
  const hu = 0.5 - 0.5 * Math.cos(2 * Math.PI * (phi + 0.05));
  const au = 0.5 - 0.5 * Math.cos(2 * Math.PI * (phi - 0.03));
  const lean = lerp(56, 2, hu);
  const leg = { thigh: lerp(16, 0, hu), knee: lerp(27, 2, hu), foot: 0, stance: 1, abd: 4 };
  const arm = { upper: lerp(-26, 86, au), elbow: 3, spread: 0, hands: 1, tee: 0 };
  return { lean, head: -lean * 0.5, hipW: 0.125, sway: 0, yaw: 0, hingeDir: 0, twist: 0, legs: [leg, { ...leg }], arms: [arm, { ...arm }] };
}

/**
 * A standing windmill, u in 0..1 for one cycle (right hand to the left foot,
 * up, left hand to the right foot, up). Wide stance, arms straight out.
 */
export function windmillPose(u) {
  const h = (u * 2) % 1;
  const side = u < 0.5 ? 1 : -1;
  const depth = 0.5 - 0.5 * Math.cos(2 * Math.PI * h);
  const lean = 88 * depth;
  // Hips sit back over the heels as the trunk folds, so the hand lands on the foot.
  const leg = { thigh: 0.3 * lean, knee: 3 + 0.3 * lean - 6 * depth, foot: 0, stance: 1, abd: 14 };
  const arm = { upper: 90, elbow: 0, spread: 0, hands: 0, tee: 1 };
  return {
    lean, head: 0, hipW: 0.12, sway: 0, yaw: 0,
    // Hinge toward the opposite foot and turn the shoulders so the reaching
    // arm points down at it while the other points at the ceiling.
    hingeDir: -side * 20, twist: side * 120 * depth,
    legs: [leg, { ...leg }], arms: [arm, { ...arm }],
    side, depth,
  };
}

/** An overhead squat, t from 0 (standing) to 1 (bottom), arms overhead. */
const OHS = { lean: [2, 14, 34], thigh: [2, 52, 98], knee: [3, 64, 118], upper: [178, 171, 160] };
export function squatPose(t) {
  const lean = spline(OHS.lean, t);
  const leg = { thigh: spline(OHS.thigh, t), knee: spline(OHS.knee, t), foot: 0, stance: 1, abd: 6 };
  const arm = { upper: spline(OHS.upper, t), elbow: 0, spread: 0.04, hands: 0, tee: 0 };
  return { lean, head: -lean * 0.4, hipW: 0.11, sway: 0, yaw: 0, hingeDir: 0, twist: 0, legs: [leg, { ...leg }], arms: [arm, { ...arm }] };
}

/**
 * A countermovement jump, l from 0 to 1: load (hips back, arms swing back),
 * drive (arms up, onto the toes), air, then a soft landing. `lift` is how far
 * the feet are off the floor, which the caller adds after fk().
 */
export function jumpPose(l) {
  const seg = (a, b) => clamp((l - a) / (b - a));
  let depth = 0, armU = 8, foot = 0, tuck = 0, lift = 0;
  if (l < 0.3) { const k = ease(seg(0, 0.3)); depth = 0.42 * k; armU = lerp(8, -45, k); }
  else if (l < 0.42) { const k = ease(seg(0.3, 0.42)); depth = 0.42 * (1 - k); armU = lerp(-45, 165, k); foot = -35 * k; }
  else if (l < 0.78) { const k = seg(0.42, 0.78); armU = 165 - 30 * k; foot = -35 * (1 - k); tuck = Math.sin(Math.PI * k); lift = 0.32 * Math.sin(Math.PI * k); }
  else { const k = seg(0.78, 1); depth = 0.36 * Math.sin(Math.PI * k); armU = lerp(135, 8, ease(k)); }
  const P = squatPose(depth);
  for (const L of P.legs) { L.thigh += 16 * tuck; L.knee += 34 * tuck; L.foot = foot; }
  for (const A of P.arms) { A.upper = armU; A.elbow = 12; }
  P.lift = lift;
  return P;
}

export function blendPose(a, b, t) {
  if (typeof a === "number") return lerp(a, b, t);
  if (Array.isArray(a)) return a.map((v, i) => blendPose(v, b[i], t));
  const o = {};
  for (const k in a) o[k] = blendPose(a[k], b && k in b ? b[k] : a[k], t);
  return o;
}

const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const v3lerp = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
function rotY([x, y, z], deg) {
  const c = Math.cos(deg * R), s = Math.sin(deg * R);
  return [x * c + z * s, y, -x * s + z * c];
}
function rotX([x, y, z], deg) {
  const c = Math.cos(deg * R), s = Math.sin(deg * R);
  return [x, y * c - z * s, y * s + z * c];
}
/** Rotate v about unit axis k by `rad` (Rodrigues). */
function rotAxis(v, k, rad) {
  const c = Math.cos(rad), s = Math.sin(rad);
  const kv = k[0] * v[0] + k[1] * v[1] + k[2] * v[2];
  const kx = [k[1] * v[2] - k[2] * v[1], k[2] * v[0] - k[0] * v[2], k[0] * v[1] - k[1] * v[0]];
  return [0, 1, 2].map((i) => v[i] * c + kx[i] * s + k[i] * kv * (1 - c));
}

/**
 * Forward kinematics. Returns named joints (right side first: r*, then l*),
 * with the floor at y = 0 and the pelvis centre at x = 0.
 */
export function fk(P) {
  const J = {};
  const sides = ["r", "l"];
  sides.forEach((sd, i) => {
    const sign = i === 0 ? 1 : -1;
    const L = P.legs[i];
    const hip = add(rotY([0, 0, sign * P.hipW], P.yaw), [0, 0, P.sway]);
    // The leg is built in its own plane, then swung out sideways (abduction).
    const out = (v) => add(hip, rotX(v, -sign * (L.abd || 0)));
    const t = L.thigh * R;
    const kRel = [Math.sin(t) * SEG.thigh, -Math.cos(t) * SEG.thigh, 0];
    const s = (L.thigh - L.knee) * R;
    const aRel = add(kRel, [Math.sin(s) * SEG.shank, -Math.cos(s) * SEG.shank, 0]);
    const f = L.foot * R;
    const dir = [Math.cos(f), Math.sin(f), 0];
    const down = [Math.sin(f), -Math.cos(f), 0];
    const sole = add(aRel, mul(down, SEG.ankleH));
    J[sd + "hip"] = hip;
    J[sd + "knee"] = out(kRel);
    J[sd + "ankle"] = out(aRel);
    J[sd + "heel"] = out(add(sole, mul(dir, -SEG.heel)));
    J[sd + "toe"] = out(add(sole, mul(dir, SEG.toe)));
  });

  // Trunk frame: turn the shoulders about the vertical, then hinge forward
  // toward hingeDir (0 = straight ahead, + toward the right side).
  const lean = P.lean * R;
  const psi = (P.hingeDir || 0) * R;
  const k = [Math.sin(psi), 0, -Math.cos(psi)];
  const turn = (P.twist || 0) - P.yaw * 1.2;
  const axis = rotAxis([0, 1, 0], k, lean);
  const right = rotAxis(rotY([0, 0, 1], turn), k, lean);
  const fwd = rotAxis(rotY([1, 0, 0], turn), k, lean);
  const neck = add(mul(axis, SEG.trunk), [0, 0, P.sway * 0.4]);
  J.neck = neck;
  J.pelvis = mul(add(J.rhip, J.lhip), 0.5);
  const hp = P.head * R;
  J.head = add(neck, mul(add(mul(axis, Math.cos(hp)), mul(fwd, Math.sin(hp))), SEG.head));

  sides.forEach((sd, i) => {
    const sign = i === 0 ? 1 : -1;
    const A = P.arms[i];
    const sh = add(add(neck, mul(right, sign * SEG.shW)), mul(axis, -0.04));
    const u = A.upper * R;
    let elbow = add(sh, [Math.sin(u) * SEG.upper, -Math.cos(u) * SEG.upper, sign * A.spread * 0.6]);
    const fa = (A.upper + A.elbow) * R;
    let wrist = add(elbow, [Math.sin(fa) * SEG.fore, -Math.cos(fa) * SEG.fore, sign * A.spread]);
    if (A.hands > 0) {
      // Both hands on one handle, at the midline.
      elbow = v3lerp(elbow, [elbow[0], elbow[1], sign * 0.1], A.hands);
      wrist = v3lerp(wrist, [wrist[0], wrist[1], sign * 0.035], A.hands);
    }
    if (A.tee > 0) {
      // Arms straight out along the shoulder line.
      const o = mul(right, sign);
      elbow = v3lerp(elbow, add(sh, mul(o, SEG.upper)), A.tee);
      wrist = v3lerp(wrist, add(sh, mul(o, SEG.upper + SEG.fore)), A.tee);
    }
    J[sd + "shoulder"] = sh;
    J[sd + "elbow"] = elbow;
    J[sd + "wrist"] = wrist;
  });

  // Floor contact: the lowest heel or toe of a weight-bearing foot sits on y = 0.
  let min = Infinity;
  for (const k2 of footPoints(P)) min = Math.min(min, J[k2][1]);
  for (const k2 in J) J[k2] = [J[k2][0], J[k2][1] - min, J[k2][2]];
  return J;
}

function footPoints(P) {
  const pts = [];
  ["r", "l"].forEach((sd, i) => { if (P.legs[i].stance >= 0.5) pts.push(sd + "heel", sd + "toe"); });
  return pts.length ? pts : ["rheel", "rtoe", "lheel", "ltoe"];
}

/** The lowest point of a weight-bearing foot, for no-slip travel. */
export function contact(J, P) {
  let best = null;
  for (const k of footPoints(P)) if (!best || J[k][1] < J[best][1]) best = k;
  return best;
}

export const MARKERS = ["head", "rshoulder", "lshoulder", "relbow", "lelbow", "rwrist", "lwrist", "rhip", "lhip", "rknee", "lknee", "rankle", "lankle", "rtoe", "ltoe"];
export const BONES = [
  ["head", "neck"], ["neck", "pelvis"], ["rshoulder", "lshoulder"],
  ["rshoulder", "relbow"], ["relbow", "rwrist"], ["lshoulder", "lelbow"], ["lelbow", "lwrist"],
  ["rshoulder", "rhip"], ["lshoulder", "lhip"], ["rhip", "lhip"],
  ["rhip", "rknee"], ["rknee", "rankle"], ["rankle", "rheel"], ["rheel", "rtoe"], ["rankle", "rtoe"],
  ["lhip", "lknee"], ["lknee", "lankle"], ["lankle", "lheel"], ["lheel", "ltoe"], ["lankle", "ltoe"],
];

/** A simple camera: yaw about the vertical axis, an optional downward pitch, then perspective. */
export function makeCamera({ yaw = 0, pitch = 0, dist = 7, scale = 160, cx = 0, cy = 0, focus = [0, 0.9, 0] }) {
  const c = Math.cos(yaw * R), s = Math.sin(yaw * R);
  const cp = Math.cos(pitch * R), sp = Math.sin(pitch * R);
  return {
    yaw, scale, cx, cy,
    project([x, y, z]) {
      const dx = x - focus[0], dy = y - focus[1], dz = z - focus[2];
      const X = dx * c - dz * s;
      const Zh = dx * s + dz * c; // + = toward the camera
      const Y = dy * cp - Zh * sp;
      const Z = Zh * cp + dy * sp;
      const k = dist / (dist - Z);
      return [cx + X * scale * k, cy - Y * scale * k, Z, k];
    },
  };
}

/** Joint angle in degrees at b between a and c. */
export function angleAt(a, b, c) {
  const u = [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const v = [c[0] - b[0], c[1] - b[1], c[2] - b[2]];
  const d = u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
  const m = Math.hypot(...u) * Math.hypot(...v);
  return Math.acos(clamp(d / m, -1, 1)) / R;
}
