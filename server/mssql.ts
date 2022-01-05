import { connect, config, pool, Connection, ConnectionPool } from "mssql";

export default class MsSqlUtils {
  private config: config;
  public connection: ConnectionPool;
  public constructor(
    server: string,
    database: string,
    user: string,
    password: string,
    port: number = 1433
  ) {
    this.config = {
      user,
      database,
      password,
      server,
      port,
    };
  }

  public async init() {
    this.connection = await connect(this.config);
  }
}
