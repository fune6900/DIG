import Link from "next/link";

export function ConditionsLink() {
  return (
    <Link
      href="/search/conditions"
      className="inline-flex items-center gap-1.5 rounded-none border border-denim/30 bg-transparent px-4 py-2 text-sm font-medium tracking-wide text-denim dark:border-denim-light/30 dark:text-denim-light transition-colors hover:border-denim hover:bg-denim/5 dark:hover:border-denim-light dark:hover:bg-denim-light/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2"
    >
      こだわり条件を選択
    </Link>
  );
}
