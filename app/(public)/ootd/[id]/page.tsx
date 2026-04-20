import { notFound } from "next/navigation";
import { getOotdByIdAction } from "@/app/actions/ootd";
import { OotdDetailPage } from "./OotdDetailPage";

interface OotdDetailRouteProps {
  params: Promise<{ id: string }>;
}

export default async function OotdDetailRoute({ params }: OotdDetailRouteProps) {
  const { id } = await params;
  const result = await getOotdByIdAction(id);

  if (
    result.error?.code === "NOT_FOUND" ||
    result.error?.code === "VALIDATION_ERROR"
  ) {
    notFound();
  }

  if (result.error) {
    throw new Error(result.error.message);
  }

  const ootd = result.data!;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <OotdDetailPage ootd={ootd} />
    </main>
  );
}
