export type MediaAssetStatus = "PENDING" | "READY" | "FAILED" | "DELETED";

export interface MediaAsset {
  readonly id: string;
  readonly fileName: string;
  readonly originalName: string;
  readonly mimeType: string;
  readonly readUrl?: string;
  readonly sizeBytes: number;
  readonly status: MediaAssetStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
}
