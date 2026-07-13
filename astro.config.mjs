import { defineConfig } from "astro/config";
import markdoc from "@astrojs/markdoc";
import svelte from "@astrojs/svelte";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  redirects: {
    "/form":
      "https://docs.google.com/forms/d/e/1FAIpQLSe0axLrX6rW9X-Og9-UCs_NVkcq1M66opaFRXuF8yu3M3JRBw/viewform?usp=dialog",
    "/dev":
      "https://docs.google.com/forms/d/e/1FAIpQLSeM-xSUAg1bBx2RgfHPwO_GQCiwu3ZB2FKG-7PeGyoaBSa6gQ/viewform?usp=dialog",
    "/join":
      "https://us05web.zoom.us/j/7767707462?pwd=hCfz9pYC591EGeTHl1gmgK2ra0RzWE.1",
    // Boards were restructured — keep old links working.
    "/problem-board": "/project-board",
    "/extra-credit": "/project-board",
    "/completed-solutions": "/solution-gallery",
  },

  integrations: [markdoc(), svelte()],

  vite: {
    plugins: [tailwindcss()],
  },
});
