import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import type { StorageConfiguration } from "./storage.types.js";

@Injectable()
export class StorageConfigService {
  private readonly config: StorageConfiguration;

  constructor(private readonly configService: ConfigService) {
    this.config = {
      endpoint: this.require("STORAGE_ENDPOINT"),
      accessKey: this.require("STORAGE_ACCESS_KEY"),
      secretKey: this.require("STORAGE_SECRET_KEY"),
      bucketName: this.require("STORAGE_BUCKET_NAME"),
      region: this.configService.get<string>("STORAGE_REGION") ?? "us-east-1",
      publicBaseUrl: this.require("STORAGE_PUBLIC_BASE_URL")
    };
  }

  getSettings(): StorageConfiguration {
    return {
      ...this.config
    };
  }

  private require(key: string) {
    const value = this.configService.get<string>(key);

    if (!value) {
      throw new Error(`Missing required configuration: ${key}`);
    }

    return value;
  }
}
