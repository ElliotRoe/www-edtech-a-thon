<script lang="ts">
  interface Props {
    slug: string;
    prId: string;
    title: string;
  }

  const { slug, prId, title }: Props = $props();
</script>

<a
  href={`/problem-database/${slug}`}
  class="flex flex-col border border-b-4 border-slate-400 bg-white rounded-lg hover:-translate-y-1 hover:shadow-lg transition"
>
  <div class="flex flex-col p-4 grow justify-center">
    <span class="block text-sm text-slate-600 mb-2">{prId}</span>
    <div class="grow flex flex-col justify-center">
      <div class="text-lg leading-snug text-slate-700">{title}</div>
    </div>
  </div>
</a>
