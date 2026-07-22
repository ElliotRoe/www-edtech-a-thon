<script lang="ts">
  import type { GalleryItem } from "../lib/board";

  interface Props {
    items: GalleryItem[];
  }

  const { items }: Props = $props();

  // Look up an item by its stable key when an open request comes in.
  const byKey = new Map(items.map((i) => [i.key, i]));

  let selected = $state<GalleryItem | null>(null);

  export function open(key: string) {
    const item = byKey.get(key);
    if (!item) return;
    selected = item;
    document.body.style.overflow = "hidden";
  }
  function close() {
    selected = null;
    document.body.style.overflow = "";
  }
  function onKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") close();
  }

  // Any element on the page can request a modal via a window event carrying the
  // item key — used by the Project Board's Astro cards and the gallery grid.
  $effect(() => {
    const handler = (e: Event) => open((e as CustomEvent<string>).detail);
    window.addEventListener("open-solution", handler);
    return () => window.removeEventListener("open-solution", handler);
  });

  // Split a description into paragraphs on blank lines.
  const paragraphs = (text: string) =>
    text
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean);
</script>

<svelte:window onkeydown={onKeydown} />

{#if selected}
  <!-- Backdrop -->
  <div
    class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm sm:items-center"
    role="dialog"
    aria-modal="true"
    aria-label={selected.name}
    tabindex="-1"
    onclick={close}
    onkeydown={(e) => e.key === "Enter" && close()}
  >
    <!-- Panel -->
    <div
      class="my-8 w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
      role="document"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
    >
      {#if selected.videoEmbed}
        <div class="aspect-video w-full bg-black">
          <iframe
            src={selected.videoEmbed}
            title={`${selected.name} showcase video`}
            class="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          ></iframe>
        </div>
      {/if}

      <div class="p-5 sm:p-6">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="text-2xl font-extrabold text-slate-900">
              {selected.name}
            </h2>
            <p class="mt-0.5 text-sm text-slate-500">
              {#if selected.builtBy}Built by {selected.builtBy}{/if}
              {#if selected.builtBy && selected.date}&nbsp;&bull;&nbsp;{/if}
              {#if selected.date}{selected.date}{/if}
            </p>
          </div>
          <button
            type="button"
            onclick={close}
            aria-label="Close"
            class="shrink-0 rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <svg viewBox="0 0 24 24" class="h-6 w-6" aria-hidden="true"
              ><path
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                d="M6 6l12 12M18 6L6 18"
              /></svg
            >
          </button>
        </div>

        {#if selected.description}
          <div class="mt-4 flex flex-col gap-3 text-sm leading-relaxed text-slate-700">
            {#each paragraphs(selected.description) as para}
              <p>{para}</p>
            {/each}
          </div>
        {/if}

        <div class="mt-6 flex flex-wrap gap-3">
          {#if selected.link}
            <a
              href={selected.link}
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-500"
            >
              Visit solution <span aria-hidden="true">&rarr;</span>
            </a>
          {/if}
          {#if selected.forumLink}
            <a
              href={selected.forumLink}
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-primary-400 hover:bg-primary-50 hover:text-primary-900"
            >
              Forum <span aria-hidden="true">&nearr;</span>
            </a>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}
