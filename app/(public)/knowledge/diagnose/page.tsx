import { notFound } from "next/navigation";
import Link from "next/link";
import { getFlowById } from "@/lib/diagnostic-flows";
import { DiagnosticFlowUI } from "@/components/features/knowledge/DiagnosticFlowUI";

export default function DiagnosePage() {
  const flow = getFlowById("levis");

  if (!flow) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <header className="mb-8">
        <nav className="mb-4 text-xs tracking-widest text-denim/40 uppercase dark:text-offwhite/30">
          <Link
            href="/knowledge"
            className="hover:text-denim focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2 rounded dark:hover:text-offwhite"
          >
            古着図鑑
          </Link>
          <span className="mx-2">/</span>
          <span className="text-denim/60 dark:text-offwhite/50">年代判別</span>
        </nav>
        <h1 className="font-display mb-1 text-4xl tracking-widest text-denim-dark dark:text-offwhite">
          年代判別
        </h1>
        <p className="text-sm text-denim/50 dark:text-offwhite/40">
          {flow.brand} {flow.targetItem} の年代をQ&Aで判別する
        </p>
      </header>

      <DiagnosticFlowUI flow={flow} />
    </main>
  );
}
