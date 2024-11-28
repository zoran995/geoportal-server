import {
  Module,
  type DynamicModule,
  type ModuleMetadata,
} from '@nestjs/common';

import { feedbackServiceFactory } from './feeback-service.factory';
import { FeedbackController } from './feedback.controller';
import { FEEDBACK_CONFIG } from './feedback.constants';
import type { FeedbackConfigType } from './config/schema/feedback.config.schema';

@Module({})
export class FeedbackModule {
  static forRoot(options: FeedbackModuleOptions): DynamicModule {
    return {
      module: FeedbackModule,
      imports: options.imports ?? [],
      controllers: [FeedbackController],
      providers: [
        {
          provide: FEEDBACK_CONFIG,
          useFactory: options.useFactory,
          inject: options.inject ?? [],
        },
        feedbackServiceFactory,
      ],
    };
  }
}

interface FeedbackModuleOptions extends Pick<ModuleMetadata, 'imports'> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inject?: any[];
  useFactory: (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...args: any[]
  ) => Promise<FeedbackConfigType | undefined> | FeedbackConfigType | undefined;
}
