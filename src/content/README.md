# Solution Gallery content

Each Markdown file in `solutions/` becomes one card and modal in the Solution
Gallery. The filename is its stable internal key, so keep it stable after
publishing.

Required frontmatter:

- `title`
- `completedAt` as `YYYY-MM-DD`

Optional frontmatter:

- `oneLiner`
- `builtBy`
- `solutionUrl`
- `showcaseVideo` (YouTube watch, short, embed, or Shorts URL)
- `screenshot` (local image path relative to the Markdown file, such as
  `./group-readers.png`; used when there is no showcase video)
- `problems` (Problem Database slugs such as `pr-258`)

Write the full solution description below the frontmatter using normal
Markdown. Gallery entries are sorted newest first by `completedAt`.
