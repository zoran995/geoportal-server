# Command line arguments

When starting the geoportal-server it is possible to specify following command line arguments which will override the configuration specified in config file.

| Option                                  | Type      | Description                                                      | Default             |
| --------------------------------------- | --------- | ---------------------------------------------------------------- | ------------------- |
| `--port`                                | `integer` | Port to listen on.                                               | 3001                |
| `--public`                              | `boolean` | Run a public server that listens on all interfaces.              | true                |
| `--ignore-env-file`                     | `boolean` | If "true", environment files (`.env`) will be ignored.           | false               |
| `--ignore-env-vars`                     | `boolean` | If "true", predefined environment variables will be ignored      | false               |
| `--env-file-path`                       | `string`  | Path to .env file to be load. Not used if ignore-env-file=false. |                     |
| <a id="config-file"></a>`--config-file` | `string`  | File containing settings such as allowed domains to proxy.       | ./serverconfig.json |
| `--help`, `-h`                          |           | Show the help                                                    |                     |
| `path/to/wwwroot`                       | `string`  | The location of wwwroot directory.                               | ./wwwroot           |

## Usage

### Using yarn

`yarn start [options] [path/to/wwwroot]`

_Example_

```sh
yarn start --port 3003 # Start server on port 3003
```

```sh
yarn start --port 3003 ./public # Start server on port 3003 using directory public as wwwroot
```

### Using node.js

```sh
node dist/main.js -- [options] [path/to/wwwroot]
```

_Example_

```sh
node dist/main.js -- --port 3003 # Start server on port 3003
```

```sh
node dist/main.js -- --port 3003 ./public # Start server on port 3003 using directory public as wwwroot
```
