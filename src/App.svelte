<script>
  import heroImage from './assets/edtech-athon-hero.png'

  // Replace this with the real form URL when it is ready.
  const formLink = 'https://docs.google.com/forms/d/e/1FAIpQLSe-DIYBCiD3ewgji0ugGrR4xvOaNIexTWa3AWrKb0KPS3dFiw/viewform?usp=publish-editor'

  const organizers = [
    {
      name: 'Josh Pullen',
      siteLabel: 'joshuapullen.com',
      siteHref: 'https://www.joshuapullen.com/',
      blurb:
        "An Algebra teacher and web developer from South Lyon, Michigan, Josh Pullen builds practical edtech solutions for his classroom and shares them with other teachers. He has developed interactive math lessons for 3Blue1Brown and is the creator of Shuffle Buddy, a specialized seating chart generator. Josh's work provides simple, effective tools that solve the day-to-day challenges educators actually face.",
    },
    {
      name: 'Duncan Johnson',
      siteLabel: 'duncanajohnson.com',
      siteHref: 'https://www.duncanajohnson.com/',
      blurb:
        'An edtech researcher and designer from Boston, Massachusetts, Duncan Johnson builds educational technology for universities and companies alike. He previously co-founded a STEM education non-profit with Elliot Roe and has published computer science education research with the Center for Engineering Education at Tufts University.',
    },
    {
      name: 'Elliot Roe',
      siteLabel: 'elliotbroe.com',
      siteHref: 'https://elliotbroe.com/',
      blurb:
        'A full-time software engineer from Atlanta, Georgia, Elliot Roe is passionate about open-source software and educational technology. He previously co-founded a STEM education non-profit with Duncan Johnson and worked as a research assistant at the Play and Learn Lab, where he developed educational games and supported after-school programs. Now, Elliot develops open-source tooling for researchers, integrating academic literature with AI.',
    },
  ]
</script>

<svelte:head>
  <title>The First Annual EdTech-a-thon</title>
  <meta
    name="description"
    content="The hackathon where developers and teachers work together to design and ship edtech for the real world."
  />
</svelte:head>

<div class="min-h-screen bg-[radial-gradient(circle_at_top,_#fff1c9,_#fffdf8_38%,_#eef4f8_100%)]">
  <main class="mx-auto flex max-w-2xl flex-col gap-10 px-6 py-10 sm:px-10 sm:py-14">
    <div class="mx-auto flex max-w-4xl flex-col items-center text-center">
      <div class="mb-8 flex w-full items-center justify-center">
        <img
          src={heroImage}
          alt="Elliot Roe, Josh Pullen, and Duncan Johnson"
          class="w-full max-w-4xl drop-shadow-[0_28px_60px_rgba(15,23,42,0.16)]"
        />
      </div>

      <p class="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
        The First Annual
      </p>

      <h1 class="mt-4 font-['Lemon',serif] text-5xl leading-[0.95] text-slate-900 sm:text-6xl">
        EdTech-a-thon
      </h1>

      <p class="mt-6 max-w-3xl text-lg leading-8 text-slate-700 sm:text-xl">
        The hackathon where developers and teachers work together to design and ship
        edtech for the real world. July 20-22nd in Atlanta, GA.
      </p>
    </div>
    <div>
      <div class="flex justify-center">
        <a
          href={formLink}
          target="_blank"
          class="inline-flex items-center justify-center rounded-full bg-amber-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-200"
        >
          Open the form
        </a>
      </div>
      <p class="mt-1 max-w-3xl text-lg leading-8 text-slate-500 sm:text-sm text-center">
        Fill out the form with your contact information<br> and we'll reach out!
      </p>
    </div>

    <section class="border-slate-300 pt-8">

      <p class="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 text-center">
        About Us
      </p>

      <div class="mt-6 text-center">
        {#each organizers as organizer, index}
          <article class={index === 0 ? 'py-6' : 'border-t border-slate-300 py-6'}>
            <h2 class="mt-3 font-['Lemon',serif] text-3xl text-slate-900">
              {organizer.name}
            </h2>

            <a
              href={organizer.siteHref}
              target="_blank"
              rel="noreferrer"
              class="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 transition hover:text-slate-900"
            >
              {organizer.siteLabel}
            </a>

            <p class="mt-4 text-base leading-7 text-slate-700">
              {organizer.blurb}
            </p>
          </article>
        {/each}
      </div>
    </section>

    <section class="border-t border-slate-300 pt-8">
      <div class="flex flex-col items-center gap-5 text-center">
        <div class="max-w-2xl">
          <p class="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
            Join Us
          </p>
          <h2 class="mt-2 font-['Lemon',serif] text-4xl text-slate-900">
            Fill out this form and we'll reach out to you!
          </h2>
        </div>

        <a
          href={formLink}
          target="_blank"
          class="inline-flex items-center justify-center rounded-full bg-amber-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-200"
        >
          Open the form
        </a>
      </div>
    </section>
  </main>
</div>
