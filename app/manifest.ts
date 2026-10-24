import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NiveshLens – Investment Risk & Scheme Comparator",
    short_name: "NiveshLens",
    description: "Compare Indian FDs, PPF, Mutual Funds, and LIC policies on true returns, charges, and risk.",
    start_url: "/",
    display: "standalone",
    background_color: "#0B1B3A",
    theme_color: "#10B981",
    icons: [
      {
        src: "/icon.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
