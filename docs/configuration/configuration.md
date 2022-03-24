# Configuration

There are two ways to specify the configuration of geoportal-server. Entire configuration of `geoportal-server` should be specified inside one `json` file. The content of this file is described [here](./config-file.md). Along with configuration specified in `json` file it is possible to override some of those parameters when starting the application using [command line arguments](./command-line-arguments.md)

## Expanding config values

It is possible to specify some configuration using enviroment variables or inside environment files. Those values will be loaded at application bootstrap, and used to expand values specified in config-file. This is done the same way as with dotenv-expand package.

**Example**

Config-file

```json
{
  "port": "$PORT"
}
```

.env file

```sh
PORT=3005
```

After stating the application config will have port value of 3005. Order of resolving env values is that env variables will overwrite env file values.

### Expansion rules

Expansion will follow those rules:

- $KEY will expand any env with the name KEY
- ${KEY} will expand any env with the name KEY
- $KEY will escape the $KEY rather than expand
- ${KEY:-default} will first attempt to expand any env with the name KEY. If not found, then it will return default
