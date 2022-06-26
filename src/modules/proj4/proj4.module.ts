import { Module } from '@nestjs/common';

import { Proj4Controller } from './proj4.controller';
import { Proj4Service } from './proj4.service';

@Module({
  controllers: [Proj4Controller],
  providers: [Proj4Service],
})
export class Proj4Module {}
