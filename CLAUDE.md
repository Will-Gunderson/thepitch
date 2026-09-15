# The Pitch

Marketing site for The Pitch Apartments, 427 Snelling Ave N, St. Paul. Leasing is
Yellow Tree; tours and chat run through EliseAI.

- **Live URL:** https://www.thepitchstp.com
- **Stack:** Astro 5, static output, from a Webflow export
- **Status:** converted from flat HTML to Astro on the `astro-conversion` branch —
  **not merged**, see *Deploy* below

## Commands

```bash
npm run dev      # dev server on :4331
npm run build    # static build to dist.nosync/
npm run preview  # serve the production build
```

No tests or linter.

## Where things live

```
src/pages/*.astro     thin wrappers: props + set:html of the body
src/content/*.html    the Webflow body markup, verbatim
src/layouts/Base.astro  head, promo bar, navbar, scripts
src/components/Footer.astro
public/               css, js, fonts, images, videos, content/promo.json
.pages.yml            Pages CMS config
```

## The promo bar is the client-editable part

The client edits it at
`https://app.pagescms.org/will-gunderson/thepitch/main/file/promo` (the **Admin**
link in the site footer). Pages CMS commits `public/content/promo.json` to `main`.

That file is read **twice, on purpose**:

1. `Base.astro` imports it at build time, so the served HTML already has the copy;
2. `/js/promo-content.js` re-fetches `/content/promo.json` at runtime and overwrites
   the markup, so an edit lands even on an HTML response cached at the edge.

Keep both. Dropping the fetch makes edits wait on a rebuild; dropping the build-time
render brings back the hand-maintained duplicate that could drift from the JSON.

If the file moves, update `path:` in `.pages.yml` **and** the fetch URL in
`promo-content.js`. `media.input` in `.pages.yml` is `public/images` (repo path) while
`output` is `/images` (public URL) — they are different on purpose.

## Gotchas

- **Never inline the Webflow body markup as Astro markup.** Webflow nests
  `<script type="application/json" class="w-json">` (lightbox config) *inside*
  `<a class="w-lightbox">`. Astro's parser treats such an `<a>` as an unclosed
  formatting element and reconstructs it around everything that follows — on
  amenities that turned 18 anchors into 157 and destroyed the DOM. Verified with a
  minimal repro: `<a>` + nested `<script>` duplicates; `<a>` + plain `<div>` does not.
  Hence `src/content/*.html` + `set:html`.
- **Build output is `dist.nosync/`, not `dist/`** — the vault is in iCloud and a folder
  rewritten every build becomes conflict copies. Vault `CLAUDE.md` has the reasoning.
- **URLs are extensionless** (`/amenities`). `build: { format: 'file' }` emits
  `amenities.html` and the host serves it at `/amenities`; `/amenities.html` 307s.
  Internal links use `/amenities`, not `amenities.html` — with the old `.html` links
  every nav click paid a redirect, and Webflow's own JS stripped the `w--current`
  highlight because the href never matched the URL. Both fixed by the conversion.
- **`data-wf-page` is per page and load-bearing** — `thepitch.js` keys its interactions
  off it. It's the `wfPage` prop; don't collapse it to one value.
- **EliseAI chat fails on localhost** with a CORS error. Expected: their API validates
  the origin. Not a bug, and it means local element counts run ~10 short of production.
- `terms-conditions` and `404` now also load `promo-content.js` / `promo-bar.js`, which
  the old export didn't ship there. Both return early when `.promo-bar` is absent, so
  they're inert; the alternative was two more props for no behavioural gain.

## Deploy — UNRESOLVED, read before merging

`main` currently holds flat HTML at the repo root and whatever deploys the site
expects exactly that, with **no build step**. This branch moves the HTML into
`src/` and only produces it after `npm run build`.

**Merging without reconfiguring the deploy will take the live site down.**

The deploy target has not been identified. It is not a Cloudflare Pages project or a
Worker under `hello@willgunderson.com` — that account shows only `willgunderson`
(pages.dev, 2 years old). Check other Cloudflare accounts, then the repo's GitHub
webhooks. Once found it needs:

- build command: `npm ci && npm run build`
- output directory: `dist.nosync`

Pages CMS keeps working either way — it commits JSON to the repo and doesn't care how
the site is built — but the `path:` values in `.pages.yml` are already updated for the
new layout, so CMS and site must ship together.
