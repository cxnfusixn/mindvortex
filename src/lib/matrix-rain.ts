const alphabet = [..."012345789ABCDEFGHIJKLMNOPQRSTUVWXYZｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾗﾘﾙﾚﾛ"];

/** Original canvas renderer: fixed character cells, descending heads and fading tails. */
export function createMatrixRain(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return { setPaused: (paused: boolean) => { void paused; }, destroy: () => {} };
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let width = 0;
  let height = 0;
  let lineHeight = 20;
  let spacing = 25;
  let paused = false;
  let raf = 0;
  let previous = 0;
  let mutationTime = 0;
  let columns: { head: number; speed: number; length: number; letters: string[] }[] = [];
  const glyph = () => alphabet[Math.floor(Math.random() * alphabet.length)];

  const draw = (delta: number) => {
    ctx.clearRect(0, 0, width, height);
    mutationTime += delta;
    const mutate = mutationTime > 0.12;
    if (mutate) mutationTime = 0;
    const rows = Math.ceil(height / lineHeight);
    for (let columnIndex = 0; columnIndex < columns.length; columnIndex++) {
      const column = columns[columnIndex];
      column.head += column.speed * delta;
      if (column.head - column.length > rows) {
        column.head = -2 - Math.random() * 18;
        column.speed = 5.208 + Math.random() * 3.72;
        column.length = 12 + Math.floor(Math.random() * 18);
      }
      const first = Math.max(0, Math.ceil(column.head - column.length));
      const last = Math.min(rows, Math.floor(column.head));
      for (let row = first; row <= last; row++) {
        if (mutate && Math.random() < 0.08) column.letters[row] = glyph();
        const distance = column.head - row;
        const y = row * lineHeight;
        const trail = Math.pow(1 - distance / column.length, 1.4);
        const depth = Math.pow(Math.max(0, 1 - y / height), 1.35);
        ctx.globalAlpha = trail * depth * (distance < 1.5 ? 0.36 : 0.22);
        ctx.fillStyle = distance < 1.5 ? "#D0F5DB" : "#35F46A";
        ctx.fillText(column.letters[row], columnIndex * spacing + spacing / 2, y);
      }
    }
    ctx.globalAlpha = 1;
  };
  const tick = (now: number) => {
    raf = requestAnimationFrame(tick);
    if (now - previous < 1000 / 30) return;
    const delta = previous ? Math.min((now - previous) / 1000, 0.08) : 0;
    previous = now;
    draw(delta);
  };
  const sync = () => {
    cancelAnimationFrame(raf);
    previous = 0;
    const running = !paused && !document.hidden && !reduced.matches;
    canvas.dataset.motion = reduced.matches ? "reduced" : running ? "running" : "paused";
    if (reduced.matches) ctx.clearRect(0, 0, width, height);
    if (running) raf = requestAnimationFrame(tick);
  };
  const resize = () => {
    width = innerWidth;
    height = innerHeight;
    const mobile = width < 768;
    lineHeight = mobile ? 18 : 20;
    spacing = mobile ? 26 : 25;
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.font = `${mobile ? 13 : 15}px ${getComputedStyle(canvas).fontFamily}`;
    ctx.textBaseline = "top";
    ctx.textAlign = "center";
    const rows = Math.ceil(height / lineHeight) + 1;
    columns = Array.from({ length: Math.ceil(width / spacing) }, () => ({
      head: -Math.random() * 24,
      speed: 5.208 + Math.random() * 3.72,
      length: 12 + Math.floor(Math.random() * 18),
      letters: Array.from({ length: rows }, glyph),
    }));
    if (!reduced.matches) draw(0);
  };
  resize();
  sync();
  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", sync);
  reduced.addEventListener("change", sync);
  return {
    setPaused(value: boolean) { paused = value; sync(); },
    destroy() {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", sync);
      reduced.removeEventListener("change", sync);
    },
  };
}
