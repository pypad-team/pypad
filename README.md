# collabd
**collabd** is a distributed, peer-to-peer collaborative text editor.

## About
collabd uses a **Conflict-Free Replicated Data Type** (CRDT) to inherently maintain consistency among multiple clients. Clients can create a new document, requesting a session from the server, which returns a link to the client. This link can then be shared to allow other clients access to the document. This document is stored on the clients, providing security by removing the need of a central storage server. Clients communicate updates to maintain consistency among all clients' documents.

## Deployment
Before running collabd, make sure you have [Node.js](https://nodejs.org/en/). This was developed using `node` version `v12.16.1` and `npm` version `6.13.4`.

1. Install dependencies: `npm install --production`
2. Check files, build, and run server: `npm run prod`

## Development
See [DEVELOPMENT.md][development] for more information about development of collabd.

## License
Copyright (c) 2020 by **collabd**. Released under MIT License. See [LICENSE.txt][license] for details.

[development]: DEVELOPMENT.md
[license]: LICENSE.txt