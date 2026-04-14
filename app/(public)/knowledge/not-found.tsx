import Link from "next/link";

export default function KnowledgeNotFound() {
  return (
    <div>
      <p>アイテムが見つかりませんでした</p>
      <Link href="/knowledge">一覧に戻る</Link>
    </div>
  );
}
