import {
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
  ApiTags,
} from '@nestjs/swagger';
import { PayloadLimitInterceptor } from 'src/interceptor/payload-limit.interceptor';
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
  @UseInterceptors(PayloadLimitInterceptor)
  async proxyQueryPost(@Query() queryParams: GetProxyQueryDto) {
    return this.proxyService.proxyRequest(
      queryParams.target,
      queryParams.duration,
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
  async proxy(@Param('duration') duration: string, @Param() params: any) {
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
  @UseInterceptors(PayloadLimitInterceptor)
  async proxyPost(@Param('duration') duration: string, @Param() params: any) {
    return this.proxyService.proxyRequest(params['0'], duration);
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
  async proxyDefault(@Param() params: any) {
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
  @UseInterceptors(PayloadLimitInterceptor)
  async proxyDefaultPost(@Param() params: any) {
    return this.proxyService.proxyRequest(params['0'], undefined);
  }
}
