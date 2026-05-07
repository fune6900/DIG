// ---------------------------------------------------------------------------
// OotdNewHeader: /ootd/new 画面上部のヘッダー。
// - isSubmitting=true は戻るリンクを描画しない（投稿処理中の意図しない離脱を防ぐ）
// - onBack 指定時はリンクではなくボタンとして描画し、押下で onBack を呼ぶ
//   （register 画面 → 分析プレビューに戻すため）
// - onBack 未指定時は /ootd へのリンクを描画
// ---------------------------------------------------------------------------

import { render, screen, fireEvent } from "@testing-library/react";
import { OotdNewHeader } from "@/components/features/ootd/OotdNewHeader";

describe("OotdNewHeader", () => {
  it("通常時（onBack 未指定）は /ootd へのリンクとして戻るが描画される", () => {
    render(<OotdNewHeader isSubmitting={false} />);
    const back = screen.getByLabelText("戻る");
    expect(back).toBeInTheDocument();
    expect(back.tagName.toLowerCase()).toBe("a");
    expect(back.getAttribute("href")).toBe("/ootd");
  });

  it("投稿中（isSubmitting=true）は戻るリンクが描画されない", () => {
    render(<OotdNewHeader isSubmitting={true} />);
    expect(screen.queryByLabelText("戻る")).toBeNull();
  });

  it("onBack 指定時はボタンが描画され、押下で onBack が呼ばれる", () => {
    const onBack = vi.fn();
    render(<OotdNewHeader isSubmitting={false} onBack={onBack} />);
    const back = screen.getByLabelText("戻る");
    expect(back.tagName.toLowerCase()).toBe("button");
    fireEvent.click(back);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("isSubmitting=true なら onBack 指定があっても戻るボタンは描画されない", () => {
    const onBack = vi.fn();
    render(<OotdNewHeader isSubmitting={true} onBack={onBack} />);
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
