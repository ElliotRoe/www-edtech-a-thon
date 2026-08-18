<script lang="ts">
  import type { GalleryItem } from "../lib/board";

  interface Props {
    items: GalleryItem[];
  }

  const { items }: Props = $props();
  const byKey = new Map(items.map((item) => [item.key, item]));
  let selected = $state<GalleryItem | null>(null);

  function open(key: string) {
    const item = byKey.get(key);
    if (!item) return;
    selected = item;
    document.body.style.overflow = "hidden";
  }

  function close() {
    selected = null;
    document.body.style.overflow = "";
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") close();
  }

  // Astro-rendered triggers dispatch this event only after the island is ready.
  // The gallery and Project Board both use the stable Markdown filename key.
  $effect(() => {
    const handler = (event: Event) =>
      open((event as CustomEvent<string>).detail);
    window.addEventListener("open-solution", handler);
    document.documentElement.dataset.solutionModalReady = "true";
    return () => {
      window.removeEventListener("open-solution", handler);
      delete document.documentElement.dataset.solutionModalReady;
      document.body.style.overflow = "";
    };
  });
</script>

<svelte:window onkeydown={onKeydown} />

{#if selected}
  <div
    class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm sm:items-center"
    role="dialog"
    aria-modal="true"
    aria-label={selected.name}
    tabindex="-1"
    onclick={close}
    onkeydown={(event) => event.key === "Enter" && close()}
  >
    <div
      class="my-8 w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
      role="document"
      onclick={(event) => event.stopPropagation()}
      onkeydown={(event) => event.stopPropagation()}
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
      {:else if selected.screenshot}
        <div class="aspect-video w-full overflow-hidden bg-slate-100">
          <img
            src={selected.screenshot.src}
            alt={`${selected.name} screenshot`}
            width={selected.screenshot.width}
            height={selected.screenshot.height}
            class="h-full w-full object-cover"
          />
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
            <svg viewBox="0 0 24 24" class="h-6 w-6" aria-hidden="true">
              <path
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                d="M6 6l12 12M18 6L6 18"
              />
            </svg>
          </button>
        </div>

        {#if selected.descriptionHtml}
          <div class="modal-description mt-4 text-sm leading-relaxed text-slate-700">
            {@html selected.descriptionHtml}
          </div>
        {:else if selected.oneLiner}
          <p class="mt-4 text-sm leading-relaxed text-slate-700">{selected.oneLiner}</p>
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
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  :global(.modal-description > * + *) {
    margin-top: 0.75rem;
  }

  :global(.modal-description ul),
  :global(.modal-description ol) {
    padding-left: 1.25rem;
  }

  :global(.modal-description ul) {
    list-style: disc;
  }

  :global(.modal-description ol) {
    list-style: decimal;
  }

  :global(.modal-description a) {
    color: var(--color-primary-700);
    text-decoration: underline;
  }
</style>
