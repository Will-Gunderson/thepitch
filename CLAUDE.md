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

Keep both, but note which is authoritative: **the build-time render is**. The fetch is a
top-up for an edit made since the last build. It must never gate visibility — the bar was
originally `visibility: hidden` until the fetch resolved, which showed a blank strip that
popped in on every page load. The bar now paints with the page.

When `enabled` is false the bar is not emitted at all, rather than emitted and hidden by
script. The gap that leaves: if a CMS edit flips `enabled` from false to true, the bar
cannot appear until the rebuild lands, because there is no element for the fetch to fill.
Workers Builds deploys on the CMS commit, so that window is about a minute.

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
- **EliseAI is domain-locked, like Buhl's Adobe Fonts kit.** The widget resolves which
  property it belongs to by calling
  `app.meetelise.com/platformApi/webchat/microsite_slug?uri=<the page URL>`. On any
  hostname EliseAI has not registered — localhost, and equally a `*.pages.dev` preview
  or a staging domain — that lookup is refused (surfacing as a CORS error), `window.eliseAi`
  is left an empty object, and every `[eliseai]` button silently no-ops because the
  export's own handlers are guarded with `typeof window.eliseAi.onOpenSST === 'function'`.
  The chat bubble never renders either: `<me-chat>` mounts with a shadow root and stays
  0x0.
  Consequence for cutover: **the chat cannot be tested anywhere except
  www.thepitchstp.com** unless EliseAI whitelists the test hostname first. Confirmed by
  comparing the two: live exposes `onOpenSST, onOpenChat, onOpenCallUsWindow,
  onOpenEmailUsWindow`; localhost exposes none. Both carry the same 3 buttons in markup,
  so an empty `eliseAi` is an environment symptom, never a markup regression.
  It also means local element counts run ~10 short of production.
- `terms-conditions` and `404` now also load `promo-content.js` / `promo-bar.js`, which
  the old export didn't ship there. Both return early when `.promo-bar` is absent, so
  they're inert; the alternative was two more props for no behavioural gain.

## Deploy

Cloudflare **Worker** named `thepitch` (not a Pages project — `wrangler pages project
list` does not show it, which is what made this hard to find). Workers Builds is
connected to this repo through the "Cloudflare Workers and Pages" GitHub App, so every
push to `main` builds and deploys. Confirmed: the Pages CMS commit `a803177` carries a
`Workers Builds: thepitch` check run with conclusion `success`, so **a promo edit by the
client already deploys itself** — no manual step.

`wrangler.jsonc` now pins the parts that belong in the repo: the assets directory
(`dist.nosync`) and `html_handling: drop-trailing-slash`, which reproduces the live URL
shape — `/amenities` 200, `/amenities.html` and `/amenities/` both 307 to it. That was
measured against production, not assumed. Changing it moves every URL on the site.

**One dashboard setting still has to change before merging this branch:** the Worker's
Build command must become

```
npm ci && npm run build
```

Until then the build has no `dist.nosync` to upload. That fails the Workers Build rather
than publishing an empty site, so the live site should stay on its last good deployment
— but it would silently stop updating, so set it first.

Watch on the first deploy: the custom domain `thepitchstp.com` is attached to the Worker
in the dashboard. Custom domains are managed separately from `routes` and should survive
a `wrangler deploy` that does not declare any, but this has not been exercised here —
check the domain still resolves right after the first build.
