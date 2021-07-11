import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Post,
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
import { NotFoundExceptionFilter } from 'src/common/exceptions/not-found.exception';
import { PayloadLimitInterceptor } from 'src/interceptor/payload-limit.interceptor';
import { GetShareDto } from './dto/get-share.dto';
import { ShareService } from './share.service';

@ApiTags('share')
@Controller('share')
export class ShareController {
  constructor(private shareService: ShareService) {}

  /**
   * Stores the share configuration and returns id of the share file.
   * @param shareDto Share data
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
  @UseInterceptors(new PayloadLimitInterceptor(1024 * 200))
  async create(@Body() shareDto: Record<string, unknown>) {
    return this.shareService.save(shareDto);
  }

  /**
   * Resolves the existing share ID.
   * @param params.id The share id
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
  @UseFilters(NotFoundExceptionFilter)
  async resolve(@Param() params: GetShareDto) {
    return await this.shareService.resolve(params.id);
  }
}
