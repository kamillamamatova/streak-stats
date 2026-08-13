import { mkdir, writeFile } from "node:fs/promises";

const username = process.env.STATS_USERNAME || "kamillamamatova";
const token = process.env.STATS_TOKEN || process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
const themes = [
  {
  output: "assets/github-streak-stats.svg",
  accent: "#ec4899",
  accentSoft: "#fbcfe8",
  bg: "#fff5fb",
  border: "#f9a8d4",
  dot: "#f9a8d4",
  dotSoft: "#fbcfe8",
  muted: "#9d174d",
  panel: "#fffafd",
  starSoft: "#fb7185",
  suffix: "#be185d",
  text: "#831843",
  tile: "#ffffff",
  track: "#fce7f3",
  },
  {
  output: "assets/github-streak-stats-dark.svg",
  accent: "#f472b6",
  accentSoft: "#831843",
  bg: "#190817",
  border: "#db2777",
  dot: "#f472b6",
  dotSoft: "#831843",
  muted: "#f9a8d4",
  panel: "#2a1026",
  starSoft: "#fb7185",
  suffix: "#fbcfe8",
  text: "#fdf2f8",
  tile: "#381431",
  track: "#4a173f",
  },
  {
  output: "assets/github-streak-stats-green.svg",
  accent: "#22c55e",
  accentSoft: "#bbf7d0",
  bg: "#f0fdf4",
  border: "#86efac",
  dot: "#86efac",
  dotSoft: "#bbf7d0",
  muted: "#166534",
  panel: "#fbfffc",
  starSoft: "#34d399",
  suffix: "#15803d",
  text: "#14532d",
  tile: "#ffffff",
  track: "#dcfce7",
  },
  {
  output: "assets/github-streak-stats-green-dark.svg",
  accent: "#4ade80",
  accentSoft: "#166534",
  bg: "#07170d",
  border: "#16a34a",
  dot: "#4ade80",
  dotSoft: "#166534",
  muted: "#bbf7d0",
  panel: "#0f2417",
  starSoft: "#86efac",
  suffix: "#dcfce7",
  text: "#f0fdf4",
  tile: "#16351f",
  track: "#1d4d2b",
  },
  {
  output: "assets/github-streak-stats-blue.svg",
  accent: "#38bdf8",
  accentSoft: "#bae6fd",
  bg: "#f0f9ff",
  border: "#7dd3fc",
  dot: "#7dd3fc",
  dotSoft: "#bae6fd",
  muted: "#075985",
  panel: "#f8fcff",
  starSoft: "#60a5fa",
  suffix: "#0369a1",
  text: "#0c4a6e",
  tile: "#ffffff",
  track: "#e0f2fe",
  },
  {
  output: "assets/github-streak-stats-blue-dark.svg",
  accent: "#60a5fa",
  accentSoft: "#1d4ed8",
  bg: "#07111f",
  border: "#2563eb",
  dot: "#60a5fa",
  dotSoft: "#1d4ed8",
  muted: "#bfdbfe",
  panel: "#0c1b33",
  starSoft: "#38bdf8",
  suffix: "#dbeafe",
  text: "#eff6ff",
  tile: "#13294b",
  track: "#1e3a8a",
  },
  {
  output: "assets/github-streak-stats-purple.svg",
  accent: "#a855f7",
  accentSoft: "#e9d5ff",
  bg: "#faf5ff",
  border: "#d8b4fe",
  dot: "#d8b4fe",
  dotSoft: "#e9d5ff",
  muted: "#6b21a8",
  panel: "#fdfaff",
  starSoft: "#c084fc",
  suffix: "#7e22ce",
  text: "#581c87",
  tile: "#ffffff",
  track: "#f3e8ff",
  },
  {
  output: "assets/github-streak-stats-purple-dark.svg",
  accent: "#c084fc",
  accentSoft: "#6b21a8",
  bg: "#13081f",
  border: "#9333ea",
  dot: "#c084fc",
  dotSoft: "#6b21a8",
  muted: "#e9d5ff",
  panel: "#211033",
  starSoft: "#a78bfa",
  suffix: "#f3e8ff",
  text: "#faf5ff",
  tile: "#2f1649",
  track: "#4c1d95",
  },
];

if (!token) {
  throw new Error(
    "Missing token. Set STATS_TOKEN, GH_TOKEN, or GITHUB_TOKEN before running the generator.",
  );
}

const today = new Date();
const isoDate = (date) => date.toISOString().slice(0, 10);
const currentYear = today.getUTCFullYear();

async function graphql(query, variables = {}) {
  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      "user-agent": "github-streak-stats-readme-generator",
    },
    body: JSON.stringify({ query, variables }),
  });

  const payload = await response.json();
  if (!response.ok || payload.errors) {
    const detail = payload.errors?.map((error) => error.message).join("; ");
    throw new Error(detail || `GitHub API request failed with ${response.status}`);
  }

  return payload.data;
}

async function getContributionYears() {
  const data = await graphql(
    `
      query ContributionYears($login: String!) {
        user(login: $login) {
          contributionsCollection {
            contributionYears
          }
        }
      }
    `,
    { login: username },
  );

  const years = data.user?.contributionsCollection?.contributionYears;
  if (!years?.length) {
    return [currentYear];
  }

  return [...new Set(years)].sort((a, b) => a - b);
}

function yearRange(year) {
  const start = `${year}-01-01T00:00:00Z`;
  const endYear = year === currentYear ? today : new Date(Date.UTC(year, 11, 31, 23, 59, 59));
  return { start, end: endYear.toISOString() };
}

async function getYearDays(year) {
  const { start, end } = yearRange(year);
  const data = await graphql(
    `
      query ContributionCalendar($login: String!, $from: DateTime!, $to: DateTime!) {
        user(login: $login) {
          contributionsCollection(from: $from, to: $to) {
            contributionCalendar {
              totalContributions
              weeks {
                contributionDays {
                  date
                  contributionCount
                }
              }
            }
          }
        }
      }
    `,
    { login: username, from: start, to: end },
  );

  const calendar = data.user?.contributionsCollection?.contributionCalendar;
  return {
    total: calendar?.totalContributions ?? 0,
    days: calendar?.weeks?.flatMap((week) => week.contributionDays) ?? [],
  };
}

function summarize(days) {
  const byDate = new Map(days.map((day) => [day.date, day.contributionCount]));
  const sortedDates = [...byDate.keys()].sort();
  let total = 0;
  let highestStreak = 0;
  let runningStreak = 0;

  for (const date of sortedDates) {
    const count = byDate.get(date) ?? 0;
    total += count;
    if (count > 0) {
      runningStreak += 1;
      highestStreak = Math.max(highestStreak, runningStreak);
    } else {
      runningStreak = 0;
    }
  }

  let currentStreak = 0;
  const cursor = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const todayKey = isoDate(cursor);

  if ((byDate.get(todayKey) ?? 0) === 0) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  while (true) {
    const date = isoDate(cursor);
    const count = byDate.get(date);

    if (count === undefined && date > sortedDates.at(-1)) {
      cursor.setUTCDate(cursor.getUTCDate() - 1);
      continue;
    }

    if ((count ?? 0) <= 0) {
      break;
    }

    currentStreak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return { total, currentStreak, highestStreak };
}

function formatNumber(number) {
  return new Intl.NumberFormat("en-US").format(number);
}

function pluralize(number, singular, plural = `${singular}s`) {
  return number === 1 ? singular : plural;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function statBlock({ x, label, value, suffix, theme }) {
  return `
    <g transform="translate(${x} 132)">
      <rect x="-96" y="-32" width="192" height="94" rx="18" fill="${theme.tile}" stroke="${theme.accentSoft}"/>
      <text text-anchor="middle" fill="${theme.text}" font-size="34" font-weight="800">${escapeHtml(value)}</text>
      <text y="29" text-anchor="middle" fill="${theme.muted}" font-size="13" font-weight="700">${escapeHtml(label)}</text>
      <text y="48" text-anchor="middle" fill="${theme.suffix}" font-size="12" font-weight="600">${escapeHtml(suffix)}</text>
    </g>`;
}

function createSvg(stats, theme) {
  const currentSuffix = pluralize(stats.currentStreak, "day");
  const highestSuffix = pluralize(stats.highestStreak, "day");
  const streakRatio = stats.highestStreak > 0 ? stats.currentStreak / stats.highestStreak : 0;
  const streakBarWidth = Math.max(8, Math.min(364, Math.round(364 * streakRatio)));

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="800" height="270" viewBox="0 0 800 270" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="title desc">
  <title id="title">GitHub contribution streak stats for ${escapeHtml(username)}</title>
  <desc id="desc">Total contributions: ${formatNumber(stats.total)}. Current streak: ${stats.currentStreak} ${currentSuffix}. Highest streak: ${stats.highestStreak} ${highestSuffix}.</desc>
  <rect width="800" height="270" rx="26" fill="${theme.bg}"/>
  <rect x="18" y="18" width="764" height="234" rx="24" fill="${theme.panel}" stroke="${theme.border}" stroke-width="2"/>
  <path d="M59 41l5 12 13 1-10 8 3 13-11-7-11 7 3-13-10-8 13-1 5-12z" fill="${theme.accent}"/>
  <path d="M721 49l4 9 10 1-8 6 2 10-8-5-9 5 2-10-8-6 10-1 5-9z" fill="${theme.starSoft}"/>
  <circle cx="104" cy="222" r="5" fill="${theme.dot}"/>
  <circle cx="694" cy="222" r="5" fill="${theme.dot}"/>
  <circle cx="124" cy="222" r="3" fill="${theme.dotSoft}"/>
  <circle cx="674" cy="222" r="3" fill="${theme.dotSoft}"/>
  <text x="400" y="58" text-anchor="middle" fill="${theme.text}" font-family="Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="25" font-weight="850">${escapeHtml(username)}'s GitHub Streak</text>
  <g font-family="Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif">
    ${statBlock({ x: 174, label: "TOTAL", value: formatNumber(stats.total), suffix: "contributions", theme })}
    ${statBlock({ x: 400, label: "CURRENT", value: formatNumber(stats.currentStreak), suffix: currentSuffix, theme })}
    ${statBlock({ x: 626, label: "BEST", value: formatNumber(stats.highestStreak), suffix: highestSuffix, theme })}
  </g>
  <text x="400" y="207" text-anchor="middle" fill="${theme.suffix}" font-family="Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="12" font-weight="700">current streak / best streak</text>
  <rect x="218" y="218" width="364" height="12" rx="6" fill="${theme.track}"/>
  <rect x="218" y="218" width="${streakBarWidth}" height="12" rx="6" fill="${theme.accent}"/>
</svg>
`;
}

const years = await getContributionYears();
const yearly = await Promise.all(years.map(getYearDays));
const days = yearly.flatMap((year) => year.days);
const stats = summarize(days);
for (const theme of themes) {
  await mkdir(theme.output.split("/").slice(0, -1).join("/") || ".", { recursive: true });
  await writeFile(theme.output, createSvg(stats, theme), "utf8");
  console.log(`Wrote ${theme.output}`);
}

console.log(`Total contributions: ${formatNumber(stats.total)}`);
console.log(`Current streak: ${stats.currentStreak}`);
console.log(`Highest streak: ${stats.highestStreak}`);
