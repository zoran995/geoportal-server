import { Injectable } from '@nestjs/common';
import got, {
  AfterResponseHook,
  BeforeErrorHook,
  BeforeRequestHook,
  Got,
  HTTPError,
} from 'got';

import { LoggerService } from 'src/infrastructure/logger/index.js';

/**
 * Defines the structure for context data to be passed through got's request lifecycle.
 */
interface LoggingContext {
  requestStartTime?: Date;
}

@Injectable()
export class GotLoggingInstance {
  public readonly gotInstance: Got;

  constructor(private readonly logger: LoggerService) {
    this.logger.setContext('Got');

    const beforeRequestHook: BeforeRequestHook = (options) => {
      // Ensure context exists and is typed
      if (!options.context) {
        options.context = {};
      }
      const context = options.context as LoggingContext;
      context.requestStartTime = new Date();

      this.logger.verbose(
        `[Got Request] ${options.method} ${options.url?.toString() ?? 'N/A'}`,
      );
    };

    const afterResponseHook: AfterResponseHook = (response) => {
      const context = response.request.options.context as LoggingContext;
      let duration = 'N/A';

      if (context?.requestStartTime) {
        const endTime = new Date();
        duration = `${endTime.getTime() - context.requestStartTime.getTime()}ms`;
      }

      this.logger.verbose(
        `[Got Response] ${response.request.options.method} ${response.url} ${response.statusCode} ${duration}`,
      );
      return response; // Must return the response
    };

    const beforeErrorHook: BeforeErrorHook = (error) => {
      const context = error.options.context as LoggingContext;
      let duration = 'N/A';

      if (context?.requestStartTime) {
        const endTime = new Date();
        duration = `${endTime.getTime() - context.requestStartTime.getTime()}ms`;
      }

      let logMessage = `[Got Error] ${error.options.method} ${error.options.url?.toString() ?? 'N/A'} (after ${duration})`;

      if (error instanceof HTTPError) {
        logMessage += ` - Status: ${error.response.statusCode}`;
      } else {
        logMessage += ` - Code: ${error.code || 'N/A'}`;
      }
      logMessage += ` - Message: ${error.message}`;

      this.logger.error(logMessage, error.stack);
      return error; // Must return the error
    };

    this.gotInstance = got.extend({
      hooks: {
        beforeRequest: [beforeRequestHook],
        afterResponse: [afterResponseHook],
        beforeError: [beforeErrorHook],
      },
      // Ensure HTTP errors are thrown to be caught by beforeError or calling code.
      // This is the default in got v12+, but explicit for clarity.
      throwHttpErrors: true,
    });
  }
}
