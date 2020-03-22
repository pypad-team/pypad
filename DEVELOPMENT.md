# Development
This will discuss the workflow of developing collabd.

## Project Structure
`client`: This directory hosts all the files for the client. This includes all the views, styles, and CRDT logic.

`server`: This directory hosts all the files for the server. This includes the express server and all the logic for serving sessions.

`tests`: This directory hosts all the files for server and client tests.

## Running a Server
The server is usually run by compiling the `.ts` files to `.js` and creating a `build` directory for the server to run on. This can be done by running `npm run build && npm start`.

The server can also be run on dev mode to find live updates in the `.ts` files. This will run a server directly from the `client` and `server` directories. This can be done by running `npm run dev`.

## Formatting
collabd uses [eslint](https://eslint.org/) and [prettier](https://prettier.io/) to format the code. Linting the `client`, `server`, and `tests` directory files can be done by running `npm run lint`. This is automatically run every time the files are built and the server is run.

## Tests
collabd uses [mocha](https://mochajs.org/), [chai](https://www.chaijs.com/), and [sinon](https://sinonjs.org/) to test the code. This allows for testing with assertions and mocks. All the tests written for the server and client are stored in the `tests` directory. Running tests manually can be done by running `npm run test-client` for client tests, `npm run test-server` for server tests, and `npm run test` to run all tests. This is automatically run when running the production server.

## Contributing
Please test and lint the code before each commit. To maintain this workflow, please write proper tests for any new or modified functions in the corresponding test directories.

Please also make sure to keep the commit history clean with clear commit messages. Developing large changes in separate branches while maintaining this workflow can help. Once these branches are working and ready, they can be merged into master.
