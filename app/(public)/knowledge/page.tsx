import { searchKnowledgeAction } from "@/app/actions/knowledge";
import { KnowledgeSearchForm } from "@/components/features/knowledge/KnowledgeSearchForm";
import { KnowledgeList } from "@/components/features/knowledge/KnowledgeList";
import { Pagination } from "@/components/ui/Pagination";

const CATEGORIES = [
  "スウェット",
  "Tシャツ",
  "デニム",
  "ジャケット",
  "ミリタリー",
  "ワーク",
  "スポーツ",
  "その他",
];

const ERAS = [
  "1940s",
  "1950s",
  "1960s",
  "1970s",
  "1980s",
  "1990s",
  "2000s",
  "2010s",
];

interface KnowledgePageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    era?: string;
    page?: string;
  }>;
}

export default async function KnowledgePage({ searchParams }: KnowledgePageProps) {
  const params = await searchParams;
  const result = await searchKnowledgeAction({
    query: params.q,
    category: params.category,
    era: params.era,
    page: params.page,
  });

  if (result.error && result.error.code !== "VALIDATION_ERROR") {
    throw new Error(result.error.message);
  }

  const data = result.data ?? { items: [], total: 0, page: 1, totalPages: 0 };

  // Pagination に渡す baseUrl を構築（page パラメータを除いた部分）
  const baseParams = new URLSearchParams();
  if (params.q) baseParams.set("q", params.q);
  if (params.category) baseParams.set("category", params.category);
  if (params.era) baseParams.set("era", params.era);
  const baseUrl = `/knowledge?${baseParams.toString()}`;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <header className="mb-8">
        <h1 className="mb-1 text-2xl font-bold text-stone-900">古着図鑑</h1>
        <p className="text-sm text-stone-500">
          ブランド・年代・特徴から古着を調べる
        </p>
      </header>

      <div className="mb-6 rounded-xl bg-stone-50 p-4 border border-stone-200">
        <KnowledgeSearchForm
          defaultQuery={params.q}
          defaultCategory={params.category}
          defaultEra={params.era}
          categories={CATEGORIES}
          eras={ERAS}
        />
      </div>

      <KnowledgeList result={data} searchQuery={params.q} />

      <Pagination
        currentPage={data.page}
        totalPages={data.totalPages}
        baseUrl={baseUrl}
      />
    </main>
  );
}
