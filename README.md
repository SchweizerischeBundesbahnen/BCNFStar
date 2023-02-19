# BCNFStar

BCNFStar is a tool for interactive database schema management. It helps you to

- normalize or denormalize your schema (by splitting or joining tables)
- create star schemas with a dedicated optimized mode
- replace primary and foreign keys by automatically generated surrogate keys
- find valid foreign key candidates (based on inclusion dependencies) present in the data
  - and investigate why others are invalid
  - same for functional dependencies, which are the basis for normalising (splitting) tables
- integrate new tables into an existing schema (coming soon!)

It ensures that all transformations are valid for a given data instance and generates SQL downloads for transforming

## Setup

You can either setup BCNFStar manually with nodejs or use our docker image. For most users, we recommend Docker as it is easier to setup.

### Using Docker

The docker image does not include a database as BCNFStar is intended to run on your existing data.
You can configure the database connection in [docker-compose.yml](docker-compose.yml). By default we use a standard postgres database configuration. The available options for DB_TYPE are `postgres` and `mssql` (for Microsoft SQL Server based databases)

```yml
- DB_HOST=host.docker.internal
- DB_PORT=5432
- DB_DATABASE=postgres
- DB_USER=postgres
- DB_TYPE=postgres
- DB_PASSWORD=
```

After that, you can use the following command to launch the app

```bash
docker-compose up
```

to create docker containers for redis and BCNFStar.

You can open BCNFStar on `http://localhost/#/`.

### Manual

#### Java

This project uses [metanome](https://github.com/sekruse/metanome-cli), which requires [java](https://www.java.com/de/download/manual.jsp). We recommend Java 8-11.

#### Node

This project requires [nodejs](https://nodejs.org/en/download/). After installing node, you need to execute

```bash
npm install
```

from the project root folder, which will also install all dependencies in the server and frontend projects.

#### Database

BCNFStar currently works on Postgres and Microsoft SQL Server databases. You need to set an environment variable called DB_TYPE to either postgres, mssql (or sqledge). Regardless of the database type, a [.pgpass-like](https://www.postgresql.org/docs/9.3/libpq-pgpass.html) is needed. Its path needs to be in an environment variable called DB_PASSFILE. Environment variables can be placed in a file called .env.local in the project root like this:

```dotenv
DB_TYPE="postgres"
DB_PASSFILE="~/.pgpass"
```

#### Redis

Since metanome jobs might take a lot of time and resources, we queue them. This requires running a [Redis](https://redis.io/) instance for storing the queue through server restarts, which can be obtained from many standard package managers on Unix or from a [tarball](https://redis.io/download). On Windows, you can use [this download](https://github.com/zkteco-home/redis-windows). If you host Redis on a different machine or change its config, you may pass REDIS_HOST and REDIS_PORT env variables.

#### Deploying

To build the production app, run

```bash
npm run build
```

from the project root, which will build both the server and the frontend. After that, you can start the server by invoking

```bash
npm run start
```

## Configure FD-Ranking

To better assess the subject-specific correctness of functional dependencies, the functional dependencies can be evaluated using various ranking approaches. The defaultRankingWeights constant in the [FdScore.ts](frontend/src/model/schema/methodObjects/FdScore.ts) file can be used to specify whether and to what extent a ranking approach is included in the overall ranking calculation. By default, only the keyValue ranking is used. The attributes of defaultRankingWeights may only have values between 0 and 1 and the sum of all attributes must be 1.

## Troubleshooting

Something doesn't work? Always try to run `npm install && npm run build` first.

## Documentation

There are two types of documentation for this project.  

1. A documentation close to the source code that is auto-generated for the [frontend](https://schweizerischebundesbahnen.github.io/BCNFStar/frontend/) and the [backend](https://schweizerischebundesbahnen.github.io/BCNFStar/server/) respectively.
2. A documentation for all the features the tool implements. This can be found [here](documentation/index.md).
