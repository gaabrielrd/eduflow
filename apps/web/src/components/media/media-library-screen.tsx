"use client";

import { useState } from "react";

import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  PageHeader
} from "@eduflow/ui";

import {
  DEFAULT_MEDIA_UPLOAD_MAX_SIZE_BYTES,
  DEFAULT_MEDIA_UPLOAD_MIME_TYPES,
  formatAcceptedMimeTypes,
  formatFileSize
} from "@/lib/media/media-upload-config";
import type { MediaAsset } from "@/lib/media/media-types";

import { MediaUploader } from "./media-uploader";

export function MediaLibraryScreen() {
  const [uploadedAsset, setUploadedAsset] = useState<MediaAsset | null>(null);

  return (
    <section className="space-y-8">
      <PageHeader
        actions={<Badge variant="secondary">Upload v1</Badge>}
        eyebrow="Midia"
        title="Biblioteca inicial de midia"
        description="A area de midia agora ja suporta upload unitario com validacao no cliente, progresso e confirmacao do asset criado."
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(20rem,1fr)]">
        <MediaUploader onUploaded={setUploadedAsset} />

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
              <CardTitle>Primeira iteracao</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Upload de um arquivo por vez.</p>
              <p>Retry reinicia o envio completo do arquivo.</p>
              <p>Cancelamento interrompe a requisicao atual sem resumir depois.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {uploadedAsset ? (
        <Card>
          <CardHeader>
            <CardTitle>Ultimo asset criado</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
            <div>
              <p className="font-medium text-card-foreground">Nome original</p>
              <p>{uploadedAsset.originalName}</p>
            </div>
            <div>
              <p className="font-medium text-card-foreground">Arquivo normalizado</p>
              <p>{uploadedAsset.fileName}</p>
            </div>
            <div>
              <p className="font-medium text-card-foreground">Tipo</p>
              <p>{uploadedAsset.mimeType}</p>
            </div>
            <div>
              <p className="font-medium text-card-foreground">Tamanho</p>
              <p>{formatFileSize(uploadedAsset.sizeBytes)}</p>
            </div>
            <div>
              <p className="font-medium text-card-foreground">Status</p>
              <p>{uploadedAsset.status}</p>
            </div>
            <div>
              <p className="font-medium text-card-foreground">ID</p>
              <p className="break-all">{uploadedAsset.id}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          title="Nenhum asset criado nesta sessao"
          description="Depois do primeiro upload concluido, esta area mostra o asset devolvido ao componente pai."
        />
      )}
    </section>
  );
}
