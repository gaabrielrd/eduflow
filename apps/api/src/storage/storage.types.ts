export type StorageObjectRef = {
  organizationId: string;
  key: string;
};

export type BuildStorageKeyInput = {
  organizationId: string;
  category: string;
  filename: string;
  now?: Date;
};

export type CreateUploadUrlInput = {
  organizationId: string;
  category: string;
  filename: string;
  contentType?: string;
  expiresInSeconds?: number;
};

export type CreateUploadUrlResult = {
  url: string;
  method: "PUT";
  object: StorageObjectRef;
  headers: Record<string, string>;
};

export type StorageConfiguration = {
  endpoint: string;
  accessKey: string;
  secretKey: string;
  bucketName: string;
  region: string;
  publicBaseUrl: string;
  mediaUploadMaxSizeBytes: number;
};
