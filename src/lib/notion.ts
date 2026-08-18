import {
  Client,
  isFullPage,
  iteratePaginatedAPI,
  type PageObjectResponse,
  type QueryDataSourceParameters,
} from "@notionhq/client";
import type { Loader } from "astro/loaders";

/**
 * Custom Astro Content Layer loader for Notion.
 *
 * We use a hand-rolled loader (rather than `notion-astro-loader`) because that
 * package's peer dependency excludes Astro 6, which this project runs. The
 * Content Layer `Loader` interface is small and stable, so this is a thin,
 * dependency-light shim over the official `@notionhq/client` (v5).
 *
 * Notion API v5 restructured databases around "data sources": you no longer
 * query a database directly, you query one of its data sources. We resolve the
 * first data source id from the friendlier database id at load time so callers
 * only ever configure a database id.
 */

// --- Notion property names (edit here if the Notion columns are renamed) -----
export const PROBLEM_PROPS = {
  title: "Name",
  id: "ID", // unique-id column, renders as "PR-123"
  publishable: "Publishable", // checkbox gate — only true rows are ingested
  // The educator-entered columns. The maintainer redacts any PII IN PLACE on
  // these, then ticks `Publishable` to signal the row is reviewed and safe.
  problem: "Problem",
  solution: "Proposed Solution",
} as const;

export const GROUP_PROPS = {
  title: "Name",
  problems: "Problems", // relation → Problems database
} as const;

export const POTENTIAL_SOLUTION_PROPS = {
  title: "Name",
  accepted: "Accepted", // select: "Yes" → Problem Board, "Extra Credit" → Extra Credit
  projectSlug: "Project Slug", // rich text — DNS-safe name created by the admin script
  // Rollup (via Relevant Educators) surfacing the Problems-DB pages this solution covers.
  problemsCovered: "Problems Covered",
  oneLiner: "One-Liner", // rich text — short one-sentence description shown on the card
  contributors: "Contributors", // rich text — contributor names (may be empty)
  authorLine: "Author Line", // rich text — author credit shown in the progress modal
  progress: "Progress", // select: "Not Started" | "In-Progress" | "Completed"
  youtubeLink: "Youtube Link", // url — YouTube progress video shown in the project modal
  githubLink: "Github Link", // url — GitHub repository for the project
  solutionLink: "Solution Link", // url — link to the finished solution
} as const;

type Props = PageObjectResponse["properties"];

function getToken(): string {
  const token =
    import.meta.env.NOTION_TOKEN ?? process.env.NOTION_TOKEN ?? "";
  if (!token) {
    throw new Error(
      "Missing NOTION_TOKEN. Add it to .env (see .env.example) and to the deploy environment.",
    );
  }
  return token;
}

function requireEnv(name: string): string {
  const value = import.meta.env[name] ?? process.env[name] ?? "";
  if (!value) {
    throw new Error(
      `Missing ${name}. Add it to .env (see .env.example) and to the deploy environment.`,
    );
  }
  return value;
}

/** Resolve a database id to its first data source id (Notion API v5). */
async function resolveDataSourceId(
  client: Client,
  databaseId: string,
): Promise<string> {
  const db = await client.databases.retrieve({ database_id: databaseId });
  const source = "data_sources" in db ? db.data_sources[0] : undefined;
  if (!source) {
    throw new Error(
      `Notion database ${databaseId} has no data sources. Confirm the id and that the integration can access it.`,
    );
  }
  return source.id;
}

// --- Property extractors (defensive: tolerate missing/mismatched columns) ----

/** Join a rich-text or title array into a plain string, preserving newlines. */
function richTextToPlainText(rich: Array<{ plain_text: string }> = []): string {
  return rich.map((r) => r.plain_text).join("");
}

export function readTitle(props: Props, name: string): string {
  const prop = props[name];
  return prop?.type === "title" ? richTextToPlainText(prop.title).trim() : "";
}

export function readRichText(props: Props, name: string): string {
  const prop = props[name];
  return prop?.type === "rich_text"
    ? richTextToPlainText(prop.rich_text).trim()
    : "";
}

export function readCheckbox(props: Props, name: string): boolean {
  const prop = props[name];
  return prop?.type === "checkbox" ? prop.checkbox : false;
}

export function readRelationIds(props: Props, name: string): string[] {
  const prop = props[name];
  return prop?.type === "relation" ? prop.relation.map((r) => r.id) : [];
}

export function readSelect(props: Props, name: string): string {
  const prop = props[name];
  if (prop?.type === "select") return prop.select?.name ?? "";
  if (prop?.type === "status") return prop.status?.name ?? "";
  return "";
}

export function readUrl(props: Props, name: string): string {
  const prop = props[name];
  return prop?.type === "url" ? (prop.url ?? "") : "";
}

/**
 * Collect related page ids from either a plain relation or a rollup that
 * aggregates a relation (Notion "show original"). Potential Solutions expose
 * their covered problems as such a rollup.
 */
export function readRollupRelationIds(props: Props, name: string): string[] {
  const prop = props[name];
  if (prop?.type === "relation") return prop.relation.map((r) => r.id);
  if (prop?.type === "rollup" && prop.rollup.type === "array") {
    const ids: string[] = [];
    for (const item of prop.rollup.array as Array<{ type: string } & Record<string, unknown>>) {
      if (item.type === "relation") {
        for (const r of item.relation as Array<{ id: string }>) ids.push(r.id);
      }
    }
    return [...new Set(ids)];
  }
  return [];
}

/** Read a unique-id column (e.g. `PR-123`). Falls back to rich text / title. */
export function readUniqueId(props: Props, name: string): string {
  const prop = props[name];
  if (prop?.type === "unique_id") {
    const { prefix, number } = prop.unique_id;
    if (number === null) return "";
    return prefix ? `${prefix}-${number}` : String(number);
  }
  // Fallbacks in case ID is stored as text/title instead of a unique-id column.
  return readRichText(props, name) || readTitle(props, name);
}

// --- Loader factory ----------------------------------------------------------

interface NotionLoaderOptions<T extends Record<string, unknown>> {
  name: string;
  /** Name of the env var holding the Notion database id. */
  databaseIdEnv: string;
  filter?: QueryDataSourceParameters["filter"];
  sorts?: QueryDataSourceParameters["sorts"];
  /**
   * Map a Notion page to entry data, or return `null` to skip it. The returned
   * object MUST contain a stable, collection-unique `id` string used as the
   * entry id (and, for problems, the route slug).
   */
  map: (page: PageObjectResponse) => (T & { id: string }) | null;
}

export function notionLoader<T extends Record<string, unknown>>(
  options: NotionLoaderOptions<T>,
): Loader {
  return {
    name: options.name,
    load: async ({ store, logger, parseData, generateDigest }) => {
      // Missing config is a hard error (fix your .env). But a Notion runtime
      // failure (database not shared, column renamed, network) must NOT take
      // down the whole static build — the board is one feature of an event
      // site. On such errors we log loudly and leave the collection empty so
      // the rest of the site still deploys.
      const databaseId = requireEnv(options.databaseIdEnv);
      const client = new Client({ auth: getToken() });

      store.clear();
      try {
        const dataSourceId = await resolveDataSourceId(client, databaseId);
        let count = 0;
        for await (const page of iteratePaginatedAPI(client.dataSources.query, {
          data_source_id: dataSourceId,
          filter: options.filter,
          sorts: options.sorts,
        })) {
          if (!isFullPage(page)) continue;
          const mapped = options.map(page);
          if (!mapped) continue;
          const data = await parseData({ id: mapped.id, data: mapped });
          store.set({ id: mapped.id, data, digest: generateDigest(data) });
          count++;
        }
        logger.info(`Loaded ${count} ${options.name} from Notion`);
      } catch (error) {
        logger.error(
          `Failed to load "${options.name}" from Notion — the collection will be EMPTY. ` +
            `Check that the database (${options.databaseIdEnv}) is shared with the integration ` +
            `and that the filtered columns exist. Cause: ${
              error instanceof Error ? error.message.split("\n")[0] : String(error)
            }`,
        );
      }
    },
  };
}
