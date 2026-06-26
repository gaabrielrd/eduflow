import { apiClient } from "@/lib/api/api-client";
import type { MediaAsset } from "@/lib/media/media-types";

export async function listMediaAssets() {
  return apiClient<MediaAsset[]>({
    method: "GET",
    path: "/api/media"
  });
}

export async function deleteMediaAsset(mediaId: string) {
  return apiClient<MediaAsset>({
    method: "DELETE",
    path: `/api/media/${mediaId}`
  });
}
