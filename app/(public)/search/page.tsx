import { Suspense } from "react";
import { SearchPage } from "@/components/features/search/SearchPage";
import { FullScreenLoader } from "@/components/ui/Spinner";

export default function SearchPageRoute() {
  return (
    <Suspense fallback={<FullScreenLoader label="読み込み中" />}>
      <SearchPage />
    </Suspense>
  );
}
