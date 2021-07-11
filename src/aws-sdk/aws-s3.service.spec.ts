import { Test, TestingModule } from '@nestjs/testing';
import { LoggerModule } from 'src/common/logger/logger.module';
import { AwsS3Module } from './aws-s3.module';
import { AwsS3Service } from './aws-s3.service';

describe('AwsSdkService', () => {
  let service: AwsS3Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        LoggerModule,
        AwsS3Module.register({
          useFactory: () => {
            return {};
          },
        }),
      ],
      providers: [AwsS3Service],
    }).compile();

    service = module.get<AwsS3Service>(AwsS3Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
