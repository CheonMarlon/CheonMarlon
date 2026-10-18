// Builds dist/stats.svg from live GitHub data. Any metric that cannot be fetched is omitted, never faked.
// Needs Node 20+, GH_USER and GITHUB_TOKEN. Run by .github/workflows/arcade.yml.
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { C, W, T, panel } from "./lib.mjs";

const fmt = (v) => new Intl.NumberFormat("en-US").format(v);

export function renderStats(metrics, langs, updated) {
  const n = metrics.length, pad = 28, gap = 12;
  const cw = (W - pad * 2 - gap * (n - 1)) / n;
  let b = `${T(pad, 34, 12, C.green, "LIVE · GITHUB API", 'letter-spacing="3"')}${T(W - pad, 34, 11, C.muted, `UPDATED ${updated}`, 'letter-spacing="2" text-anchor="end"')}`;
  metrics.forEach((m, i) => {
    const x = pad + i * (cw + gap);
    b += `<g class="rise" style="animation-delay:${i * 0.1}s" transform="translate(${x} 52)"><rect width="${cw}" height="66" fill="${C.panel}" stroke="${C.line}"/>
${T(12, 22, 10, C.muted, m.label, 'letter-spacing="1"')}${T(12, 54, 26, m.color, m.value, 'font-weight="700"')}</g>`;
  });
  let y = 118;
  if (langs.length) {
    y += 34; b += T(pad, y, 11, C.muted, "LANGUAGES BY REPO BYTES", 'letter-spacing="3"'); y += 14;
    const top = Math.max(...langs.map((l) => l.pct)), bw = 480;
    langs.forEach((l, i) => {
      y += 26;
      b += `${T(pad, y, 12.5, C.text, l.lang.toLowerCase())}<rect x="170" y="${y - 10}" width="${bw}" height="10" fill="${C.panel}"/>
<rect class="grow" style="animation-delay:${0.2 + i * 0.1}s" x="170" y="${y - 10}" width="${Math.max(4, Math.round((l.pct / top) * bw))}" height="10" fill="${i === 0 ? C.green : "#2f7d46"}"/>
${T(170 + bw + 14, y, 12, C.muted, `${l.pct}%`)}`;
    });
    y += 14;
  }
  y += 22;
  b += T(pad, y, 10, C.muted, "Stars and languages: owned, non-fork public repos. Commits, PRs and contributions: last 12 months.", 'letter-spacing=".5"');
  return panel(y + 16, `GitHub stats: ${metrics.map((m) => `${m.label} ${m.value}`).join(", ")}`, b);
}

async function main() {
  const user = process.env.GH_USER, token = process.env.GITHUB_TOKEN;
  if (!user || !token) throw new Error("GH_USER and GITHUB_TOKEN are required");
  const headers = { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "bymiko-arcade" };
  const rest = async (p) => { const r = await fetch(`https://api.github.com${p}`, { headers }); if (!r.ok) throw new Error(`${p} -> ${r.status}`); return r.json(); };
  const metrics = [], langs = [];

  let repos = [];
  try {
    const u = await rest(`/users/${user}`);
    for (let page = 1; ; page++) {
      const b = await rest(`/users/${user}/repos?type=owner&per_page=100&page=${page}`);
      repos = repos.concat(b); if (b.length < 100) break;
    }
    repos = repos.filter((r) => !r.fork);
    metrics.push({ label: "PUBLIC REPOS", value: fmt(u.public_repos), color: C.text });
    metrics.push({ label: "STARS EARNED", value: fmt(repos.reduce((s, r) => s + r.stargazers_count, 0)), color: C.text });
  } catch (e) { console.warn("repo metrics omitted:", e.message); }

  try {
    const r = await fetch("https://api.github.com/graphql", { method: "POST", headers, body: JSON.stringify({
      query: "query($l:String!){user(login:$l){pullRequests{totalCount} contributionsCollection{totalCommitContributions contributionCalendar{totalContributions}}}}", variables: { l: user } }) });
    const u = (await r.json())?.data?.user;
    if (!u) throw new Error("no data");
    metrics.push({ label: "COMMITS · 12MO", value: fmt(u.contributionsCollection.totalCommitContributions), color: C.text });
    metrics.push({ label: "PULL REQUESTS", value: fmt(u.pullRequests.totalCount), color: C.text });
    metrics.push({ label: "CONTRIBS · 12MO", value: fmt(u.contributionsCollection.contributionCalendar.totalContributions), color: C.text });
  } catch (e) { console.warn("graphql metrics omitted:", e.message); }

  try {
    const totals = {};
    for (const r of repos) {
      try { const l = await rest(`/repos/${user}/${r.name}/languages`); for (const [k, v] of Object.entries(l)) totals[k] = (totals[k] || 0) + v; }
      catch (e) { console.warn(`languages skipped for ${r.name}:`, e.message); }
    }
    const sum = Object.values(totals).reduce((a, b) => a + b, 0);
    if (sum > 0) Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 5).forEach(([lang, v]) => langs.push({ lang, pct: Math.round((v / sum) * 1000) / 10 }));
  } catch (e) { console.warn("languages omitted:", e.message); }

  if (metrics.length === 0) throw new Error("No metrics available; refusing to publish an empty panel");
  mkdirSync("dist", { recursive: true });
  writeFileSync("dist/stats.svg", renderStats(metrics, langs, new Date().toISOString().slice(0, 10)));
  console.log(`stats.svg written: ${metrics.length} metrics, ${langs.length} languages`);
}
if (process.argv[1] === fileURLToPath(import.meta.url)) main().catch((e) => { console.error(e); process.exit(1); });
