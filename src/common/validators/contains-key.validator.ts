import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function ContainsKey(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: { [key: string]: any }, propertyName: string) {
    registerDecorator({
      name: 'containsKey',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: Map<string, any>, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          const relatedValue = (args.object as any)[relatedPropertyName];

          return (
            typeof relatedValue === 'string' && value && value.has(relatedValue)
          ); // you can return a Promise<boolean> here as well, if you want to make async validation
        },
        defaultMessage(args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          const relatedValue = (args.object as any)[relatedPropertyName];
          return `$object ${relatedPropertyName} must contain object with key ${relatedValue}`;
        },
      },
    });
  };
}
