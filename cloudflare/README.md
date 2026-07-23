# Like-counter Worker — deployment

Backs the like button on each post with a shared, anonymous count stored
in `data/likes.json` in this repo (see `like-counter-worker.js`'s header
comment for how it works). This is a one-time setup; after it's deployed
the site needs no further code changes.

The Cloudflare dashboard's drag-and-drop "upload a project" flow expects
a bundled build and will reject this file with *"This uploader does not
yet support projects that require a build process"* — that's a quirk of
that specific upload flow, not something actually needed for a one-file
Worker like this. Use the `wrangler` CLI instead (no global install
needed, `npx` handles it):

## 1. Log in

```
npx wrangler login
```
Opens a browser tab to authorize `wrangler` against your Cloudflare
account (create a free account first at
https://dash.cloudflare.com/sign-up if you don't have one).

## 2. Create a GitHub token

A **fine-grained** Personal Access Token, scoped to *only* this
repository, with **Contents: Read and write** permission and nothing
else: https://github.com/settings/personal-access-tokens/new

## 3. Deploy the Worker

From this `cloudflare/` directory:
```
npx wrangler deploy
```
`wrangler.toml` already has the non-secret config (repo owner/name/
branch). This prints the Worker's URL on success, something like
`https://mpd-blog-likes.<your-subdomain>.workers.dev`.

## 4. Add the GitHub token as a secret

```
npx wrangler secret put GITHUB_TOKEN
```
Paste the token from step 2 when prompted. This is stored encrypted by
Cloudflare and never appears in the dashboard, git, or the deployed
code — different from `wrangler.toml`'s `[vars]`, which are plain text
and fine for non-sensitive values only.

## 5. Point the site at it

Set `like_worker_url:` in `_config.yml` (repo root) to the URL from step
3, commit, and deploy the site as normal. The like button already reads
this value — no other changes needed.

## Redeploying after an edit

If you change `like-counter-worker.js`, just re-run `npx wrangler
deploy` from this directory — the secret and vars stay set.
