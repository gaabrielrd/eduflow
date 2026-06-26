import { beforeEach, describe, expect, it, vi } from "vitest";

import { MediaLibraryScreen } from "@/components/media/media-library-screen";
import { useSession } from "@/hooks/use-session";
import {
  deleteMediaAsset,
  listMediaAssets
} from "@/lib/media/media-library-service";
import type { MediaAsset } from "@/lib/media/media-types";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/hooks/use-session", () => ({
  useSession: vi.fn()
}));

vi.mock("@/lib/media/media-library-service", () => ({
  deleteMediaAsset: vi.fn(),
  listMediaAssets: vi.fn()
}));

const uploadedAsset: MediaAsset = {
  createdAt: "2026-06-26T10:00:00.000Z",
  fileName: "hero.png",
  id: "media-1",
  mimeType: "image/png",
  originalName: "Hero.png",
  sizeBytes: 2048,
  status: "READY",
  updatedAt: "2026-06-26T10:00:00.000Z"
};

const existingAsset: MediaAsset = {
  createdAt: "2026-06-25T09:00:00.000Z",
  fileName: "welcome-guide.pdf",
  id: "media-2",
  mimeType: "application/pdf",
  originalName: "Welcome Guide.pdf",
  sizeBytes: 4096,
  status: "READY",
  updatedAt: "2026-06-25T09:00:00.000Z"
};

const useSessionMock = vi.mocked(useSession);
const listMediaAssetsMock = vi.mocked(listMediaAssets);
const deleteMediaAssetMock = vi.mocked(deleteMediaAsset);

vi.mock("@/components/media/media-uploader", () => ({
  MediaUploader: ({ onUploaded }: { onUploaded: (asset: MediaAsset) => void }) => (
    <button onClick={() => onUploaded(uploadedAsset)} type="button">
      Simular upload
    </button>
  )
}));

describe("MediaLibraryScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSessionMock.mockReturnValue({
      activeOrganizationId: "org-1",
      createOrganization: vi.fn(),
      hasOrganization: true,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      organizations: [
        {
          id: "org-1",
          name: "EduFlow Studio",
          role: "OWNER",
          slug: "eduflow-studio"
        }
      ],
      refreshSession: vi.fn(),
      register: vi.fn(),
      session: null,
      setActiveOrganizationId: vi.fn(),
      user: {
        email: "owner@eduflow.dev",
        id: "user-1",
        name: "Owner"
      }
    });
  });

  it("shows loading state while media assets are being fetched", () => {
    listMediaAssetsMock.mockReturnValue(new Promise<MediaAsset[]>(() => undefined));

    render(<MediaLibraryScreen />);

    expect(screen.getByText("Carregando biblioteca de midia")).toBeTruthy();
  });

  it("shows error state and retry affordance when the initial load fails", async () => {
    listMediaAssetsMock.mockRejectedValue(new Error("Falha ao carregar"));

    render(<MediaLibraryScreen />);

    expect(
      await screen.findByText("Nao foi possivel carregar a biblioteca de midia")
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeTruthy();
  });

  it("shows empty state when there are no assets", async () => {
    listMediaAssetsMock.mockResolvedValue([]);

    render(<MediaLibraryScreen />);

    expect(await screen.findByText("Nenhum arquivo encontrado")).toBeTruthy();
  });

  it("renders persisted assets, metadata, and filters them by search", async () => {
    const user = userEvent.setup();
    listMediaAssetsMock.mockResolvedValue([existingAsset, uploadedAsset]);

    render(<MediaLibraryScreen />);

    expect(await screen.findByText("Welcome Guide.pdf")).toBeTruthy();
    expect(screen.getByText("PDF")).toBeTruthy();
    expect(screen.getByText("4 KB")).toBeTruthy();

    await user.type(screen.getByLabelText("Buscar arquivos de midia"), "hero");

    expect(screen.getByText("Hero.png")).toBeTruthy();
    expect(screen.queryByText("Welcome Guide.pdf")).toBeNull();
  });

  it("shows the empty-search state when the query has no matches", async () => {
    const user = userEvent.setup();
    listMediaAssetsMock.mockResolvedValue([existingAsset]);

    render(<MediaLibraryScreen />);

    expect(await screen.findByText("Welcome Guide.pdf")).toBeTruthy();

    await user.type(screen.getByLabelText("Buscar arquivos de midia"), "missing");

    expect(await screen.findByText("Nenhum resultado para a busca")).toBeTruthy();
  });

  it("adds a newly uploaded asset to the rendered list", async () => {
    const user = userEvent.setup();
    listMediaAssetsMock.mockResolvedValue([existingAsset]);

    render(<MediaLibraryScreen />);

    expect(await screen.findByText("Welcome Guide.pdf")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Simular upload" }));

    expect(await screen.findByText("Hero.png")).toBeTruthy();
    expect(screen.getByText("hero.png")).toBeTruthy();
  });

  it("removes a media item from the list after successful deletion", async () => {
    const user = userEvent.setup();
    listMediaAssetsMock.mockResolvedValue([existingAsset]);
    deleteMediaAssetMock.mockResolvedValue({
      ...existingAsset,
      status: "DELETED"
    });

    render(<MediaLibraryScreen />);

    expect(await screen.findByText("Welcome Guide.pdf")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Remover" }));

    await waitFor(() => {
      expect(screen.queryByText("Welcome Guide.pdf")).toBeNull();
    });
  });

  it("keeps the media item visible and shows retry feedback when deletion fails", async () => {
    const user = userEvent.setup();
    listMediaAssetsMock.mockResolvedValue([existingAsset]);
    deleteMediaAssetMock.mockRejectedValue(new Error("Falha ao remover"));

    render(<MediaLibraryScreen />);

    expect(await screen.findByText("Welcome Guide.pdf")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Remover" }));

    expect(await screen.findByText("Falha ao remover")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Tentar remover novamente" })).toBeTruthy();
    expect(screen.getByText("Welcome Guide.pdf")).toBeTruthy();
  });
});
