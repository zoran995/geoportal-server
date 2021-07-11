import { ValidationError } from 'class-validator';

export class ValidationErrorsFormatter {
  /**
   * @param {ValidationError[]} validationErrors
   * @returns
   */
  public static format(validationErrors: ValidationError[]): ValidationObject {
    return validationErrors.reduce(
      (p, c: ValidationError): ValidationObject => {
        if (!c.children || !c.children.length) {
          p[c.property] = {
            value: c.value,
            constraints: Object.keys(c.constraints).map((key) => {
              const obj = {};
              obj[key] = c.constraints[key] + '.\u00a0';
              return obj;
            }),
          };
        } else {
          p[c.property] = ValidationErrorsFormatter.format(c.children);
        }
        return p;
      },
      {} as ValidationObject,
    );
  }
}

export interface ValidationObject {
  [key: string]:
    | { value: string; constraints: { [key: string]: string }[] }
    | ValidationObject;
}
