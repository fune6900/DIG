import { BookmarkList } from "@/components/features/knowledge/BookmarkList";

export default function BookmarksPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold text-stone-900">マイ図鑑</h1>
      <BookmarkList />
    </main>
  );
}
