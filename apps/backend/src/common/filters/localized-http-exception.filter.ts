import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { localizeBackendMessage, resolveLang } from '../i18n';

@Catch(HttpException)
export class LocalizedHttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const lang = resolveLang(request.headers['accept-language']);
    const payload = exception.getResponse();

    if (typeof payload === 'string') {
      response.status(status).json({
        statusCode: status,
        message: localizeBackendMessage(payload, lang),
      });
      return;
    }

    if (payload && typeof payload === 'object') {
      const body = payload as Record<string, unknown>;
      response.status(status).json({
        ...body,
        ...(body.message !== undefined ? { message: localizeBackendMessage(body.message, lang) } : {}),
        ...(typeof body.error === 'string' ? { error: localizeBackendMessage(body.error, lang) } : {}),
      });
      return;
    }

    response.status(status).json(payload);
  }
}
