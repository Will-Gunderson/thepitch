# The Pitch — upgrade backlog

Written Sep 15, 2026, after the performance + SEO pass. Numbers here were measured, not
estimated; where something turned out not to be worth doing, that's recorded too so it
doesn't get re-proposed. Background for any of it is in `CLAUDE.md`.

---

## Needs you, not me

### 1. Submit the sitemap in Google Search Console

**Not an upload — you paste one path.** (It's Search *Console*, the SEO tool, not Google
Cloud Console.)

1. Go to [search.google.com/search-console](https://search.google.com/search-console)
2. Pick the `thepitchstp.com` property — it should already be verified, since the
   homepage still carries the verification token `W6kf_OST5fcmGQV6oZpcya0g0Ts1AjUc8nv4ndMG480`
3. **Sitemaps** in the left sidebar
4. Enter `sitemap-index.xml` and Submit

While you're in there:

- **Check for an old Webflow sitemap** in that same list. Webflow generated one
  automatically; if `sitemap.xml` is still submitted it has been returning 404 since the
  migration. Remove it.
- **Request indexing** for `/floor-plans` and `/amenities` specifically. Both changed
  substantially — new titles, descriptions, canonical tags, and floor-plans gained the
  13 unit-amenity badges it never had.

Why it can't be automated: the live `robots.txt` is **Cloudflare-managed, not served from
this repo**, and it carries no `Sitemap:` line — so Google has no way to discover the
sitemap on its own. Submitting it by hand is the fix. (The alternative is overriding
Cloudflare's managed robots.txt, which costs the AI-crawler rules it currently applies.
Not worth it for one line.)

Optional: same sitemap into [Bing Webmaster Tools](https://www.bing.com/webmasters),
which also feeds DuckDuckGo.

### 2. The promo bar is advertising an expired offer — live, right now

`content/promo.json` currently reads:

> "Sweet summer savings", "Hot days. Cool savings.", "…receive a $500 rent credit when
> you move in by **August 15th**!"

It's Sep 15, 2026. That's a month past the deadline, on the most prominent element of
every page. Nothing technical to fix — this is the client-editable bar, so Yellow Tree
(or you) updates it at
[app.pagescms.org/will-gunderson/thepitch](https://app.pagescms.org/will-gunderson/thepitch/main/file/promo),
the **Admin** link in the footer. It deploys itself on save.

Worth raising as a process question: nobody noticed for a month. A calendar reminder tied
to each concession's end date would catch it.

### 3. Decide whether the Meta Pixel stays

Restoring the broken GTM container brought back **743 KB** of `fbevents.js` plus its
config — now the third-largest thing on the homepage. It's real tracking you'd been
silently losing since the Astro conversion, but it's worth confirming with whoever runs
the ad spend that those tags are still wanted. If the Meta campaigns are over, removing
the tag from GTM is free performance.

---

## Worth doing, and I can do it

### 4. Alt text on photography — ~38 images

102 of the 140 empty `alt` attributes are icons and squiggles and are correctly empty.
**38 are real photography**, including every floor plan drawing on `/floor-plans`
(`STUDIO-B`, `ALCOVE-B`…`G`, `1BR-*`, `2BR-*`). Those are the highest-value ones: a plan
drawing with `alt="Studio-B floor plan, 408 square feet, available with balcony"` is
useful to a screen reader *and* to image search, and the square footage is already
sitting right next to it in the markup. Half a day, no risk.

### 5. Fingerprint the CSS and JS, then cache them for a year

`/css/*` and `/js/*` are stuck on a 5-minute TTL purely because the filenames aren't
content-hashed — so a returning visitor re-validates them on every navigation, and a
deploy takes up to 5 minutes to reach anyone. Moving them into Astro's bundling gets
hashed names, which allows `immutable` for a year, same as the fonts.

Care needed: `thepitch.js` is loaded by Webflow's runtime expectations and `promo-bar.js`
/ `promo-content.js` are referenced by path. Not hard, but it touches the loading order
that took work to get right.

### 6. Purge unused Webflow CSS

`thepitch.css` is 111 KB raw / ~18 KB brotli and carries rules for a lot of Webflow
components this site never uses. A purge pass against the eight built pages would cut it
meaningfully. **Do this carefully** — the sliders, lightboxes and IX2 animations apply
classes at runtime, so a naive purge will strip classes that only ever appear from
JavaScript. Needs a safelist and a careful visual diff.

### 7. Give `/neighborhood` some actual content

The page is an Elfsight map embed plus a "Make The Pitch Your New Home" CTA, and that's
all. Its `h1` is currently `.sr-only` because the design has no visible page title. It
has essentially nothing for Google to rank on, despite "Midway apartments St. Paul" being
exactly the query it should own. This is a copywriting job more than a code one — walk
score, Allianz Field, the Green Line and A Line connections, nearby food. The transit
detail is already written on `/amenities` and could be reused.

### 8. Per-page `og:image`

Every page currently shares one default share image (the exterior shot). Giving
`/amenities`, `/gallery` and `/floor-plans` their own would make shared links look
deliberate. The `ogImage` prop already exists in `Base.astro` — it's one line per page.

---

## Bigger projects — scope deliberately

### 9. Replace the Webflow runtime

~89 KB brotli (`thepitch.js` 58.7 KB + jQuery 30.6 KB), the last significant JS on the
site. **Not incremental work**, and two findings rule out the easy paths:

- Minifying gains nothing — it's already minified. Brotli 58,707 → 58,638 bytes, 0.1%.
  The bulk is the IX2 interaction payload, not code.
- It drives five subsystems: 9 sliders, 32 lightboxes (13 of them Matterport walkthrough
  embeds), the responsive nav, the background video, and **65 IX2 interactions with 235
  actions** — 66 opacity animations and 9 scroll triggers. Sections like
  `.section-contents` sit at `opacity: 0` until IX2 reveals them, so dropping the runtime
  without rebuilding those animations leaves content invisible.

A rewrite of the interaction layer on a live leasing site, for 89 KB, against the 11.5 MB
already recovered. Only worth it bundled with a redesign.

### 10. Astro 5 → 7

`npm audit` flags `sharp` (libvips + libheif advisories) via Astro's image tooling. It's
a **build-time dependency — visitors are not exposed** — so this is housekeeping, not
urgent. The fix is a major version bump, so it wants its own session and a full visual
pass.

### 11. Third-party dependencies worth a look

None are broken; all are single points of failure worth knowing about:

- **EliseAI** — chat, tours, the contact buttons. Domain-locked, so it cannot be tested
  anywhere but `www.thepitchstp.com`. That makes preview deploys blind for the entire
  lead-capture path.
- **SightMap** (`sightmap.com/embed/yjp20e7zwxl`) — renders the whole availability grid
  on `/floor-plans`. Also doesn't resolve on localhost.
- **Matterport** — 13 walkthrough links on `/floor-plans`.
- **Elfsight** — the `/neighborhood` map. Usually a paid subscription; worth confirming
  who owns the account, same question as Buhl's Adobe Fonts kit.
- **Nestio** — the `/contact` lead form, separate from EliseAI. Two lead-capture vendors
  on one site is worth a question.

---

## Looked at, not worth doing

Recorded so these don't come back as suggestions:

- **Pruning unused images.** Only 18 of 134 are unreferenced, totalling 0.9 MB, and
  563 KB of that is one file. The 46 MB deploy is almost entirely responsive variants
  that *are* referenced via `srcset`. No visitor-facing gain.
- **Minifying `thepitch.js`.** 0.1%. See item 9.
- **A VP9/webm hero video.** The VP9 encode came out *larger* than the h264 (2.08 MB vs
  1.35 MB), and the export's original VP8 was larger still. One mp4 source is both
  smaller and universal.
- **Combining the three CSS files.** They're 31 KB brotli combined and all three are
  already in the initial HTTP/2 response's critical path; merging saves no round trip
  worth the loss of separation.
