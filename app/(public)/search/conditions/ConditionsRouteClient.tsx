"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ConditionsForm } from "@/components/features/search/ConditionsForm";
import { buildKeywordFromConditions } from "@/lib/conditions-keyword";

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
    const keyword = buildKeywordFromConditions(params);
    if (keyword.length === 0) {
      router.push("/search");
      return;
    }
    const urlParams = new URLSearchParams({ query: keyword });
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
