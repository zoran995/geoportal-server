import { IsNotEmpty, IsString } from 'class-validator';

export class SearchRequestParams {
  @IsString()
  @IsNotEmpty()
  id!: string;
}
