import { Controller, Get, Param, Post, UseInterceptors } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PayloadLimitInterceptor } from '../common/interceptor/payload-limit.interceptor';
import { ProxyDto, ProxyWithDurationDto } from './dto/proxy.dto';
import { ProxyService } from './proxy.service';

@Controller('proxy')
@ApiTags('proxy')
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  /**
   * Proxy request where target and duration are passed as params
   * @param params - Request params {@link ProxyWithDurationDto}
   */
  @Get('_:duration/*')
  @ApiBadRequestResponse()
  @ApiForbiddenResponse()
  @ApiInternalServerErrorResponse()
  async proxy(@Param() params: ProxyWithDurationDto) {
    return this.proxyService.proxyRequest(params['0'], params.duration);
  }

  /**
   * Proxy request where target and duration are passed as params
   * @param params - Request params {@link ProxyWithDurationDto}
   */
  @Post('_:duration/*')
  @ApiBody({ schema: {} })
  @ApiBadRequestResponse()
  @ApiForbiddenResponse()
  @ApiInternalServerErrorResponse()
  @UseInterceptors(PayloadLimitInterceptor)
  async proxyPost(@Param() params: ProxyWithDurationDto) {
    return this.proxyService.proxyRequest(params['0'], params.duration);
  }

  /**
   * Proxy request where only target is passed as param
   * @param params - Request params {@link ProxyDto}
   */
  @Get('*')
  @ApiBadRequestResponse()
  @ApiForbiddenResponse()
  @ApiInternalServerErrorResponse()
  async proxyDefault(@Param() params: ProxyDto) {
    return this.proxyService.proxyRequest(params['0']);
  }

  /**
   * Proxy request where only target is passed as param
   * @param params - Request params {@link ProxyDto}
   */
  @Post('*')
  @ApiBody({ schema: {} })
  @ApiBadRequestResponse()
  @ApiForbiddenResponse()
  @ApiInternalServerErrorResponse()
  @UseInterceptors(PayloadLimitInterceptor)
  async proxyDefaultPost(@Param() params: ProxyDto) {
    return this.proxyService.proxyRequest(params['0']);
  }
}
