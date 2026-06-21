import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus
} from "@nestjs/common";
import type { Request, Response } from "express";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      const errorPayload =
        typeof exceptionResponse === "string"
          ? {
              message: exceptionResponse,
              error: exception.name
            }
          : exceptionResponse;

      const message = Array.isArray((errorPayload as { message?: unknown }).message)
        ? (errorPayload as { message: unknown[] }).message.join(", ")
        : String((errorPayload as { message?: unknown }).message ?? exception.message);

      response.status(statusCode).json({
        statusCode,
        message,
        error: String((errorPayload as { error?: unknown }).error ?? exception.name),
        path: request.url,
        timestamp: new Date().toISOString()
      });
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: "Internal server error",
      error: "InternalServerError",
      path: request.url,
      timestamp: new Date().toISOString()
    });
  }
}
