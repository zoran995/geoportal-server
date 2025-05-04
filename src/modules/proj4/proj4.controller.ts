import {
  Controller,
  Get,
  Header,
  Param,
  ParseIntPipe,
  UseFilters,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';

import { HttpExceptionFilter } from 'src/common/filters';

import { Proj4Service } from './proj4.service';

@Controller('proj4def')
@ApiTags('proj4')
export class Proj4Controller {
  constructor(private readonly proj4Service: Proj4Service) {}

  /**
   * Get the projection definition using EPSG code
   * @param code - EPSG Code of projection
   * @returns Proj4 definition
   */
  @Get('epsg\\::code')
  @ApiOperation({ summary: 'Get the projection definition using EPSG code' })
  @ApiBadRequestResponse({ description: 'Projection code is not number' })
  @ApiNotFoundResponse({ description: 'Projection was not found' })
  @UseFilters(HttpExceptionFilter)
  @ApiParam({ name: 'code', description: 'EPSG Code of projection' })
  @ApiProduces('text/plain')
  @Header('Content-Type', 'text/plain')
  resolveCode(@Param('code', ParseIntPipe) code: number) {
    return this.proj4Service.getDefinition(code);
  }
}
