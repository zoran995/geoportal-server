import { All, Controller } from '@nestjs/common';

@Controller('ping')
export class PingController {
  @All()
  ping() {
    return 'OK';
  }
}
