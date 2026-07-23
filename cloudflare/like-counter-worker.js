/**
 * Cloudflare Worker: shared, anonymous per-post like counter for
 * https://scallerio.github.io/MPDBlog, backed by data/likes.json in this
 * GitHub repo (the "database" — each like is a commit appending an
 * ISO-8601 timestamp to that post's array; the count is just the
 * array's length, and the array itself is the "simple trace" of when
 * likes happened).
 *
 * Why a Worker at all: GitHub Pages only serves static files, and a
 * browser can't safely hold the GitHub token needed to write to the
 * repo (anything shipped in page source is public and could be stolen
 * and used to modify the repo). This Worker holds that token as a
 * private secret and does the write on the button's behalf.
 *
 * Routes:
 *   GET  /likes/:slug   -> { count } — reads the public raw file, no auth needed
 *   POST /likes/:slug   -> { count } — appends a timestamp, commits via the
 *                                      GitHub Contents API, needs GITHUB_TOKEN
 *
 * ── Deployment ──────────────────────────────────────────────────────
 * See README.md in this directory (`npx wrangler deploy` + `npx wrangler
 * secret put GITHUB_TOKEN` — the Cloudflare dashboard's drag-and-drop
 * upload flow rejects this file with a misleading "requires a build
 * process" error; wrangler doesn't have that problem). wrangler.toml
 * already has the non-secret config (repo owner/name/branch).
 */

const DATA_PATH = "data/likes.json";
const ALLOWED_ORIGIN = "https://scallerio.github.io";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders() },
  });
}

async function readPublicLikes(env) {
  const url = `https://raw.githubusercontent.com/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/${env.GITHUB_BRANCH}/${DATA_PATH}`;
  const res = await fetch(url, { cf: { cacheTtl: 30 } });
  if (!res.ok) return {};
  return res.json();
}

async function readLikesWithSha(env) {
  const url = `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${DATA_PATH}?ref=${env.GITHUB_BRANCH}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      "User-Agent": "mpd-blog-like-counter",
      Accept: "application/vnd.github+json",
    },
  });
  if (!res.ok) throw new Error(`GitHub read failed: ${res.status}`);
  const body = await res.json();
  const content = JSON.parse(atob(body.content.replace(/\n/g, "")));
  return { content, sha: body.sha };
}

async function writeLikes(env, content, sha, slug) {
  const url = `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${DATA_PATH}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      "User-Agent": "mpd-blog-like-counter",
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: `Like: ${slug}`,
      content: btoa(JSON.stringify(content, null, 2) + "\n"),
      sha,
      branch: env.GITHUB_BRANCH,
    }),
  });
  if (!res.ok) throw new Error(`GitHub write failed: ${res.status}`);
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    const url = new URL(request.url);
    const match = url.pathname.match(/^\/likes\/([^/]+)\/?$/);
    if (!match) return jsonResponse({ error: "not found" }, 404);
    const slug = decodeURIComponent(match[1]);

    if (request.method === "GET") {
      const likes = await readPublicLikes(env);
      const count = Array.isArray(likes[slug]) ? likes[slug].length : 0;
      return jsonResponse({ count });
    }

    if (request.method === "POST") {
      try {
        const { content, sha } = await readLikesWithSha(env);
        if (!Array.isArray(content[slug])) content[slug] = [];
        content[slug].push(new Date().toISOString());
        await writeLikes(env, content, sha, slug);
        return jsonResponse({ count: content[slug].length });
      } catch (err) {
        return jsonResponse({ error: String(err) }, 500);
      }
    }

    return jsonResponse({ error: "method not allowed" }, 405);
  },
};
