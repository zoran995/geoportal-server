import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseFilters,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { HttpExceptionFilter } from '../common/filters/http-exception.filter';
import { Proj4Service } from './proj4.service';

@Controller('proj4def')
@ApiTags('proj4')
export class Proj4Controller {
  constructor(private readonly proj4Service: Proj4Service) {}

  @Get('epsg::code')
  @ApiOperation({ summary: 'Get the projection definition using EPSG code' })
  @ApiBadRequestResponse({ description: 'Projection code is not number' })
  @ApiNotFoundResponse({ description: 'Projection was not found' })
  @UseFilters(HttpExceptionFilter)
  resolveCode(@Param('code', ParseIntPipe) code: number) {
    return this.proj4Service.getDefinition(code);
  }
}
