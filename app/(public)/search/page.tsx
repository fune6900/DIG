import { SearchIcon } from "@/components/ui/icons";

export default function SearchPlaceholderPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <div className="flex flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-denim/10 text-denim dark:bg-offwhite/10 dark:text-offwhite">
          <SearchIcon width={28} height={28} />
        </div>
        <h1 className="font-display text-3xl tracking-widest text-denim-dark dark:text-offwhite">
          着こなし検索
        </h1>
        <p className="text-sm text-denim/60 dark:text-offwhite/50 max-w-md">
          コーデのアイデアを検索する機能は準備中。
        </p>
      </div>
    </main>
  );
}
