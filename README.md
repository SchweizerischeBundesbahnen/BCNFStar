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

### Database

BCNFStar currently works on Postgres and Microsoft SQL Server databases. You need to set an environment variable called DB_TYPE to either postgres, mssql (or sqledge). Regardless of the database type, a [.pgpass-like](https://www.postgresql.org/docs/9.3/libpq-pgpass.html) is needed. Its path needs to be in an environment variable called DB_PASSFILE. Environment variables can be placed in a file called .env.local in the project root like this:

```dotenv
DB_TYPE="postgres"
DB_PASSFILE="~/.pgpass"
```

### Redis

Since metanome jobs might take a lot of time and resources, we queue them. This requires running a [Redis](https://redis.io/) instance for storing the queue through server restarts, which can be obtained from many standard pacakge managers on Unix or from a [tarball](https://redis.io/download). On Windows, you can use [this download](https://github.com/zkteco-home/redis-windows). If you host Redis on a different machine or change its config, you may pass a REDIS_URL environment variable following [this standard](https://metacpan.org/pod/URI::redis)

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
