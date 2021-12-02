# BCNFStar

## Setup

### Java

This project uses [metanome](https://github.com/sekruse/metanome-cli), which requires [java](https://www.java.com/de/download/manual.jsp). We recommand Java 8 -11

### Node

This project requires [nodejs](https://nodejs.org/en/download/). After installing node, you need to execute

```bash
npm install
```

from the project root folder, which will also install all dependencies in the server and frontend projects.

### Postgres

BCNFStar can currently only work on Postgres databases. You need a running postgres database server, a [.pgpass](https://www.postgresql.org/docs/9.3/libpq-pgpass.html) with credentials for it and you need to set the PGPASSFILE environment variable containing the path of that .pgpass file. Environment variables can be placed in a .env.local file in the project root.

## Development

We recommend to delevop with the following command. This will hot-reload the server and the frontend, and will automatically run tests whenever anything is changed:

```bash
npm run test:dev
```

Alternatively, you can use `npm run dev` if you don't want tests to be run

## Deploying

To build the production app, run

```bash
npm run build
```

from the project root, which will build both the server and the frontend. After that, you can start the server by invoking

```bash
npm run start
```
