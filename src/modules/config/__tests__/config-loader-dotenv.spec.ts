import { vol, DirectoryJSON } from 'memfs';
import { ConfigLoader } from '../config-loader';

jest.mock('fs');

const volJson: DirectoryJSON = {
  './test/dotenv-expand.json': JSON.stringify({
    'basic-expand': '$BASIC',
    MACHINE_EXPAND: '$MACHINE',

    ESCAPED_EXPAND: '\\$ESCAPED',

    EXPAND_DEFAULT: '${MACHINE:-default}',
    EXPAND_DEFAULT_NESTED: '${MACHINE:-${UNDEFINED:-default}}',
    EXPAND_DEFAULT_NESTED2: '${MACHINE-${UNDEFINED-default}}',
    EXPAND_DEFAULT_NESTED_TWICE:
      '${UNDEFINED:-${MACHINE}${UNDEFINED:-default}}',
    EXPAND_DEFAULT_NESTED_TWICE2: '${UNDEFINED-${MACHINE}${UNDEFINED-default}}',
    EXPAND_DEFAULT_SPECIAL_CHARACTERS: '${MACHINE:-/default/path:with/colon}',
    EXPAND_DEFAULT_SPECIAL_CHARACTERS2: '${MACHINE-/default/path:with/colon}',

    UNDEFINED_EXPAND: '$UNDEFINED',
    UNDEFINED_EXPAND_NESTED: '${UNDEFINED:-${MACHINE:-default}}',
    UNDEFINED_EXPAND_DEFAULT: '${UNDEFINED:-default}',
    UNDEFINED_EXPAND_DEFAULT2: '${UNDEFINED-default}',
    UNDEFINED_EXPAND_DEFAULT_NESTED: '${UNDEFINED:-${UNDEFINED:-default}}',
    UNDEFINED_EXPAND_DEFAULT_NESTED2: '${UNDEFINED-${UNDEFINED-default}}',
    UNDEFINED_EXPAND_DEFAULT_NESTED_TWICE:
      '${UNDEFINED:-${UNDEFINED:-${UNDEFINED:-default}}}',
    UNDEFINED_EXPAND_DEFAULT_NESTED_TWICE2:
      '${UNDEFINED-${UNDEFINED-${UNDEFINED-default}}}',
    UNDEFINED_EXPAND_DEFAULT_SPECIAL_CHARACTERS:
      '${UNDEFINED:-/default/path:with/colon}',
    UNDEFINED_EXPAND_DEFAULT_SPECIAL_CHARACTERS2:
      '${UNDEFINED-/default/path:with/colon}',
    UNDEFINED_EXPAND_DEFAULT_SPECIAL_CHARACTERS_NESTED:
      '${UNDEFINED:-${UNDEFINED_2:-/default/path:with/colon}}',
    UNDEFINED_EXPAND_DEFAULT_SPECIAL_CHARACTERS_NESTED2:
      '${UNDEFINED-${UNDEFINED_2-/default/path:with/colon}}',
    MONGOLAB_URI:
      'mongodb://${MONGOLAB_USER}:${MONGOLAB_PASSWORD}@${MONGOLAB_DOMAIN}:${MONGOLAB_PORT}/${MONGOLAB_DATABASE}',

    MONGOLAB_URI_RECURSIVELY:
      'mongodb://${MONGOLAB_USER_RECURSIVELY}@${MONGOLAB_DOMAIN}:${MONGOLAB_PORT}/${MONGOLAB_DATABASE}',

    NO_CURLY_BRACES_URI:
      'mongodb://$MONGOLAB_USER:$MONGOLAB_PASSWORD@$MONGOLAB_DOMAIN:$MONGOLAB_PORT/$MONGOLAB_DATABASE',
    NO_CURLY_BRACES_USER_RECURSIVELY: '$MONGOLAB_USER:$MONGOLAB_PASSWORD',
    NO_CURLY_BRACES_URI_RECURSIVELY:
      'mongodb://$MONGOLAB_USER_RECURSIVELY@$MONGOLAB_DOMAIN:$MONGOLAB_PORT/$MONGOLAB_DATABASE',
    NO_CURLY_BRACES_UNDEFINED_EXPAND_DEFAULT_SPECIAL_CHARACTERS:
      '$UNDEFINED:-/default/path:with/colon',
    NO_CURLY_BRACES_UNDEFINED_EXPAND_DEFAULT_SPECIAL_CHARACTERS2:
      '$UNDEFINED-/default/path:with/colon',

    'POSTGRESQL.MAIN.USER': '${POSTGRESQL.BASE.USER}',

    ONETWO: '${ONE}${TWO}',
    ONETWO_SIMPLE: '${ONE}$TWO',
    ONETWO_SIMPLE2: '$ONE${TWO}',
    ONETWO_SUPER_SIMPLE: '$ONE$TWO',

    TWO_DOLLAR_SIGNS: 'abcd$$1234',

    DONT_CHOKE1:
      '.kZh`>4[,[DDU-*Jt+[;8-,@K=,9%;F9KsoXqOE)gpG^X!{)Q+/9Fc(QF}i[NEi!',
    DONT_CHOKE2:
      '=;+=CNy3)-D=zI6gRP2w\\$B@0K;Y]e^EFnCmx\\$Dx?;.9wf-rgk1BcTR0]JtY<S:b_',
    DONT_CHOKE3:
      'MUcKSGSY@HCON<1S_siWTP`DgS*Ug],mu]SkqI|7V2eOk9:>&fw;>HEwms`D8E2H',
    DONT_CHOKE4:
      'm]zjzfRItw2gs[2:{p{ugENyFw9m)tH6_VCQzer`*noVaI<vqa3?FZ9+6U;K#Bfd',
    DONT_CHOKE5:
      '#la__nK?IxNlQ%`5q&DpcZ>Munx=[1-AMgAcwmPkToxTaB?kgdF5y`A8m=Oa-B!)',
    DONT_CHOKE6:
      'xlC&*<j4J<d._<JKH0RBJV!4(ZQEN-+&!0p137<g*hdY2H4xk?/;KO1\\$(W{:Wc}Q',
    DONT_CHOKE7:
      '?\\$6)m*xhTVewc#NVVgxX%eBhJjoHYzpXFg=gzn[rWXPLj5UWj@z\\$/UDm8o79n/p%',
    DONT_CHOKE8:
      '@}:[4#g%[R-CFR});bY(Z[KcDQDsVn2_y4cSdU<Mjy!c^F`G<!Ks7]kbS]N1:bP:',

    // # https://github.com/motdotla/dotenv-expand/issues/112#issuecomment-1937330651
    DOMAIN: 'https://${HOST}',

    PASSWORD_EXPAND: '${PASSWORD}',
    PASSWORD_EXPAND_SIMPLE: '$PASSWORD',

    ALTERNATE: '${USE_IF_SET:+alternate}',
    ALTERNATE2: '${USE_IF_NOT_SET+alternate}',

    EXPANDED: 'ab-$SOURCE-cd-ef-gh',
  }),

  '.env.dotenv':
    'BASIC=basic\nMACHINE=machine_env\nMONGOLAB_DATABASE=heroku_db\nMONGOLAB_USER=username\nMONGOLAB_PASSWORD=password\nMONGOLAB_DOMAIN=abcd1234.mongolab.com\nMONGOLAB_PORT=12345\nMONGOLAB_USER_RECURSIVELY=${MONGOLAB_USER}:${MONGOLAB_PASSWORD}\nPOSTGRESQL.BASE.USER=postgres\nDOLLAR=$\nONE=one\nTWO=two\nHOST=something\nPASSWORD=password\nUSE_IF_SET=true\nUSE_IF_NOT_SET=\nSOURCE=12345\n',
};

vol.fromJSON(volJson);

describe('ConfigLoader tests based on dotenv repository', () => {
  const validateMock = jest.fn((config: unknown) => {
    return config as never;
  });

  it('can load complex sample', () => {
    process.argv.push(
      '--config-file',
      './test/dotenv-expand.json',
      '--env-file-path',
      '.env.dotenv',
    );

    const loadedConfig = ConfigLoader.load(validateMock);

    expect(loadedConfig).toBeDefined();

    expect(loadedConfig).toEqual(
      expect.objectContaining({
        'basic-expand': 'basic',
        MACHINE_EXPAND: 'machine_env',
        ESCAPED_EXPAND: '$ESCAPED',
        EXPAND_DEFAULT: 'machine_env',
        EXPAND_DEFAULT_NESTED: 'machine_env',
        EXPAND_DEFAULT_NESTED2: 'machine_env',
        EXPAND_DEFAULT_NESTED_TWICE: 'machine_envdefault',
        EXPAND_DEFAULT_NESTED_TWICE2: 'machine_envdefault',
        EXPAND_DEFAULT_SPECIAL_CHARACTERS: 'machine_env',
        EXPAND_DEFAULT_SPECIAL_CHARACTERS2: 'machine_env',
        UNDEFINED_EXPAND: '',
        UNDEFINED_EXPAND_NESTED: 'machine_env',
        UNDEFINED_EXPAND_DEFAULT: 'default',
        UNDEFINED_EXPAND_DEFAULT2: 'default',
        UNDEFINED_EXPAND_DEFAULT_NESTED: 'default',
        UNDEFINED_EXPAND_DEFAULT_NESTED2: 'default',
        UNDEFINED_EXPAND_DEFAULT_NESTED_TWICE: 'default',
        UNDEFINED_EXPAND_DEFAULT_NESTED_TWICE2: 'default',
        UNDEFINED_EXPAND_DEFAULT_SPECIAL_CHARACTERS: '/default/path:with/colon',
        UNDEFINED_EXPAND_DEFAULT_SPECIAL_CHARACTERS2:
          '/default/path:with/colon',
        UNDEFINED_EXPAND_DEFAULT_SPECIAL_CHARACTERS_NESTED:
          '/default/path:with/colon',
        UNDEFINED_EXPAND_DEFAULT_SPECIAL_CHARACTERS_NESTED2:
          '/default/path:with/colon',
        MONGOLAB_URI:
          'mongodb://username:password@abcd1234.mongolab.com:12345/heroku_db',
        MONGOLAB_URI_RECURSIVELY:
          'mongodb://username:password@abcd1234.mongolab.com:12345/heroku_db',
        NO_CURLY_BRACES_URI:
          'mongodb://username:password@abcd1234.mongolab.com:12345/heroku_db',
        NO_CURLY_BRACES_URI_RECURSIVELY:
          'mongodb://username:password@abcd1234.mongolab.com:12345/heroku_db',
        NO_CURLY_BRACES_USER_RECURSIVELY: 'username:password',
        NO_CURLY_BRACES_UNDEFINED_EXPAND_DEFAULT_SPECIAL_CHARACTERS:
          ':-/default/path:with/colon',
        NO_CURLY_BRACES_UNDEFINED_EXPAND_DEFAULT_SPECIAL_CHARACTERS2:
          '-/default/path:with/colon',
        'POSTGRESQL.MAIN.USER': 'postgres',

        ONETWO: 'onetwo',
        ONETWO_SIMPLE: 'onetwo',
        ONETWO_SIMPLE2: 'onetwo',
        ONETWO_SUPER_SIMPLE: 'onetwo',

        TWO_DOLLAR_SIGNS: 'abcd$$1234',

        DONT_CHOKE1:
          '.kZh`>4[,[DDU-*Jt+[;8-,@K=,9%;F9KsoXqOE)gpG^X!{)Q+/9Fc(QF}i[NEi!',
        DONT_CHOKE2:
          '=;+=CNy3)-D=zI6gRP2w$B@0K;Y]e^EFnCmx$Dx?;.9wf-rgk1BcTR0]JtY<S:b_',
        DONT_CHOKE3:
          'MUcKSGSY@HCON<1S_siWTP`DgS*Ug],mu]SkqI|7V2eOk9:>&fw;>HEwms`D8E2H',
        DONT_CHOKE4:
          'm]zjzfRItw2gs[2:{p{ugENyFw9m)tH6_VCQzer`*noVaI<vqa3?FZ9+6U;K#Bfd',
        DONT_CHOKE5:
          '#la__nK?IxNlQ%`5q&DpcZ>Munx=[1-AMgAcwmPkToxTaB?kgdF5y`A8m=Oa-B!)',
        DONT_CHOKE6:
          'xlC&*<j4J<d._<JKH0RBJV!4(ZQEN-+&!0p137<g*hdY2H4xk?/;KO1$(W{:Wc}Q',
        DONT_CHOKE7:
          '?$6)m*xhTVewc#NVVgxX%eBhJjoHYzpXFg=gzn[rWXPLj5UWj@z$/UDm8o79n/p%',
        DONT_CHOKE8:
          '@}:[4#g%[R-CFR});bY(Z[KcDQDsVn2_y4cSdU<Mjy!c^F`G<!Ks7]kbS]N1:bP:',

        DOMAIN: 'https://something',

        PASSWORD_EXPAND: 'password',
        PASSWORD_EXPAND_SIMPLE: 'password',

        ALTERNATE: 'alternate',
        ALTERNATE2: '',

        EXPANDED: 'ab-12345-cd-ef-gh',
      }),
    );
  });
});
