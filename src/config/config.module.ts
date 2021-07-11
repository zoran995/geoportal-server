import { Global, Module } from '@nestjs/common';
import {
  ConfigModule as NestConfigModule,
  ConfigService as NestConfigService,
} from '@nestjs/config';
import { validate } from './validators/config.validator';
import { YARGS_CONFIG_LOADER } from './yargs-config/yargs-config.constants';
import yargsConfiguration from './yargs-config/yargs-configuration';
import { CustomConfigService } from './config.service';

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      type: 'json',
      filePath: yargsConfiguration().configFile || 'serverconfig.json',
      validate,
    }),
  ],
  providers: [
    // Add CustomConfigService to context.
    CustomConfigService,
    {
      provide: YARGS_CONFIG_LOADER,
      useValue: yargsConfiguration(),
    },
    // Alias NestConfigService so it can be used inside CustomConfigService.
    {
      provide: 'NestConfigService',
      useClass: NestConfigService,
    },
    // Alias CustomConfigService with NestConfigService so we can import NestConfigService.
    { provide: NestConfigService, useExisting: CustomConfigService },
  ],
  exports: [YARGS_CONFIG_LOADER, CustomConfigService, NestConfigService],
})
export class ConfigModule {}
