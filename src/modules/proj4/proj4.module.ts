import { Module } from '@nestjs/common';

import { Proj4Controller } from './proj4.controller.js';
import { Proj4Service } from './proj4.service.js';

@Module({
  controllers: [Proj4Controller],
  providers: [Proj4Service],
})
export class Proj4Module {}
