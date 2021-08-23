import { IsNotEmpty, IsString } from 'class-validator';

export class AdditionalParametersDto {
  @IsString()
  @IsNotEmpty()
  descriptiveLabel!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;
}
