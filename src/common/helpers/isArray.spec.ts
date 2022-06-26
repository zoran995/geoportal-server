import { isArray } from './isArray';

class SimpleClass {
  constructor(public name: string) {}
}
test('helper is array', () => {
  expect.assertions(10);
  expect(isArray({})).toBe(false);
  expect(isArray(new Date())).toBe(false);
  expect(isArray(new SimpleClass('asd'))).toBe(false);
  expect(isArray(false)).toBe(false);
  expect(isArray(true)).toBe(false);
  expect(isArray(null)).toBe(false);
  expect(isArray(undefined)).toBe(false);
  expect(isArray(1)).toBe(false);
  expect(isArray('1')).toBe(false);

  expect(isArray([])).toBe(true);
});
