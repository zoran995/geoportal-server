import { ValidationErrorsFormatter } from '../validation-errors.formatter';

const validationError1 = {
  value: null,
  property: 'test',
  children: [],
  constraints: {
    max: 'port must not be greater than 65535',
    min: 'port must not be less than 0',
    isInt: 'port must be an integer number',
  },
};
const formattedError1 = {
  test: {
    value: null,
    constraints: expect.arrayContaining([
      { max: 'port must not be greater than 65535.\u00a0' },
      { isInt: 'port must be an integer number.\u00a0' },
      { min: 'port must not be less than 0.\u00a0' },
    ]),
  },
};

const validationError2 = {
  value: { testChild: '', test3: 'test3' },
  property: 'testProperty',
  children: [
    {
      value: '',
      property: 'testChild',
      children: [],
      constraints: {
        isNotEmpty: 'testChild should not be empty',
        isAlphanumeric: 'testChild must contain only letters and numbers',
      },
    },
  ],
};

const formattedError2 = {
  testProperty: {
    testChild: {
      value: '',
      constraints: expect.arrayContaining([
        { isNotEmpty: 'testChild should not be empty.\u00a0' },
        {
          isAlphanumeric:
            'testChild must contain only letters and numbers.\u00a0',
        },
      ]),
    },
  },
};

describe('ValidationErrorsFormatter', () => {
  it('should retturn empty object on empty array', () => {
    const formatted = ValidationErrorsFormatter.format([]);
    expect(formatted).toEqual({});
  });

  it('should properly format error', () => {
    const formatted = ValidationErrorsFormatter.format([validationError1]);
    expect(formatted).toBeDefined();
    expect(formatted.test).toBeDefined();
    expect(formatted).toStrictEqual(expect.objectContaining(formattedError1));
    expect(formatted.test.constraints).toHaveLength(3);
  });

  it('should properly format error with child errors', () => {
    const formatted = ValidationErrorsFormatter.format([validationError2]);
    expect(formatted).toBeDefined();
    expect((formatted.testProperty as any).testChild).toBeDefined();
    expect(formatted).toStrictEqual(expect.objectContaining(formattedError2));
    expect((formatted.testProperty as any).testChild.constraints).toHaveLength(
      2,
    );
  });

  it('should properly combine errors', () => {
    const formatted = ValidationErrorsFormatter.format([
      validationError1,
      validationError2,
    ]);
    expect(formatted).toBeDefined();
    expect(formatted.test).toBeDefined();
    expect(formatted).toStrictEqual(expect.objectContaining(formattedError1));
    expect(formatted.test.constraints).toHaveLength(3);
    expect((formatted.testProperty as any).testChild).toBeDefined();
    expect(formatted).toStrictEqual(expect.objectContaining(formattedError2));
    expect((formatted.testProperty as any).testChild.constraints).toHaveLength(
      2,
    );
  });
});
