"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ConditionsForm } from "@/components/features/search/ConditionsForm";

export function ConditionsRouteClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialQuery = searchParams.get("query") ?? "";
  const initialStyles = (searchParams.get("styles") ?? "")
    .split(",")
    .filter(Boolean);
  const initialColors = (searchParams.get("colors") ?? "")
    .split(",")
    .filter(Boolean);

  function handleSearch(params: {
    query: string;
    styles: string[];
    colors: string[];
  }) {
    const urlParams = new URLSearchParams();
    if (params.query) urlParams.set("query", params.query);
    if (params.styles.length > 0)
      urlParams.set("styles", params.styles.join(","));
    if (params.colors.length > 0)
      urlParams.set("colors", params.colors.join(","));
    router.push(`/search?${urlParams.toString()}`);
  }

  function handleReset() {
    router.replace("/search/conditions");
  }

  return (
    <ConditionsForm
      initialQuery={initialQuery}
      initialStyles={initialStyles}
      initialColors={initialColors}
      onSearch={handleSearch}
      onReset={handleReset}
    />
  );
}
