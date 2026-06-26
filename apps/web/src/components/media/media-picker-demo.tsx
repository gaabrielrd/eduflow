"use client";

import { useState } from "react";

import { Button, Card, CardContent, CardHeader, CardTitle } from "@eduflow/ui";
import { formatFileSize } from "@/lib/media/media-upload-config";
import type { MediaAsset } from "@/lib/media/media-types";

import { formatMediaDate, formatMediaType } from "./media-formatters";
import { MediaPicker } from "./media-picker";

export function MediaPickerDemo() {
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);

  return (
    <Card>
      <CardHeader className="space-y-2">
        <CardTitle>Selecionar asset existente</CardTitle>
        <p className="text-sm text-muted-foreground">
          Demo do `MediaPicker` para consumidores que precisam escolher um unico arquivo da
          biblioteca.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <MediaPicker
          onSelect={setSelectedAsset}
          trigger={
            <Button type="button" variant="outline">
              Abrir media picker
            </Button>
          }
        />

        {selectedAsset ? (
          <div className="rounded-2xl border border-border/70 bg-muted/30 p-4 text-sm">
            <p className="font-medium text-card-foreground">{selectedAsset.originalName}</p>
            <p className="mt-1 text-muted-foreground">
              {formatMediaType(selectedAsset.mimeType)} · {formatFileSize(selectedAsset.sizeBytes)}
            </p>
            <p className="mt-1 text-muted-foreground">
              Enviado em {formatMediaDate(selectedAsset.createdAt)}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nenhum asset selecionado ainda.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
