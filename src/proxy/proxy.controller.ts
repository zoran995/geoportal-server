import {
  Controller,
  Get,
  Param,
  Query,
  Redirect,
  Req,
  Res,
  UseInterceptors,
} from '@nestjs/common';
import { GetProxyQueryDto } from './dto/get-proxy-query.dto';
import { SetResponseHeaders } from './interceptors/SetResponseHeaders';
import { ProxyService } from './proxy.service';
import { Blacklist } from './utils/blacklist';
import { Request, Response } from 'express';

@Controller('proxy')
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  @Get('blacklist')
  async blacklist() {
    return Blacklist.list;
  }

  @Get('testAuth')
  async testAuth(@Res() response: Response, @Req() request: Request) {
    if (request.headers.authorization) {
      response.status(403).send('authorization failed');
      response.end();
    } else {
      response.status(200).send('success');
      response.end();
    }
  }

  @Get('test')
  @Redirect('http://ci.terria.io/next/serverconfig', 301)
  async redirect() {
    return;
  }

  /**
   * Proxy request where target and duration are passed as query params
   * @param queryParams
   */
  @Get()
  @UseInterceptors(new SetResponseHeaders())
  async proxyQuery(@Query() queryParams: GetProxyQueryDto) {
    return this.proxyService.proxyRequest(
      queryParams.target,
      queryParams.duration,
    );
  }

  @Get('_:duration/*')
  @UseInterceptors(new SetResponseHeaders())
  async proxy(@Param('duration') duration: string, @Param() params) {
    return this.proxyService.proxyRequest(params['0'], duration);
  }

  @Get('*')
  @UseInterceptors(new SetResponseHeaders())
  async proxyDefault(@Param() params) {
    return this.proxyService.proxyRequest(params['0']);
  }
}
