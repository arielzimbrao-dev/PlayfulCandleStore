# Playful Candles — Design System (Tokens v1)

The contract for `styles/abstracts/`. Groovy 70s-revival bubblegum: fun, ludic, bubbly — but shoppable and legible. Brand heroes are bubblegum **pink** + tangerine **orange** on a blush-white ground, with a **grape** third for the liquid-blob motif. Body copy is a warm plum-black ink so nothing important ever rides on low-contrast candy colors.

Existing `_variables.scss` already commits `#ff5ca6 / #f88e2f / #1A1A1A / #FAFAFA / #e0e0e0` — this spec preserves those heroes and adds the AA-safe text shades + support ramp around them.

---

## 1. Color

All contrast ratios verified against WCAG AA (body ≥4.5:1, large ≥3:1).

### Brand — fills & accents (NOT for body text on white)
| Token | Hex | Use |
|---|---|---|
| `--pink` | `#ff5ca6` | Hero brand #1. Button fills, blobs, tags, "Playful" wordmark. |
| `--orange` | `#f88e2f` | Hero brand #2. Blobs, accents, "Candles" wordmark, marquee. |
| `--grape` | `#7c2fb0` | Third blob color; also AA as text (7.3:1). Purple accents, links. |
| `--grape-bright` | `#a24bd6` | Blob/gradient fill only (decorative). |
| `--teal` | `#2bb6a3` | Support blob/tile fill only (70s groovy accent). Never text on white. |
| `--lemon` | `#ffd24c` | Support blob/star/badge fill only. Never text on white. |

### Ink — text (AA-safe)
| Token | Hex | On | Ratio | Use |
|---|---|---|---|---|
| `--ink` | `#2a1b24` | blush/white | 15.6 | Body copy, headings. Warm plum-black, not pure black. |
| `--ink-soft` | `#63505b` | blush/white | 7.1 | Secondary text, captions, meta. |
| `--pink-deep` | `#c01e63` | white | 5.8 | Pink used AS text/links, price sale color. |
| `--orange-deep` | `#b8560f` | white | 4.8 | Orange used AS text (rare — labels). |
| `--on-brand` | `#2a1b24` | pink `#ff5ca6` (5.7), orange (7.0) | — | Text/icon color that sits ON a bright brand fill. |
| `--on-deep` | `#ffffff` | grape/pink-deep (5.8+) | — | White text on deep/saturated fills. |

### Surface & structure
| Token | Hex | Use |
|---|---|---|
| `--bg` | `#fff7fb` | Body ground. Blush white (tinted toward pink hue, NOT beige). |
| `--surface` | `#ffffff` | Cards, header, inputs. |
| `--surface-sink` | `#fff0f6` | Alt section band, tile bases. |
| `--line` | `#f4d9e6` | Soft pink hairline borders (decorative). |
| `--line-strong` | `#e9c2d4` | Interactive borders (outline buttons, inputs). |

### State
`--sale` = `--pink-deep`; `--success` = `#1f8f6b`; `--sold-out` uses `--ink-soft` on `--surface-sink`.

**Rule:** brand pink/orange are FILLS. The moment a color becomes readable text on white, switch to its `-deep` ink. Never body copy in `--pink`/`--orange`.

---

## 2. Typography

Google Fonts, both rounded but contrasting on role/weight (chunky display vs. humanist text) — not two lookalike geometrics.

| Token | Stack | Role |
|---|---|---|
| `--font-display` | `'Genty', 'Fredoka', 'Baloo 2', system-ui, sans-serif` | Headings, buttons, prices, card names. **Genty** is the brand identity face (self-hosted at `design/fonts/Genty.otf`; falls back to Fredoka until loaded). |
| `--font-body` | `'Nunito', system-ui, -apple-system, 'Segoe UI', sans-serif` | Body, nav, labels, inputs. Weights 400/600/700/800. |

> **Genty licensing:** the supplied file is *GentyDemo (personal-use)*. A **commercial license** must be secured before launch. Convert to `.woff2` for production (smaller payload).

**Fluid scale** (`clamp`, ratio ≈1.25, display max ≤6rem per craft ceiling):
| Token | clamp | Use |
|---|---|---|
| `--fs-hero` | `clamp(2.6rem, 7vw, 5rem)` | h1 hero. |
| `--fs-h2` | `clamp(1.9rem, 4vw, 3rem)` | Section headings. |
| `--fs-h3` | `clamp(1.25rem, 2vw, 1.6rem)` | Card/subsection. |
| `--fs-lead` | `clamp(1.05rem, 1.6vw, 1.3rem)` | Hero subcopy. |
| `--fs-body` | `1rem` (16px) | Body. Line-height 1.6, max 68ch. |
| `--fs-sm` | `0.875rem` | Meta, tags. |
| `--fs-xs` | `0.75rem` | Badges. |

Display letter-spacing `-0.02em` (floor −0.04em respected). `text-wrap: balance` on h1–h3; `pretty` on prose.

---

## 3. Spacing (4px base)
`--sp-1:4px · --sp-2:8px · --sp-3:12px · --sp-4:16px · --sp-5:24px · --sp-6:32px · --sp-7:48px · --sp-8:64px · --sp-9:96px · --sp-10:128px`.
Section vertical rhythm: `clamp(3.5rem, 8vw, 7rem)`. Content max-width `--wrap: 1200px`; gutter `clamp(1rem, 4vw, 2.5rem)`.

## 4. Radii (generous — the brand is round)
`--r-sm:10px · --r-md:16px · --r-lg:24px · --r-xl:32px · --r-2xl:44px · --r-pill:999px · --r-blob:42% 58% 63% 37% / 41% 44% 56% 59%` (organic liquid-blob shape).
Buttons & inputs = pill. Cards = `--r-xl`. Tiles = `--r-2xl`.

## 5. Shadows (soft, brand-tinted — no harsh gray)
| Token | Value | Use |
|---|---|---|
| `--sh-sm` | `0 2px 8px -2px rgba(42,27,36,.12)` | Resting cards. |
| `--sh-md` | `0 14px 30px -14px rgba(255,92,166,.45)` | Raised / hover, pink glow. |
| `--sh-lg` | `0 26px 60px -22px rgba(248,142,47,.5)` | Hero candle, key CTA. |
| `--sh-focus` | `0 0 0 3px var(--bg), 0 0 0 6px var(--pink-deep)` | Focus ring. |

## 6. Motion
Easing `--ease: cubic-bezier(.22,1,.36,1)` (ease-out-quart, no bounce). Durations `--t-fast:150ms · --t:280ms · --t-slow:600ms`. Blobs float 12–18s ease-in-out infinite; USP marquee 30s linear; hover lift `translateY(-4px)` + `--sh-md`. **All wrapped in `@media (prefers-reduced-motion: reduce)` → transitions ~1ms, marquee & float paused.**

## 7. Z-index scale
`--z-base:1 · --z-blob:0 · --z-sticky:100 · --z-header:200 · --z-menu:300 · --z-toast:400`.

---

## 8. Component notes

**Buttons** (min touch 44×44, pill, `--font-display` 600):
- *Primary* — `--pink` fill, `--on-brand` (ink) text. Hover: lift + `--sh-md`.
- *Secondary/outline* — transparent, 2px `--pink-deep` border, `--pink-deep` text. Hover: fill `--surface-sink`.
- *Ghost/icon* — 44px circle, `--ink` glyph; hover `--surface-sink`.

**Announcement bar** — pink→orange gradient band, `--on-brand` ink text (AA 5.7+), centered, rotating messages (CSS translateY cycle). Lead: portes grátis + entrega 24/72h.

**Product card** — `--surface`, `--r-xl`, `--sh-sm`. Anatomy: gradient/blob thumb (4:5 real-photo ratio later) → **type-label tag** (pill, tinted) → product name (`--font-display`) → star rating (`--lemon` stars + count) → price row (regular; sale = `--pink-deep` price + struck original + `−%` badge) → "Escolher" affordance. States: default, **SALE** (badge + strike), **Esgotado** (desaturated thumb, disabled button, badge). Lives in a scroll-snap carousel inside `overflow-x:auto`.

**Badge/tag** — pill, `--fs-xs`, `--font-body` 800. Type tag: tinted bg (pink/orange/grape @ ~14%) + matching `-deep` text. Sale badge: `--pink-deep` fill + white. Esgotado: `--ink-soft` on `--surface-sink`.

**Category tile** — `--r-2xl`, colored gradient wash + blob, playful one-liner + "Explorar →". Hover: blob drifts + lift.

**USP marquee** — full-bleed pink band, duplicated track, `--on-brand`/white pills separated by ✦, seamless loop in `overflow:hidden`.

**Inputs** — pill, `--surface`, 2px `--line-strong` border, `--ink` text, placeholder `--ink-soft` (AA). Focus: `--sh-focus`.

**Wavy dividers** — inline SVG `<path>` liquid waves between sections, filled with the adjacent band color; the recurring blob/liquid motif that carries the groovy voice.

---

## 9. Iconography — FontAwesome

All UI glyphs use **FontAwesome 6** (search, account, cart/bag, bell, chevrons, arrows, truck, leaf, heart, gem, gift, category icons, social/payment brands). The mockup loads the FA **JS/SVG** build from cdnjs (the only artifact-CSP-allowed route). **Production (Next.js):** use `@fortawesome/fontawesome-svg-core` + React components (tree-shaken, no layout shift), or the self-hosted CSS+webfont build. Keep brand illustration (candle jar, mood emoji) as-is — free FA has no candle glyph.

## 10. Logo
Header + footer use the raster wordmark `public/images/logo.png` (1615×341). Referenced in the mockup as a published asset; in the app it's `/images/logo.png` via `next/image` (set `priority` on the header instance). Footer sits it on a white pill for contrast on the dark band.

## 11. Carousels (arrows + dots)
Two patterns, both with prev/next **arrows** and **dots**, driven by ~70 lines of dependency-free vanilla JS:
- **Hero** — full-viewport (`100dvh − announce − header`) media carousel; each slide is an `<img>`/`<video>` (mockup uses gradient placeholders) under a readability scrim with overlaid copy + CTA. Transform-based track, 6s autoplay, pauses on hover/focus, respects `prefers-reduced-motion`, dots as tablist.
- **Product row** — native `overflow-x` scroll-snap lane; arrows `scrollBy` one card, dots = pages, active syncs on scroll, arrows disable at the ends.
- Controls: `.car-arrow` (48px pill, white/ink), `.car-dots .dot` (10px → 26px pill when active).
