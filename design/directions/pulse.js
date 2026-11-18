// The signature moment: the logo's heartbeat draws once, then flattens to a
// steady line as the hero scrolls away. The beat keeps a fixed pixel shape at
// every width; only the flat runs either side stretch.
(() => {
  const svg = document.querySelector("svg.pulse");
  if (!svg) return;
  const path = svg.querySelector("path");
  const scope = svg.closest("[data-pulse-scope]") || document.body;
  const H = 120, MID = 60;
  // [x offset from the beat's centre, y offset from the baseline], in px
  const BEAT = [[-150, 0], [-120, -14], [-106, 0], [-88, 0], [-72, 36], [-50, -54],
    [-28, 48], [-12, -20], [0, 0], [30, 0], [44, -9], [58, 0]];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let k = 1;

  function render() {
    const w = svg.clientWidth || 1200;
    const cx = Math.round(w * (parseFloat(svg.dataset.at) || 0.5));
    const amp = w < 600 ? 0.8 : 1;
    const pts = [[0, MID], ...BEAT.map(([dx, dy]) => [cx + dx * amp, MID + dy * amp * k]), [w, MID]];
    svg.setAttribute("viewBox", `0 0 ${w} ${H}`);
    path.setAttribute("d", pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" "));
  }

  render();
  addEventListener("resize", render);
  if (reduce) return;
  path.classList.add("draw-on");
  let queued = false;
  addEventListener("scroll", () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      const p = Math.min(1, Math.max(0, scrollY / (scope.offsetHeight * 0.8)));
      k = 1 - p * p * (3 - 2 * p);
      render();
      queued = false;
    });
  }, { passive: true });
})();
