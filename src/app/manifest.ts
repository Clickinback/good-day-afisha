import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Good Day — афиша Полоцка и Новополоцка",
    short_name: "Good Day",
    description: "Актуальные события Полоцка и Новополоцка рядом с вами",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f2ea",
    theme_color: "#3561f4",
    lang: "ru",
    icons: [
      { src: "/brand/good-day-logo.png", sizes: "800x800", type: "image/png", purpose: "any" },
      { src: "/brand/good-day-logo.png", sizes: "800x800", type: "image/png", purpose: "maskable" },
    ],
  };
}

