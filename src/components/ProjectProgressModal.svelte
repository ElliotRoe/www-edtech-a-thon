<script lang="ts">
  interface ProgressItem {
    key: string;
    name: string;
    authorLine: string;
    description: string;
    videoLink: string;
  }

  interface Props {
    items: ProgressItem[];
  }

  const { items }: Props = $props();
  const byKey = new Map(items.map((item) => [item.key, item]));
  let selected = $state<ProgressItem | null>(null);

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

  $effect(() => {
    const handler = (event: Event) =>
      open((event as CustomEvent<string>).detail);
    window.addEventListener("open-project-progress", handler);
    return () => window.removeEventListener("open-project-progress", handler);
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
      class="my-8 w-full max-w-xl overflow-hidden rounded-2xl border border-b-4 border-slate-400 bg-white shadow-2xl"
      role="document"
      onclick={(event) => event.stopPropagation()}
      onkeydown={(event) => event.stopPropagation()}
    >
      <div class="h-1.5 w-full bg-amber-300"></div>
      <div class="p-5 sm:p-6">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="text-2xl font-extrabold text-slate-900">
              {selected.name}
            </h2>
            {#if selected.authorLine}
              <p class="mt-1 text-sm text-slate-500">
                {selected.authorLine}
              </p>
            {/if}
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

        {#if selected.description}
          <p class="mt-4 text-sm leading-relaxed text-slate-700">
            {selected.description}
          </p>
        {/if}

        <div class="mt-6 flex flex-wrap items-center gap-3">
          {#if selected.videoLink}
            <a
              href={selected.videoLink}
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-500"
            >
              Open video <span aria-hidden="true">&rarr;</span>
            </a>
          {:else}
            <p class="text-sm italic text-slate-500">Video coming soon.</p>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}
