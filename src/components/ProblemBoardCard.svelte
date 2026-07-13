<script lang="ts">
  export type ProblemStatus = "completed" | "board" | "extra-credit" | null;

  interface Props {
    slug: string;
    prId: string;
    title: string;
    status?: ProblemStatus;
  }

  const { slug, prId, title, status = null }: Props = $props();

  // Tint by where the problem can be found. Full literal class strings so
  // Tailwind's scanner keeps them.
  const styles: Record<NonNullable<ProblemStatus>, string> = {
    completed: "border-green-300 bg-green-100",
    board: "border-sky-300 bg-sky-100",
    "extra-credit": "border-amber-300 bg-amber-100",
  };
  const tint = status ? styles[status] : "border-slate-400 bg-white";
</script>

<a
  href={`/problem-database/${slug}`}
  class={`flex flex-col border border-b-4 rounded-lg hover:-translate-y-1 hover:shadow-lg transition ${tint}`}
>
  <div class="flex flex-col p-4 grow justify-center">
    <span class="block text-sm text-slate-600 mb-2">{prId}</span>
    <div class="grow flex flex-col justify-center">
      <div class="text-lg leading-snug text-slate-700">{title}</div>
    </div>
  </div>
</a>
