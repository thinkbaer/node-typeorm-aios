import {AiosConnectionOptions} from '../../src';
import {DatabaseType} from 'typeorm';

export const DB = 'informix';

export const aiosConfigTemplate: AiosConnectionOptions = {
  id: 'informix-dev-01',
  type: <DatabaseType>'aios',
  jdbcDriverClass: 'com.informix.jdbc.IfxDriver',
  jdbcDriverLocation: '/data/java/driver/com.informix.ifxjdbc-4.10.JC4DE.jar',
  url: 'jdbc:informix-sqli://typeorm_aios_informix:9088/iot:INFORMIXSERVER=informix;DELIMITER=',
  user: 'informix',
  password: 'in4mix',
  dialect: DB,
  host: '127.0.0.1',
  port: 8118,
  socketTimeout: 5000,
  connectionTimeout: 5000
};

