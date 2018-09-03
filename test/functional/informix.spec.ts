import {expect} from 'chai';
import {suite, test, timeout} from 'mocha-typescript';
import {Connection, createConnection, DatabaseType, Driver, EntitySchema, Table} from 'typeorm';
import {AiosConnectionOptions} from "../../src/driver/aios/AiosConnectionOptions";

import '../../src/integrate';
import {AiosQueryRunner} from "../../src/driver/aios/AiosQueryRunner";
import {EntitySchemaOptions} from "../../node_modules/typeorm/entity-schema/EntitySchemaOptions";
import * as _ from "lodash";
import {CategoryEntity} from "./test-schema";
import {TableOptions} from "../../node_modules/typeorm/schema-builder/options/TableOptions";
import {AiosDriver} from "../../src/driver/aios/AiosDriver";
import {inspect} from "util";


const DB = 'informix';

const aiosConfigTemplate: AiosConnectionOptions = {
  id: 'informix-dev-01',
  type: <DatabaseType>"aios",
  jdbcDriverClass: 'com.informix.jdbc.IfxDriver',
  jdbcDriverLocation: "/data/java/driver/com.informix.ifxjdbc-4.10.JC4DE.jar",
  url: "jdbc:informix-sqli://informix:9088/iot:INFORMIXSERVER=informix;DELIMITER=",
  user: 'informix',
  password: 'in4mix',
  dialect: DB,
  host: '127.0.0.1',
  port: 8118,
  socketTimeout: 5000,
  connectionTimeout: 5000
};


@suite('functional/test/' + DB) @timeout(10000)
class TestSpec {


  @test.only
  async 'connect / db information / disconnect'() {
    let aiosConfig = _.clone(aiosConfigTemplate);
    const connection = await createConnection(<any>aiosConfig);
    expect(connection).to.not.be.null;

    let runner: AiosQueryRunner = <AiosQueryRunner>connection.createQueryRunner();
    let cars = await runner.query("SELECT count(*) c FROM iot_data_ts");
    expect(cars).to.have.length(1);
    expect(cars.shift()).to.deep.eq({c: 0});

    let driver: AiosDriver = <AiosDriver>connection.driver;

    let catalogs = await driver._catalogs();
    expect(catalogs).to.deep.eq(driver.catalogs);


    let res: any = await runner.hasDatabase('iot');
    console.log(res)
    expect(res).to.be.true;
    res = await runner.hasDatabase('iot2');
    console.log(res)
    expect(res).to.be.false;
    res = await runner.hasSchema('informix');
    console.log(res)
    expect(res).to.be.true;
    res = await runner.hasSchema('informix2');
    console.log(res)
    expect(res).to.be.false;
    res = await runner.getDatabases();
    console.log(res)
    expect(res).to.include('iot');
    res = await runner.getSchemas();
    console.log(res)
    expect(res).to.include('informix');

    res = await runner.hasTable('iot_data_ts');
    console.log(res)
    expect(res).to.be.true

    res = await runner.hasColumn('iot_data_ts', 'desc');
    console.log(res)
    expect(res).to.be.true;

    let tables = await runner['loadTables'](['iot_data_ts']);
    console.log(inspect(tables,false,10))


    // let table = new Table(<TableOptions>{
    //   name: 'aios_test',
    //   columns: [
    //     {
    //       isGenerated: true,
    //       type: 'integer',
    //       isPrimary: true,
    //       name: 'id',
    //       generationStrategy: "increment"
    //     },
    //     {
    //       type: 'string',
    //       name: 'name'
    //     },
    //   ]
    // })
    //
    // await driver._execute('DROP TABLE IF EXISTS ' + table.name);
    //
    //
    //
    //
    // res = await runner.createTable(table, true, true, true);
    // console.log(res)
    //
    // res = await runner.dropTable(table);
    // console.log(res)

    // TODO currently not permissions
    // let tables = await driver._tables('informix');
    // console.log('tables',tables);

    /*
        try {
          // currently not implemented
          // await connection.close();
        } catch (e) {
          // TODO disconnect must be implemented in aios
          console.error(e);
        }
        */
  }


  @test
  async 'create table'() {
    let aiosConfig = _.clone(aiosConfigTemplate);
    const connection = await createConnection(<any>aiosConfig);
    expect(connection).to.not.be.null;


    let runner: AiosQueryRunner = <AiosQueryRunner>connection.createQueryRunner();

    let table: Table = new Table(<TableOptions>{
      name: 'car',
      columns: [
        {
          name: 'id',
          type: 'int',
          isPrimary: true,
          isGenerated: true,
          generatedType: "STORED",
          generationStrategy: "increment"
        },
        {
          name: 'key',
          type: 'string',
        },
        {
          name: 'value',
          type: 'string',
        }
      ]
    });

    await runner.createTable(table);

  }

}

