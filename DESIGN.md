# Draftroom Design System

> **Read this before creating or changing any UI.** Every screen, component and animation follows these rules.
> If something isn't covered here, choose the option that is calmer, more consistent, and causes zero layout shift.

**Design idea:** "Sage & Lime." A calm, premium workspace. Soft sage background, white rounded cards, black pill
buttons, one lime accent used sparingly. The writing surface stays quiet; the chrome around it feels crafted.

---

## 1. Tokens (single source of truth)

Put these in `src/app/globals.css`. Never hard-code a hex value, radius, shadow, duration or easing in a component -
always use a token. (Tailwind v4 `@theme` syntax; if the project is on Tailwind v3, mirror these in `tailwind.config.ts`.)

```css
@import "tailwindcss";

@theme {
  /* Colors */
  --color-bg: #E9ECE6;            /* app background (sage) */
  --color-surface: #FFFFFF;       /* cards, editor page, dialogs */
  --color-surface-muted: #F3F5F0; /* hover, secondary pills, inputs */
  --color-border: #DCE0D7;        /* hairlines only */
  --color-ink: #0F110E;           /* text, primary buttons, toolbar */
  --color-ink-soft: #2A2E28;      /* hover state of ink surfaces */
  --color-ink-muted: #6A7066;     /* secondary text, timestamps */
  --color-lime: #D4F36B;          /* accent BACKGROUNDS only, with ink text */
  --color-lime-strong: #B8E635;   /* glows / active rings on dark */
  --color-orange: #FF6A1A;        /* placeholder warnings */
  --color-orange-soft: #FFF1E8;
  --color-danger: #E5484D;
  --color-danger-soft: #FDECEC;
  --color-dark-bg: #0B0F0A;       /* sign-in screen */

  /* Typography */
  --font-sans: var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-geist-mono), ui-monospace, monospace;

  /* Radius */
  --radius-card: 24px;
  --radius-panel: 16px;
  --radius-control: 12px;
  /* pills use rounded-full */

  /* Shadows: only floating elements get a shadow */
  --shadow-card: 0 1px 2px rgb(15 17 14 / 0.04);
  --shadow-float: 0 8px 24px -8px rgb(15 17 14 / 0.18), 0 2px 6px rgb(15 17 14 / 0.06);
  --shadow-dialog: 0 24px 64px -16px rgb(15 17 14 / 0.28);
  --shadow-focus: 0 0 0 3px rgb(212 243 107 / 0.9), 0 0 0 5px rgb(15 17 14 / 0.9);

  /* Motion */
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);      /* default: entering, hover */
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);   /* moving between states */
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1); /* tiny pops only (avatars, badges) */
}

:root {
  --dur-instant: 100ms; /* press feedback */
  --dur-fast: 160ms;    /* hover, color, small toggles */
  --dur-base: 220ms;    /* dialogs, dropdowns, toasts */
  --dur-slow: 360ms;    /* page/content enter, sign-in glow */
}

html { scrollbar-gutter: stable; }               /* no shift when scrollbars appear */
body { background: var(--color-bg); color: var(--color-ink); -webkit-font-smoothing: antialiased; }
:focus-visible { outline: none; box-shadow: var(--shadow-focus); }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 1ms !important;
  }
}
```

**Color rules**
- Lime is **never text on white** (unreadable). It is a background with ink text, or a glow on dark.
- One lime element per region at most. If everything is accented, nothing is.
- Orange means "needs attention before sharing." Don't use it for anything else.
- Danger red only for destructive actions and errors.

---

## 2. Typography

| Role | Class | Notes |
|---|---|---|
| Display (sign-in headline) | `text-5xl md:text-6xl font-medium tracking-tight leading-[1.05]` | |
| Page title / greeting | `text-3xl font-medium tracking-tight` | |
| Card title | `text-base font-medium` | truncate to 1 line |
| Body / UI | `text-sm` | |
| Meta (timestamps, counts) | `text-xs text-ink-muted tabular-nums` | `tabular-nums` so numbers never jitter |
| Editor body | `text-[16px] leading-[1.7]` | max width ~68ch |
| Editor H1 / H2 / H3 | `text-3xl` / `text-2xl` / `text-xl`, `font-semibold tracking-tight` | |

- Load fonts only with `next/font` (Geist). Never a `<link>` to a font CDN. `next/font` prevents font-swap layout shift.
- Two weights in the UI: 400 and 500 (600 only for editor headings).

---

## 3. Spacing and layout

- 4px base scale. Common values: 8, 12, 16, 20, 24, 32.
- Card padding: `p-5` (small cards) / `p-6` (large cards). Gap between bento cards: `gap-4`.
- Page container: `max-w-6xl mx-auto px-6`. Editor paper: `max-w-3xl mx-auto`.
- Top bar height is fixed: `h-16`. Never let it grow with content.

---

## 4. Components

All interactive elements have **five states**: default, hover, active (pressed), focus-visible, disabled.
Loading is a sixth where an action is async.

### Buttons
| Variant | Default | Hover | Active |
|---|---|---|---|
| Primary | `bg-ink text-white rounded-full h-10 px-5` | `bg-ink-soft` | `scale-[0.97]` |
| Secondary | `bg-surface-muted text-ink rounded-full h-10 px-5` | `bg-border/60` | `scale-[0.97]` |
| Accent | `bg-lime text-ink rounded-full h-10 px-5` | `brightness-95` | `scale-[0.97]` |
| Ghost / icon | `h-9 w-9 rounded-full grid place-items-center` | `bg-surface-muted` | `scale-[0.94]` |
| Danger | `bg-danger text-white rounded-full` | `brightness-95` | `scale-[0.97]` |

- Transition: `transition-[background-color,transform,filter] duration-[var(--dur-fast)] ease-[var(--ease-out)]`.
  Press uses `--dur-instant`.
- Disabled: `opacity-40 pointer-events-none`. Never change size.
- **Loading:** keep the button's width fixed. Swap the label for a spinner *inside the same box*, using `invisible`
  on the label (not removing it) so the width doesn't change.
- Icons: lucide-react, `size-4` in buttons, `strokeWidth={1.75}`.

### Cards
- `bg-surface rounded-[var(--radius-card)] shadow-[var(--shadow-card)]`.
- Clickable cards: hover lifts with `-translate-y-0.5` and gains `--shadow-float`, over `--dur-fast`.
  Never change padding, border width or font size on hover.
- Document card contents: title (1 line, truncate), 2-line preview (`line-clamp-2`), meta row
  (relative time + avatar stack or owner + role pill). Fixed min height so the grid doesn't jump.

### Pills / badges
- `rounded-full h-6 px-2.5 text-xs font-medium inline-flex items-center gap-1.5`.
- Role pills: Editor = `bg-lime text-ink`, Viewer = `bg-surface-muted text-ink`, Owner = `bg-ink text-white`.
- **Save status pill** has a fixed width (`w-[104px]`) so "Saving…" → "Saved" → "Error" never shifts the row.
  The text cross-fades (opacity, `--dur-fast`); a small dot changes color (lime saved, ink-muted saving, danger error).

### Inputs
- `h-10 rounded-[var(--radius-control)] bg-surface-muted px-3 text-sm`, no border; focus uses `--shadow-focus`.
- Error text sits in a **reserved** line under the input (`min-h-5`) so showing an error doesn't push content down.
- Editable title: looks like plain heading text; on hover shows `bg-surface-muted` rounded background. Same font
  size in both modes so editing never reflows.

### Avatars
- Circle, fixed size (`size-8` default, `size-7` in stacks), initials on `avatarColor`, `ring-2 ring-surface`.
- Stacks overlap with `-space-x-2`; max 3 shown, then a `+N` circle of the same size.
- Presence: a lime dot (`size-2.5`, `ring-2 ring-surface`) bottom-right. New avatar enters with
  opacity 0→1 + scale 0.8→1 using `--ease-spring`, `--dur-base`. The presence container has a fixed width for
  3 avatars so arrivals/departures don't move the Share button.

### Editor toolbar
- Floating black pill: `bg-ink text-white rounded-full h-11 px-1.5 shadow-[var(--shadow-float)]`, `sticky top-20`.
- Buttons `h-8 w-8 rounded-full`; hover `bg-white/10`; **active (formatting on)** `bg-lime text-ink`.
- Groups separated by a 1px `bg-white/15` divider, `h-5`.
- Viewers: toolbar not rendered; instead a "View only" banner occupies **the same height** (`h-11`) so the paper
  starts at the same position for every role.

### Dialogs (Share, Ready-to-share check, Delete confirm)
- Use a proper dialog primitive (Radix Dialog or native `<dialog>`), portal-rendered, focus-trapped, Esc closes,
  focus returns to the trigger.
- Overlay: `bg-ink/30`, fade `--dur-base`. Panel: `bg-surface rounded-[var(--radius-card)] shadow-[var(--shadow-dialog)] p-6 w-[min(480px,92vw)]`.
- Enter: opacity 0→1, `scale(0.96)→1`, `translateY(8px)→0`, `--dur-base`, `--ease-out`. Exit: reverse, slightly faster.
- Ready-to-share dialog: orange icon chip at top, title "3 unfinished placeholders found", placeholders as
  `bg-orange-soft text-ink rounded-full` chips, actions: **Fix first** (primary) and **Share anyway** (secondary).

### Toasts
- Bottom-center, `bg-ink text-white rounded-full h-11 px-4`, slide up 8px + fade in, auto-dismiss 3s.
- One toast at a time; a new one replaces the old.

### Empty states
- Inside a card: a lucide icon in a `size-10 rounded-full bg-surface-muted` circle, one sentence, one action button.
  Same card size as filled state.

### Skeletons (loading)
- **Exactly the same dimensions** as the content they replace (same card size, same line heights).
- `bg-surface-muted` with a slow shimmer (1.6s, linear, low contrast). Swap to content with a 160ms opacity fade.

---

## 5. Screens

**/login.** `bg-dark-bg` full screen. A large soft lime radial glow (`radial-gradient` with `--color-lime-strong`
at low opacity, blurred) that drifts very slowly (20s+ loop, transform only). Headline in white:
"Draft together. Share with confidence." Three user cards (glassy: `bg-white/5 ring-1 ring-white/10`, avatar, name,
title). Hover: card brightens + lifts 2px. Click: card shows a pressed state and a spinner, then route.

**/dashboard.** Bento grid on sage. Row 1: greeting card ("Good evening, Alice", counts in `tabular-nums`),
lime "Import a file" card (accepted types `.txt · .md · .docx`, max 2 MB, also a drop zone), black "New document"
card. Then "My documents" and "Shared with me" sections, each a responsive grid of document cards.

**/documents/[id].** Sage background. Fixed top bar: back button, editable title, save-status pill, presence
avatars, Export menu, black Share pill. Below: sticky floating toolbar, then the centered white paper card
(`rounded-[var(--radius-card)] p-12 min-h-[70vh]`). The "X updated this document. Load latest" notice appears as a
slim bar above the paper that **pushes nothing**: it overlays (absolute/sticky) or occupies reserved space.

---

## 6. Motion principles

1. **Animate only `transform` and `opacity`** (plus color and shadow on hover). Never animate width, height, top,
   left, margin or padding. They cause layout recalculation and jitter.
   For expand/collapse use the `grid-template-rows: 0fr → 1fr` technique.
2. **Motion explains, it doesn't decorate.** Things enter from where they come from (dialogs rise slightly,
   toasts from the bottom, dropdowns from their trigger with `transform-origin` set to the trigger side).
3. **Short and confident.** Hover 160ms, dialogs 220ms, page content 360ms max. Nothing longer except the ambient
   login glow.
4. **Exits are faster than entrances** (about 0.75×).
5. **Respect `prefers-reduced-motion`** (handled globally in tokens; don't override it).
6. **No motion on data updates while typing.** The editor never animates while the user types; autosave status
   changes are opacity cross-fades only.
7. Use CSS transitions by default. Use `motion` (Framer Motion) only for enter/exit of dialogs, toasts and
   presence avatars, where unmount animations need it. No other animation library.

---

## 7. Zero CLS, no lag, no jitter (hard rules)

- **Reserve space for everything that appears later:** save status (fixed width), presence avatars (fixed width
  for 3), error lines (`min-h`), banners (fixed height), images and icons (explicit size).
- **Skeletons match final dimensions exactly.** No spinner-then-jump.
- **Fonts via `next/font` only.** No FOUT/FOIT shift.
- **Hover never changes layout:** no border-width, padding, font-weight or font-size changes on hover.
  Use background, shadow, opacity or transform.
- **Numbers use `tabular-nums`.**
- **`scrollbar-gutter: stable`** on `html` so opening a dialog or loading content doesn't shift the page sideways.
  Dialog scroll-lock must not remove the scrollbar width (Radix handles this; with native dialog, compensate).
- **Optimistic UI** for rename, share, role change: update immediately, roll back with a toast on error.
  No full-page reloads or refetch flicker after an action.
- **Autosave** debounced ~800ms, never blocks typing, never re-renders the editor content from the server
  response (it only updates `version` and status).
- **Presence polling** updates only the avatar component; it must not re-render the editor.
- **Lists keep stable `key`s** (document id) so cards don't remount and flash.
- **Use `will-change` sparingly** (only on actively animating elements, removed after). Avoid
  `backdrop-filter` on large or scrolling areas (it's expensive); fine on small floating elements.
- **Debounce/throttle** resize and scroll handlers; prefer CSS (`position: sticky`) over JS scroll listeners.
- Route transitions: use `loading.tsx` skeletons per route so navigation shows structure instantly.

---

## 8. Accessibility (part of "premium")

- Visible focus ring on every interactive element (`--shadow-focus`).
- Icon-only buttons have `aria-label` and a tooltip.
- Toolbar buttons use `aria-pressed` for active formats.
- Save status is announced with `aria-live="polite"`.
- Text contrast meets WCAG AA (ink on sage/white/lime all pass; ink-muted only for secondary text at ≥ 12px).
- Everything works with the keyboard alone.

---

## 9. Checklist before finishing any UI change

- [ ] Only tokens used (no stray hex, radius, shadow, duration).
- [ ] All states styled: hover, active, focus-visible, disabled, loading.
- [ ] No layout shift when loading, saving, erroring, hovering, or when presence changes.
- [ ] Only transform/opacity animated; durations from tokens; reduced motion respected.
- [ ] Empty and error states exist and match the filled state's size.
- [ ] Keyboard and screen-reader basics work.
