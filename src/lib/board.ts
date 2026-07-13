import { getCollection } from "astro:content";

/** A covered/related problem, ready to render: `href` is null when the problem
 *  isn't publishable (no detail page exists), in which case show the title only. */
export interface ProblemLink {
  pageId: string;
  title: string;
  href: string | null;
}

/** Which board a potential solution lives on, by its `Accepted` value. */
export function boardHrefForAccepted(accepted: string): string {
  return accepted === "Extra Credit" ? "/extra-credit" : "/problem-board";
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
