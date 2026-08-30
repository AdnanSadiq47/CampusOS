import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { StructuredLogger } from '@campus-os/logger';

const logger = new StructuredLogger('ExceptionFilter');

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal Server Error';
    let errorCode = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'object' && res !== null) {
        message = (res as Record<string, unknown>)['message'] as string || message;
        errorCode = (res as Record<string, unknown>)['error'] as string || errorCode;
      } else {
        message = String(res);
      }
    } else if (exception instanceof Error) {
      console.error('SERVER EXCEPTION:', exception.message, exception.stack);
      logger.error('Unhandled internal error', {
        message: exception.message,
        stack: exception.stack,
        path: request.url,
        method: request.method,
      });
      message = exception.message || 'Internal Server Error';
    } else {
      console.error('UNKNOWN EXCEPTION:', exception);
    }

    response.status(status).json({
      statusCode: status,
      errorCode,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
