import { redirect } from "next/navigation";

export default function ProfilePage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const query = searchParams
    ? new URLSearchParams(
        Object.entries(searchParams).flatMap(([k, v]) =>
          Array.isArray(v) ? v.map((val) => [k, val]) : v ? [[k, v]] : []
        )
      ).toString()
    : "";

  redirect(`/compare${query ? `?${query}` : ""}#details`);
}
