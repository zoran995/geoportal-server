import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { BasicAuthGuard } from './basic-auth.guard';

@Module({
  providers: [
    {
      provide: APP_GUARD,
      useFactory: (basicAuthGuard: BasicAuthGuard) => {
        return basicAuthGuard;
      },
      inject: [BasicAuthGuard],
    },
    BasicAuthGuard,
  ],
  exports: [BasicAuthGuard],
})
export class AuthModule {}
