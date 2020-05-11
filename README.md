# PyPad
**PyPad** is a distributed, peer-to-peer collaborative text editor.

## About
PyPad uses a **Conflict-Free Replicated Data Type** (CRDT) to inherently maintain consistency among multiple clients. Clients can create a new document, requesting a session from the server, which returns a link to the client. This link can then be shared to allow other clients access to the document. This document is stored on the clients, providing security by removing the need of a central storage server. Clients communicate updates to maintain consistency among all clients' documents.

## Deployment
Before running PyPad, make sure you have [Node.js](https://nodejs.org/en/) installed. This was developed using `node` version `12.16.1` and `npm` version `6.13.4`.

1. Install dependencies: `npm install`
2. Build application: `npm run build`
2. Run server: `npm start`

## Development
See [DEVELOPMENT.md][development] for more information about development of PyPad.

## License
Released under MIT License. See [LICENSE.txt][license] for details.

[development]: DEVELOPMENT.md
[license]: LICENSE.txt
