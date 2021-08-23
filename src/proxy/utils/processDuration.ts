import { BadRequestException } from '@nestjs/common';
import { DURATION_REGEX, DURATION_UNITS } from '../proxy.constants';

/**
 * Interpret the max age as a duration in Varnish notation
 * https://www.varnish-cache.org/docs/trunk/reference/vcl.html#durations
 * @param duration - max age
 * @returns converted duration
 * @throws {@link BadRequestException} - when duration is not valid
 */
export const processDuration = (duration: string): number | never => {
  const parsedMaxAge = DURATION_REGEX.exec(duration);
  if (!parsedMaxAge || parsedMaxAge.length < 3) {
    throw new BadRequestException('Invalid duration');
  }
  const value = parseFloat(parsedMaxAge[1]);
  if (value !== value) {
    throw new BadRequestException('Invalid duration');
  }
  const unit: any = parsedMaxAge[2];
  const unitConversion = DURATION_UNITS[unit];

  if (!unitConversion) {
    throw new BadRequestException('Invalid duration unit ' + parsedMaxAge[2]);
  }

  return value * unitConversion;
};
