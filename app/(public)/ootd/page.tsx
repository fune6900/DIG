import Link from "next/link";
import { listOotdsAction } from "@/app/actions/ootd";
import { OotdListClient } from "./OotdListClient";
import type { OotdSummary } from "@/types/ootd";

export default async function OotdPage() {
  const result = await listOotdsAction({ sort: "desc" });

  if (result.error) {
    throw new Error(result.error.message);
  }

  const ootds: OotdSummary[] = (result.data ?? []).map((ootd) => ({
    id: ootd.id,
    imageUrl: ootd.imageUrl,
    oneLiner: ootd.oneLiner,
    date: ootd.date,
    tags: ootd.tags,
    createdAt: ootd.createdAt,
  }));

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <header className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="font-display mb-1 text-4xl tracking-widest text-denim-dark dark:text-offwhite">
            #OOTD
          </h1>
          <p className="text-sm text-denim/50 dark:text-offwhite/40">
            今日のコーデを記録する
          </p>
        </div>
        <Link
          href="/ootd/new"
          className="rounded-sm bg-denim px-4 py-2 text-sm font-medium tracking-widest text-offwhite hover:bg-denim-dark transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2"
        >
          + 追加
        </Link>
      </header>

      <OotdListClient ootds={ootds} />
    </main>
  );
}
