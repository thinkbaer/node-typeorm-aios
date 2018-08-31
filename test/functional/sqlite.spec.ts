import {expect} from 'chai';
import {suite, test} from 'mocha-typescript';
import {Connection, createConnection, DatabaseType, Driver, EntitySchema} from 'typeorm';
import {AiosConnectionOptions} from "../../src/driver/aios/AiosConnectionOptions";

import '../../src/integrate';
import {AiosQueryRunner} from "../../src/driver/aios/AiosQueryRunner";
import {EntitySchemaOptions} from "../../node_modules/typeorm/entity-schema/EntitySchemaOptions";
import * as _ from "lodash";
const DB = 'sqlite';

const aiosConfigTemplate: AiosConnectionOptions = {
  id: 'test2',
  type: <DatabaseType>"aios",
  jdbcDriverClass: 'org.sqlite.JDBC',
  jdbcDriverLocation: "http://central.maven.org/maven2/org/xerial/sqlite-jdbc/3.23.1/sqlite-jdbc-3.23.1.jar",
  url: "jdbc:sqlite:file:/tmp/test_server/sqlite_test",
  user: '',
  password: '',
  dialect: DB,
  host: 'localhost',
  port: 8118
};



@suite('functional/test/'+DB)
class TestSpec {


}

