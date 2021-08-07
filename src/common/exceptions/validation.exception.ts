import { HttpException, HttpStatus } from '@nestjs/common';

export class ValidationException extends HttpException {
  constructor(objectOrError?: any) {
    super(objectOrError, HttpStatus.BAD_REQUEST);
  }
}
