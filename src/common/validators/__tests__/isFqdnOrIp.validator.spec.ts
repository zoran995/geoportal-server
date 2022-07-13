import { ValidationError } from '@nestjs/common';

import { Validator } from 'class-validator';

import { isFqdnOrIp } from '../isFqdnOrIp.validator';

const validator = new Validator();

describe('isFqdnOrIp', () => {
  describe('single', () => {
    class MyClass {
      @isFqdnOrIp()
      title?: string;
    }
    it('should not throw when valid IPv4', () => {
      expect.assertions(1);
      const model = new MyClass();
      model.title = '192.168.1.1';
      return validator.validate(model).then((errors) => {
        expect(errors.length).toEqual(0);
      });
    });

    it('should not throw when valid IPv6', () => {
      expect.assertions(1);
      const model = new MyClass();
      model.title = '::ffff:127.0.0.1';
      return validator.validate(model).then((errors) => {
        expect(errors.length).toEqual(0);
      });
    });

    it('should not throw when valid fqdn', () => {
      expect.assertions(1);
      const model = new MyClass();
      model.title = 'example.com';
      return validator.validate(model).then((errors) => {
        expect(errors.length).toEqual(0);
      });
    });

    it('should throw error when invalid IPv4', () => {
      expect.assertions(5);
      const model = new MyClass();
      model.title = '::/128';
      return validator
        .validate(model)
        .then((errors) => assertErrors(errors, model, model.title));
    });

    it('should throw error when invalid IPv6', () => {
      expect.assertions(5);
      const model = new MyClass();
      model.title = '::11111';
      return validator
        .validate(model)
        .then((errors) => assertErrors(errors, model, model.title));
    });

    it('should throw error when invalid fqdn', () => {
      expect.assertions(5);
      const model = new MyClass();
      model.title = 'http://example.com';
      return validator
        .validate(model)
        .then((errors) => assertErrors(errors, model, model.title));
    });

    it('should throw error when undefined', () => {
      expect.assertions(5);
      const model = new MyClass();
      model.title = undefined;
      return validator
        .validate(model)
        .then((errors) => assertErrors(errors, model, model.title));
    });

    it('should properly validate IP with valid port', () => {
      expect.assertions(1);
      const model = new MyClass();
      model.title = '127.0.0.1:3001';
      return validator.validate(model).then((errors) => {
        expect(errors.length).toEqual(0);
      });
    });

    it('should return error when IP with invalid port', () => {
      expect.assertions(5);
      const model = new MyClass();
      model.title = '127.0.0.1:658898';
      return validator
        .validate(model)
        .then((errors) => assertErrors(errors, model, model.title));
    });

    it('should return error when IP with empty port', () => {
      expect.assertions(5);
      const model = new MyClass();
      model.title = '127.0.0.1:';
      return validator
        .validate(model)
        .then((errors) => assertErrors(errors, model, model.title));
    });
  });

  describe('array', () => {
    class MyClass {
      @isFqdnOrIp({ each: true })
      title?: string[];
    }
    it('should not throw when valid IPv4', () => {
      expect.assertions(1);
      const model = new MyClass();
      model.title = ['192.168.1.1', '127.0.0.1'];
      return validator.validate(model).then((errors) => {
        expect(errors.length).toEqual(0);
      });
    });

    it('should not throw when valid IPv6', () => {
      expect.assertions(1);
      const model = new MyClass();
      model.title = ['::ffff:127.0.0.1', 'fe80::a6db:30ff:fe98:e946'];
      return validator.validate(model).then((errors) => {
        expect(errors.length).toEqual(0);
      });
    });

    it('should not throw when valid fqdn', () => {
      expect.assertions(1);
      const model = new MyClass();
      model.title = ['example.com'];
      return validator.validate(model).then((errors) => {
        expect(errors.length).toEqual(0);
      });
    });

    it('should not throw when combining valid values', () => {
      expect.assertions(1);
      const model = new MyClass();
      model.title = ['example.com', '::ffff:127.0.0.1', '127.0.0.1'];
      return validator.validate(model).then((errors) => {
        expect(errors.length).toEqual(0);
      });
    });

    it('should throw error when invalid IPv4', () => {
      expect.assertions(5);
      const model = new MyClass();
      model.title = ['192.168', '127.0.0.1'];
      return validator
        .validate(model)
        .then((errors) => assertErrors(errors, model, model.title));
    });
    it('should throw error when invalid IPv6', () => {
      expect.assertions(5);
      const model = new MyClass();
      model.title = ['::11111', '::ffff:127.0.0.1'];
      return validator
        .validate(model)
        .then((errors) => assertErrors(errors, model, model.title));
    });

    it('should throw error when invalid fqdn', () => {
      expect.assertions(5);
      const model = new MyClass();
      model.title = ['http://example.com'];
      return validator
        .validate(model)
        .then((errors) => assertErrors(errors, model, model.title));
    });

    it('should not throw error when empty', () => {
      expect.assertions(1);
      const model = new MyClass();
      model.title = [];
      return validator.validate(model).then((errors) => {
        expect(errors.length).toEqual(0);
      });
    });
  });

  describe('only IPv4 and fqdn', () => {
    describe('single', () => {
      class MyClass {
        @isFqdnOrIp({}, '4')
        title?: string;
      }
      it('should not throw on valid ip', () => {
        expect.assertions(1);
        const model = new MyClass();
        model.title = '192.168.1.1';
        return validator.validate(model).then((errors) => {
          expect(errors.length).toEqual(0);
        });
      });

      it('should not throw on fqdn', () => {
        expect.assertions(1);
        const model = new MyClass();
        model.title = 'example.com';
        return validator.validate(model).then((errors) => {
          expect(errors.length).toEqual(0);
        });
      });

      it('should throw on ip v6', () => {
        expect.assertions(5);
        const model = new MyClass();
        model.title = '::11111';
        return validator
          .validate(model)
          .then((errors) => assertErrors(errors, model, model.title));
      });
    });

    describe('array', () => {
      class MyClass {
        @isFqdnOrIp({ each: true }, '4')
        title?: string[];
      }
      it('should throw when one ip is v6', () => {
        expect.assertions(5);
        const model = new MyClass();
        model.title = ['example.com', '::ffff:127.0.0.1', '127.0.0.1'];
        return validator
          .validate(model)
          .then((errors) => assertErrors(errors, model, model.title));
      });
    });
  });

  describe('only IPv6 and fqdn', () => {
    describe('single', () => {
      class MyClass {
        @isFqdnOrIp({}, '6')
        title?: string;
      }
      it('should not throw on valid ip', () => {
        expect.assertions(1);
        const model = new MyClass();
        model.title = '::ffff:127.0.0.1';
        return validator.validate(model).then((errors) => {
          expect(errors.length).toEqual(0);
        });
      });

      it('should not throw on fqdn', () => {
        expect.assertions(1);
        const model = new MyClass();
        model.title = 'example.com';
        return validator.validate(model).then((errors) => {
          expect(errors.length).toEqual(0);
        });
      });

      it('should throw on ip v4', () => {
        expect.assertions(5);
        const model = new MyClass();
        model.title = '127.0.0.1';
        return validator
          .validate(model)
          .then((errors) => assertErrors(errors, model, model.title));
      });
    });

    describe('array', () => {
      class MyClass {
        @isFqdnOrIp({ each: true }, '6')
        title?: string[];
      }
      it('should throw when one ip is v4', () => {
        expect.assertions(5);
        const model = new MyClass();
        model.title = ['example.com', '::ffff:127.0.0.1', '127.0.0.1'];
        return validator
          .validate(model)
          .then((errors) => assertErrors(errors, model, model.title));
      });
    });
  });
});

const assertErrors = (
  errors: ValidationError[],
  model: { title?: string | string[] },
  value: any,
) => {
  expect(errors.length).toEqual(1);
  expect(errors[0].target).toEqual(model);
  expect(errors[0].property).toEqual('title');
  expect(errors[0].constraints).toEqual({
    isFqdnOrIp: Array.isArray(model.title)
      ? 'each value in title must be an ip address or fqdn'
      : 'title must be an ip address or fqdn',
  });
  expect(errors[0].value).toEqual(value);
};
