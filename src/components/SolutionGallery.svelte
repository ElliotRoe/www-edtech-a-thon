<script lang="ts">
  import type { GalleryItem } from "../lib/board";
  import SolutionModal from "./SolutionModal.svelte";

  interface Props {
    items: GalleryItem[];
  }

  const { items }: Props = $props();

  function open(key: string) {
    window.dispatchEvent(new CustomEvent("open-solution", { detail: key }));
  }
</script>

{#if items.length === 0}
  <p class="py-8 text-center italic text-slate-500">
    No completed solutions yet — check back during the event.
  </p>
{:else}
  <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
    {#each items as item (item.key)}
      <button
        type="button"
        onclick={() => open(item.key)}
        class="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:border-primary-300 hover:shadow-xl"
      >
        <div
          class="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-primary-200 to-primary-400"
        >
          {#if item.videoThumb}
            <img
              src={item.videoThumb}
              alt=""
              loading="lazy"
              class="h-full w-full object-cover transition group-hover:scale-105"
            />
          {:else}
            <div
              class="flex h-full w-full items-center justify-center p-4 text-center font-display text-xl text-primary-950"
            >
              {item.name}
            </div>
          {/if}
          <div
            class="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/25"
          >
            <span
              class="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 opacity-0 shadow-lg transition group-hover:opacity-100"
            >
              <svg
                viewBox="0 0 24 24"
                class="ml-0.5 h-5 w-5 fill-primary-700"
                aria-hidden="true"><path d="M8 5v14l11-7z" /></svg
              >
            </span>
          </div>
        </div>
        <div class="flex grow flex-col gap-1 p-4">
          <h2 class="text-lg font-bold leading-snug text-slate-900">
            {item.name}
          </h2>
          {#if item.oneLiner}
            <p class="line-clamp-2 text-sm text-slate-600">{item.oneLiner}</p>
          {/if}
          {#if item.builtBy}
            <p class="mt-auto pt-2 text-xs text-slate-500">
              Built by {item.builtBy}
            </p>
          {/if}
        </div>
      </button>
    {/each}
  </div>
{/if}

<SolutionModal {items} />
