import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import {
  GROUP_PROPS,
  notionLoader,
  PROBLEM_PROPS,
  readRelationIds,
  readRichText,
  readTitle,
  readUniqueId,
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

export const collections = { problems, groups };
