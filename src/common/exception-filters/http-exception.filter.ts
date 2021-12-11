import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';

interface IMessage {
  statusCode: number;
  message: string | string[];
  error: string;
}

@Catch(HttpException)
export class CustomHttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request: Request = context.getRequest();
    const status = exception.getStatus();
    const message = exception.getResponse();
    const errorCode = exception.getStatus();
    const name = exception.name;

    let msg = {
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      errorCode,
      name,
      meta: '',
    };

    let errorObj = {};
    if (Object.keys(message).every((key) => ['statusCode', 'message', 'error'].includes(key))) {
      const {statusCode, message: messageString, error} = message as IMessage;
      const formatedMsg = typeof messageString === 'string' ? [messageString] : [...messageString];
      msg = {...msg, message: formatedMsg, meta: error};
    }
    response.status(status).json({ ...msg });
  }
}
