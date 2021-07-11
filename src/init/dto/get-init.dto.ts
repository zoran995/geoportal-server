import { IsString } from 'class-validator';

export class GetInitDto {
  /**
   * Name of the requested file.
   */
  @IsString()
  fileName: string;
}
