import { portSchema } from '../port.schema.js';

describe('portSchema', () => {
  it('should return true for valid port numbers', () => {
    const result = portSchema.safeParse(80);
    expect(result.success).toBeTruthy();

    const result1 = portSchema.safeParse(3001);
    expect(result1.success).toBeTruthy();
  });

  it('should return false for negative port numbers', () => {
    const result = portSchema.safeParse(-1);

    expect(result.success).toBeFalsy();
  });

  it('should return false for port numbers greater than 65535', () => {
    const result = portSchema.safeParse(65536);

    expect(result.success).toBeFalsy();
  });

  it('should return false for floating point numbers', () => {
    const result = portSchema.safeParse(80.5);

    expect(result.success).toBeFalsy();
  });

  it('should implicitly convert string to number', () => {
    const result = portSchema.safeParse('80');

    expect(result.success).toBeTruthy();
    expect(result.data).toBe(80);
  });

  it('should fail on non-numeric string', () => {
    const result = portSchema.safeParse('abc');

    expect(result.success).toBeFalsy();
  });

  it('should fail on alhpanumeric string', () => {
    const result = portSchema.safeParse('80abc');

    expect(result.success).toBeFalsy();
  });

  it('should fail on floating point string', () => {
    const result = portSchema.safeParse('80.5');

    expect(result.success).toBeFalsy();
  });
});
