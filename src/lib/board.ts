import { getCollection } from "astro:content";

/** A covered/related problem, ready to render: `href` is null when the problem
 *  isn't publishable (no detail page exists), in which case show the title only. */
export interface ProblemLink {
  pageId: string;
  title: string;
  href: string | null;
}

/** Which board a potential solution lives on. Core projects and Extra Credit
 *  now share the Project Board page (Extra Credit is a section within it). */
export function boardHrefForAccepted(_accepted: string): string {
  return "/project-board";
}

/** Stable anchor id for a potential solution on its board. */
export const potentialSolutionAnchor = (pageId: string) => `ps-${pageId}`;

/**
 * Build a resolver from a problem's Notion page id to a renderable link,
 * using the lightweight (non-PII) problem index. Unknown ids resolve to null.
 */
export async function getProblemLookup(): Promise<
  (pageId: string) => ProblemLink | null
> {
  const index = await getCollection("problemsIndex");
  const byPageId = new Map(index.map((p) => [p.data.pageId, p]));
  return (pageId: string) => {
    const entry = byPageId.get(pageId);
    if (!entry) return null;
    const { prId, title, publishable } = entry.data;
    const slug = prId ? prId.toLowerCase() : "";
    return {
      pageId,
      title: title || prId || "Untitled problem",
      href: publishable && slug ? `/problem-database/${slug}` : null,
    };
  };
}

export interface BoardSolution {
  pageId: string;
  name: string;
  accepted: string;
  /** Short one-sentence description ("One-Liner"). */
  oneLiner: string;
  /** Contributor names (may be empty). */
  contributors: string;
  /** "Not Started" | "In-Progress" | "Completed" (may be empty). */
  progress: string;
  /** Forum post URL, normalized; "" when unset. */
  forumLink: string;
  /** Finished-solution URL, normalized; "" when unset. */
  solutionLink: string;
  problems: ProblemLink[];
}

/** Potential solutions for one board (`accepted` = "Yes" | "Extra Credit"),
 *  each with its covered problems resolved, sorted by name. */
export async function getBoardSolutions(
  accepted: string,
): Promise<BoardSolution[]> {
  const [solutions, lookup] = await Promise.all([
    getCollection("potentialSolutions"),
    getProblemLookup(),
  ]);
  return solutions
    .filter((s) => s.data.accepted === accepted)
    .map((s) => ({
      pageId: s.data.pageId,
      name: s.data.name,
      accepted: s.data.accepted,
      oneLiner: s.data.oneLiner,
      contributors: s.data.contributors,
      progress: s.data.progress,
      forumLink: normalizeUrl(s.data.forumLink),
      solutionLink: normalizeUrl(s.data.solutionLink),
      problems: s.data.problemIds
        .map(lookup)
        .filter((p): p is ProblemLink => p !== null),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export interface ProblemSolvers {
  potential: { pageId: string; name: string; accepted: string; href: string }[];
  completed: { pageId: string; name: string; url: string }[];
}

/**
 * Inverse of the covered-problem relations: for each problem page id, the
 * potential solutions (linking to their board anchor) and completed solutions
 * that address it. Powers the reverse direction of the 2-way linking.
 */
export async function getSolversByProblem(): Promise<
  Map<string, ProblemSolvers>
> {
  const [potential, completed] = await Promise.all([
    getCollection("potentialSolutions"),
    getCollection("solutions"),
  ]);
  const map = new Map<string, ProblemSolvers>();
  const bucket = (pid: string) => {
    let b = map.get(pid);
    if (!b) map.set(pid, (b = { potential: [], completed: [] }));
    return b;
  };
  for (const s of potential) {
    for (const pid of s.data.problemIds) {
      bucket(pid).potential.push({
        pageId: s.data.pageId,
        name: s.data.name,
        accepted: s.data.accepted,
        href: `${boardHrefForAccepted(s.data.accepted)}#${potentialSolutionAnchor(
          s.data.pageId,
        )}`,
      });
    }
  }
  for (const s of completed) {
    for (const pid of s.data.problemIds) {
      bucket(pid).completed.push({
        pageId: s.data.pageId,
        name: s.data.name,
        url: normalizeUrl(s.data.url),
      });
    }
  }
  return map;
}

/** Prefix bare hostnames (e.g. "vocabsleuth.com") with https:// for a valid href. */
export function normalizeUrl(url: string): string {
  const u = url.trim();
  if (!u) return "";
  return /^https?:\/\//i.test(u) ? u : `https://${u}`;
}

/**
 * The call-to-action for a Project Board card, driven by its Progress + link.
 * Completed → finished solution; In-Progress → forum post; otherwise (Not
 * Started, or no specific link) fall back to the forum to invite contribution.
 * Null only when there's no usable link at all.
 */
export function boardCardAction(
  solution: BoardSolution,
): { label: string; href: string } | null {
  if (solution.progress === "Completed" && solution.solutionLink) {
    return { label: "See solution", href: solution.solutionLink };
  }
  if (solution.progress === "In-Progress" && solution.forumLink) {
    return { label: "See progress", href: solution.forumLink };
  }
  if (solution.forumLink) {
    return { label: "Contribute", href: solution.forumLink };
  }
  return null;
}

export interface BoardProgress {
  /** Total core Project Board projects (Accepted = "Yes"). */
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  /** Completed Extra Credit projects, surfaced as a "+N" bonus. */
  extraCompleted: number;
}

/** Progress-bar counts for the Project Board: core projects by status, plus a
 *  bonus tally of completed Extra Credit projects. */
export async function getBoardProgress(): Promise<BoardProgress> {
  const [core, extra] = await Promise.all([
    getBoardSolutions("Yes"),
    getBoardSolutions("Extra Credit"),
  ]);
  const count = (list: BoardSolution[], status: string) =>
    list.filter((s) => s.progress === status).length;
  const completed = count(core, "Completed");
  const inProgress = count(core, "In-Progress");
  return {
    total: core.length,
    completed,
    inProgress,
    notStarted: core.length - completed - inProgress,
    extraCompleted: count(extra, "Completed"),
  };
}

// --- Solution Gallery (completed solutions) ----------------------------------

/** Extract a YouTube video id from watch/short/embed URLs, else "". */
export function youtubeId(url: string): string {
  const u = url.trim();
  if (!u) return "";
  const patterns = [
    /[?&]v=([A-Za-z0-9_-]{11})/, // watch?v=ID
    /youtu\.be\/([A-Za-z0-9_-]{11})/, // youtu.be/ID
    /\/embed\/([A-Za-z0-9_-]{11})/, // /embed/ID
    /\/shorts\/([A-Za-z0-9_-]{11})/, // /shorts/ID
  ];
  for (const re of patterns) {
    const m = re.exec(u);
    if (m) return m[1];
  }
  return "";
}

/** Privacy-friendly embeddable URL for a YouTube showcase, or "" if unparseable. */
export function youtubeEmbedUrl(url: string): string {
  const id = youtubeId(url);
  return id ? `https://www.youtube-nocookie.com/embed/${id}` : "";
}

/** Thumbnail image URL for a YouTube showcase, or "" if unparseable. */
export function youtubeThumb(url: string): string {
  const id = youtubeId(url);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : "";
}

/** Stable key linking a Project Board project to its gallery entry (by name). */
export function solutionKey(name: string): string {
  return name.trim().toLowerCase();
}

export interface GalleryItem {
  /** Stable id used to open this item's modal from anywhere. */
  key: string;
  name: string;
  oneLiner: string;
  description: string;
  /** Live/built solution URL, normalized; "" when unset. */
  link: string;
  /** Forum thread for feedback, normalized; "" when unset. */
  forumLink: string;
  /** Embeddable showcase video URL; "" when none/unparseable. */
  videoEmbed: string;
  /** Showcase video thumbnail URL; "" when none. */
  videoThumb: string;
  builtBy: string;
  /** Human-formatted completion date (e.g. "Jul 20, 2026"); "" when unset. */
  date: string;
}

const GALLERY_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Format an ISO date-only string without timezone drift. */
function formatGalleryDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return "";
  return `${GALLERY_MONTHS[Number(m[2]) - 1]} ${Number(m[3])}, ${m[1]}`;
}

/**
 * Gallery items plus a resolver from a Project Board project to the gallery
 * `key` that opens its modal — matched on the shared solution URL first, then
 * the name. Returns null when the project isn't Completed or has no gallery
 * entry (the card then falls back to a plain link).
 */
export async function getGalleryForBoard(): Promise<{
  items: GalleryItem[];
  keyFor: (solution: BoardSolution) => string | null;
}> {
  const items = await getSolutionGallery();
  const byUrl = new Map(
    items.filter((g) => g.link).map((g) => [g.link, g.key]),
  );
  const byName = new Map(items.map((g) => [g.key, g.key]));
  const keyFor = (s: BoardSolution): string | null => {
    if (s.progress !== "Completed") return null;
    return (
      (s.solutionLink && byUrl.get(s.solutionLink)) ||
      byName.get(solutionKey(s.name)) ||
      null
    );
  };
  return { items, keyFor };
}

/** Completed solutions shaped for the Solution Gallery, newest first. */
export async function getSolutionGallery(): Promise<GalleryItem[]> {
  const rows = await getCollection("solutions");
  return rows
    .map((row) => ({
      key: solutionKey(row.data.name),
      name: row.data.name,
      oneLiner: row.data.oneLiner,
      description: row.data.description,
      link: normalizeUrl(row.data.url),
      forumLink: normalizeUrl(row.data.forumLink),
      videoEmbed: youtubeEmbedUrl(row.data.showcaseVideo),
      videoThumb: youtubeThumb(row.data.showcaseVideo),
      builtBy: row.data.builtBy,
      date: formatGalleryDate(row.data.date),
      sortKey: row.data.date,
    }))
    // Most recently completed first.
    .sort((a, b) => b.sortKey.localeCompare(a.sortKey))
    .map(({ sortKey, ...item }) => item);
}
