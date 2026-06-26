import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { MediaPicker } from "@/components/media/media-picker";
import { listMediaAssets } from "@/lib/media/media-library-service";
import type { MediaAsset } from "@/lib/media/media-types";

vi.mock("@/lib/media/media-library-service", () => ({
  listMediaAssets: vi.fn()
}));

const firstAsset: MediaAsset = {
  createdAt: "2026-06-26T10:00:00.000Z",
  fileName: "hero.png",
  id: "media-1",
  mimeType: "image/png",
  originalName: "Hero image.png",
  sizeBytes: 2048,
  status: "READY",
  updatedAt: "2026-06-26T10:00:00.000Z"
};

const secondAsset: MediaAsset = {
  createdAt: "2026-06-25T09:00:00.000Z",
  fileName: "welcome-guide.pdf",
  id: "media-2",
  mimeType: "application/pdf",
  originalName: "Welcome Guide.pdf",
  sizeBytes: 4096,
  status: "READY",
  updatedAt: "2026-06-25T09:00:00.000Z"
};

const listMediaAssetsMock = vi.mocked(listMediaAssets);

describe("MediaPicker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("opens from the default trigger and shows loading while assets are being fetched", async () => {
    const user = userEvent.setup();
    listMediaAssetsMock.mockReturnValue(new Promise<MediaAsset[]>(() => undefined));

    render(<MediaPicker onSelect={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Selecionar midia" }));

    expect(await screen.findByText("Carregando biblioteca de midia")).toBeTruthy();
  });

  it("shows an error state and retries after a failed load", async () => {
    const user = userEvent.setup();
    listMediaAssetsMock
      .mockRejectedValueOnce(new Error("Falha ao carregar"))
      .mockResolvedValueOnce([firstAsset]);

    render(<MediaPicker onSelect={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Selecionar midia" }));

    expect(
      await screen.findByText("Nao foi possivel carregar a biblioteca de midia")
    ).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(await screen.findByText("Hero image.png")).toBeTruthy();
  });

  it("shows the empty library state when no assets are returned", async () => {
    const user = userEvent.setup();
    listMediaAssetsMock.mockResolvedValue([]);

    render(<MediaPicker onSelect={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Selecionar midia" }));

    expect(await screen.findByText("Nenhum arquivo encontrado")).toBeTruthy();
  });

  it("filters assets by original name and stored file name", async () => {
    const user = userEvent.setup();
    listMediaAssetsMock.mockResolvedValue([firstAsset, secondAsset]);

    render(<MediaPicker onSelect={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Selecionar midia" }));
    expect(await screen.findByText("Welcome Guide.pdf")).toBeTruthy();

    await user.type(screen.getByLabelText("Buscar arquivos de midia"), "hero");

    expect(screen.getByText("Hero image.png")).toBeTruthy();
    expect(screen.queryByText("Welcome Guide.pdf")).toBeNull();
  });

  it("shows the empty-search state when the query has no matches", async () => {
    const user = userEvent.setup();
    listMediaAssetsMock.mockResolvedValue([secondAsset]);

    render(<MediaPicker onSelect={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Selecionar midia" }));
    expect(await screen.findByText("Welcome Guide.pdf")).toBeTruthy();

    await user.type(screen.getByLabelText("Buscar arquivos de midia"), "missing");

    expect(await screen.findByText("Nenhum resultado para a busca")).toBeTruthy();
  });

  it("selects one item, enables confirm, and returns it to the parent", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    listMediaAssetsMock.mockResolvedValue([firstAsset, secondAsset]);

    render(<MediaPicker onSelect={onSelect} />);

    await user.click(screen.getByRole("button", { name: "Selecionar midia" }));

    const confirmButton = await screen.findByRole("button", {
      name: "Confirmar selecao"
    });
    expect(confirmButton).toBeDisabled();

    await user.click(screen.getByText("Hero image.png"));

    expect(confirmButton).not.toBeDisabled();

    await user.click(confirmButton);

    expect(onSelect).toHaveBeenCalledWith(firstAsset);
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });

  it("cancels without returning the selected media", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    listMediaAssetsMock.mockResolvedValue([firstAsset]);

    render(<MediaPicker onSelect={onSelect} />);

    await user.click(screen.getByRole("button", { name: "Selecionar midia" }));
    await user.click(await screen.findByText("Hero image.png"));
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onSelect).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });

  it("does not keep a stale pending selection after dismissing and reopening", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    listMediaAssetsMock.mockResolvedValue([firstAsset]);

    render(<MediaPicker onSelect={onSelect} />);

    await user.click(screen.getByRole("button", { name: "Selecionar midia" }));
    await user.click(await screen.findByText("Hero image.png"));
    await user.click(screen.getByRole("button", { name: "Close" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    await user.click(screen.getByRole("button", { name: "Selecionar midia" }));

    expect(await screen.findByText("Hero image.png")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Confirmar selecao" })
    ).toBeDisabled();
    expect(onSelect).not.toHaveBeenCalled();
  });
});
