import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://niveshlens.vercel.app";
  const routes = [
    "",
    "/compare",
    "/profile",
    "/goal",
    "/btir",
    "/fd",
    "/ppf",
    "/mf/122639",
    "/mf/120503",
    "/lic/lic-jeevan-labh-936",
    "/lic/lic-jeevan-umang-945",
    "/learn",
    "/admin",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route.startsWith("/mf") ? "daily" : "weekly",
    priority: route === "" ? 1.0 : 0.8,
  }));
}
