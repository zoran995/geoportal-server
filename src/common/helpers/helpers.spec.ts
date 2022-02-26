import { isArray, isObject } from './helpers';

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
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  expect(isObject(() => {})).toBe(false);
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  expect(isObject(function () {})).toBe(false);
  expect(isObject(1)).toBe(false);
  expect(isObject('1')).toBe(false);

  expect(isObject({})).toBe(true);
  expect(isObject(new Date())).toBe(true);
  expect(isObject(new SimpleClass('asd'))).toBe(true);
});

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
