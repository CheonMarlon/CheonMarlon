export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const FONT = "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace";
// One accent (phosphor green) on near-black. Everything else is grey.
export const C = { bg: "#0a0a0a", panel: "#111312", line: "#262a27", text: "#dcdcdc", muted: "#7c817d", dim: "#3b403c", green: "#33ff66" };
export const W = 800;

export function wrap(text, max) {
  const out = []; let line = "";
  for (const w of text.split(/\s+/)) {
    if ((line + " " + w).trim().length > max) { out.push(line); line = w; } else line = (line + " " + w).trim();
  }
  if (line) out.push(line);
  return out;
}

// Base state is always visible; animations only describe the "from" state.
export const STYLE = `<style>
.m{font-family:${FONT}}
.rise{animation:rise .6s cubic-bezier(.2,.7,.2,1) both}
@keyframes rise{from{opacity:0;transform:translateY(6px)}}
.blink{animation:blink 1.2s steps(1) infinite}
@keyframes blink{50%{opacity:0}}
.sway{animation:sway 1.6s steps(1) infinite}
@keyframes sway{25%{transform:translateX(5px)}75%{transform:translateX(-5px)}}
.grow{transform-box:fill-box;transform-origin:left center;animation:grow 1s cubic-bezier(.2,.7,.2,1) both}
@keyframes grow{from{transform:scaleX(0)}}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}
</style>`;

export function panel(h, label, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${h}" width="${W}" height="${h}" fill="none" role="img" aria-label="${esc(label)}">
${STYLE}
<rect x=".5" y=".5" width="${W - 1}" height="${h - 1}" rx="4" fill="${C.bg}" stroke="${C.line}"/>
${body}
</svg>`;
}
export const T = (x, y, size, fill, txt, extra = "") => `<text class="m" x="${x}" y="${y}" font-size="${size}" fill="${fill}" ${extra}>${esc(txt)}</text>`;

// ---- classic invader sprite (11x8) ----
const SPRITE = ["00100000100", "00010001000", "00111111100", "01101110110", "11111111111", "10111111101", "10100000101", "00011011000"];
export function invader(x, y, s, color, sway = true) {
  let r = "";
  SPRITE.forEach((row, j) => [...row].forEach((c, i) => { if (c === "1") r += `<rect x="${i * s}" y="${j * s}" width="${s}" height="${s}"/>`; }));
  return `<g transform="translate(${x} ${y})"><g class="${sway ? "sway" : ""}" fill="${color}">${r}</g></g>`;
}

// ---- 5x7 bitmap font, drawn as pixels so the marquee needs no web font ----
const G = {
  A: "01110,10001,10001,11111,10001,10001,10001", B: "11110,10001,10001,11110,10001,10001,11110",
  C: "01110,10001,10000,10000,10000,10001,01110", D: "11110,10001,10001,10001,10001,10001,11110",
  E: "11111,10000,10000,11110,10000,10000,11111", F: "11111,10000,10000,11110,10000,10000,10000",
  G: "01110,10001,10000,10111,10001,10001,01111", H: "10001,10001,10001,11111,10001,10001,10001",
  I: "01110,00100,00100,00100,00100,00100,01110", J: "00111,00010,00010,00010,00010,10010,01100",
  K: "10001,10010,10100,11000,10100,10010,10001", L: "10000,10000,10000,10000,10000,10000,11111",
  M: "10001,11011,10101,10101,10001,10001,10001", N: "10001,11001,10101,10011,10001,10001,10001",
  O: "01110,10001,10001,10001,10001,10001,01110", P: "11110,10001,10001,11110,10000,10000,10000",
  Q: "01110,10001,10001,10001,10101,10010,01101", R: "11110,10001,10001,11110,10100,10010,10001",
  S: "01111,10000,10000,01110,00001,00001,11110", T: "11111,00100,00100,00100,00100,00100,00100",
  U: "10001,10001,10001,10001,10001,10001,01110", V: "10001,10001,10001,10001,10001,01010,00100",
  W: "10001,10001,10001,10101,10101,11011,10001", X: "10001,10001,01010,00100,01010,10001,10001",
  Y: "10001,10001,01010,00100,00100,00100,00100", Z: "11111,00001,00010,00100,01000,10000,11111",
  0: "01110,10001,10011,10101,11001,10001,01110", 1: "00100,01100,00100,00100,00100,00100,01110",
  2: "01110,10001,00001,00010,00100,01000,11111", 3: "11110,00001,00001,01110,00001,00001,11110",
  4: "00010,00110,01010,10010,11111,00010,00010", 5: "11111,10000,11110,00001,00001,10001,01110",
  6: "00110,01000,10000,11110,10001,10001,01110", 7: "11111,00001,00010,00100,01000,01000,01000",
  8: "01110,10001,10001,01110,10001,10001,01110", 9: "01110,10001,10001,01111,00001,00010,01100",
  "-": "00000,00000,00000,11111,00000,00000,00000", ".": "00000,00000,00000,00000,00000,01100,01100",
  " ": "00000,00000,00000,00000,00000,00000,00000", "'": "00100,00100,01000,00000,00000,00000,00000",
};
export function pixelText(str, y, s, fill, cx = W / 2) {
  const t = str.toUpperCase();
  for (const ch of t) if (!G[ch]) throw new Error(`pixel font has no glyph for "${ch}"`);
  const total = t.length * 6 - 1;
  let x0 = cx - (total * s) / 2, d = "";
  for (const ch of t) {
    G[ch].split(",").forEach((row, j) => [...row].forEach((c, i) => { if (c === "1") d += `M${x0 + i * s} ${y + j * s}h${s}v${s}h-${s}z`; }));
    x0 += 6 * s;
  }
  return `<path d="${d}" fill="${fill}"/>`;
}
export const fitScale = (str, max = 9, margin = 96) => Math.min(max, Math.floor((W - margin) / (str.length * 6 - 1)));
