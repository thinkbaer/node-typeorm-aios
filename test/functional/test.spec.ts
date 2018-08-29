import {expect} from 'chai';
import {suite, test} from 'mocha-typescript';
import {Connection, createConnection, DatabaseType, Driver, EntitySchema} from 'typeorm';
import {AiosConnectionOptions} from "../../src/driver/aios/AiosConnectionOptions";

import '../../src/integrate';
import {AiosQueryRunner} from "../../src/driver/aios/AiosQueryRunner";
import {EntitySchemaOptions} from "../../node_modules/typeorm/entity-schema/EntitySchemaOptions";
import * as _ from "lodash";


const aiosConfigTemplate: AiosConnectionOptions = {
  id: 'test1',
  type: <DatabaseType>"aios",
  jdbcDriverClass: 'org.hsqldb.jdbc.JDBCDriver',
  jdbcDriverLocation: "http://central.maven.org/maven2/org/hsqldb/hsqldb/2.4.1/hsqldb-2.4.1.jar",
  url: "jdbc:hsqldb:file:/tmp/test_server/hsql_test;get_column_name=false",
  user: 'SA',
  password: '',
  dialect: 'hsqldb',
  host: 'localhost',
  port: 8118
};

const aiosConfigTemplate2: AiosConnectionOptions = {
  id: 'test2',
  type: <DatabaseType>"aios",
  jdbcDriverClass: 'org.sqlite.JDBC',
  jdbcDriverLocation: "http://central.maven.org/maven2/org/xerial/sqlite-jdbc/3.23.1/sqlite-jdbc-3.23.1.jar",
  url: "jdbc:sqlite:file:/tmp/test_server/sqlite_test",
  user: '',
  password: '',
  dialect: 'sqlite',
  host: 'localhost',
  port: 8118
};
const CategoryEntity = new EntitySchema(<EntitySchemaOptions<any>>{
  name: "category",
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: true
    },
    name: {
      type: String
    }
  },

});
@suite('functional/test')
class TestSpec {


  @test
  async 'connect to aios and query'() {

    let aiosConfig = _.clone(aiosConfigTemplate);

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

  @test
  async 'load entity from table - hsqldb'() {

    let aiosConfig = _.clone(aiosConfigTemplate);
    (<any>aiosConfig).entities = [CategoryEntity];

    const connection = await createConnection(<any>aiosConfig);
    expect(connection).to.not.be.null;

    await (<AiosQueryRunner>connection.createQueryRunner())._executeBatch([
      'CREATE TABLE  IF NOT EXISTS category ( id INTEGER IDENTITY, name VARCHAR(256))',
    ]);

    // Without parameters
    let repo = connection.getRepository<any>('category');
    let count = await repo.count();

    if(count == 0){
      await (<AiosQueryRunner>connection.createQueryRunner())._executeBatch([
        "INSERT INTO category ( name) VALUES('Car')",
        "INSERT INTO category ( name) VALUES('Truck')"
      ]);

    }



    let qr = repo.createQueryBuilder();
    let entities = await qr.getMany();


    console.log(entities);

    let entitiesAndCount = await qr.getManyAndCount();
    console.log(entitiesAndCount);


  }

  @test
  async 'load entity from table - sqlite'() {

    let aiosConfig = _.clone(aiosConfigTemplate2);
    (<any>aiosConfig).entities = [CategoryEntity];

    const connection = await createConnection(<any>aiosConfig);
    expect(connection).to.not.be.null;

    await (<AiosQueryRunner>connection.createQueryRunner())._executeBatch([
      'CREATE TABLE  IF NOT EXISTS category ( id integer primary key autoincrement, name VARCHAR(256) )',
      "INSERT INTO category ( name) VALUES('Car')",
      "INSERT INTO category ( name) VALUES('Truck')"
    ]);

    // Without parameters
    let repo = connection.getRepository<any>('category');
    let qr = repo.createQueryBuilder();
    let entities = await qr.getMany();
    console.log(entities);

    let entitiesAndCount = await qr.getManyAndCount();
    console.log(entitiesAndCount);


  }

}

