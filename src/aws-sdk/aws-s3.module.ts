import { DynamicModule, Module } from '@nestjs/common';
import { AWS_CONFIG_OPTIONS } from './aws-s3.contants';
import { AwsS3Service } from './aws-s3.service';
import { AwsS3ModuleAsyncOption } from './interfaces/aws-s3-options.interface';

@Module({})
export class AwsS3Module {
  static register(options: AwsS3ModuleAsyncOption): DynamicModule {
    return {
      module: AwsS3Module,
      providers: [
        {
          provide: AWS_CONFIG_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        AwsS3Service,
      ],
      exports: [AwsS3Service],
    };
  }
}
