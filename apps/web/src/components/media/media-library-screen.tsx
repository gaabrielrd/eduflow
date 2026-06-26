"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  PageHeader,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@eduflow/ui";
import { useSession } from "@/hooks/use-session";
import {
  DEFAULT_MEDIA_UPLOAD_MAX_SIZE_BYTES,
  DEFAULT_MEDIA_UPLOAD_MIME_TYPES,
  formatAcceptedMimeTypes,
  formatFileSize
} from "@/lib/media/media-upload-config";
import {
  deleteMediaAsset,
  listMediaAssets
} from "@/lib/media/media-library-service";
import type { MediaAsset } from "@/lib/media/media-types";

import { formatMediaDate, formatMediaType } from "./media-formatters";
import { MediaPickerDemo } from "./media-picker-demo";
import { MediaUploader } from "./media-uploader";

const authoringRoles = new Set(["OWNER", "ADMIN", "INSTRUCTOR", "MANAGER"]);

export function MediaLibraryScreen() {
  const { activeOrganizationId, organizations } = useSession();
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);
  const [deletingMediaId, setDeletingMediaId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [failedDeleteMediaId, setFailedDeleteMediaId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const uploadSectionRef = useRef<HTMLDivElement | null>(null);

  const activeOrganization = useMemo(
    () =>
      organizations.find((organization) => organization.id === activeOrganizationId) ??
      null,
    [activeOrganizationId, organizations]
  );
  const canManageMedia = authoringRoles.has(activeOrganization?.role ?? "");

  const loadMediaLibrary = useCallback(async () => {
    try {
      const nextMediaAssets = await listMediaAssets();
      setMediaAssets(nextMediaAssets);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Nao foi possivel carregar a biblioteca de midia"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (!cancelled) {
        void loadMediaLibrary();
      }
    });

    return () => {
      cancelled = true;
    };
  }, [loadMediaLibrary]);

  const filteredMediaAssets = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return mediaAssets;
    }

    return mediaAssets.filter((asset) =>
      `${asset.originalName} ${asset.fileName}`.toLowerCase().includes(normalizedQuery)
    );
  }, [mediaAssets, searchQuery]);

  function handleUploaded(asset: MediaAsset) {
    setDeleteErrorMessage(null);
    setFailedDeleteMediaId(null);
    setMediaAssets((current) => {
      const nextAssets = current.filter((item) => item.id !== asset.id);
      return [asset, ...nextAssets];
    });
  }

  async function handleDelete(mediaId: string) {
    setDeletingMediaId(mediaId);
    setDeleteErrorMessage(null);
    setFailedDeleteMediaId(null);

    try {
      const deletedAsset = await deleteMediaAsset(mediaId);
      setMediaAssets((current) =>
        current.filter((asset) => asset.id !== deletedAsset.id)
      );
    } catch (error) {
      setDeleteErrorMessage(
        error instanceof Error
          ? error.message
          : "Nao foi possivel remover o arquivo selecionado"
      );
      setFailedDeleteMediaId(mediaId);
    } finally {
      setDeletingMediaId(null);
    }
  }

  function handleRetryLoadMediaLibrary() {
    setIsLoading(true);
    setErrorMessage(null);
    void loadMediaLibrary();
  }

  if (isLoading) {
    return (
      <LoadingState
        description="Buscando os arquivos da organizacao ativa."
        title="Carregando biblioteca de midia"
      />
    );
  }

  if (errorMessage) {
    return (
      <ErrorState
        action={<Button onClick={handleRetryLoadMediaLibrary}>Tentar novamente</Button>}
        description={errorMessage}
        title="Nao foi possivel carregar a biblioteca de midia"
      />
    );
  }

  return (
    <section className="space-y-8">
      <PageHeader
        actions={
          canManageMedia ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                uploadSectionRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "start"
                })
              }
            >
              Novo upload
            </Button>
          ) : (
            <Badge variant="secondary">Somente leitura</Badge>
          )
        }
        eyebrow="Midia"
        title="Biblioteca de midia"
        description="Gerencie uploads da organizacao, encontre arquivos pelo nome e remova itens que nao devem mais aparecer na biblioteca."
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(20rem,1fr)]">
        <div ref={uploadSectionRef} id="media-upload">
          {canManageMedia ? (
            <MediaUploader onUploaded={handleUploaded} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Upload indisponivel</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Seu perfil atual pode visualizar a biblioteca, mas nao pode enviar ou remover
                arquivos.
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Politica de upload</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Tipos suportados: {formatAcceptedMimeTypes(DEFAULT_MEDIA_UPLOAD_MIME_TYPES)}.</p>
              <p>Tamanho maximo por arquivo: {formatFileSize(DEFAULT_MEDIA_UPLOAD_MAX_SIZE_BYTES)}.</p>
              <p>O fluxo usa presign, upload direto ao storage e confirmacao final na API.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resumo rapido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>{mediaAssets.length} arquivo(s) ativo(s) na biblioteca.</p>
              <p>Busca por nome funciona no cliente sem recarregar a pagina.</p>
              <p>Remocao marca o asset como deletado e oculta da lista.</p>
            </CardContent>
          </Card>

          <MediaPickerDemo />
        </div>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <CardTitle>Assets da biblioteca</CardTitle>
              <p className="text-sm text-muted-foreground">
                Pesquise por nome original ou pelo nome normalizado do arquivo.
              </p>
            </div>
            <div className="w-full md:max-w-xs">
              <Input
                aria-label="Buscar arquivos de midia"
                placeholder="Buscar por nome"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {deleteErrorMessage && failedDeleteMediaId ? (
            <div className="rounded-2xl border border-destructive/35 bg-destructive/12 p-4 text-sm text-destructive">
              <p>{deleteErrorMessage}</p>
              <Button
                className="mt-3"
                type="button"
                variant="secondary"
                onClick={() => void handleDelete(failedDeleteMediaId)}
              >
                Tentar remover novamente
              </Button>
            </div>
          ) : null}

          {mediaAssets.length === 0 ? (
            <EmptyState
              title="Nenhum arquivo encontrado"
              description="Assim que o primeiro upload for concluido, os assets aparecem aqui para consulta e remocao."
            />
          ) : filteredMediaAssets.length === 0 ? (
            <EmptyState
              title="Nenhum resultado para a busca"
              description="Ajuste o termo pesquisado para encontrar arquivos pelo nome original ou nome normalizado."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Arquivo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Tamanho</TableHead>
                  <TableHead>Enviado em</TableHead>
                  <TableHead className="text-right">Acao</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMediaAssets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium text-card-foreground">{asset.originalName}</p>
                        <p className="text-xs text-muted-foreground">{asset.fileName}</p>
                      </div>
                    </TableCell>
                    <TableCell>{formatMediaType(asset.mimeType)}</TableCell>
                    <TableCell>{formatFileSize(asset.sizeBytes)}</TableCell>
                    <TableCell>{formatMediaDate(asset.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      {canManageMedia ? (
                        <Button
                          loading={deletingMediaId === asset.id}
                          size="sm"
                          type="button"
                          variant="destructive"
                          onClick={() => void handleDelete(asset.id)}
                        >
                          Remover
                        </Button>
                      ) : (
                        <Badge variant="secondary">Sem permissao</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
