// ---------------------------------------------------------------------------
// ImagePickerSheet のユニットテスト（Red フェーズ）
//
// SP/PC 共通の画像ピッカーシート。
// - アルバム選択 / カメラ撮影 を分岐できる
// - open=false 時は何も描画しない
// - ESC / バックドロップで onClose
// - ファイル選択で onPick(file)
// ---------------------------------------------------------------------------

import { render, screen, fireEvent } from "@testing-library/react";
import { ImagePickerSheet } from "@/components/features/search/ImagePickerSheet";

function makeJpegFile(name = "outfit.jpg") {
  return new File([new Uint8Array([0xff, 0xd8, 0xff])], name, {
    type: "image/jpeg",
  });
}

describe("ImagePickerSheet", () => {
  describe("表示制御", () => {
    it("open=false のときダイアログは描画されない", () => {
      render(
        <ImagePickerSheet open={false} onClose={vi.fn()} onPick={vi.fn()} />,
      );
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("open=true のときダイアログが表示される", () => {
      render(
        <ImagePickerSheet open={true} onClose={vi.fn()} onPick={vi.fn()} />,
      );
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("open=true のとき『アルバムから選択』『カメラで撮影』ボタンが表示される", () => {
      render(
        <ImagePickerSheet open={true} onClose={vi.fn()} onPick={vi.fn()} />,
      );
      expect(
        screen.getByRole("button", { name: /アルバムから選択/ }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /カメラで撮影/ }),
      ).toBeInTheDocument();
    });
  });

  describe("file input の属性", () => {
    it("アルバム用 input には capture 属性が無い", () => {
      render(
        <ImagePickerSheet open={true} onClose={vi.fn()} onPick={vi.fn()} />,
      );
      const albumInput = screen.getByTestId(
        "image-search-album-input",
      ) as HTMLInputElement;
      expect(albumInput.type).toBe("file");
      expect(albumInput.accept).toBe("image/*");
      expect(albumInput.hasAttribute("capture")).toBe(false);
    });

    it("カメラ用 input には capture='environment' が付く", () => {
      render(
        <ImagePickerSheet open={true} onClose={vi.fn()} onPick={vi.fn()} />,
      );
      const cameraInput = screen.getByTestId(
        "image-search-camera-input",
      ) as HTMLInputElement;
      expect(cameraInput.type).toBe("file");
      expect(cameraInput.accept).toBe("image/*");
      expect(cameraInput.getAttribute("capture")).toBe("environment");
    });
  });

  describe("ファイル選択", () => {
    it("アルバム用 input でファイルを選ぶと onPick が呼ばれる", () => {
      const onPick = vi.fn();
      render(
        <ImagePickerSheet open={true} onClose={vi.fn()} onPick={onPick} />,
      );

      const albumInput = screen.getByTestId(
        "image-search-album-input",
      ) as HTMLInputElement;
      const file = makeJpegFile("album.jpg");
      fireEvent.change(albumInput, { target: { files: [file] } });

      expect(onPick).toHaveBeenCalledTimes(1);
      expect(onPick).toHaveBeenCalledWith(file);
    });

    it("カメラ用 input でファイルを選ぶと onPick が呼ばれる", () => {
      const onPick = vi.fn();
      render(
        <ImagePickerSheet open={true} onClose={vi.fn()} onPick={onPick} />,
      );

      const cameraInput = screen.getByTestId(
        "image-search-camera-input",
      ) as HTMLInputElement;
      const file = makeJpegFile("camera.jpg");
      fireEvent.change(cameraInput, { target: { files: [file] } });

      expect(onPick).toHaveBeenCalledTimes(1);
      expect(onPick).toHaveBeenCalledWith(file);
    });
  });

  describe("クローズ操作", () => {
    it("『キャンセル』ボタンクリックで onClose が呼ばれる", () => {
      const onClose = vi.fn();
      render(
        <ImagePickerSheet open={true} onClose={onClose} onPick={vi.fn()} />,
      );

      fireEvent.click(screen.getByRole("button", { name: /キャンセル/ }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("ESC キー押下で onClose が呼ばれる", () => {
      const onClose = vi.fn();
      render(
        <ImagePickerSheet open={true} onClose={onClose} onPick={vi.fn()} />,
      );

      fireEvent.keyDown(window, { key: "Escape" });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("バックドロップクリックで onClose が呼ばれる", () => {
      const onClose = vi.fn();
      render(
        <ImagePickerSheet open={true} onClose={onClose} onPick={vi.fn()} />,
      );

      const backdrop = screen.getByTestId("image-picker-sheet-backdrop");
      fireEvent.click(backdrop);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("open=false のとき ESC を押しても onClose は呼ばれない", () => {
      const onClose = vi.fn();
      render(
        <ImagePickerSheet open={false} onClose={onClose} onPick={vi.fn()} />,
      );

      fireEvent.keyDown(window, { key: "Escape" });

      expect(onClose).not.toHaveBeenCalled();
    });
  });
});
