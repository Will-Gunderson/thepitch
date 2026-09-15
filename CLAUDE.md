# The Pitch

Marketing site for The Pitch Apartments, 427 Snelling Ave N, St. Paul. Leasing is
Yellow Tree; tours and chat run through EliseAI.

- **Live URL:** https://www.thepitchstp.com
- **Stack:** Astro 5, static output, from a Webflow export
- **Status:** the Astro conversion is on `main`, pushed, and live — the Workers Build on
  `c2f59ac` succeeded, so the dashboard build command is already right. (An earlier note
  here said this sat unmerged on an `astro-conversion` branch; that was wrong.) A
  performance + SEO pass has since landed on top — see *Performance* and *SEO* below.

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
public/_headers       browser cache policy — see Performance
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

## Performance

The homepage was **14.0 MB over 58 requests** measured against production; it is now
about **2.5 MB** on first paint. What got it there, and what not to undo:

- **Images must carry `srcset`.** Three slider cards were requesting 2.2–3.0 MB
  originals to render at 400×259 — the `-p-500/800/1080` variants were already in the
  repo, unused. `sizes="(max-width: 479px) 87vw, 400px"` is measured, not guessed: the
  card is 87vw on a phone and pinned at 400px above ~460px wide.
- **`img { height: auto }` in thepitch.css is load-bearing.** `components.css` sets
  `max-width: 100%` but never `height: auto`, so an HTML `height` attribute applies
  literally — adding width/height for CLS protection stretched a card to 400×1621 until
  this rule went in. Don't remove it while any img has width/height.
- **`public/_headers` carries the cache policy.** Without it Workers Assets serves
  everything `max-age=0, must-revalidate`, so every navigation re-validates ~40 files.
  TTLs are deliberately uneven because **none of these filenames are content-hashed**:
  a year on `/fonts/*` (font bytes never change under a name), a week on images/video,
  five minutes plus `stale-while-revalidate` on css/js because those do change on
  redeploy. If css/js ever move into Astro's bundling and get hashed names, raise them.
  `/content/promo.json` is pinned to no-cache on purpose — the promo fetch depends on it.
- **Fonts are woff2 only.** The export shipped seven `.otf` plus one `.woff` (422 KB);
  the same faces are 176 KB as woff2. Every face is `font-display: swap` — Optician Sans
  was `auto`, which Chrome treats as `block`, blanking display headings for up to 3s.
  The eight `@font-face` blocks were also duplicated verbatim in the file; one set now.
- **The hero video is re-encoded, not just re-pointed.** 3.0 MB → 1.35 MB (h264 CRF 28,
  SSIM 0.98 against the original). The VP9 webm came out *larger* than the h264, so
  there is one mp4 source and no webm. It has a real `poster` attribute now; the export
  set the poster as an inline `background-image`, invisible to the preload scanner.
  Don't add `preload="none"` — `autoplay` overrides it, and the re-encode was the fix.
- **jQuery is self-hosted** at `/js/jquery-3.5.1.min.js`, byte-identical to Webflow's
  CloudFront copy (verified against the integrity hash the export shipped). One fewer
  origin handshake, and it inherits the `_headers` TTL.
- **The YouTube embed and the promo image are lazy.** The iframe had no `loading` at all.

## Sliders have one fixed slide height

Slide height used to follow its contents, so advancing a slider moved the card's bottom
edge. Three causes, all fixed in thepitch.css:

- **Every slide photo is boxed at 3:2 and cropped to fill** (`aspect-ratio` +
  `object-fit: cover`). The library runs 1.489–1.555 except Pitch_010v2 at 1.888, so the
  crop is a few percent on all but that one. **These selectors are scoped to `.w-slide`
  deliberately** — the amenities lightbox includes a portrait image (Pitch_009,
  801×1200) that must keep its own shape. Don't widen them.
- **Where copy drives height, lines are reserved rather than truncated**: three lines for
  `.slide-caption .small-text`, two for `.slider .text-block-10`, and a floor on
  `.card-body`. Each is keyed to that element's own line-height — keep them in step if
  the type changes. Only needed below 768px for the first two, because `.slide-caption`
  and `.slider-overlay-box` both drop out of absolute positioning there.
- Four walkthrough links in `floor-plans.html` were missing the `.lightbox-link` class
  the other nine carry (it is `padding-bottom: 15px`), which made two of the four unit
  sliders 15px shorter. All 13 now match.

Verified spread 0 on all nine sliders at 320/375/414/600/700/767/768/900/1181/1440px,
and the sliders now match each other too. If you change slider imagery or captions,
re-measure: `[...document.querySelectorAll('.slider')].map(s=>{const h=[...s.querySelectorAll('.w-slide')].map(x=>Math.round(x.getBoundingClientRect().height));return Math.max(...h)-Math.min(...h)})`
should be all zeros.
- **The EliseAI chat bundle loads after the page, not with it.** It is ~1 MB and used to
  be a static `import`, starting at ~90 ms and competing with the hero video and LCP
  image; it now loads on the first of any user interaction, the `load` event, or a 2.5 s
  fallback (measured on production: it now starts at 363 ms, exactly `loadEventEnd`).
  The `[eliseai]` buttons are wired **before** the bundle arrives and a click that lands
  early is queued and replayed — don't "simplify" that back into wiring-after-import,
  which silently dropped such clicks. Verified on production that the Schedule-a-Tour
  modal still opens; note it renders into a shadow root and adds no new body nodes, so
  a DOM-diff probe will wrongly report nothing happened. Screenshot instead.

## Why the Webflow runtime is still here

`thepitch.js` (263 KB) + jQuery (89 KB) is ~89 KB brotli, and it is the last big JS on
the page — but it is not low-hanging fruit, and two things rule out the easy options:

- **Minifying is pointless.** It is already minified; the bulk is the IX2 interaction
  payload, not code. Measured: brotli 58,707 → 58,638 bytes, 0.1%.
- **It drives five separate subsystems**: 9 sliders, 32 lightboxes (including 13
  Matterport walkthrough embeds), the responsive nav, the background video, and **65 IX2
  interactions with 235 actions** — 66 of them opacity animations and 9 scroll-into-view
  triggers. Sections like `.section-contents` sit at `opacity: 0` until IX2 reveals them,
  so dropping the runtime without replacing those animations leaves content invisible.

So removing it is a rewrite of the interaction layer on a live leasing site, for ~89 KB.
Scope it deliberately if it is ever worth doing; it is not an incremental tweak.

## SEO

- **`Base.astro` owns canonical, og: and twitter: for every page.** They previously
  rendered only on the homepage via index.astro's head slot, so interior pages shared as
  a bare URL, and the `summary_large_image` card had no image. Only the Search Console
  verification token is still homepage-only.
- **Titles and descriptions are unique per page.** Home and amenities used to share the
  identical title; six pages shared the description "Studios, 1-Bed, 2-Beds"; the
  homepage advertised "Opening this September 2021" in its description and og: tags.
- **`@astrojs/sitemap` emits `sitemap-index.xml`**, filtering out `/404`. Webflow used
  to generate a sitemap and the migration dropped it, so `/sitemap.xml` had been 404ing.
  **The live `robots.txt` is Cloudflare-managed, not served from this repo, and carries
  no `Sitemap:` line** — so the sitemap has to be submitted in Search Console directly.
- **Every page has exactly one h1.** amenities, floor-plans, contact and neighborhood had
  none (amenities started at h4; contact and neighborhood had no heading at all), while
  home had five and gallery three. The four missing ones are `.sr-only` — their comps
  carry no visible page title, so the heading exists for crawlers and screen readers
  without touching the design. Swapping heading levels is visually safe here because
  `.display-heading` / `.large-heading` / `.medium-heading` each override font-size,
  weight, line-height and margin-bottom, and thepitch.css sets `margin-top: 0` on h1–h4
  alike. `thepitch.js` only ever selects those classes, never a tag-qualified form.
- **One phone number.** The export had four, two of them crossed: the navbar showed
  (651) 412-7725 while dialling +1 877 660 3959, and a second link showed (877) 660-3959
  while dialling +1 651 447 4150. `PHONE_DISPLAY` / `PHONE_HREF` in Base.astro are the
  single source. **Will confirmed on Sep 15, 2026 that (877) 660-3959 is the correct
  number**, so the three (651) variants in the export were stale, not call-tracking
  lines. Change it in Base.astro only — nothing else should hardcode a phone number.
- **JSON-LD `ApartmentComplex`** in Base.astro, built only from what the footer already
  states. Geo coordinates and Saturday's "by appointment only" are deliberately omitted
  rather than invented — add coordinates only from a real source.

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
- **The GTM container loader is easy to lose.** The conversion dropped the `GTM-TQT627Q`
  bootstrap from `<head>` but kept its `<noscript>` iframe at the end of `<body>`, so
  the container stopped loading for every JS-enabled visitor while still *looking*
  installed in the page source. It's restored in Base.astro. That container loads a
  Meta Pixel — ~743 KB — which is why the page got heavier once it worked again.
  `GTM-5MW9Q9P` has only ever had a noscript iframe here; it's presumably fired as a
  nested tag from TQT627Q. If you audit tags, check that assumption before deleting it.
- **`floor-plans` renders its plan cards behind a third-party widget**
  (`sightmap.com/embed/...`) and, like EliseAI, it doesn't resolve on localhost — the
  page shows a spinner and all 13 plan images measure 0×0. On production all 13 are
  visible. Don't read a local spinner as a regression.
- **The amenities lightbox used to load 10 images from Webflow's CDN**
  (`cdn.prod.website-files.com`) — they were never downloaded during the migration, so
  cancelling the Webflow subscription would have broken them. They're local now, and
  `website-files.com` appears nowhere in the repo. Keep it that way.
- **iCloud conflict copies can reach the deploy.** Editing tracked files in this vault
  produced `launch 2.json` and a second copy of the hero video mid-session. `.gitignore`
  now excludes `* [0-9].*`, because Workers Builds uploads the whole output folder.

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

The Worker's Build command must run `npm ci && npm run build` so there is a
`dist.nosync` to upload. **This is already set** — the Workers Build on `c2f59ac`
completed with conclusion `success` and the live site serves the Astro output (the
Webflow "Last Published" comment is gone from production HTML). If a build ever fails
it uploads nothing rather than publishing an empty site, so the site holds its last
good deployment — which also means it can silently stop updating. Check the check run,
not just the live page.

Watch on the first deploy: the custom domain `thepitchstp.com` is attached to the Worker
in the dashboard. Custom domains are managed separately from `routes` and should survive
a `wrangler deploy` that does not declare any, but this has not been exercised here —
check the domain still resolves right after the first build.
