# mock-auth-service

<br />

## Overview
This simple program does the following:

 * Prints "Hello World"

<br />

## Main entry point

See file located at: `src/main.ts`.

<br />

## Project structure:

 * `src` - contains source code (Typescript)
 * `dist` - after building, contains transpiled Javascript

<br />

## Npm helper scripts

Below are descriptions of the helper scripts found in `package.json`.

<br />

### `npm run build`

Runs `npm tsc` to build the code under `src` and and places the transpiled Javascript into the `dist` directory.

<br />

### `npm run start`

Runs `node dist/main.js` to execute the mock-auth-service

<br />

### `npm run dev`

Runs `npm run build && npm run start` to build then execute the mock-auth-service

<br />

### `npm run build-container`

Runs `docker build -t mock-auth-service .` to create a mock-auth-service image based on the `Dockerfile`.

<br />

### `npm run start-container`

Runs `docker run mock-auth-service` to create a container based on the mock-auth-service image. The container is then started.

<br />

### `npm run dev-container`

Runs `npm run build-container && npm run start-container` to perform the same processing defined by `npm run build-contianer` and `npm run start-container`.

<br />

### `npm run stop-container`

Runs `docker stop mock-auth-service` to stop the running mock-auth-service container.

<br />

### `npm run clean-container`

Runs `docker container prune --force && docker image prune --force` to delete all stopped containers and images not associated with containers.

