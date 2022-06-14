import {
  IS_BOOLEAN,
  IS_INT,
  IS_NUMBER,
  IS_POSITIVE,
  IS_URL,
  MAX,
  MIN,
} from 'class-validator';
import { validationMetadatasToSchemas } from 'class-validator-jsonschema';
import { writeFileSync } from 'fs';
export { ConfigurationDto } from 'src/infrastructure/config/dto/configuration.dto';
export { GithubFeedbackDto } from 'src/modules/feedback/dto/github-feedback.dto';
export { MailFeedbackDto } from 'src/modules/feedback/dto/mail-feedback.dto';
export { RedmineFeedbackDto } from 'src/modules/feedback/dto/redmine-feedback.dto';
export { ShareGistDto } from 'src/modules/share/dto/share-gist.dto';
export { ShareS3Dto } from 'src/modules/share/dto/share-s3.dto';
// needed for properly resolving @Type decorators
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { defaultMetadataStorage } = require('class-transformer/cjs/storage'); // See https://github.com/typestack/class-transformer/issues/563 for alternatives

const schemas = validationMetadatasToSchemas({
  classTransformerMetadataStorage: defaultMetadataStorage,
  additionalConverters: {
    isFqdnOrIp: {
      anyOf: [
        {
          type: 'string',
          pattern:
            '((?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])[.]){3}(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])',
        },
        {
          type: 'string',
          format: 'ipv6',
        },
        { type: 'string', format: 'hostname' },
        { type: 'string', pattern: '^\\$.*' },
      ],
    },
    ArrayContainsObjectKey: {},
    [IS_URL]: {
      oneOf: [
        { format: 'uri', pattern: '^(https?|wss?|ftp)://' },
        { type: 'string', pattern: '^\\$.*' },
      ],
    },
    [IS_INT]: {
      oneOf: [{ type: 'integer' }, { type: 'string', pattern: '^\\$.*' }],
    },
    [IS_NUMBER]: {
      oneOf: [{ type: 'number' }, { type: 'string', pattern: '^\\$.*' }],
    },
    [IS_POSITIVE]: {
      minimum: 0,
      exclusiveMinimum: true,
    },
    [MIN]: (meta) => ({
      oneOf: [
        { minimum: meta.constraints[0] },
        { type: 'string', pattern: '^\\$.*' },
      ],
    }),
    [MAX]: (meta) => ({
      oneOf: [
        { maximum: meta.constraints[0] },
        { type: 'string', pattern: '^\\$.*' },
      ],
    }),
    [IS_BOOLEAN]: {
      oneOf: [{ type: 'boolean' }, { type: 'string', pattern: '^\\$.*' }],
    },
  },
});

const configDto = schemas.ConfigurationDto;
delete schemas.ConfigurationDto;

const output = {
  title: 'Geoportal-Server config schema',
  $schema: 'http://json-schema.org/draft-04/schema#',
  additionalProperties: false,
  ...configDto,
  definitions: { ...schemas },
};
if (output.properties) {
  output.properties['$schema'] = { type: 'string' };
}

writeFileSync(
  'dist/server-config.schema.json',
  JSON.stringify(output, null, 2),
);
