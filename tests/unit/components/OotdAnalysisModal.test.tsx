// ---------------------------------------------------------------------------
// OotdAnalysisModal の dismissal 挙動を検証する。
// 生成中（isLoading=true）にバックドロップをタップしても onClose が呼ばれない
// ことを保証する。これがないと、AI 分析中に画面外タップで処理が打ち切られる。
// ---------------------------------------------------------------------------

import { render, screen, fireEvent } from "@testing-library/react";
import { OotdAnalysisModal } from "@/components/features/ootd/OotdAnalysisModal";

describe("OotdAnalysisModal — 分析中のバックドロップ操作", () => {
  it("isLoading=true のときにバックドロップをタップしても onClose が呼ばれない", () => {
    const onClose = vi.fn();
    const onNext = vi.fn();
    render(
      <OotdAnalysisModal isOpen isLoading onClose={onClose} onNext={onNext} />,
    );

    const backdrop = screen.getByTestId("ootd-analysis-backdrop");
    fireEvent.click(backdrop);

    expect(onClose).not.toHaveBeenCalled();
  });

  it("isLoading=false のときはバックドロップをタップすると onClose が呼ばれる", () => {
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

    const backdrop = screen.getByTestId("ootd-analysis-backdrop");
    fireEvent.click(backdrop);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
