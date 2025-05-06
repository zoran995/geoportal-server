import { LogLevel } from '@nestjs/common';
import { z } from 'zod';

export const logLevelSchema = z
  .enum(['none', 'error', 'warn', 'log', 'debug', 'verbose'])
  .default('log')
  .describe('The log level to use.')
  .transform((val): LogLevel[] => {
    switch (val) {
      case 'none':
        return ['fatal'];
      case 'error':
        return ['fatal', 'error'];
      case 'warn':
        return ['fatal', 'error', 'warn'];
      case 'log':
        return ['fatal', 'error', 'warn', 'log'];
      case 'debug':
        return ['fatal', 'error', 'warn', 'log', 'debug'];
      case 'verbose':
        return ['fatal', 'error', 'warn', 'log', 'debug', 'verbose'];
    }
  });
