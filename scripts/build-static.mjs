// Generates the static SVG panels and README.md from profile.json.
// Run locally: node scripts/build-static.mjs   (then commit assets/ and README.md)
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { C, W, T, esc, wrap, panel, invader, pixelText, fitScale } from "./lib.mjs";

const P = JSON.parse(readFileSync(new URL("../profile.json", import.meta.url), "utf8"));
mkdirSync("assets", { recursive: true });
const out = (f, s) => writeFileSync(`assets/${f}`, s);

// ---------- header: attract-mode marquee ----------
{
  const title = P.gameTitle, s = fitScale(title);
  let row = ""; for (let i = 0; i < 5; i++) row += invader(W / 2 - 5 * 60 / 2 + 10 + i * 60, 64, 3, C.dim);
  out("header.svg", panel(238, `${title} — ${P.name}`, `
${T(28, 34, 13, C.green, "1UP", 'letter-spacing="2"')}${T(76, 34, 13, C.muted, P.name.toUpperCase(), 'letter-spacing="2"')}
<text class="m blink" x="${W - 28}" y="34" font-size="13" fill="${C.text}" letter-spacing="3" text-anchor="end">INSERT COIN</text>
<line x1="28" y1="48" x2="${W - 28}" y2="48" stroke="${C.line}"/>
${row}
${pixelText(title, 104, s, C.green)}
${T(W / 2, 104 + 7 * s + 34, 14, C.muted, `${P.title}  ·  ${P.location}`, 'text-anchor="middle"')}
${T(W / 2, 104 + 7 * s + 62, 11, C.dim, `© ${P.year} ${P.name.toUpperCase()}`, 'text-anchor="middle" letter-spacing="2"')}`));
}

// ---------- section labels ----------
const SECTIONS = [["01", "PLAYER"], ["02", "GAMES"], ["03", "STATUS"], ["04", "PLAYFIELD"], ["05", "LEVELS"], ["06", "INVENTORY"]];
for (const [n, label] of SECTIONS) {
  const x2 = 64 + label.length * 14;
  out(`s${n}.svg`, panel(44, `Section ${n}: ${label}`, `
${T(28, 28, 12, C.green, ">", "")}${T(46, 28, 12, C.text, label, 'letter-spacing="4"')}
<line x1="${x2 + 20}" y1="23" x2="${W - 28}" y2="23" stroke="${C.line}"/>`));
}

// ---------- 01 player ----------
{
  let y = 38, b = "";
  P.about.lines.forEach((l, i) => { b += `<text class="m rise" style="animation-delay:${0.05 + i * 0.1}s" x="28" y="${y}" font-size="15" fill="${i === 0 ? C.text : C.muted}">${esc(l)}</text>`; y += 28; });
  y += 2; b += `<line x1="28" y1="${y}" x2="${W - 28}" y2="${y}" stroke="${C.line}"/>`; y += 30;
  P.about.rows.forEach(([k, v], i) => { b += `<g class="rise" style="animation-delay:${0.4 + i * 0.1}s">${T(28, y, 11, C.muted, k, 'letter-spacing="2"')}${T(140, y, 14, C.text, v)}</g>`; y += 30; });
  out("whoami.svg", panel(y - 6, `About ${P.name}`, b));
}

// ---------- 02 games ----------
{
  let y = 14, b = "";
  P.projects.forEach((p, i) => {
    const lines = wrap(p.desc, 78);
    b += `<g class="rise" style="animation-delay:${0.08 + i * 0.12}s">`;
    b += T(28, y + 26, 16, C.green, "▶", "") + T(52, y + 26, 16, C.text, `${String(i + 1).padStart(2, "0")}  ${p.name}`, 'font-weight="700"');
    b += T(W - 28, y + 26, 11, C.muted, p.meta, 'letter-spacing="1.5" text-anchor="end"');
    let ly = y + 54;
    lines.forEach((l) => { b += T(52, ly, 14, C.muted, l); ly += 20; });
    b += T(52, ly + 6, 11, "#5d635e", p.tech, 'letter-spacing="1"');
    const bottom = ly + 22;
    if (i < P.projects.length - 1) b += `<line x1="28" y1="${bottom}" x2="${W - 28}" y2="${bottom}" stroke="${C.line}"/>`;
    b += `</g>`;
    y = bottom + 10;
  });
  out("projects.svg", panel(y + 8, `${P.projects.length} projects: ${P.projects.map((p) => p.name).join(", ")}`, b));
}

// ---------- 05 levels ----------
{
  let y = 20, b = `<line x1="132" y1="14" x2="132" y2="${14 + P.route.length * 62}" stroke="${C.line}"/>`;
  P.route.forEach(([when, what, sub], i) => {
    b += `<g class="rise" style="animation-delay:${0.08 + i * 0.12}s">
${T(28, y + 26, 12, C.muted, when, 'letter-spacing="2"')}
<rect x="128" y="${y + 18}" width="8" height="8" fill="${i === 0 ? C.green : C.dim}"/>
${T(152, y + 26, 15, C.text, what)}${T(152, y + 48, 12.5, C.muted, sub)}</g>`;
    y += 62;
  });
  out("levels.svg", panel(y + 8, `Route: ${P.route.map((r) => `${r[0]} ${r[1]}`).join("; ")}`, b));
}

// ---------- 06 inventory ----------
{
  let y = 22, b = "";
  P.stack.forEach(([k, v], i) => { b += `<g class="rise" style="animation-delay:${0.06 * i}s">${T(28, y + 20, 11, C.muted, k, 'letter-spacing="2"')}${T(170, y + 20, 14.5, C.text, v)}</g>`; y += 34; });
  out("inventory.svg", panel(y + 10, `Technical stack: ${P.stack.map((s) => `${s[0]}: ${s[1]}`).join(". ")}`, b));
}

// ---------- footer ----------
out("footer.svg", panel(64, `Credit 01. ${P.location}`, `
<text class="m blink" x="28" y="38" font-size="13" fill="${C.green}" letter-spacing="3">CREDIT 01  ·  PRESS START</text>
${T(W - 28, 38, 12, C.muted, P.location, 'text-anchor="end"')}`));

// ---------- README ----------
const pic = (dark, light, alt) => `<picture><source media="(prefers-color-scheme: dark)" srcset="${dark}"><source media="(prefers-color-scheme: light)" srcset="${light}"><img src="${light}" alt="${esc(alt)}" width="100%"></picture>`;
const img = (src, alt) => `<img src="${src}" alt="${esc(alt)}" width="100%">`;
const RAW = `https://raw.githubusercontent.com/${P.handle}/${P.handle}/output`;
const links = [P.links.linkedin && `<a href="${P.links.linkedin}">LINKEDIN</a>`, P.links.email && `<a href="mailto:${P.links.email}">EMAIL</a>`].filter(Boolean).join(" &nbsp;·&nbsp; ");
const projLinks = P.projects.filter((p) => p.repo).map((p) => `[\`▶ ${p.name}\`](${p.repo})`).join(" &nbsp; ");

writeFileSync("README.md", `<div align="center">

${img("assets/header.svg", `${P.gameTitle} — ${P.name}, ${P.title}`)}

${links ? `<sub>${links}</sub>` : ""}

</div>

${img("assets/s01.svg", "01 — Player")}
${img("assets/whoami.svg", `About ${P.name}`)}

${img("assets/s02.svg", "02 — Games")}
${img("assets/projects.svg", `Projects: ${P.projects.map((p) => p.name).join(", ")}`)}

${projLinks ? projLinks + "\n" : ""}
${img("assets/s03.svg", "03 — Status")}
${img(`${RAW}/stats.svg`, "Live GitHub stats generated daily from the GitHub API")}

${img("assets/s04.svg", "04 — Playfield")}
${pic(`${RAW}/snake-dark.svg`, `${RAW}/snake-light.svg`, "Snake animation eating my real GitHub contribution graph, regenerated daily")}

${img("assets/s05.svg", "05 — Levels")}
${img("assets/levels.svg", "Timeline of milestones")}

${img("assets/s06.svg", "06 — Inventory")}
${img("assets/inventory.svg", "Technical stack")}

${img("assets/footer.svg", "Credit 01. Press start.")}
`);
console.log("built assets + README");
