import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * Check if array contains object with specified key value.
 * @param array - Array that is checked
 * @param key - key that are checked
 * @param value - value that of the object object should
 */
export function arrayContainsObjectKey(
  array: any[],
  key: string,
  value: string,
) {
  return (
    typeof value === 'string' &&
    array &&
    array.some((prop) => prop[key] === value)
  ); // you can return a Promise<boolean> here as well, if you want to make async validation
}

export function ArrayContainsObjectKey(
  property: string,
  key: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: { [key: string]: any }, propertyName: string) {
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
  validate(value: any[], args: ValidationArguments) {
    const [relatedPropertyName, key] = args.constraints;
    const relatedValue = (args.object as any)[relatedPropertyName];
    return arrayContainsObjectKey(value, key, relatedValue);
  }

  defaultMessage(args: ValidationArguments) {
    const [relatedPropertyName, key] = args.constraints;
    const relatedValue = (args.object as any)[relatedPropertyName];
    return `array (\`${args.property}\`) must contain object with property ${key} equal to ${relatedValue}`;
  }
}
