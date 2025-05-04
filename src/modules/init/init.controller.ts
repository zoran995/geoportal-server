import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Res,
  UseFilters,
} from '@nestjs/common';
import { ApiNotFoundResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import type { Response } from 'express';
import sanitize from 'sanitize-filename';

import { HttpExceptionFilter } from 'src/common/filters/index.js';

import { GetInitDto } from './dto/get-init.dto.js';
import { InitService } from './init.service.js';

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
  serveInitFile(@Param() params: GetInitDto, @Res() res: Response): void {
    const fileName = sanitize(params.fileName);
    const filePath = this.initService.getFilePath(fileName);
    if (!filePath) {
      throw new NotFoundException();
    }
    return res.sendFile(filePath);
  }
}
