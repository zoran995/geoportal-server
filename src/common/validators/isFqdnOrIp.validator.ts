import {
  IsIpVersion,
  ValidateBy,
  ValidationOptions,
  buildMessage,
  isFQDN,
  isIP,
  isPort,
} from 'class-validator';

export const IS_FQDN_OR_IP = 'isFqdnOrIp';

interface IsFQDNOptions {
  /**
   * @defaultValue true
   */
  require_tld: boolean | undefined;
  /**
   * @defaultValue false
   */
  allow_underscores: boolean | undefined;
  /**
   * @defaultValue false
   */
  allow_trailing_dot: boolean | undefined;
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
        validate: (value?: string): boolean => {
          const split = value?.split(':');
          if (split?.length === 2) {
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
