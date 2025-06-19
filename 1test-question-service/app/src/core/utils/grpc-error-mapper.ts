import {
  HTTPError,
  HTTPSystemError,
  ValidationError,
  InputValidationError,
  ModelValidationError,
} from '@/core/types/errors';
import { CommonSystemCode } from '@/core/utils/guards/error-code-builder';
import { ErrorResponse } from '@/protobuf/common/common';
import { sendUnaryData } from '@grpc/grpc-js';

interface ResponseType<T> {
  data?: T | undefined;
  error?: ErrorResponse | undefined;
}
export class GrpcErrorMapper {
  static toGrpcError(error: Error): ErrorResponse {
    if (
      error instanceof ValidationError ||
      error instanceof InputValidationError ||
      error instanceof ModelValidationError
    ) {
      return {
        httpStatusCode: 400,
        code: error.response.error.code,
        message: error.message,
        details: error.response.error.details.map((detail) => ({
          code: detail.code,
          message: detail.message,
          field: detail.field,
          codeParams: Array.isArray(detail.codeParams)
            ? detail.codeParams.map((param) => String(param))
            : [],
        })),
      };
    }

    if (error instanceof HTTPError) {
      return {
        httpStatusCode: error.statusCode,
        code: error.response.error.code,
        message: error.message,
        details: [],
      };
    }

    const systemError = new HTTPSystemError(
      error.message,
      CommonSystemCode.UNEXPECTED,
    );

    return {
      httpStatusCode: systemError.statusCode,
      code: systemError.response.error.code,
      message: error.message,
      details: [],
    };
  }

  static handle<T>(callback: sendUnaryData<ResponseType<T>>, f: () => void) {
    try {
      f();
    } catch (e) {
      callback(null, { error: GrpcErrorMapper.toGrpcError(e as Error) });
    }
  }
}
