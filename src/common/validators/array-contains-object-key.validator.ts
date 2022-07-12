import {
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator,
} from 'class-validator';

/**
 * Check if array contains object with specified key value.
 * @param array - Array that is checked
 * @param key - key that are checked
 * @param value - value that of the object object should
 */
export function arrayContainsObjectKey(
  array: unknown[],
  key: string,
  value: string,
) {
  return (
    typeof value === 'string' &&
    array &&
    Array.isArray(array) &&
    array.some((prop) => prop[key] === value)
  ); // you can return a Promise<boolean> here as well, if you want to make async validation
}

export function ArrayContainsObjectKey(
  property: string,
  key: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'ArrayContainsObjectKey',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property, key],
      options: validationOptions,
      validator: ArrayContainsObjectKeyConstraint,
    });
  };
}

@ValidatorConstraint({ name: 'ArrayContainsObjectKey' })
export class ArrayContainsObjectKeyConstraint
  implements ValidatorConstraintInterface
{
  validate(value: unknown[], args: ValidationArguments) {
    const [relatedPropertyName, key] = args.constraints;
    const relatedValue = (args.object as never)[relatedPropertyName];
    return arrayContainsObjectKey(value, key as string, relatedValue as string);
  }

  defaultMessage(args: ValidationArguments) {
    const [relatedPropertyName, key] = args.constraints;
    const relatedValue = (args.object as never)[relatedPropertyName];
    return `array (\`${args.property}\`) must contain object with property ${key} equal to ${relatedValue}`;
  }
}
