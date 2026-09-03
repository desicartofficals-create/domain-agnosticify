# DesiCart Redesign + Admin Controls

A full storefront redesign in the style of the reference screenshots, with every new
element controllable from the Admin Panel. No new frameworks, no infra/deployment
changes — same Vite + TanStack + Cloud stack that already deploys to Hostinger.

## 1. Data model (new tables + columns)

New tables, all admin-editable and publicly readable:

- `site_settings` — single row of key/value config: ribbon text, ribbon colors,
  ribbon countdown end time, product-page urgency text ("X+ people viewed this"),
  sale-timer duration, and social links (Facebook, X, Instagram, Pinterest,
  YouTube, TikTok, LinkedIn, Snapchat).
- `hero_slides` — manually curated slider entries: image, title, subtitle, badge,
  link (product slug or URL), sort order, active flag. The hero will render only
  these rows, never auto-populated products.

New columns on `products`:

- `section` — which homepage row it belongs to: Best Sellers / Best Offers /
  Just Launched (a product can sit in more than one via a text array).
- `discount_percent` — for the "71% OFF" tag (auto-computed from old/new price
  when left blank).
- `views_count` — backs the social-proof line.

Category → product linking uses a `category_slug` column on `products` so a
category icon opens a real category page.

## 2. Storefront

**Announcement ribbon** — marquee bar above the nav, CSS-only animation, text /
colors / countdown all read from `site_settings`.

**Hero slider** — curated slides only. Dominant color is extracted from the
active slide image in-browser (tiny canvas sample, no library) and drives the
background gradient with a smooth CSS transition. Falls back to the theme
gradient if extraction fails.

**Category icons** — circular icons row with the pop-in hover scale effect;
clicking one opens `/category/$slug` listing that category's products.

**Homepage rows** — "Best Sellers", "Best Offers", "Just Launched", each a
horizontal scroll row with a "View all" link to `/collection/$section`.

**Product card** — matches the reference: discount badge top-right, color
swatches, real star rating averaged from the `reviews` table, crossed-out old
price + new price, solid black "Buy Now".

**Product detail page** — green urgency banner with "% OFF" + countdown, social
proof line, and a gallery where the main image swaps instantly on thumbnail
hover/click (no lightbox, no popup).

**Footer** — minimal quick-links / support / policy columns plus the social icon
grid, each icon using the URL stored in `site_settings`.

## 3. Performance & search

- Remove the loading overlays/spinners on product navigation; product data is
  prefetched on link hover so transitions are instant, with the previously
  loaded product rendered immediately when available.
- Images get explicit dimensions, lazy loading below the fold, and eager/high
  priority only for the first hero slide.
- Animations stay pure CSS transforms/opacity.
- Search bar becomes a real instant search: a debounced query over product name,
  tagline, and category with a dropdown of results, keyboard-navigable.

## 4. Admin Panel

New panels added to the existing admin tabs:

- **Ribbon & Urgency** — ribbon text, background/text color, countdown end,
  product-page timer duration and social-proof text.
- **Hero Slides** — add/remove/reorder slides, upload image, pick linked product.
- **Categories** — existing panel extended so each category can be linked to a
  set of products.
- **Sections** — assign each product to Best Sellers / Best Offers / Just Launched
  and set its discount percent.
- **Social Links** — edit the eight social URLs.

## Technical notes

- Migrations create the tables with GRANTs, RLS, public SELECT policies and
  admin-only write policies via the existing `has_role` setup.
- No changes to `vite.config.ts`, `app.js`, build output, or pixel components.
