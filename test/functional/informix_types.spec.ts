import {expect} from 'chai';
import {suite, test, timeout} from '@testdeck/mocha';
import {
  Column,
  createConnection,
  DatabaseType,
  Entity,
  getConnectionManager,
  PrimaryGeneratedColumn,
  Table,
  TableColumn
} from 'typeorm';
import {AiosConnectionOptions} from '../../src/driver/aios/AiosConnectionOptions';

import '../../src/integrate';
import {AiosQueryRunner} from '../../src/driver/aios/AiosQueryRunner';
import * as _ from 'lodash';
import {Car, Category} from './test-schema';
import {TableOptions} from '../../node_modules/typeorm/schema-builder/options/TableOptions';
import {AiosDriver} from '../../src/driver/aios/AiosDriver';
import {InformixDialect} from '../../src';


const DB = 'informix';

const aiosConfigTemplate: AiosConnectionOptions = {
  id: 'informix-dev-02',
  type: <DatabaseType>'aios',
  jdbcDriverClass: 'com.informix.jdbc.IfxDriver',
  jdbcDriverLocation: '/data/java/driver/com.informix.ifxjdbc-4.10.JC4DE.jar',
  url: 'jdbc:informix-sqli://127.0.0.1:9088/iot:INFORMIXSERVER=informix;DELIMITER=',
  user: 'informix',
  password: 'in4mix',
  dialect: DB,
  host: '127.0.0.1',
  port: 8118,
  socketTimeout: 5000,
  connectionTimeout: 5000
};

const skip = ['datetime', 'interval', 'bigserial', 'serial', 'serial8'];

@suite('functional/' + DB + '_types') @timeout(20000)
class TestSpec {


  @test
  async 'create table type tables'() {
    _.remove(getConnectionManager().connections, x => true);
    const aiosConfig = _.clone(aiosConfigTemplate);
    (<any>aiosConfig).entities = [];
    const dialect = new InformixDialect();
    const tables = [];
    for (const t of dialect.supportedDataTypes) {
      let hasLength = false;
      if (dialect.withLengthColumnTypes.indexOf(t) > -1) {
        hasLength = true;
      }
      if (skip.indexOf(<string>t) !== -1) { continue; }
      const tableName = ('aios_test_' + t).replace(/[^\w]/g, '_');
      const tableDef = new Table(<TableOptions>{
        name: tableName,
        columns: [
          {
            name: 'id',
            type: 'integer',
            isGenerated: true,
            isPrimary: true,
            generationStrategy: 'increment'
          },
          {
            name: 'name',
            type: t,
            isNullable: true
          },
        ]
      });
      if (hasLength) {
        (<any>tableDef.columns[1]).length = 4;
      }
      tables.push(tableDef);

      @Entity(tableName)
      class X {
        @PrimaryGeneratedColumn()
        id: number;

        @Column({type: t})
        name: any;
      }

      (<any>aiosConfig).entities.push(X);
    }


    const connection = await createConnection(<any>aiosConfig);
    expect(connection).to.not.be.null;

    const driver: AiosDriver = <AiosDriver>connection.driver;
    const runner: AiosQueryRunner = <AiosQueryRunner>connection.createQueryRunner();


    for (const tableDef of tables) {

      let res: any = await driver._execute('DROP TABLE IF EXISTS ' + tableDef.name);
      expect(res.affected).to.be.eq(0);

      await runner.createTable(tableDef, true, true, true);
      res = await runner.hasTable(tableDef.name);
      expect(res).to.be.true;

      const table = await runner.getTable(tableDef.name);
      const _table = JSON.parse(JSON.stringify(table));

      const type = tableDef.columns[1].type;
      let value = null;
      let values = null;


      let compare = (x: any, y: any) => x === y;
      switch (type) {
        case 'int':
        case 'smallint':
        case 'bigint':
        case 'integer':

          value = 256;
          break;
        case 'double precision':
        case 'float':
          value = 256.6777777;
          break;
        case 'real':
        case 'money':
        case 'decimal':

        case 'dec':
        case 'numeric':
          value = 256.68;
          compare = (x: any, y: any) => Math.round(x * 10000) === Math.round(y * 10000);
          break;
        case 'smallfloat':

          value = 256.68;
          compare = (x: any, y: any) => Math.round(x * 100) === Math.round(y * 100);
          break;
        case 'boolean':
          values = [true, false];
          break;
        case 'character varying':
        case 'varchar':
        case 'char':
        case 'character':
        case 'lvarchar':
        case 'text':
        // case 'blob':
          value = 'Test';
          break;
        case 'nchar':
          value = '1234';
          break;
        case 'nvarchar':
          value = '1';
          break;
        case 'byte':
          // TODO
          // value = new ArrayBuffer(1);
          // value[0] = 0x4;
          break;
        case 'datetime year to fraction':
          value = new Date();
          compare = (x: any, y: any) => x.toISOString().replace(/\d{3}Z$/, '') === y.toISOString().replace(/\d{3}Z$/, '');
          break;
        case 'datetime year to second':
          value = new Date();
          compare = (x: any, y: any) => x.toISOString().replace(/\d{3}Z$/, '') === y.toISOString().replace(/\d{3}Z$/, '');
          break;
        case 'date':
          value = new Date().toISOString().substring(0, 10);
          break;
        case 'json':
          // Currently not supported by aios
          // value = {hallo:'welt'};
          break;
      }

      console.log(tableDef.name, type, value);
      // null test
      const repo = connection.getRepository(tableDef.name);
      const saved = await repo.save({name: null});

      if (value) {
        const saved: any = await repo.save({name: value});
        expect(_.keys(saved)).to.have.members(['id', 'name']);

        const found: any = await repo.findOne(saved.id);
        console.log('> okay', saved.name, found.name);
        expect(compare(saved.name, found.name)).to.be.true;

      } else if (values) {
        for (const x of values) {
          const saved: any = await repo.save({name: x});
          expect(_.keys(saved)).to.have.members(['id', 'name']);

          const found: any = await repo.findOne(saved.id);
          console.log('> okay', saved.name, found.name);
          expect(compare(saved.name, found.name)).to.be.true;

        }

      } else {
        console.log('> skipping cause TODO');
      }
    }


    await connection.close();
  }


}
