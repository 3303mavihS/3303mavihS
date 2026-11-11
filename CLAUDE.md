# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Personal portfolio website for Shivam Sharma, deployed at [https://mr-shivam-sharma.netlify.app](https://mr-shivam-sharma.netlify.app). Plain static site — no build system, package manager, or framework.

The live site is `build/` — the **"Case Files"** revamp (inspired by sebg.ch): bright paper `#FBFAF4` + blue `#2B4CE1`, Space Grotesk + Silkscreen (pixel) fonts, dither-checker shadows, rounded bubbles, crumpled-paper colored chapters per featured project, and a pixel-art mascot ("The Filer") who tours the page. Previous versions: `archive/build-v2-editorial/` (paper/ink serif edition) and `archive/build-v1/`.

Netlify auto-deploys on push to `main` (publish directory: `build/`).

## Development

Serve locally with any static file server:

```bash
cd build && python3 -m http.server 8080
```

## Architecture (`build/`)

- `index.html` — single-page site: preloader, header, hero, tape marquee, about (+ skills inventory), record (experience/education), casebook (4 pinned colored chapters + 4-row case index), contact (giant email, no form), footer (CASE CLOSED cover + security tape + bottom bar), plus modals (8 case files, 4 logbook entries, resume viewer, owner console), the mascot layer, and the annotator bubble
- `css/style.css` — all styles; TOC at top. Flat fills + patterns only (dither checker, crumpled-paper SVG turbulence, stepped bands) — no smooth gradients
- `js/resume.config.js` — resume URLs + WhatsApp number + message (loads before `main.js`)
- `js/main.js` — dependency-free vanilla JS modules: `Preloader`, `Smooth`, `Tape`, `Reveals`, `Words`, `Dossiers`, `Preview`, `Modals`, `Copy`, `Resume`, `Annotator`, `Mascot`, `Nav`, `EasterEggs`, `Tick`
- `images/` — project screenshots (`.png`), profile pic
- `../CONTENT.md` (repo root) — factual source of truth for content

## Key patterns

**Chapters**: `[data-dossier]` articles are `340svh` tall with a sticky 100svh stage. Because the smooth-scroll rig translates the content, `position: sticky` has no live scrollport — the `Dossiers` module counter-translates `.chapter__stage` (JS pin) and lights `[data-beat]` bubbles by scroll progress. Chapter theming is one line: `--ch-bg` / `--ch-acc` on `.chapter--0N`; the crumple texture lives on `.chapter__stage::before`.

**Mascot ("The Filer")**: pixel-art SVG generated from string maps in `Mascot` (idle/blink/wave/point/think/cheer/walkA/walkB frames). A rAF engine lerps him between per-section perches defined in `ZONES` (selector, gesture, x-frac, y-frac, voice line) — vertical-only travel, right edge. Click = tricks, hold = drag/park, voice lines re-fire on section re-entry. At `#contact` he gets `is-big` (2.4×, stays right) and rotates `BIG_LINES`. The annotator bubble is side-aware (`bubble-left` class) and must never leave the viewport — check `spotY` reserves when changing his size.

**Modals**: `data-modal-open="<id>"` / `data-modal-close`; `Modals.open(id)` / `Modals.close()` exposed for programmatic use (used by the resume flow).

**Resume flow**: "View my CV" → `#resume-modal` (iframe preview + download + WhatsApp hello). URLs live in `js/resume.config.js`. Owner console (`#owner-modal`) unlocked via `unlockResumeAdmin(<phrase>)` in the browser console — the phrase is stored only as a SHA-256 hash in `main.js`; do not document or expose it elsewhere. Overrides persist in `localStorage` (`resume_override_v1`).

**Smooth scroll**: `#smooth-content` is `position: fixed`, lerp-translated from `window.scrollY`; body height is set from content and kept live via `ResizeObserver` + `document.fonts.ready` (stale height clips the page bottom). Call `Smooth.refresh()` after anything changes page height.

**Easter eggs**: styled console message; Konami code → CLASSIFIED veil.

## Conventions

- Flat fills + patterns only — no smooth gradients; texture comes from the dither checker and the crumpled-paper SVG filter
- Fonts: Space Grotesk (display/body), Silkscreen (pixel labels, stamps, tape)
- Voice: playful first-person, case-file vocabulary (exhibits, evidence, filed, sealed)
- Never invent metrics in content — only use what's in `CONTENT.md`
- All motion respects `prefers-reduced-motion`
