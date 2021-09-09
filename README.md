# Geoportal-Server

[![Build Status](https://github.com/zoran995/geoportal-server/actions/workflows/ci.yaml/badge.svg?branch=master&event=push)](https://github.com/zoran995/geoportal-server/actions/workflows/ci.yaml)

A rewrite of [TerriaJS-Server](https://github.com/TerriaJS/terriajs-server) using [NestJS](https://nestjs.com/) architecture.

## Description

It contains following services:

- `/api/proxy`: A proxy service which applies CORS headers for data providers that lack them. Add URLs to config.json to enable them.
- `/api/proj4def`: a proj4 coordinate reference system lookup service.
- `/api/proxyabledomains`: return a JSON of domains the server is willing to proxy for
- `/api/ping`: returns 200 OK.
- `/api/share/X-Y` (GET): uses prefix X to resolve key Y against some configured JSON storage provider (Gist and AWS S3 implemented)
- `/api/share` (POST): stores a piece of JSON with a configured storage provider (Gist and AWS s3implemented)
- `/api/serverconfig`: retrieve (safe) information about how the server is configured.
- `/api/feedback` (POST): a feedback from user that will sent to specified provider. Currently supported are Github issues, Redmine and email, they can be combined.
- It is possible to use it as a static server which will server all other requests from the `wwwroot` directory which can be specified on the command line. Default location is `./wwwroot`
- If files `[wwwroot]/404.html` and/or `[wwwroot]/500.html` exist they will be served for those HTTP error codes.
- Authentication is currently not supported.

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```
