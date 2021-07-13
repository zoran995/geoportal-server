import { Controller, Get, Param, UseFilters } from '@nestjs/common';
import { GlobalExceptionFilter } from 'src/common/exceptions/global.exception';
import { Proj4Service } from './proj4.service';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

@Controller('proj4def')
@ApiTags('proj4')
export class Proj4Controller {
  constructor(private readonly proj4Service: Proj4Service) {}

  @Get('epsg::code')
  @ApiOperation({ summary: 'Get the projection definition using EPSG code' })
  @ApiBadRequestResponse({ description: 'Projection code is not number' })
  @ApiNotFoundResponse({ description: 'Projection was not found' })
  @UseFilters(GlobalExceptionFilter)
  resolveCode(@Param('code') code: number) {
    return this.proj4Service.getDefinition(code);
  }
}
