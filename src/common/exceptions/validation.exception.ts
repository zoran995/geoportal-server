import { HttpException, HttpStatus } from '@nestjs/common';

export class ValidationException extends HttpException {
  constructor(objectOrError: Record<string, unknown> | Error) {
    super(objectOrError, HttpStatus.BAD_REQUEST);
  }
}
