import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { MediaPickerDemo } from "@/components/media/media-picker-demo";
import type { MediaAsset } from "@/lib/media/media-types";

const selectedAsset: MediaAsset = {
  createdAt: "2026-06-26T10:00:00.000Z",
  fileName: "hero.png",
  id: "media-1",
  mimeType: "image/png",
  originalName: "Hero image.png",
  sizeBytes: 2048,
  status: "READY",
  updatedAt: "2026-06-26T10:00:00.000Z"
};

vi.mock("@/components/media/media-picker", () => ({
  MediaPicker: ({
    onSelect,
    trigger
  }: {
    onSelect: (asset: MediaAsset) => void;
    trigger: ReactNode;
  }) => (
    <div>
      {trigger}
      <button type="button" onClick={() => onSelect(selectedAsset)}>
        Simular selecao
      </button>
    </div>
  )
}));

describe("MediaPickerDemo", () => {
  it("surfaces the selected media back to the parent UI", async () => {
    const user = userEvent.setup();

    render(<MediaPickerDemo />);

    expect(screen.getByText("Nenhum asset selecionado ainda.")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Simular selecao" }));

    expect(screen.getByText("Hero image.png")).toBeTruthy();
    expect(screen.getByText("PNG · 2 KB")).toBeTruthy();
  });
});
