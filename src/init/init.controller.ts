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
import { NotFoundExceptionFilter } from '../common/exceptions/not-found.exception';
import { GetInitDto } from './dto/get-init.dto';
import { InitService } from './init.service';

@ApiTags('init')
@Controller('init')
export class InitController {
  constructor(private readonly initService: InitService) {}

  /**
   * Special handling for /init/foo.json requests: look in initPaths, not just wwwroot/init
   * @param params.fileName Name of the file
   * @param res Express res
   */
  @Get(':fileName')
  @ApiOperation({ summary: 'Resolves init configuration' })
  @ApiNotFoundResponse({ description: 'File not found.' })
  @UseFilters(NotFoundExceptionFilter)
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
