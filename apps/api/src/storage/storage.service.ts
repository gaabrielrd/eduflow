import type {
  BuildStorageKeyInput,
  CreateUploadUrlInput,
  CreateUploadUrlResult,
  StorageObjectRef
} from "./storage.types.js";

export interface StorageService {
  buildObjectKey(input: BuildStorageKeyInput): StorageObjectRef;
  createUploadUrl(input: CreateUploadUrlInput): Promise<CreateUploadUrlResult>;
  getReadUrl(object: StorageObjectRef): string;
  deleteObject(object: StorageObjectRef): Promise<void>;
  validateConfiguration(): Promise<void>;
}
