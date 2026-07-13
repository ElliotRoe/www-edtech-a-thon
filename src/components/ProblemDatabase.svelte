<script lang="ts">
  import ProblemBoardCard, {
    type ProblemStatus,
  } from "./ProblemBoardCard.svelte";

  interface Problem {
    slug: string;
    prId: string;
    title: string;
    status: ProblemStatus;
  }
  interface Section {
    title: string;
    problems: Problem[];
  }
  interface Props {
    sections: Section[];
    total: number;
  }

  const { sections, total }: Props = $props();

  let query = $state("");

  const normalize = (s: string) => s.toLowerCase().trim();

  // Filter over both group names and problem names. A matching group name shows
  // the whole group; otherwise only its matching problems are shown.
  const filtered = $derived.by(() => {
    const q = normalize(query);
    if (!q) return sections;
    return sections
      .map((section) => {
        if (normalize(section.title).includes(q)) return section;
        const problems = section.problems.filter(
          (p) =>
            normalize(p.title).includes(q) || normalize(p.prId).includes(q),
        );
        return { ...section, problems };
      })
      .filter((section) => section.problems.length > 0);
  });

  const shownCount = $derived(
    filtered.reduce((n, s) => n + s.problems.length, 0),
  );
</script>

<div class="sticky top-0 z-10 -mx-4 bg-[#fffdf8]/95 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8">
  <input
    type="search"
    bind:value={query}
    placeholder="Search groups and problems…"
    aria-label="Search groups and problems"
    class="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-300"
  />
  <div class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
    <span>
      {#if query.trim()}
        {shownCount} of {total} problems match
      {:else}
        {total} problems across {sections.length} groups
      {/if}
    </span>
    <span class="flex items-center gap-1.5">
      <span class="inline-block h-3 w-3 rounded-sm border border-sky-300 bg-sky-100"></span>
      Project Board
    </span>
    <span class="flex items-center gap-1.5">
      <span class="inline-block h-3 w-3 rounded-sm border border-amber-300 bg-amber-100"></span>
      Extra Credit
    </span>
    <span class="flex items-center gap-1.5">
      <span class="inline-block h-3 w-3 rounded-sm border border-green-300 bg-green-100"></span>
      Completed
    </span>
  </div>
</div>

<div class="mt-4 flex flex-col gap-8">
  {#each filtered as section (section.title)}
    <div>
      <h2 class="text-lg font-semibold text-slate-900">
        {section.title}
        <span class="ml-1 text-sm font-normal text-slate-400"
          >{section.problems.length}</span
        >
      </h2>
      <div
        class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        {#each section.problems as problem (problem.slug)}
          <ProblemBoardCard
            slug={problem.slug}
            prId={problem.prId}
            title={problem.title}
            status={problem.status}
          />
        {/each}
      </div>
    </div>
  {/each}

  {#if filtered.length === 0}
    <p class="py-8 text-center italic text-slate-500">
      {total === 0
        ? "No published problems yet."
        : "No groups or problems match your search."}
    </p>
  {/if}
</div>
