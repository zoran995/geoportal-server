import { Validator } from 'class-validator';

import { NotNull } from '../not-null.validator';

const validator = new Validator();

class MyClass {
  @NotNull()
  title?: any;
}

describe('NotNull', () => {
  it('should not throw when value specified', () => {
    expect.assertions(1);
    const model = new MyClass();
    model.title = 'test';
    return validator.validate(model).then((errors) => {
      expect(errors.length).toEqual(0);
    });
  });

  it('should not throw when value undefined', () => {
    expect.assertions(1);
    const model = new MyClass();
    model.title = undefined;
    return validator.validate(model).then((errors) => {
      expect(errors.length).toEqual(0);
    });
  });

  it('should throw when value null', () => {
    expect.assertions(5);
    const model = new MyClass();
    model.title = null;
    return validator.validate(model).then((errors) => {
      expect(errors.length).toEqual(1);
      expect(errors[0].target).toEqual(model);
      expect(errors[0].property).toEqual('title');
      expect(errors[0].constraints).toEqual({
        notEquals: 'title should not be equal to null',
      });
      expect(errors[0].value).toEqual(null);
    });
  });
});
