import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MediaUploader } from "@/components/media/media-uploader";
import { uploadMediaAsset } from "@/lib/media/media-upload-service";
import type { MediaAsset } from "@/lib/media/media-types";
import {
  fireEvent,
  render,
  screen,
  waitFor
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/lib/media/media-upload-service", () => ({
  isMediaUploadAbortError: (error: unknown) =>
    error instanceof DOMException && error.name === "AbortError",
  uploadMediaAsset: vi.fn()
}));

const uploadMediaAssetMock = vi.mocked(uploadMediaAsset);

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

function createFile(type = "image/png", contents = "hello", name = "hero.png") {
  return new File([contents], name, { type });
}

describe("MediaUploader", () => {
  beforeEach(() => {
    uploadMediaAssetMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("accepts a supported file and returns the created asset to the parent", async () => {
    uploadMediaAssetMock.mockResolvedValue(mediaAsset);

    const onUploaded = vi.fn();
    const user = userEvent.setup();

    render(<MediaUploader onUploaded={onUploaded} />);

    await user.upload(screen.getByLabelText("Selecionar arquivo de midia"), createFile());

    await waitFor(() => {
      expect(uploadMediaAssetMock).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByText("Upload concluido")).toBeTruthy();
    expect(onUploaded).toHaveBeenCalledWith(mediaAsset);
  });

  it("rejects unsupported file types before upload", async () => {
    const user = userEvent.setup({ applyAccept: false });

    render(<MediaUploader onUploaded={vi.fn()} />);

    await user.upload(
      screen.getByLabelText("Selecionar arquivo de midia"),
      createFile("application/zip", "zip", "archive.zip")
    );

    expect(
      await screen.findByText("Formato nao suportado. Use PNG, JPG, WEBP, PDF.")
    ).toBeTruthy();
    expect(uploadMediaAssetMock).not.toHaveBeenCalled();
  });

  it("rejects oversized files before upload", async () => {
    const user = userEvent.setup();

    render(<MediaUploader maxSizeBytes={1} onUploaded={vi.fn()} />);

    await user.upload(
      screen.getByLabelText("Selecionar arquivo de midia"),
      createFile("image/png", "too-big")
    );

    expect(await screen.findByText("O arquivo precisa ter ate 1 B.")).toBeTruthy();
    expect(uploadMediaAssetMock).not.toHaveBeenCalled();
  });

  it("shows upload progress while the file is being sent", async () => {
    const user = userEvent.setup();

    uploadMediaAssetMock.mockImplementation(async ({ onPhaseChange, onProgress }) => {
      onPhaseChange?.("uploading");
      onProgress?.(42);

      return new Promise<MediaAsset>(() => undefined);
    });

    const { unmount } = render(<MediaUploader onUploaded={vi.fn()} />);

    await user.upload(screen.getByLabelText("Selecionar arquivo de midia"), createFile());

    expect(await screen.findByText("42%")).toBeTruthy();

    unmount();
  });

  it("shows an error state and retries the last valid file", async () => {
    const user = userEvent.setup();
    const onUploaded = vi.fn();

    uploadMediaAssetMock
      .mockRejectedValueOnce(new Error("Falha no upload"))
      .mockResolvedValueOnce(mediaAsset);

    render(<MediaUploader onUploaded={onUploaded} />);

    await user.upload(screen.getByLabelText("Selecionar arquivo de midia"), createFile());

    expect(await screen.findByText("Nao foi possivel enviar o arquivo")).toBeTruthy();

    await user.click(screen.getAllByRole("button", { name: "Tentar novamente" })[0]);

    await waitFor(() => {
      expect(onUploaded).toHaveBeenCalledWith(mediaAsset);
    });
    expect(uploadMediaAssetMock).toHaveBeenCalledTimes(2);
  });

  it("shows a recoverable cancelled state after aborting the upload", async () => {
    const user = userEvent.setup();

    uploadMediaAssetMock.mockImplementation(
      ({ onPhaseChange, signal }) =>
        new Promise<MediaAsset>((_, reject) => {
          onPhaseChange?.("uploading");
          signal?.addEventListener("abort", () => {
            reject(new DOMException("Aborted", "AbortError"));
          });
        })
    );

    render(<MediaUploader onUploaded={vi.fn()} />);

    await user.upload(screen.getByLabelText("Selecionar arquivo de midia"), createFile());
    await user.click(screen.getByRole("button", { name: "Cancelar upload" }));

    expect(await screen.findByText("Upload cancelado")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeTruthy();
  });

  it("starts the same upload flow after drag and drop", async () => {
    uploadMediaAssetMock.mockResolvedValue(mediaAsset);

    render(<MediaUploader onUploaded={vi.fn()} />);

    const file = createFile();
    fireEvent.drop(screen.getByTestId("media-upload-dropzone"), {
      dataTransfer: {
        files: {
          0: file,
          item: (index: number) => (index === 0 ? file : null),
          length: 1
        },
        items: [],
        types: ["Files"]
      }
    });

    await waitFor(() => {
      expect(uploadMediaAssetMock).toHaveBeenCalledWith(
        expect.objectContaining({
          file
        })
      );
    });
  });
});
