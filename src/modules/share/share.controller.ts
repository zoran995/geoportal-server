import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Post,
  Req,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { HttpExceptionFilter } from 'src/common/filters';
import { PayloadLimitInterceptor } from 'src/common/interceptor';

import { GetShareDto } from './dto/get-share.dto';
import { ShareService } from './share.service';
import type { Request } from 'express';

@ApiTags('share')
@Controller('share')
export class ShareController {
  constructor(private shareService: ShareService) {}

  /**
   * Stores the share configuration and returns id of the share file.
   * @param shareDto - Share data
   * @returns The share ID
   */
  @Post()
  @ApiOperation({ summary: 'Create new short url.' })
  @ApiBody({ schema: { example: {} } })
  @Header('content-type', 'text/html')
  @Header('accept', 'application/json')
  @ApiCreatedResponse({
    description: 'ID of stored share configuration.',
  })
  @ApiNotFoundResponse()
  @ApiInternalServerErrorResponse()
  @UseInterceptors(PayloadLimitInterceptor)
  async create(
    @Body() shareDto: Record<string, unknown>,
    @Req() request: Request,
  ) {
    return await this.shareService.save(shareDto, request);
  }

  /**
   * Resolves the existing share ID.
   * @param params - Request params ({@link GetShareDto})
   * @returns The share data
   */
  @Get(':id')
  @ApiOperation({ summary: 'Resolves the existing share ID' })
  @Header('content-type', 'application/json')
  @ApiOkResponse({
    description: 'The init configuration of the share',
    schema: { example: {} },
  })
  @ApiNotFoundResponse({ description: 'Share configuration not found.' })
  @ApiBadRequestResponse({ description: 'Unknown prefix to resolve' })
  @UseFilters(HttpExceptionFilter)
  async resolve(@Param() params: GetShareDto) {
    return this.shareService.resolve(params.id);
  }
}
