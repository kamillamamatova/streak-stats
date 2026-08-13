import { mkdir, writeFile } from "node:fs/promises";

const username = process.env.STATS_USERNAME || "kamillamamatova";
const token = process.env.STATS_TOKEN || process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
const output = process.env.STATS_OUTPUT || "assets/github-streak-stats.svg";
const accent = process.env.STATS_ACCENT || "#14b8a6";
const dark = process.env.STATS_DARK || "#111827";
const muted = process.env.STATS_MUTED || "#6b7280";
const bg = process.env.STATS_BG || "#ffffff";

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

function statBlock({ x, label, value, suffix }) {
  return `
    <g transform="translate(${x} 92)">
      <text text-anchor="middle" fill="${dark}" font-size="30" font-weight="700">${escapeHtml(value)}</text>
      <text y="28" text-anchor="middle" fill="${muted}" font-size="13" font-weight="600">${escapeHtml(label)}</text>
      <text y="48" text-anchor="middle" fill="${muted}" font-size="12">${escapeHtml(suffix)}</text>
    </g>`;
}

function createSvg(stats) {
  const currentSuffix = pluralize(stats.currentStreak, "day");
  const highestSuffix = pluralize(stats.highestStreak, "day");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="760" height="210" viewBox="0 0 760 210" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="title desc">
  <title id="title">GitHub contribution streak stats for ${escapeHtml(username)}</title>
  <desc id="desc">Total contributions: ${formatNumber(stats.total)}. Current streak: ${stats.currentStreak} ${currentSuffix}. Highest streak: ${stats.highestStreak} ${highestSuffix}.</desc>
  <rect width="760" height="210" rx="8" fill="${bg}" stroke="#e5e7eb"/>
  <rect x="22" y="22" width="716" height="166" rx="8" fill="#f9fafb" stroke="#eef2f7"/>
  <circle cx="55" cy="54" r="11" fill="${accent}"/>
  <text x="78" y="61" fill="${dark}" font-family="Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="20" font-weight="750">${escapeHtml(username)}'s GitHub Streak</text>
  <text x="78" y="82" fill="${muted}" font-family="Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="12">Public and private contribution counts, when the token and GitHub profile setting allow it.</text>
  <g font-family="Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif">
    ${statBlock({ x: 175, label: "Total Contributions", value: formatNumber(stats.total), suffix: "all-time" })}
    ${statBlock({ x: 380, label: "Current Streak", value: formatNumber(stats.currentStreak), suffix: currentSuffix })}
    ${statBlock({ x: 585, label: "Highest Streak", value: formatNumber(stats.highestStreak), suffix: highestSuffix })}
  </g>
  <path d="M52 164h656" stroke="#e5e7eb" stroke-linecap="round"/>
  <path d="M52 164h${Math.min(656, 80 + stats.currentStreak * 8)}" stroke="${accent}" stroke-width="4" stroke-linecap="round"/>
</svg>
`;
}

const years = await getContributionYears();
const yearly = await Promise.all(years.map(getYearDays));
const days = yearly.flatMap((year) => year.days);
const stats = summarize(days);
const svg = createSvg(stats);

await mkdir(output.split("/").slice(0, -1).join("/") || ".", { recursive: true });
await writeFile(output, svg, "utf8");

console.log(`Wrote ${output}`);
console.log(`Total contributions: ${formatNumber(stats.total)}`);
console.log(`Current streak: ${stats.currentStreak}`);
console.log(`Highest streak: ${stats.highestStreak}`);
