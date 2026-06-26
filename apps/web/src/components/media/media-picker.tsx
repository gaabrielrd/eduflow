"use client";

import { isValidElement, useEffect, useMemo, useState, type ReactNode } from "react";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@eduflow/ui";
import { formatFileSize } from "@/lib/media/media-upload-config";
import { listMediaAssets } from "@/lib/media/media-library-service";
import type { MediaAsset } from "@/lib/media/media-types";

import { formatMediaDate, formatMediaType } from "./media-formatters";

export type MediaPickerProps = {
  onSelect: (asset: MediaAsset) => void;
  trigger?: ReactNode;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
};

export function MediaPicker({
  onSelect,
  trigger,
  title = "Selecionar asset de midia",
  description = "Escolha um arquivo existente da biblioteca da organizacao.",
  confirmLabel = "Confirmar selecao",
  cancelLabel = "Cancelar"
}: MediaPickerProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  const filteredMediaAssets = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return mediaAssets;
    }

    return mediaAssets.filter((asset) =>
      `${asset.originalName} ${asset.fileName}`.toLowerCase().includes(normalizedQuery)
    );
  }, [mediaAssets, searchQuery]);

  const selectedAsset =
    filteredMediaAssets.find((asset) => asset.id === selectedAssetId) ??
    mediaAssets.find((asset) => asset.id === selectedAssetId) ??
    null;

  async function loadMediaLibrary() {
    setIsLoading(true);

    try {
      const nextMediaAssets = await listMediaAssets();
      setMediaAssets(nextMediaAssets);
      setErrorMessage(null);
      setHasLoadedOnce(true);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Nao foi possivel carregar a biblioteca de midia"
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    void loadMediaLibrary();
  }, [isOpen]);

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setIsLoading(true);
      setErrorMessage(null);
    }

    setIsOpen(nextOpen);

    if (!nextOpen) {
      setSearchQuery("");
      setSelectedAssetId(null);
    }
  }

  function handleCancel() {
    handleOpenChange(false);
  }

  function handleConfirm() {
    if (!selectedAsset) {
      return;
    }

    onSelect(selectedAsset);
    handleOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {isValidElement(trigger) ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button type="button">Selecionar midia</Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="w-full md:max-w-xs">
            <Input
              aria-label="Buscar arquivos de midia"
              placeholder="Buscar por nome"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>

          <div className="max-h-[26rem] overflow-auto rounded-2xl border border-border/70">
            {isLoading ? (
              <div className="p-6">
                <LoadingState
                  description="Buscando os arquivos disponiveis na biblioteca."
                  title="Carregando biblioteca de midia"
                />
              </div>
            ) : errorMessage ? (
              <div className="p-6">
                <ErrorState
                  action={
                    <Button type="button" onClick={() => void loadMediaLibrary()}>
                      Tentar novamente
                    </Button>
                  }
                  description={errorMessage}
                  title="Nao foi possivel carregar a biblioteca de midia"
                />
              </div>
            ) : mediaAssets.length === 0 && hasLoadedOnce ? (
              <div className="p-6">
                <EmptyState
                  description="Assim que o primeiro upload for concluido, os assets aparecem aqui para selecao."
                  title="Nenhum arquivo encontrado"
                />
              </div>
            ) : filteredMediaAssets.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  description="Ajuste o termo pesquisado para encontrar arquivos pelo nome original ou nome normalizado."
                  title="Nenhum resultado para a busca"
                />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Arquivo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Tamanho</TableHead>
                    <TableHead>Enviado em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMediaAssets.map((asset) => {
                    const isSelected = selectedAssetId === asset.id;

                    return (
                      <TableRow
                        key={asset.id}
                        aria-selected={isSelected}
                        className={[
                          "cursor-pointer transition",
                          isSelected ? "bg-primary/10 hover:bg-primary/10" : ""
                        ].join(" ")}
                        onClick={() => setSelectedAssetId(asset.id)}
                      >
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium text-card-foreground">{asset.originalName}</p>
                            <p className="text-xs text-muted-foreground">{asset.fileName}</p>
                          </div>
                        </TableCell>
                        <TableCell>{formatMediaType(asset.mimeType)}</TableCell>
                        <TableCell>{formatFileSize(asset.sizeBytes)}</TableCell>
                        <TableCell>{formatMediaDate(asset.createdAt)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleCancel}>
            {cancelLabel}
          </Button>
          <Button type="button" disabled={!selectedAsset} onClick={handleConfirm}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
