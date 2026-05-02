import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
  redirects: {
    "/form":
      "https://docs.google.com/forms/d/e/1FAIpQLSe0axLrX6rW9X-Og9-UCs_NVkcq1M66opaFRXuF8yu3M3JRBw/viewform?usp=dialog",
  },
});
