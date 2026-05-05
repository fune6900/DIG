import { render, screen, fireEvent } from "@testing-library/react";

// useRouter / Server Action / useIsMobile を差し替えてレンダリング可能にする。
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/app/actions/ootd", () => ({
  createOotdAction: vi.fn(),
}));

const useIsMobileMock = vi.fn();
vi.mock("@/hooks/useIsMobile", () => ({
  useIsMobile: () => useIsMobileMock(),
}));

import { OotdNewPageClient } from "@/app/(public)/ootd/new/OotdNewPageClient";

function getCameraInput(): HTMLInputElement {
  return screen.getByLabelText("コーデ画像（カメラ）", {
    selector: "input",
  }) as HTMLInputElement;
}

function getGalleryInput(): HTMLInputElement {
  return screen.getByLabelText("コーデ画像（写真ライブラリ）", {
    selector: "input",
  }) as HTMLInputElement;
}

describe("OotdNewPageClient — アップロード入力の構成", () => {
  beforeEach(() => {
    useIsMobileMock.mockReset();
  });

  it("カメラ用 input は常に capture='environment' を持つ（モバイル時のみ click される）", () => {
    useIsMobileMock.mockReturnValue(true);
    render(<OotdNewPageClient />);
    expect(getCameraInput().getAttribute("capture")).toBe("environment");
  });

  it("ライブラリ用 input は capture 属性を持たない", () => {
    useIsMobileMock.mockReturnValue(true);
    render(<OotdNewPageClient />);
    expect(getGalleryInput().hasAttribute("capture")).toBe(false);
  });

  it("PC でもカメラ用とライブラリ用の input が両方存在する（aria-label で区別可能）", () => {
    useIsMobileMock.mockReturnValue(false);
    render(<OotdNewPageClient />);
    expect(getCameraInput()).toBeInTheDocument();
    expect(getGalleryInput()).toBeInTheDocument();
  });
});

describe("OotdNewPageClient — SP 2 択シート", () => {
  beforeEach(() => {
    useIsMobileMock.mockReset();
  });

  it("SP でアップロード領域をタップすると 2 択シートが開く", () => {
    useIsMobileMock.mockReturnValue(true);
    render(<OotdNewPageClient />);

    expect(screen.queryByRole("dialog")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /画像を選択/ }));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /カメラを起動/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /写真ライブラリから選ぶ/ }),
    ).toBeInTheDocument();
  });

  it("PC でアップロード領域をタップしてもシートは出ない（直接ファイル選択ダイアログ）", () => {
    useIsMobileMock.mockReturnValue(false);
    render(<OotdNewPageClient />);

    fireEvent.click(screen.getByRole("button", { name: /画像を選択/ }));

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("シートで「カメラを起動」をタップするとカメラ用 input.click() が呼ばれ、シートが閉じる", () => {
    useIsMobileMock.mockReturnValue(true);
    render(<OotdNewPageClient />);

    const cameraClickSpy = vi.spyOn(getCameraInput(), "click");
    const galleryClickSpy = vi.spyOn(getGalleryInput(), "click");

    fireEvent.click(screen.getByRole("button", { name: /画像を選択/ }));
    fireEvent.click(screen.getByRole("button", { name: /カメラを起動/ }));

    expect(cameraClickSpy).toHaveBeenCalledTimes(1);
    expect(galleryClickSpy).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("シートで「写真ライブラリから選ぶ」をタップするとライブラリ用 input.click() が呼ばれ、シートが閉じる", () => {
    useIsMobileMock.mockReturnValue(true);
    render(<OotdNewPageClient />);

    const cameraClickSpy = vi.spyOn(getCameraInput(), "click");
    const galleryClickSpy = vi.spyOn(getGalleryInput(), "click");

    fireEvent.click(screen.getByRole("button", { name: /画像を選択/ }));
    fireEvent.click(
      screen.getByRole("button", { name: /写真ライブラリから選ぶ/ }),
    );

    expect(galleryClickSpy).toHaveBeenCalledTimes(1);
    expect(cameraClickSpy).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("シートに「キャンセル」ボタンがあり、押すと閉じる", () => {
    useIsMobileMock.mockReturnValue(true);
    render(<OotdNewPageClient />);

    fireEvent.click(screen.getByRole("button", { name: /画像を選択/ }));
    fireEvent.click(screen.getByRole("button", { name: /キャンセル/ }));

    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
