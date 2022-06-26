import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { proj4def } from 'proj4-cli-defs';

@Injectable()
export class Proj4Service {
  getDefinition(code: number) {
    if (code) {
      const definition = proj4def[code];
      if (definition) return definition;
      throw new NotFoundException(
        `No proj4 definition available for CRS with EPSG:${code}`,
      );
    }
    throw new BadRequestException('EPSG code is not correct');
  }
}
