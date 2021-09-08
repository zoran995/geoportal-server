import { Validator } from 'class-validator';
import { ArrayContainsObjectKey } from './array-contains-object-key.validator';

const validator = new Validator();

class SubClass {
  title!: string;
}

class MyClass {
  newTitle = 'test';

  @ArrayContainsObjectKey('newTitle', 'title')
  availableTitles?: SubClass[];
}

describe('ArrayContainsObjectKey', () => {
  it('should not throw when array contains object with specified key value', () => {
    expect.assertions(1);
    const subModel1 = new SubClass();
    subModel1.title = 'test';
    const subModel2 = new SubClass();
    subModel2.title = 'test2';
    const model = new MyClass();
    model.newTitle = 'test';
    model.availableTitles = [subModel1, subModel2];
    return validator.validate(model).then((errors) => {
      expect(errors.length).toEqual(0);
    });
  });

  it("should throw when array doesn't contain object with specified key value", () => {
    expect.assertions(5);
    const subModel1 = new SubClass();
    subModel1.title = 'test';
    const subModel2 = new SubClass();
    subModel2.title = 'test2';
    const model = new MyClass();
    model.newTitle = 'test-invalid';
    model.availableTitles = [subModel1, subModel2];
    return validator.validate(model).then((errors) => {
      expect(errors.length).toEqual(1);
      expect(errors[0].target).toEqual(model);
      expect(errors[0].property).toEqual('availableTitles');
      expect(errors[0].constraints).toEqual({
        ArrayContainsObjectKey:
          'array (`availableTitles`) must contain object with property title equal to test-invalid',
      });
      expect(errors[0].value).toEqual(model.availableTitles);
    });
  });

  it('should throw when array is empty', () => {
    expect.assertions(5);
    const model = new MyClass();
    model.newTitle = 'test-invalid';
    model.availableTitles = [];
    return validator.validate(model).then((errors) => {
      expect(errors.length).toEqual(1);
      expect(errors[0].target).toEqual(model);
      expect(errors[0].property).toEqual('availableTitles');
      expect(errors[0].constraints).toEqual({
        ArrayContainsObjectKey:
          'array (`availableTitles`) must contain object with property title equal to test-invalid',
      });
      expect(errors[0].value).toEqual(model.availableTitles);
    });
  });
});
