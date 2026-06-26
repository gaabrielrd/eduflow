import { describe, expect, it, vi } from "vitest";

import { MediaLibraryScreen } from "@/components/media/media-library-screen";
import type { MediaAsset } from "@/lib/media/media-types";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mediaAsset: MediaAsset = {
  createdAt: "2026-06-26T10:00:00.000Z",
  fileName: "hero.png",
  id: "media-1",
  mimeType: "image/png",
  originalName: "Hero.png",
  sizeBytes: 2048,
  status: "READY",
  updatedAt: "2026-06-26T10:00:00.000Z"
};

vi.mock("@/components/media/media-uploader", () => ({
  MediaUploader: ({ onUploaded }: { onUploaded: (asset: MediaAsset) => void }) => (
    <button onClick={() => onUploaded(mediaAsset)} type="button">
      Simular upload
    </button>
  )
}));

describe("MediaLibraryScreen", () => {
  it("shows the created asset summary after upload success", async () => {
    const user = userEvent.setup();

    render(<MediaLibraryScreen />);

    expect(screen.getByText("Nenhum asset criado nesta sessao")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Simular upload" }));

    expect(await screen.findByText("Ultimo asset criado")).toBeTruthy();
    expect(screen.getByText("Hero.png")).toBeTruthy();
    expect(screen.getByText("hero.png")).toBeTruthy();
  });
});
