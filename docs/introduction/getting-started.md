# Getting started

To get started using `geoportal-server` you can either install it with TerriaMap and serve TerriaMap with it, or install it separately and then point TerriaMap instance to API URLs.

## Installation

Installation is pretty simple, choose your favorite package manager and install `geoportal-server`. Run one of the following in your commandline:

```sh
npm i geoportal-server --save
# OR
yarn add geoportal-server
# OR
pnpm i geoportal-server
```

## Running the application

There are multiple options to start `geoportal-server`. Each of the options support the command line arguments, for more details about command-line arguments check [this](../configuration/command-line-arguments.md).

### Using pm2

In the production environment, it is recommended to start the server using the pm2 process manager, which can handle automatic restarting, logging, and load balancing. There is a sample configuration `ecosystem.config.js` that will run a server using a single process. To use multiple processes, modify the configuration. For more details regarding pm2 configuration check their [documentation](https://pm2.keymetrics.io/docs/usage/quick-start/).

For example, to start the server using sample configuration run the following command:

```sh
pm2 start ecosystem.config.js
```

For running project in development environment check [development guide](../contributing/development-environment.md)
