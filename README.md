# EdTech-a-thon

Minimal Astro + Tailwind site for EdTech-a-thon.

## Commands

```sh
npm install
npm run dev
npm run build
npm run preview
```

## Problem Carousel

Problem cards live in `src/problems/*.md`.

Each file needs frontmatter:

```md
---
order: 1
category: Planning
title: I lose hours turning standards into usable weekly plans.
solutionName: Optional Solution Name
solutionLink: https://example.com
---
```

The homepage loads every Markdown file in that folder and sorts by `order`.
If `solutionLink` is present, the carousel card is marked as solved and links to that solution.
