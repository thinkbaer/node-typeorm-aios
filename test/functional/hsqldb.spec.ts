// import {expect} from 'chai';
// import {suite, test} from 'mocha-typescript';
// import {Connection, createConnection, DatabaseType, Driver, EntitySchema} from 'typeorm';
// import {AiosConnectionOptions} from "../../src/driver/aios/AiosConnectionOptions";
//
// import '../../src/integrate';
// import {AiosQueryRunner} from "../../src/driver/aios/AiosQueryRunner";
// import {EntitySchemaOptions} from "../../node_modules/typeorm/entity-schema/EntitySchemaOptions";
// import * as _ from "lodash";
//
// const DB = 'hsqldb';
//
// const aiosConfigTemplate: AiosConnectionOptions = {
//   id: 'test1',
//   type: <DatabaseType>"aios",
//   jdbcDriverClass: 'org.hsqldb.jdbc.JDBCDriver',
//   jdbcDriverLocation: "http://central.maven.org/maven2/org/hsqldb/hsqldb/2.4.1/hsqldb-2.4.1.jar",
//   url: "jdbc:hsqldb:file:/tmp/test_server/hsql_test;get_column_name=false",
//   user: 'SA',
//   password: '',
//   dialect: DB,
//   host: 'localhost',
//   port: 8118
// };
//
//
// @suite('functional/test/' + DB)
// class TestSpec {
//
// }
//
