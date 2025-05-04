import { Module } from '@nestjs/common';

import { PingController } from './ping.controller.js';

@Module({
  controllers: [PingController],
})
export class PingModule {}
