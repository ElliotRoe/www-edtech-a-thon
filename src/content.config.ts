import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import {
  GROUP_PROPS,
  notionLoader,
  POTENTIAL_SOLUTION_PROPS,
  PROBLEM_PROPS,
  readCheckbox,
  readDate,
  readRelationIds,
  readRichText,
  readRollupRelationIds,
  readSelect,
  readTitle,
  readUniqueId,
  readUrl,
  SOLUTION_PROPS,
} from "./lib/notion";

/**
 * Both collections are sourced from Notion at build time (see ./lib/notion.ts).
 *
 * PII / redaction gate:
 *  - The `problems` loader filters to `Publishable = true`, so unpublishable rows
 *    never enter the collection. `Publishable` means "reviewed and redacted".
 *  - The maintainer redacts any PII directly in the `Problem` / `Proposed
 *    Solution` columns before ticking `Publishable`; those redacted columns are
 *    what gets rendered.
 *  - Educator names and Miro links are never loaded.
 */

const problems = defineCollection({
  loader: notionLoader({
    name: "problems",
    databaseIdEnv: "NOTION_PROBLEMS_DB_ID",
    filter: { property: PROBLEM_PROPS.publishable, checkbox: { equals: true } },
    map: (page) => {
      const props = page.properties;
      const prId = readUniqueId(props, PROBLEM_PROPS.id);
      if (!prId) return null; // no id → can't build a stable slug; skip
      return {
        id: prId.toLowerCase(), // entry id + route slug, e.g. "pr-123"
        pageId: page.id, // Notion page id, used to resolve group relations
        prId, // display badge, e.g. "PR-123"
        title: readTitle(props, PROBLEM_PROPS.title),
        problem: readRichText(props, PROBLEM_PROPS.problem),
        solution: readRichText(props, PROBLEM_PROPS.solution),
      };
    },
  }),
  schema: z.object({
    pageId: z.string(),
    prId: z.string(),
    title: z.string(),
    problem: z.string(),
    solution: z.string().optional(),
  }),
});

const groups = defineCollection({
  loader: notionLoader({
    name: "groups",
    databaseIdEnv: "NOTION_GROUPS_DB_ID",
    map: (page) => {
      const props = page.properties;
      const title = readTitle(props, GROUP_PROPS.title);
      if (!title) return null;
      return {
        id: page.id, // groups are not routed; the page id is a stable key
        title,
        problemIds: readRelationIds(props, GROUP_PROPS.problems),
      };
    },
  }),
  schema: z.object({
    title: z.string(),
    problemIds: z.array(z.string()),
  }),
});

/**
 * A lightweight index of ALL problems (published or not), carrying only
 * non-PII fields (title, PR id, publishable flag) — never the raw problem /
 * solution text. Used purely to resolve links from the solution boards back to
 * the Problem Database: a covered problem links to its detail page only when it
 * is `publishable` (i.e. that page exists); otherwise its title still shows.
 */
const problemsIndex = defineCollection({
  loader: notionLoader({
    name: "problem index entries",
    databaseIdEnv: "NOTION_PROBLEMS_DB_ID",
    map: (page) => {
      const props = page.properties;
      return {
        id: page.id,
        pageId: page.id,
        prId: readUniqueId(props, PROBLEM_PROPS.id),
        title: readTitle(props, PROBLEM_PROPS.title),
        publishable: readCheckbox(props, PROBLEM_PROPS.publishable),
      };
    },
  }),
  schema: z.object({
    pageId: z.string(),
    prId: z.string(),
    title: z.string(),
    publishable: z.boolean(),
  }),
});

/**
 * Potential Solutions. Only rows accepted onto a board are loaded ("Yes" →
 * Project Board, "Vibe Code" → Collaborative Build Cohort, "Extra Credit" →
 * Extra Credit); all three are sections of the Project Board page. We publish
 * the solution name and its covered-problem links ONLY — never Notes,
 * educators, or scores.
 */
const potentialSolutions = defineCollection({
  loader: notionLoader({
    name: "potential solutions",
    databaseIdEnv: "NOTION_POTENTIAL_SOLUTIONS_DB_ID",
    filter: {
      or: [
        { property: POTENTIAL_SOLUTION_PROPS.accepted, select: { equals: "Yes" } },
        {
          property: POTENTIAL_SOLUTION_PROPS.accepted,
          select: { equals: "Vibe Code" },
        },
        {
          property: POTENTIAL_SOLUTION_PROPS.accepted,
          select: { equals: "Extra Credit" },
        },
      ],
    },
    map: (page) => {
      const props = page.properties;
      const name = readTitle(props, POTENTIAL_SOLUTION_PROPS.title);
      if (!name) return null;
      return {
        id: page.id,
        pageId: page.id,
        name,
        accepted: readSelect(props, POTENTIAL_SOLUTION_PROPS.accepted),
        projectSlug: readRichText(props, POTENTIAL_SOLUTION_PROPS.projectSlug),
        oneLiner: readRichText(props, POTENTIAL_SOLUTION_PROPS.oneLiner),
        contributors: readRichText(props, POTENTIAL_SOLUTION_PROPS.contributors),
        progress: readSelect(props, POTENTIAL_SOLUTION_PROPS.progress),
        forumLink: readUrl(props, POTENTIAL_SOLUTION_PROPS.forumLink),
        githubLink: readUrl(props, POTENTIAL_SOLUTION_PROPS.githubLink),
        solutionLink: readUrl(props, POTENTIAL_SOLUTION_PROPS.solutionLink),
        problemIds: readRollupRelationIds(
          props,
          POTENTIAL_SOLUTION_PROPS.problemsCovered,
        ),
      };
    },
  }),
  schema: z.object({
    pageId: z.string(),
    name: z.string(),
    accepted: z.string(),
    projectSlug: z.string(),
    oneLiner: z.string(),
    contributors: z.string(),
    progress: z.string(),
    forumLink: z.string(),
    githubLink: z.string(),
    solutionLink: z.string(),
    problemIds: z.array(z.string()),
  }),
});

/** Completed, shipped solutions for the gallery. */
const solutions = defineCollection({
  loader: notionLoader({
    name: "completed solutions",
    databaseIdEnv: "NOTION_SOLUTIONS_DB_ID",
    map: (page) => {
      const props = page.properties;
      const name = readTitle(props, SOLUTION_PROPS.title);
      if (!name) return null;
      return {
        id: page.id,
        pageId: page.id,
        name,
        url: readUrl(props, SOLUTION_PROPS.link),
        builtBy: readRichText(props, SOLUTION_PROPS.builtBy),
        date: readDate(props, SOLUTION_PROPS.date),
        oneLiner: readRichText(props, SOLUTION_PROPS.oneLiner),
        description: readRichText(props, SOLUTION_PROPS.description),
        forumLink: readUrl(props, SOLUTION_PROPS.forumLink),
        showcaseVideo: readUrl(props, SOLUTION_PROPS.showcaseVideo),
        problemIds: readRelationIds(props, SOLUTION_PROPS.problems),
      };
    },
  }),
  schema: z.object({
    pageId: z.string(),
    name: z.string(),
    url: z.string(),
    builtBy: z.string(),
    date: z.string(),
    oneLiner: z.string(),
    description: z.string(),
    forumLink: z.string(),
    showcaseVideo: z.string(),
    problemIds: z.array(z.string()),
  }),
});

export const collections = {
  problems,
  groups,
  problemsIndex,
  potentialSolutions,
  solutions,
};
