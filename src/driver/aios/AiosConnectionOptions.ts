import {BaseConnectionOptions} from 'typeorm/connection/BaseConnectionOptions';


export interface AiosConnectionOptions extends BaseConnectionOptions {

  id: string;

  dialect: string;

  jdbcDriverClass: string;

  jdbcDriverLocation: string;

  url: string;

  user: string;

  password: string;

  host: string;

  port: number;

  socketTimeout?: number;

  connectionTimeout?: number;

  readonly?: boolean;




}
