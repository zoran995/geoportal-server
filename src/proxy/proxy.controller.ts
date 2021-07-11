import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiParam,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { GetProxyQueryDto } from './dto/get-proxy-query.dto';
import { SetResponseHeaders } from './interceptors/SetResponseHeaders';
import { ProxyService } from './proxy.service';

@Controller('proxy')
@ApiTags('proxy')
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  /**
   * Proxy request where target and duration are passed as query params
   * @param queryParams
   */
  @Get()
  @ApiBadRequestResponse()
  @ApiForbiddenResponse()
  @ApiInternalServerErrorResponse()
  @UseInterceptors(new SetResponseHeaders())
  async proxyQuery(@Query() queryParams: GetProxyQueryDto) {
    return this.proxyService.proxyRequest(
      queryParams.target,
      queryParams.duration,
    );
  }

  @Post()
  @ApiBody({ schema: {} })
  @ApiBadRequestResponse()
  @ApiForbiddenResponse()
  @ApiInternalServerErrorResponse()
  @UseInterceptors(new SetResponseHeaders())
  async proxyQueryPost(
    @Query() queryParams: GetProxyQueryDto,
    @Body() payload: any,
  ) {
    return this.proxyService.proxyRequest(
      queryParams.target,
      queryParams.duration,
      payload,
    );
  }

  /**
   * Proxy request where target and duration are passed as params
   * @param queryParams
   */
  @Get('_:duration/*')
  @ApiBadRequestResponse()
  @ApiForbiddenResponse()
  @ApiInternalServerErrorResponse()
  @UseInterceptors(new SetResponseHeaders())
  async proxy(@Param('duration') duration: string, @Param() params) {
    return this.proxyService.proxyRequest(params['0'], duration);
  }

  /**
   * Proxy request where target and duration are passed as params
   * @param queryParams
   */
  @Post('_:duration/*')
  @ApiBody({ schema: {} })
  @ApiBadRequestResponse()
  @ApiForbiddenResponse()
  @ApiInternalServerErrorResponse()
  @UseInterceptors(new SetResponseHeaders())
  async proxyPost(
    @Param('duration') duration: string,
    @Param() params,
    @Body() payload: any,
  ) {
    return this.proxyService.proxyRequest(params['0'], duration, payload);
  }

  /**
   * Proxy request where only target is passed as param
   * @param params
   */
  @Get('*')
  @ApiBadRequestResponse()
  @ApiForbiddenResponse()
  @ApiInternalServerErrorResponse()
  @UseInterceptors(new SetResponseHeaders())
  async proxyDefault(@Param() params) {
    return this.proxyService.proxyRequest(params['0']);
  }

  /**
   * Proxy request where only target is passed as param
   * @param params
   */
  @Post('*')
  @ApiBody({ schema: {} })
  @ApiBadRequestResponse()
  @ApiForbiddenResponse()
  @ApiInternalServerErrorResponse()
  @UseInterceptors(new SetResponseHeaders())
  async proxyDefaultPost(@Param() params, @Body() payload: any) {
    return this.proxyService.proxyRequest(params['0'], undefined, payload);
  }
}
