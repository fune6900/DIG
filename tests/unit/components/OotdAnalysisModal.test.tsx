// ---------------------------------------------------------------------------
// OotdAnalysisModal の dismissal 挙動を検証する。
// バックドロップ（背面）タップでは onClose が呼ばれない。
// 分析中（処理キャンセル防止）／結果プレビュー中（誤離脱防止）の両方で同じ仕様。
// 閉じる動線は ✕ ボタンと「次へ」のみ。
// ---------------------------------------------------------------------------

import { render, screen, fireEvent } from "@testing-library/react";
import { OotdAnalysisModal } from "@/components/features/ootd/OotdAnalysisModal";

describe("OotdAnalysisModal — バックドロップ無効化", () => {
  it("isLoading=true のときにバックドロップをタップしても onClose が呼ばれない", () => {
    const onClose = vi.fn();
    const onNext = vi.fn();
    render(
      <OotdAnalysisModal isOpen isLoading onClose={onClose} onNext={onNext} />,
    );

    fireEvent.click(screen.getByTestId("ootd-analysis-backdrop"));

    expect(onClose).not.toHaveBeenCalled();
  });

  it("結果プレビュー表示中（isLoading=false）にバックドロップをタップしても onClose が呼ばれない", () => {
    const onClose = vi.fn();
    const onNext = vi.fn();
    render(
      <OotdAnalysisModal
        isOpen
        isLoading={false}
        analysisResult={{
          oneLiner: "テストコーデ",
          description: "説明",
          colorPalette: [],
          styles: [],
          detectedItems: [],
        }}
        onClose={onClose}
        onNext={onNext}
      />,
    );

    fireEvent.click(screen.getByTestId("ootd-analysis-backdrop"));

    expect(onClose).not.toHaveBeenCalled();
  });

  it("結果プレビューの ✕ ボタンを押すと onClose が呼ばれる", () => {
    const onClose = vi.fn();
    const onNext = vi.fn();
    render(
      <OotdAnalysisModal
        isOpen
        isLoading={false}
        analysisResult={{
          oneLiner: "テストコーデ",
          description: "説明",
          colorPalette: [],
          styles: [],
          detectedItems: [],
        }}
        onClose={onClose}
        onNext={onNext}
      />,
    );

    fireEvent.click(screen.getByLabelText("閉じる"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
