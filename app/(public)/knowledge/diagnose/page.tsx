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
        <nav className="mb-4 text-sm text-stone-400">
          <Link
            href="/knowledge"
            className="hover:text-stone-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 focus-visible:ring-offset-2 rounded"
          >
            古着図鑑
          </Link>
          <span className="mx-2">/</span>
          <span className="text-stone-600">年代判別</span>
        </nav>
        <h1 className="mb-1 text-2xl font-bold text-stone-900">年代判別</h1>
        <p className="text-sm text-stone-500">
          {flow.brand} {flow.targetItem} の年代をQ&Aで判別する
        </p>
      </header>

      <DiagnosticFlowUI flow={flow} />
    </main>
  );
}
