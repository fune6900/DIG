import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OotdEditForm } from "@/components/features/ootd/OotdEditForm";
import type { Ootd } from "@/types/ootd";

const mockOotd: Ootd = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  imageUrl: "https://example.com/ootd.jpg",
  oneLiner: "ヴィンテージデニムで決めた今日のコーデ",
  colorPalette: [],
  styles: [],
  description: "test",
  detectedItems: [],
  date: new Date("2026-05-12T00:00:00Z"),
  tags: ["古着", "デニム"],
  createdAt: new Date("2026-05-12T10:00:00Z"),
  updatedAt: new Date("2026-05-12T10:00:00Z"),
};

describe("OotdEditForm", () => {
  it("初期表示で日付が YYYY/MM/DD 形式で表示される", () => {
    render(
      <OotdEditForm
        ootd={mockOotd}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        isSubmitting={false}
      />,
    );
    const dateInput = screen.getByLabelText(/投稿年月日/) as HTMLInputElement;
    expect(dateInput.value).toBe("2026/05/12");
  });

  it("初期表示でタグが # なしで表示される", () => {
    render(
      <OotdEditForm
        ootd={mockOotd}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        isSubmitting={false}
      />,
    );
    expect(screen.getByText("古着")).toBeInTheDocument();
    expect(screen.getByText("デニム")).toBeInTheDocument();
    expect(screen.queryByText("#古着")).not.toBeInTheDocument();
    expect(screen.queryByText("#デニム")).not.toBeInTheDocument();
  });

  it("保存ボタンで onSubmit が呼ばれる（変更なし）", async () => {
    const onSubmit = vi.fn();
    render(
      <OotdEditForm
        ootd={mockOotd}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
        isSubmitting={false}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /保存/ }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    const arg = onSubmit.mock.calls[0][0];
    expect(arg.date).toBeInstanceOf(Date);
    expect(arg.tags).toEqual(["古着", "デニム"]);
  });

  it("日付を変更して保存すると新しい Date が onSubmit に渡る", async () => {
    const onSubmit = vi.fn();
    render(
      <OotdEditForm
        ootd={mockOotd}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
        isSubmitting={false}
      />,
    );
    const dateInput = screen.getByLabelText(/投稿年月日/);
    await userEvent.clear(dateInput);
    await userEvent.type(dateInput, "2026/06/01");
    await userEvent.click(screen.getByRole("button", { name: /保存/ }));
    const arg = onSubmit.mock.calls[0][0];
    expect(arg.date.getFullYear()).toBe(2026);
    expect(arg.date.getMonth()).toBe(5);
    expect(arg.date.getDate()).toBe(1);
  });

  it("不正な日付形式ではエラーが表示され onSubmit が呼ばれない", async () => {
    const onSubmit = vi.fn();
    render(
      <OotdEditForm
        ootd={mockOotd}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
        isSubmitting={false}
      />,
    );
    const dateInput = screen.getByLabelText(/投稿年月日/);
    await userEvent.clear(dateInput);
    await userEvent.type(dateInput, "not-a-date");
    await userEvent.click(screen.getByRole("button", { name: /保存/ }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("タグ削除ボタンでタグが削除される", async () => {
    const onSubmit = vi.fn();
    render(
      <OotdEditForm
        ootd={mockOotd}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
        isSubmitting={false}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "古着を削除" }));
    await userEvent.click(screen.getByRole("button", { name: /保存/ }));
    expect(onSubmit.mock.calls[0][0].tags).toEqual(["デニム"]);
  });

  it("タグを追加して保存できる", async () => {
    const onSubmit = vi.fn();
    render(
      <OotdEditForm
        ootd={mockOotd}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
        isSubmitting={false}
      />,
    );
    const tagInput = screen.getByPlaceholderText(/タグを入力/);
    await userEvent.type(tagInput, "90s");
    await userEvent.click(screen.getByRole("button", { name: "追加" }));
    await userEvent.click(screen.getByRole("button", { name: /保存/ }));
    expect(onSubmit.mock.calls[0][0].tags).toEqual(["古着", "デニム", "90s"]);
  });

  it("キャンセルボタンで onCancel が呼ばれる", async () => {
    const onCancel = vi.fn();
    render(
      <OotdEditForm
        ootd={mockOotd}
        onSubmit={vi.fn()}
        onCancel={onCancel}
        isSubmitting={false}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "キャンセル" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
