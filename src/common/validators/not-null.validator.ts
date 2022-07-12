import { NotEquals, ValidateIf } from 'class-validator';

export function NotNull() {
  const notEquals = NotEquals(null);
  const validateIf = ValidateIf((object, value) => value !== undefined);
  return function (target: object, key: string) {
    validateIf(target, key);
    notEquals(target, key);
  };
}
