import { BadRequestException } from '@nestjs/common';

import { processDuration } from '../processDuration';

describe('proxy process duration', () => {
  it('properly process milliseconds', () => {
    const duration = processDuration('3000ms');
    expect(duration).toBe(3);
  });
  it('properly process seconds', () => {
    const duration = processDuration('3s');
    expect(duration).toBe(3);
  });
  it('properly process minutes', () => {
    const duration = processDuration('2m');
    expect(duration).toBe(120);
  });
  it('properly process hours', () => {
    const duration = processDuration('2h');
    expect(duration).toBe(7200);
  });
  it('properly process days', () => {
    const duration = processDuration('2d');
    expect(duration).toBe(172800);
  });
  it('properly process week ', () => {
    const duration = processDuration('2w');
    expect(duration).toBe(1209600);
  });
  it('properly process years', () => {
    const duration = processDuration('2y');
    expect(duration).toBe(63072000);
  });

  it('throws an BadRequestException on invalid suffix', () => {
    expect.assertions(1);
    try {
      processDuration('0.1ss');
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestException);
    }
  });
});
