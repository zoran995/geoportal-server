import { writeFileSync } from 'node:fs';
import { configuration } from 'src/modules/config/index.js';

import { zodToJsonSchema } from 'zod-to-json-schema';

const schema = zodToJsonSchema(configuration);

writeFileSync(
  'dist/server-config.schema.json',
  JSON.stringify(schema, null, 2),
);
