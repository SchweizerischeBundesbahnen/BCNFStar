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

### Java

This project uses [metanome](https://github.com/sekruse/metanome-cli), which requires [java](https://www.java.com/de/download/manual.jsp). We recommand Java 8 -11

### Node

This project requires [nodejs](https://nodejs.org/en/download/). After installing node, you need to execute

```bash
npm install
```

from the project root folder, which will also install all dependencies in the server and frontend projects.

### Database

BCNFStar currently works on Postgres and Microsoft SQL Server databases. You need to set an environment variable called DB_TYPE to either postgres, mssql (or sqledge). Regardless of the database type, a [.pgpass-like](https://www.postgresql.org/docs/9.3/libpq-pgpass.html) is needed. Its path needs to be in an environment variable called DB_PASSFILE. Environment variables can be placed in a file called .env.local in the project root like this:

```dotenv
DB_TYPE="postgres"
DB_PASSFILE="~/.pgpass"
```

### Redis

Since metanome jobs might take a lot of time and resources, we queue them. This requires running a [Redis](https://redis.io/) instance for storing the queue through server restarts, which can be obtained from many standard pacakge managers on Unix or from a [tarball](https://redis.io/download). On Windows, you can use [this download](https://github.com/zkteco-home/redis-windows). If you host Redis on a different machine or change its config, you may pass REDIS_HOST and REDIS_PORT env variables.

## Deploying

To build the production app, run

```bash
npm run build
```

from the project root, which will build both the server and the frontend. After that, you can start the server by invoking

```bash
npm run start
```

### Docker

If want to use a docker container for deployment you can skip the steps bellow. Just follow the next commands.

First set up your personal DB configuration in [](docker-compose.yml). By default we use a standard postgres database configuration.

```yml
- DB_HOST=host.docker.internal
- DB_PORT=5432
- DB_DATABASE=postgres
- DB_USER=postgres
- DB_TYPE=postgres
- DB_PASSWORD=
```

To build your docker container run

```bash
docker build . -t bcnfstar
```

to create bcnfstar docker image and run

```bash
docker-compose up
```

to create docker containers for redis and BCNFStar.

You can open BCNFStar on `http://localhost/#/`.

### Troubleshooting

Something doesn't work? Always try to run `npm install && npm run build` first.
