import { Injectable } from "@nestjs/common";

import { appConfig } from "../config/app.config.js";

@Injectable()
export class HealthService {
  getHealth() {
    return {
      status: "ok",
      service: appConfig.serviceName
    };
  }
}
