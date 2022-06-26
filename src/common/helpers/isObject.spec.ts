import { isObject } from './isObject';

class SimpleClass {
  constructor(public name: string) {}
}

test('helper isObject', () => {
  expect.assertions(12);
  expect(isObject([])).toBe(false);
  expect(isObject(false)).toBe(false);
  expect(isObject(true)).toBe(false);
  expect(isObject(null)).toBe(false);
  expect(isObject(undefined)).toBe(false);
  expect(
    isObject(() => {
      return;
    }),
  ).toBe(false);
  expect(
    isObject(function () {
      return;
    }),
  ).toBe(false);
  expect(isObject(1)).toBe(false);
  expect(isObject('1')).toBe(false);

  expect(isObject({})).toBe(true);
  expect(isObject(new Date())).toBe(true);
  expect(isObject(new SimpleClass('asd'))).toBe(true);
});
