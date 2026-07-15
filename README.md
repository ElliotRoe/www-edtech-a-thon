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

## Project metadata API

Accepted rows in the Notion Potential Solutions database can expose public
project links at:

```text
/api/projects/<project-slug>.json
```

Populate these Notion properties on the row:

- `Project Slug` (rich text): the lowercase DNS-label project name used by the
  admin script.
- `Forum Link` (URL).
- `Github Link` (URL).

The response also includes the row's existing `Name` and `One-Liner` values as
`name` and `oneLiner`.

Rows without a `Project Slug` do not get an endpoint. Invalid or duplicate
non-empty slugs fail the build to prevent ambiguous project metadata. The JSON
is public and permits cross-origin reads so project-hosted widgets can consume
it.
