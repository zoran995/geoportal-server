import { ValidationError } from 'class-validator';

import { isDefined } from '../helpers/isDefined';

export class ValidationErrorsFormatter {
  /**
   * @param validationErrors - list of validation errors to format
   * @returns
   */
  public static format(validationErrors: ValidationError[]): ValidationObject {
    return validationErrors.reduce(
      (p, c: ValidationError): ValidationObject => {
        const { children, constraints } = c;
        if (
          (!isDefined(children) || !children.length) &&
          isDefined(constraints)
        ) {
          p[c.property] = {
            value: c.value,
            constraints: Object.keys(constraints).map((key) => {
              const obj: Record<string, string> = {};
              obj[key] = constraints[key] + '.\u00a0';
              return obj;
            }),
          };
        } else if (isDefined(children)) {
          p[c.property] = ValidationErrorsFormatter.format(children);
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
