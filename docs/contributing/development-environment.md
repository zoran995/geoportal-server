# Development environment

## Requirements

To run geportal-server in development environment there are following requirements

- Node 10+

## Setting up development environment

First you need to clone the repository from github, and install dependencies

```sh
git clone https://github.com/zoran995/geoportal-server.git
cd geoportal-server
yarn install
```

## Starting development environment

To run project you need to run one of the following commands, they will automatically build the application:

```sh
yarn run start:dev # starting a server with hot reload, every change in the source code will trigger a new build
# OR
yarn run start:debug # starting a server with hot reload and debugger enabled.
```

## Prettier and ESlint

We are using [Prettier](https://github.com/prettier/prettier) to format code, so don't worry much about code formatting. If using VScode is recommended to install Prettier extension and enable format on save, so code gets formatted on each save. Check for prettier formatting is run as part of our CI.

To manully format code using prettier, you can run:

```sh
yarn run format
```

To manually check if code is propperly formatted, you can run:

```sh
yarn run format-check
```

Alongside with prettier we are using ESLint to statically analyze the code, enforce best practices and fix common problems. The enforced ESLint rules are defined `.eslintrc.js` file in the root directory. If using VSCode is recommended to install [ESlint extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) so code gets checked during development. Linting is run as part of our CI.

You can also run a linting script to check the code before commiting:

```sh
yarn run lint
```

## Testing

We are using jest as our testing framework. To run unit tests execute the following command

```sh
npm test
# OR
npm run test:watch # run tests with hot reload, every change will trigger new build
```

To run e2e tests execute the following command

```sh
npm run test:e2e
```

The test results are reported on the command line. No additional configuration is not needed for running unit or e2e tests.

### Test coverage

You can also generate test coverage by running the following commands

```sh
npm run test:cov # Generate coverage based on unit tests
# OR
npm run test:e2e:cov # Generate coverage based on e2e tests
```

To get general code coverage consisting of unit and e2e tests coverage you can run merge-coverage script (you first need to generate both unit and e2e coverage):

```sh
npm run tool:merge-coverage
```
