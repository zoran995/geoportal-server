import {
  buildMessage,
  isFQDN,
  isIP,
  IsIpVersion,
  isPort,
  ValidateBy,
  ValidationOptions,
} from 'class-validator';

export const IS_FQDN_OR_IP = 'isFqdnOrIp';

interface IsFQDNOptions {
  /**
   * @default true
   */
  require_tld?: boolean | undefined;
  /**
   * @default false
   */
  allow_underscores?: boolean | undefined;
  /**
   * @default false
   */
  allow_trailing_dot?: boolean | undefined;
}

export function isFqdnOrIp(
  validationOptions?: ValidationOptions,
  ipOptions?: IsIpVersion,
  fqdnOptions?: IsFQDNOptions,
): PropertyDecorator {
  return ValidateBy(
    {
      name: IS_FQDN_OR_IP,
      validator: {
        validate: (value): boolean => {
          if (value.indexOf(':') > 1) {
            const split = value.split(':');
            value = split.shift();
            const portStr = split[0];
            if (!isPort(portStr)) {
              return false;
            }
          }
          return isIP(value, ipOptions) || isFQDN(value, fqdnOptions);
        },
        defaultMessage: buildMessage(
          (eachPrefix) =>
            eachPrefix + '$property must be an ip address or fqdn',
          validationOptions,
        ),
      },
    },
    validationOptions,
  );
}
