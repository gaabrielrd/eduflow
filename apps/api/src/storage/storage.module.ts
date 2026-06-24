import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { STORAGE_SERVICE } from "./storage.constants.js";
import { S3CompatibleStorageService } from "./s3-compatible-storage.service.js";
import { StorageConfigService } from "./storage-config.service.js";

@Module({
  imports: [ConfigModule],
  providers: [
    StorageConfigService,
    S3CompatibleStorageService,
    {
      provide: STORAGE_SERVICE,
      useExisting: S3CompatibleStorageService
    }
  ],
  exports: [StorageConfigService, STORAGE_SERVICE]
})
export class StorageModule {}
