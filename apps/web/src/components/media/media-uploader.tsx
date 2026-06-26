"use client";

import type { DragEventHandler } from "react";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ErrorState,
  LoadingState,
  Progress
} from "@eduflow/ui";

import { ApiError } from "@/lib/api/api-client";
import {
  DEFAULT_MEDIA_UPLOAD_MAX_SIZE_BYTES,
  DEFAULT_MEDIA_UPLOAD_MIME_TYPES,
  formatAcceptedMimeTypes,
  formatFileSize,
  validateMediaFile
} from "@/lib/media/media-upload-config";
import {
  isMediaUploadAbortError,
  uploadMediaAsset
} from "@/lib/media/media-upload-service";
import type { MediaAsset } from "@/lib/media/media-types";

type MediaUploaderCopy = {
  readonly description: string;
  readonly selectButtonLabel: string;
  readonly title: string;
};

export interface MediaUploaderProps {
  readonly acceptedMimeTypes?: readonly string[];
  readonly copy?: Partial<MediaUploaderCopy>;
  readonly disabled?: boolean;
  readonly maxSizeBytes?: number;
  readonly onUploaded: (asset: MediaAsset) => void;
}

type UploadState =
  | { kind: "idle" }
  | { kind: "invalid"; message: string }
  | { kind: "presigning"; fileName: string }
  | { kind: "uploading"; fileName: string; progress: number }
  | { kind: "completing"; fileName: string; progress: number }
  | { kind: "success"; asset: MediaAsset }
  | { kind: "error"; fileName: string; message: string }
  | { kind: "cancelled"; fileName: string };

type UploadAction =
  | { type: "reset" }
  | { type: "invalid"; message: string }
  | { type: "presigning"; fileName: string }
  | { type: "uploading"; fileName: string; progress: number }
  | { type: "completing"; fileName: string; progress: number }
  | { type: "success"; asset: MediaAsset }
  | { type: "error"; fileName: string; message: string }
  | { type: "cancelled"; fileName: string };

const DEFAULT_COPY: MediaUploaderCopy = {
  description:
    "Selecione um arquivo ou arraste para a area de envio. O upload e validado no cliente antes de seguir para a API.",
  selectButtonLabel: "Selecionar arquivo",
  title: "Upload de midia"
};

function uploadReducer(_: UploadState, action: UploadAction): UploadState {
  switch (action.type) {
    case "reset":
      return { kind: "idle" };
    case "invalid":
      return { kind: "invalid", message: action.message };
    case "presigning":
      return { kind: "presigning", fileName: action.fileName };
    case "uploading":
      return {
        kind: "uploading",
        fileName: action.fileName,
        progress: action.progress
      };
    case "completing":
      return {
        kind: "completing",
        fileName: action.fileName,
        progress: action.progress
      };
    case "success":
      return { kind: "success", asset: action.asset };
    case "error":
      return {
        kind: "error",
        fileName: action.fileName,
        message: action.message
      };
    case "cancelled":
      return { kind: "cancelled", fileName: action.fileName };
  }
}

function isBusy(state: UploadState) {
  return (
    state.kind === "presigning" ||
    state.kind === "uploading" ||
    state.kind === "completing"
  );
}

function toUploadErrorMessage(error: unknown) {
  if (isMediaUploadAbortError(error)) {
    return "Upload cancelado.";
  }

  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Nao foi possivel concluir o upload agora.";
}

export function MediaUploader({
  acceptedMimeTypes = DEFAULT_MEDIA_UPLOAD_MIME_TYPES,
  copy,
  disabled = false,
  maxSizeBytes = DEFAULT_MEDIA_UPLOAD_MAX_SIZE_BYTES,
  onUploaded
}: MediaUploaderProps) {
  const mergedCopy = { ...DEFAULT_COPY, ...copy };
  const [state, dispatch] = useReducer(uploadReducer, { kind: "idle" });
  const [isDragActive, setIsDragActive] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastSelectedFileRef = useRef<File | null>(null);

  const supportedTypesLabel = useMemo(
    () => formatAcceptedMimeTypes(acceptedMimeTypes),
    [acceptedMimeTypes]
  );

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const getFirstFile = (fileList: FileList | ArrayLike<File> | null) => {
    if (!fileList) {
      return null;
    }

    if ("item" in fileList && typeof fileList.item === "function") {
      return fileList.item(0);
    }

    return fileList[0] ?? null;
  };

  const startUpload = async (file: File) => {
    const validationMessage = validateMediaFile({
      acceptedMimeTypes,
      file,
      maxSizeBytes
    });

    if (validationMessage) {
      dispatch({ type: "invalid", message: validationMessage });
      return;
    }

    lastSelectedFileRef.current = file;

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    dispatch({ type: "presigning", fileName: file.name });

    try {
      const asset = await uploadMediaAsset({
        file,
        onPhaseChange: (phase) => {
          if (phase === "presigning") {
            dispatch({ type: "presigning", fileName: file.name });
            return;
          }

          if (phase === "uploading") {
            dispatch({ type: "uploading", fileName: file.name, progress: 0 });
            return;
          }

          dispatch({ type: "completing", fileName: file.name, progress: 100 });
        },
        onProgress: (progress) => {
          dispatch({ type: "uploading", fileName: file.name, progress });
        },
        signal: abortController.signal
      });

      dispatch({ type: "success", asset });
      onUploaded(asset);
    } catch (error) {
      if (isMediaUploadAbortError(error)) {
        dispatch({ type: "cancelled", fileName: file.name });
        return;
      }

      dispatch({
        type: "error",
        fileName: file.name,
        message: toUploadErrorMessage(error)
      });
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
    }
  };

  const handleFiles = async (fileList: FileList | ArrayLike<File> | null) => {
    const file = getFirstFile(fileList);

    if (!file || disabled || isBusy(state)) {
      return;
    }

    await startUpload(file);
  };

  const handleRetry = async () => {
    if (!lastSelectedFileRef.current || disabled || isBusy(state)) {
      return;
    }

    await startUpload(lastSelectedFileRef.current);
  };

  const handleCancel = () => {
    abortControllerRef.current?.abort();
  };

  const handleDrop: DragEventHandler<HTMLDivElement> = async (event) => {
    event.preventDefault();
    setIsDragActive(false);

    await handleFiles(event.dataTransfer.files);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mergedCopy.title}</CardTitle>
        <CardDescription>{mergedCopy.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <input
          ref={fileInputRef}
          aria-label="Selecionar arquivo de midia"
          className="sr-only"
          accept={acceptedMimeTypes.join(",")}
          disabled={disabled || isBusy(state)}
          onChange={(event) => {
            void handleFiles(event.target.files);
            event.currentTarget.value = "";
          }}
          type="file"
        />

        <div
          data-testid="media-upload-dropzone"
          className={[
            "rounded-xl border border-dashed p-6 transition",
            isDragActive
              ? "border-primary bg-primary/8"
              : "border-border bg-card/70",
            disabled ? "opacity-60" : ""
          ].join(" ")}
          onDragEnter={(event) => {
            event.preventDefault();
            if (!disabled && !isBusy(state)) {
              setIsDragActive(true);
            }
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
              return;
            }

            setIsDragActive(false);
          }}
          onDragOver={(event) => {
            event.preventDefault();
          }}
          onDrop={(event) => {
            void handleDrop(event);
          }}
        >
          <div className="space-y-3">
            <p className="text-sm font-medium text-card-foreground">
              {isDragActive ? "Solte o arquivo para iniciar o upload" : "Um arquivo por vez"}
            </p>
            <p className="text-sm text-muted-foreground">
              Tipos suportados: {supportedTypesLabel}. Tamanho maximo:{" "}
              {formatFileSize(maxSizeBytes)}.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                disabled={disabled || isBusy(state)}
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                {mergedCopy.selectButtonLabel}
              </Button>
              {isBusy(state) ? (
                <Button onClick={handleCancel} type="button" variant="outline">
                  Cancelar upload
                </Button>
              ) : null}
              {state.kind === "error" || state.kind === "cancelled" ? (
                <Button onClick={() => void handleRetry()} type="button" variant="outline">
                  Tentar novamente
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        {state.kind === "invalid" ? (
          <div
            aria-live="polite"
            className="rounded-xl border border-destructive/35 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {state.message}
          </div>
        ) : null}

        {state.kind === "presigning" ? (
          <LoadingState
            className="p-6"
            description={`Validando ${state.fileName} e preparando a URL de envio.`}
            srLabel="Preparando upload"
            title="Preparando upload"
          />
        ) : null}

        {state.kind === "uploading" ? (
          <div className="space-y-3 rounded-xl border border-border bg-muted/35 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-card-foreground">{state.fileName}</p>
                <p className="text-sm text-muted-foreground">
                  Enviando arquivo para o armazenamento.
                </p>
              </div>
              <p className="text-sm font-medium text-card-foreground">{state.progress}%</p>
            </div>
            <Progress aria-label="Progresso do upload" value={state.progress} />
          </div>
        ) : null}

        {state.kind === "completing" ? (
          <LoadingState
            className="p-6"
            description={`Finalizando o cadastro de ${state.fileName} na biblioteca de midia.`}
            srLabel="Finalizando upload"
            title="Finalizando upload"
          />
        ) : null}

        {state.kind === "error" ? (
          <ErrorState
            action={
              <Button onClick={() => void handleRetry()} type="button">
                Tentar novamente
              </Button>
            }
            className="p-6"
            description={state.message}
            title="Nao foi possivel enviar o arquivo"
          />
        ) : null}

        {state.kind === "cancelled" ? (
          <div className="rounded-xl border border-border bg-muted/35 px-4 py-3">
            <p className="text-sm font-medium text-card-foreground">Upload cancelado</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {state.fileName} nao foi enviado. Voce pode selecionar outro arquivo ou tentar
              novamente.
            </p>
          </div>
        ) : null}

        {state.kind === "success" ? (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5">
            <p className="text-sm font-medium text-card-foreground">Upload concluido</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {state.asset.originalName} foi enviado com sucesso.
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
