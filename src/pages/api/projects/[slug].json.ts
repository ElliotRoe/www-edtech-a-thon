import { getCollection } from "astro:content";
import type { APIRoute } from "astro";
import { normalizeUrl } from "../../../lib/board";

interface ProjectLinks {
  slug: string;
  name: string;
  oneLiner: string;
  githubLink: string;
}

const PROJECT_SLUG = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

export async function getStaticPaths() {
  const projects = await getCollection("potentialSolutions");
  const seen = new Set<string>();

  return projects.flatMap((project) => {
    const slug = project.data.projectSlug.trim();
    if (!slug) return [];
    if (!PROJECT_SLUG.test(slug)) {
      throw new Error(
        `Potential Solution "${project.data.name}" has invalid Project Slug "${slug}". ` +
          "Use the lowercase DNS-label name created by the admin script.",
      );
    }
    if (seen.has(slug)) {
      throw new Error(`Duplicate Potential Solution Project Slug "${slug}".`);
    }
    seen.add(slug);

    const links: ProjectLinks = {
      slug,
      name: project.data.name,
      oneLiner: project.data.oneLiner,
      githubLink: normalizeUrl(project.data.githubLink),
    };

    return [{ params: { slug }, props: { links } }];
  });
}

export const GET: APIRoute = ({ props }) =>
  new Response(`${JSON.stringify(props.links as ProjectLinks, null, 2)}\n`, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
