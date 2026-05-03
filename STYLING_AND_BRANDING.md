# ADHDTasks — Styling & Branding Guide

This document captures the **playful, soft, mobile-first** visual language of ADHDTasks so new screens and refactors stay consistent. It merges **what the product should feel like** (reference UI) with **what the codebase currently implements** (`adhd-tasks/`).

---

## 1. Brand personality

| Principle | What it means in UI |
|-----------|---------------------|
| **Playful, not childish** | Large radii, pill shapes, soft shadows, emoji where they aid scanability (avatars, empty states). Avoid harsh corners and dense corporate grids. |
| **Calm clarity** | Plenty of whitespace, short Dutch copy, one clear primary action per view. |
| **Gentle gamification** | Points and streaks use **emerald** (reward) and **amber/red** (urgency), never neon arcade colors. |
| **Household warmth** | User-specific **accent colors** from the database tint avatars, pills, and leaderboard chips; the **product accent** stays indigo for navigation and primary actions. |

Default UI language: **Dutch** (`lang="nl"` on `<html>`).

---

## 2. Color system

### 2.1 Product accent (primary actions & active nav)

The reference UI and implementation both center on **indigo** (Tailwind’s indigo aligns with common “periwinkle” UI accents, ≈ `#6366F1`).

| Role | Tailwind (current code) | Approx. hex | Usage |
|------|-------------------------|-------------|--------|
| Primary / FAB / segmented “on” / approval | `bg-indigo-500`, `text-indigo-600`, `focus:border-indigo-400` | `#6366F1` / `#4F46E5` shades | FAB, submit buttons, active recurrence chips, toggle on, bottom nav active state, “Goedkeuren”. |
| Primary hover / depth | (not always explicit) | Slightly darker indigo on hover if you add it | Prefer `hover:bg-indigo-600` for buttons if contrast needs a bump. |
| Soft indigo surfaces | `bg-indigo-50`, `hover:bg-indigo-50`, `bg-indigo-100` | `#EEF2FF` family | Icon circles (empty “Taken”), subtle hover on icon buttons. |

**Rule:** Use **indigo** for *app chrome* and *global* actions. Use **user `color`** only for identity (pills, avatars, points chips).

### 2.2 Neutrals (Slate scale)

The app relies heavily on **Slate** for text and surfaces—not pure gray—so the UI stays slightly cool and cohesive with indigo.

| Token / class | Usage |
|---------------|--------|
| `text-slate-800`, `text-slate-700` | Page titles (`font-extrabold` / `font-bold`), body emphasis. |
| `text-slate-600` | Inactive segmented options, secondary lines. |
| `text-slate-500` | Uppercase field labels (see typography). |
| `text-slate-400` | Muted helper text, inactive nav, meta under task titles. |
| `border-slate-200` | Input borders, light dividers. |
| `bg-slate-50` | **App shell** background (`(app)/layout.tsx`). |
| `bg-slate-100` | Inactive segments, disabled blocks, neutral avatar fallback. |
| `border-slate-100` | Bottom nav top edge. |

### 2.3 Semantic (gamification & status)

| Meaning | Classes (patterns in code) |
|---------|----------------------------|
| Success / points earned | `text-emerald-600`, `bg-emerald-500` (Gedaan), `bg-emerald-100` + check badge |
| Positive float animation | `text-emerald-500` + `animate-float-up` (`globals.css`) |
| Warning / overdue emphasis | `text-amber-600` for points when overdue |
| Error / penalty / delete hover | `text-red-500`, `bg-red-50`, `border-l-4 border-red-500` on cards |

Keep semantic colors **consistent**: emerald = “good / done / money in the bank”, red = “bad / overdue / destructive”.

### 2.4 User identity colors

Stored per user (`User.color`). Patterns in components:

- **Solid/active pill:** `backgroundColor: color`, `color: #fff`.
- **Tinted/inactive pill:** `backgroundColor: color + "18"` (alpha suffix in hex), `color` for text.
- **Avatar circle:** `backgroundColor: user.color + "20"` for a light fill.

The gray default for “everyone / nobody” pills uses `#64748b` (slate-500).

### 2.5 shadcn / CSS variables (`globals.css`)

Root `:root` still uses **neutral** shadcn defaults (`--primary` near black). Much of the **on-brand** look is applied via **Tailwind utilities** (`indigo-*`, `slate-*`) on bespoke components, not via `--primary`.  

**If you later unify tokens:** consider mapping `--primary` to indigo OKLCH and `--radius` to a larger base so `Button` defaults match the app without extra classes.

---

## 3. Typography

### 3.1 Typeface

- **Font:** [Nunito Sans](https://fonts.google.com/specimen/Nunito+Sans) (Next.js `next/font/google` in `app/layout.tsx`).
- **CSS variable:** `--font-nunito-sans` → Tailwind `font-sans` / `font-heading` (both point to Nunito Sans in `@theme inline`).

Nunito Sans is rounded and friendly; it supports the “playful” goal without display-font whimsy.

### 3.2 Weights in use

| Weight | Tailwind | Typical use |
|--------|-----------|-------------|
| Regular | `font-normal` (400) | Body, inputs. |
| Semibold | `font-semibold` (600) | Labels, nav labels when active, task secondary line. |
| Bold / extrabold | `font-bold` (700), `font-extrabold` (800) | Page titles (`text-3xl font-extrabold`), sheet titles (`text-xl font-extrabold`), primary buttons. |

### 3.3 Hierarchy patterns

| Element | Pattern |
|---------|---------|
| Screen title | `text-3xl font-extrabold text-slate-800` |
| Sheet / modal title | `text-xl font-extrabold` |
| Section label (task groups) | `text-xs font-semibold text-slate-400 uppercase tracking-wide` |
| **Form field label** | `text-xs font-semibold text-slate-500 uppercase tracking-wide` — small caps feel, airy tracking |
| Empty state title | `text-lg font-bold text-slate-700` |
| Empty state hint | `text-slate-400 text-sm` |
| Nav label | `text-xs font-medium` / `font-semibold` when active |

---

## 4. Radius & geometry (“round everything”)

The playful look comes from **consistently large radii**, not from mixing sharp and round arbitrarily.

| Radius class | ~px (Tailwind 4 default scale) | Use |
|--------------|-------------------------------|-----|
| `rounded-full` | pill | FAB, user pills, points badges, avatar circles |
| `rounded-xl` | 12px | Inputs (`h-12`), small icon buttons, nav tap targets |
| `rounded-2xl` | 16px | Task rows/cards, bottom sheet top corners, PIN user cards |
| `rounded-lg` | 8px | Smaller grid cells (e.g. day-of-month picker) when many fit on a row |

**Sheet (task form):** `rounded-t-2xl` on bottom sheet content + `max-h-[92dvh] overflow-y-auto` for safe mobile scrolling.

---

## 5. Spacing & layout

| Convention | Implementation |
|------------|----------------|
| Content max width | `max-w-lg mx-auto px-4` on main screens |
| Vertical rhythm | `gap-5` inside forms; `gap-6` between sections; `gap-3` for dense lists |
| Touch-friendly controls | Inputs / many buttons at **`h-12`** (48px); primary submit **`h-14`** (56px) |
| Safe areas | Bottom nav and FAB use `env(safe-area-inset-bottom)` / `pb-safe` patterns |

**Bottom nav** sits `fixed bottom-0` with `z-50`; **FAB** at `bottom-24 right-5` with `z-20` so it clears the nav (`TasksManager`).

---

## 6. Elevation & surfaces

| Pattern | Classes |
|---------|---------|
| App background | `bg-slate-50` |
| Cards / rows | `bg-white rounded-2xl shadow-sm` |
| Sheet backdrop | `bg-black/10` + `backdrop-blur-xs` (`sheet.tsx` overlay) |
| FAB | `shadow-lg` + `rounded-full` |
| Modals / popovers | `shadow-lg` on sheet content |

Avoid heavy borders on cards; **shadow-sm** + white on `slate-50` is the default depth model.

---

## 7. Motion & micro-interactions

Defined in `adhd-tasks/app/globals.css`:

| Animation | Purpose |
|-----------|---------|
| `animate-float-up` | +points feedback after completing a task (`TaskCard`) |
| `animate-shake` | PIN error feedback (`PinClient`) |

**Interaction feedback** (used broadly):

- `active:scale-95` on primary taps (FAB, main buttons).
- `transition-all` / `transition-colors` on pills and segments.
- `disabled:opacity-50` on pending submits.

Keep durations **short** (150–200ms on sheets per `sheet.tsx`).

---

## 8. Component recipes (canonical patterns)

### 8.1 Text inputs

```txt
w-full h-12 px-3 rounded-xl border border-slate-200 text-slate-800
focus:border-indigo-400 focus:outline-none
```

### 8.2 Field label (“floating label” style)

Wrapper: `flex flex-col gap-1.5`  
Label: `text-xs font-semibold text-slate-500 uppercase tracking-wide`

### 8.3 Selection pills (assignee / owner)

- Container: `flex gap-2 flex-wrap`
- Pill base: `px-3 py-1.5 rounded-full text-sm font-semibold transition-all`
- Active: solid `backgroundColor: color`, `color: #fff`
- Inactive: tinted `color + "18"` background, text `color`

### 8.4 iOS-style toggle

Track: `relative w-12 h-6 rounded-full` — `bg-indigo-500` on, `bg-slate-200` off  
Knob: `absolute top-0.5 w-5 h-5 bg-white rounded-full shadow` — translate ~`translate-x-6` vs `translate-x-0.5`

### 8.5 Segmented control (e.g. recurrence)

Grid: `grid grid-cols-5 gap-1` (adjust column count per option set).  
Segment: `py-2 rounded-xl text-xs font-semibold transition-all`  
Active: `bg-indigo-500 text-white`  
Inactive: `bg-slate-100 text-slate-600 hover:bg-slate-200`

### 8.6 Primary CTA (full width)

`w-full h-14 rounded-2xl bg-indigo-500 text-white font-bold text-base disabled:opacity-50 active:scale-95 transition-all`

### 8.7 Secondary success CTA (“Gedaan”)

`flex-1 h-12 rounded-xl bg-emerald-500 text-white font-bold text-sm active:scale-95 ...`

### 8.8 Bottom navigation

- Bar: `bg-white border-t border-slate-100`, safe padding.
- Item: `flex flex-col items-center gap-1 py-2 px-4 rounded-xl min-w-[64px]`
- Active: `text-indigo-600` + icon `strokeWidth={2.5}`; inactive: `text-slate-400`, stroke `1.75`.

Icons: **Lucide** outline family at ~22px (`BottomNav`).

### 8.9 FAB

`fixed bottom-24 right-5 w-14 h-14 rounded-full bg-indigo-500 text-white shadow-lg flex items-center justify-center active:scale-95 transition-transform z-20`  
Plus icon ~26px, `strokeWidth={2.5}`.

### 8.10 Task list row (manager)

`flex items-center gap-3 bg-white rounded-2xl shadow-sm px-4 py-3`  
Edit/delete: `w-9 h-9 rounded-xl` ghost with `hover:text-indigo-500 hover:bg-indigo-50` (edit) or red variant (delete).

### 8.11 Task card (“Vandaag”)

- Outer: `relative bg-white rounded-2xl shadow-sm` + optional `border-l-4 border-red-500` when overdue.
- Title: `font-bold text-slate-800 text-lg`
- Completed: `opacity-60`, `line-through text-slate-400`, emerald check badge in `rounded-full`.

### 8.12 Empty states

| Screen | Icon well | Title / body |
|--------|-----------|--------------|
| Taken (no tasks) | `w-16 h-16 rounded-full bg-indigo-100` + emoji 📋 | `Nog geen taken` / `Tik op + om een taak aan te maken.` |
| Vandaag (all done) | `bg-emerald-100` + 🎉 | `Alles gedaan!` / helper in `text-slate-400` |

Structure: `flex flex-col items-center justify-center py-20 gap-3`.

### 8.13 Points leaderboard pills (Today)

`rounded-full`, tinted `user.color + "18"`, text `user.color`, current user `ring-2 ring-offset-1` with `--ring-color` set to their color.

---

## 9. Iconography

- **Library:** Lucide React (`lucide-react`).
- **Style:** Outline icons; **thicker stroke on active** nav items for subtle “selected” emphasis.
- **Emoji:** Used for avatars when no image, empty-state metaphors, and small inline cues—keep size consistent (`text-3xl` in 64px wells, `text-sm`–`text-base` in small circles).

---

## 10. Reference captures

Keep **gold-standard screenshots** in the repo (for example `docs/reference/`) so design reviews do not depend on chat history:

| Shot | What it shows |
|------|----------------|
| **Nieuwe taak** | Bottom sheet: uppercase labels, pills, toggle, 5-column recurrence, indigo CTA, `rounded-t-2xl` panel. |
| **Taken (empty)** | `slate-50` shell, empty state with indigo-tint circle + FAB + white bottom nav with indigo active state. |

If you use Cursor’s saved chat images locally, copy them into that folder and add filenames here so the team has one canonical place.

---

## 11. Accessibility & UX notes

- **Contrast:** Indigo buttons with white text generally pass on large controls; always verify if you lighten indigo or shrink text.
- **Touch targets:** Prefer **≥44px** height for primary controls (`h-12` / `h-14`).
- **Focus:** Inputs use ring via `focus:border-indigo-400`; ensure new components don’t remove visible focus.
- **Motion:** Respect `prefers-reduced-motion` if you add more animations (currently optional enhancement).

---

## 12. Source map (where to change what)

| Concern | File(s) |
|---------|---------|
| Global font, `lang` | `adhd-tasks/app/layout.tsx` |
| CSS variables, keyframes, Tailwind theme bridge | `adhd-tasks/app/globals.css` |
| App shell background | `adhd-tasks/app/(app)/layout.tsx` |
| Bottom nav styling | `adhd-tasks/components/layout/BottomNav.tsx` |
| Task form / pills / segments | `adhd-tasks/components/tasks/TaskForm.tsx` |
| FAB + empty state + list rows | `adhd-tasks/components/tasks/TasksManager.tsx` |
| Today header + leaderboard + empty | `adhd-tasks/app/(app)/today/page.tsx` |
| Task instance cards | `adhd-tasks/components/tasks/TaskCard.tsx` |
| Sheet overlay / panel chrome | `adhd-tasks/components/ui/sheet.tsx` |
| Generic button variants | `adhd-tasks/components/ui/button.tsx` |

---

## 13. Checklist before merging UI work

- [ ] Primary action still **indigo**; success still **emerald**; danger still **red**.
- [ ] New surfaces use **white on slate-50** with **shadow-sm** unless there is a deliberate reason not to.
- [ ] Radii at least **`rounded-xl`** on interactive rectangles; cards **`rounded-2xl`**.
- [ ] Field labels follow **uppercase / tracking-wide / text-xs** pattern where applicable.
- [ ] Dutch copy tone matches existing screens (short, informal).
- [ ] Safe-area / bottom inset respected for fixed elements.

---

*Last aligned with codebase patterns in `adhd-tasks/` (Nunito Sans, Tailwind v4 `@import`, shadcn sheet/button). Update this file when you intentionally change the design system.*
