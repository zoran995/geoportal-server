import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Res,
  UseFilters,
} from '@nestjs/common';
import { ApiNotFoundResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { HttpExceptionFilter } from '../common/filters/http-exception.filter';
import { GetInitDto } from './dto/get-init.dto';
import { InitService } from './init.service';

@ApiTags('init')
@Controller('init')
export class InitController {
  constructor(private readonly initService: InitService) {}

  /**
   * Special handling for /init/foo.json requests: look in initPaths, not just wwwroot/init
   * @param params - Request params ({@link GetInitDto})
   * @param res - Express res
   */
  @Get(':fileName')
  @ApiOperation({ summary: 'Resolves init configuration' })
  @ApiNotFoundResponse({ description: 'File not found.' })
  @UseFilters(HttpExceptionFilter)
  async serveInitFile(
    @Param() params: GetInitDto,
    @Res() res: Response,
  ): Promise<any> {
    const filePath = this.initService.getFilePath(params.fileName);
    if (!filePath) {
      throw new NotFoundException();
    }
    return res.sendFile(filePath);
  }
}
