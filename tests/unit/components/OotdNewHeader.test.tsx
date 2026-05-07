// ---------------------------------------------------------------------------
// OotdNewHeader: /ootd/new 画面上部のヘッダー。投稿中（isSubmitting=true）は
// 戻るリンクを非表示にして、生成・登録処理中の意図しない遷移を防ぐ。
// ---------------------------------------------------------------------------

import { render, screen } from "@testing-library/react";
import { OotdNewHeader } from "@/components/features/ootd/OotdNewHeader";

describe("OotdNewHeader", () => {
  it("通常時は戻るリンクが表示されている", () => {
    render(<OotdNewHeader isSubmitting={false} />);
    expect(screen.getByLabelText("戻る")).toBeInTheDocument();
  });

  it("投稿中（isSubmitting=true）は戻るリンクが描画されない", () => {
    render(<OotdNewHeader isSubmitting={true} />);
    expect(screen.queryByLabelText("戻る")).toBeNull();
  });

  it("isSubmitting に関わらずタイトルは常に表示される", () => {
    const { rerender } = render(<OotdNewHeader isSubmitting={false} />);
    expect(
      screen.getByRole("heading", { name: "今日のコーデ" }),
    ).toBeInTheDocument();

    rerender(<OotdNewHeader isSubmitting={true} />);
    expect(
      screen.getByRole("heading", { name: "今日のコーデ" }),
    ).toBeInTheDocument();
  });
});
