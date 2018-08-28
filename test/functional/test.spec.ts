import {expect} from 'chai';
import {suite, test} from 'mocha-typescript';
import {Connection, createConnection, DatabaseType, Driver} from 'typeorm';
import {AiosConnectionOptions} from "../../src/driver/aios/AiosConnectionOptions";

import '../../src/integrate';
import {AiosQueryRunner} from "../../src/driver/aios/AiosQueryRunner";


@suite('functional/test')
class TestSpec {


  @test
  async 'load aios'() {

    const aiosConfig: AiosConnectionOptions = {
      id:'test1',
      type: <DatabaseType>"aios",
      jdbcDriverClass: 'org.hsqldb.jdbc.JDBCDriver',
      jdbcDriverLocation: "http://central.maven.org/maven2/org/hsqldb/hsqldb/2.3.3/hsqldb-2.3.3.jar",
      url: "jdbc:hsqldb:file:/tmp/test_server/hsql_test",
      user: 'SA',
      password: '',
      dialect:'hsqldb',
      host:'localhost',
      port:8118
    };

    const connection = await createConnection(<any>aiosConfig);
    expect(connection).to.not.be.null;
    let runner = connection.createQueryRunner();
    console.log('ASDASD')
    await (<AiosQueryRunner>connection.createQueryRunner())._executeBatch([
      'CREATE TABLE  IF NOT EXISTS car ( id INTEGER IDENTITY, type VARCHAR(256), name VARCHAR(256))',
      "INSERT INTO car (type, name) VALUES('Ford', 'Mustang')",
      "INSERT INTO car (type, name) VALUES('Volkswagen', 'Golf')"
    ]);

    console.log('ASDASD')
    let cars = await (<AiosQueryRunner>connection.createQueryRunner()).query("SELECT * FROM car");
    console.log(cars)

  }


}

