import {expect} from 'chai';
import {suite, test, timeout} from '@testdeck/mocha';
import {createConnection, DatabaseType, getConnectionManager, Table, TableColumn} from 'typeorm';
import {AiosConnectionOptions} from '../../src/driver/aios/AiosConnectionOptions';

import '../../src/integrate';
import {AiosQueryRunner} from '../../src/driver/aios/AiosQueryRunner';
import * as _ from 'lodash';
import {Car, CarShort, Category} from './test-schema';
import {TableOptions} from '../../node_modules/typeorm/schema-builder/options/TableOptions';
import {AiosDriver} from '../../src/driver/aios/AiosDriver';
import {aiosConfigTemplate, DB} from './config';


@suite('functional/' + DB) @timeout(20000)
class TestSpec {


  @test
  async 'connect / db information / disconnect'() {
    const aiosConfig = _.clone(aiosConfigTemplate);
    const connection = await createConnection(<any>aiosConfig);
    expect(connection).to.not.be.null;

    const runner: AiosQueryRunner = <AiosQueryRunner><unknown>connection.createQueryRunner();
    const cars = await runner.query('SELECT count(*) c FROM iot_data_ts');
    expect(cars).to.have.length(1);
    expect(cars.shift()).to.deep.eq({c: 0});

    const driver: AiosDriver = <AiosDriver>connection.driver;

    const catalogs = await driver._catalogs();
    expect(catalogs).to.deep.eq(driver.catalogs);

    let res: any = await runner.hasDatabase('iot');
    expect(res).to.be.true;

    res = await runner.hasDatabase('iot2');
    expect(res).to.be.false;

    res = await runner.hasSchema('informix');
    expect(res).to.be.true;

    res = await runner.hasSchema('informix2');
    expect(res).to.be.false;

    res = await runner.getDatabases();
    expect(res).to.include('iot');

    res = await runner.getSchemas();
    expect(res).to.include('informix');

    res = await runner.hasTable('iot_data_ts');
    expect(res).to.be.true;

    res = await runner.hasColumn('iot_data_ts', 'desc');
    expect(res).to.be.true;

    const tables = await runner['loadTables'](['iot_data_ts']);
    expect(tables).to.have.length(1);

    const table = tables.shift();
    const _table = JSON.parse(JSON.stringify(table));
    expect(_table).to.deep.eq({
      columns:
        [
          {
            isNullable: true,
            isGenerated: false,
            isPrimary: true,
            isUnique: false,
            isArray: false,
            length: '',
            zerofill: false,
            unsigned: false,
            name: 'id',
            no: 1,
            type: 'int8',
            data_type: null,
            comment: ''
          }, {
          isNullable: true,
          isGenerated: false,
          isPrimary: false,
          isUnique: false,
          isArray: false,
          length: '128',
          zerofill: false,
          unsigned: false,
          name: 'desc',
          no: 2,
          type: 'varchar',
          data_type: null,
          comment: ''
        }, {
          isNullable: true,
          isGenerated: false,
          isPrimary: false,
          isUnique: false,
          isArray: false,
          length: '2048',
          zerofill: false,
          unsigned: false,
          name: 'readings',
          no: 3,
          type: 'lvarchar',
          data_type: 'timeseries(iot_data_t)',
          comment: ''
        }],
      indices: [],
      exclusions: [],
      foreignKeys: [],
      uniques: [],
      checks: [],
      justCreated: false,
      name: 'informix.iot_data_ts'
    });

    await connection.close();
  }


  @test
  async 'create table / drop table'() {
    _.remove(getConnectionManager().connections, x => true);
    const aiosConfig = _.clone(aiosConfigTemplate);
    const connection = await createConnection(<any>aiosConfig);
    expect(connection).to.not.be.null;

    const driver: AiosDriver = <AiosDriver>connection.driver;
    const runner: AiosQueryRunner = <AiosQueryRunner><unknown>connection.createQueryRunner();

    const tableDef = new Table(<TableOptions>{
      name: 'aios_test',
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
          type: 'string',
          length: 128
        },
      ]
    });

    let res: any = await driver._execute('DROP TABLE IF EXISTS ' + tableDef.name);
    expect(res.affected).to.be.eq(0);

    await runner.createTable(tableDef, true, true, true);
    const table = await runner.getTable(tableDef.name);
    const _table = JSON.parse(JSON.stringify(table));
    expect(_table).to.deep.eq({
      columns:
        [
          {
            isNullable: false,
            isGenerated: true,
            isPrimary: true,
            isUnique: false,
            isArray: false,
            length: '',
            zerofill: false,
            unsigned: false,
            no: 1,
            name: 'id',
            type: 'serial',
            data_type: null,
            generationStrategy: 'increment',
            comment: ''
          },
          {
            isNullable: false,
            isGenerated: false,
            isPrimary: false,
            isUnique: false,
            isArray: false,
            length: '128',
            zerofill: false,
            unsigned: false,
            no: 2,
            name: 'name',
            type: 'lvarchar',
            data_type: null,
            comment: ''
          }],
      indices: [],
      exclusions: [],
      foreignKeys: [],
      uniques: [],
      checks: [],
      justCreated: false,
      name: 'informix.aios_test'
    });


    await runner.dropTable(tableDef);
    res = await runner.hasTable(tableDef.name);
    expect(res).to.be.false;

    await connection.close();
  }

  @test
  async 'add / change / rename / drop column'() {

    const aiosConfig = _.clone(aiosConfigTemplate);
    const connection = await createConnection(<any>aiosConfig);
    expect(connection).to.not.be.null;

    const driver: AiosDriver = <AiosDriver>connection.driver;
    const runner: AiosQueryRunner = <AiosQueryRunner><unknown>connection.createQueryRunner();

    const tableDef = new Table(<TableOptions>{
      name: 'aios_test',
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
          type: 'string',
          length: 128
        },
      ]
    });

    let res: any = await driver._execute('DROP TABLE IF EXISTS ' + tableDef.name);
    expect(res.affected).to.be.eq(0);

    await runner.createTable(tableDef, true, true, true);

    const column = new TableColumn({
      name: 'value',
      type: 'string',
      length: '128'

    });

    const newColumn = new TableColumn({
      name: 'value',
      type: 'string',
      length: '64',
      isNullable: true,
      isUnique: true
    });

    const newColumn2 = new TableColumn({
      name: 'value_new',
      type: 'string',
      length: '64',
      isNullable: false,
      isUnique: false
    });


    await runner.addColumn(tableDef.name, column);
    res = await runner.hasColumn(tableDef.name, column.name);
    expect(res).to.be.true;

    await runner.changeColumn(tableDef.name, column, newColumn);
    res = await runner.hasColumn(tableDef.name, column.name);
    expect(res).to.be.true;

    await runner.changeColumn(tableDef.name, newColumn, newColumn2);
    res = await runner.hasColumn(tableDef.name, newColumn2.name);
    expect(res).to.be.true;

    await runner.dropColumn(tableDef.name, newColumn2.name);
    res = await runner.hasColumn(tableDef.name, newColumn2.name);
    expect(res).to.be.false;


    await runner.dropTable(tableDef);
    res = await runner.hasTable(tableDef.name);
    expect(res).to.be.false;

    await connection.close();
  }


  @test
  async 'crud'() {

    const aiosConfig = _.clone(aiosConfigTemplate);
    (<any>aiosConfig).entities = [Car, Category];
    (<any>aiosConfig).synchronize = true;

    const connection = await createConnection(<any>aiosConfig);
    expect(connection).to.not.be.null;

    const driver: AiosDriver = <AiosDriver>connection.driver;
    const runner: AiosQueryRunner = <AiosQueryRunner><unknown>connection.createQueryRunner();

    let categories = [];

    let category = new Category();
    category.name = 'Truck';
    categories.push(category);

    category = new Category();
    category.name = 'SUV';
    categories.push(category);

    category = new Category();
    category.name = 'Van';
    categories.push(category);

    categories = await connection.createEntityManager().save(categories);
    expect(categories).to.have.length(3);
    expect(categories.filter(x => _.has(x, 'id'))).to.have.length(3);

    let car = new Car();
    car.name = 'V70';
    car.label = 'Volvo';
    car.categories = category;

    let cars: any[] = [car];

    car = new Car();
    car.name = '116d';
    car.label = 'BMW';
    car.categories = category;
    cars.push(car);

    cars = await connection.createEntityManager().save(cars);
    expect(cars).to.have.length(2);
    expect(cars.filter(x => _.has(x, 'id'))).to.have.length(2);

    let _cars = await connection.getRepository(Car).createQueryBuilder().offset(1).limit(1).getMany();
    expect(_cars).to.have.length(1);

    _cars = await connection.getRepository(Car).findByIds([1, 2], {relations: ['categories']});
    expect(_cars).to.have.length(2);
    expect(_cars.filter(x => _.has(x, 'categories.id'))).to.have.length(2);

    let q = await connection.getRepository(Category).createQueryBuilder('category');
    q = q.leftJoin(Car, 'car', 'category.id = car.categories_id');
    q.limit(3);
    const categories2 = await q.getRawMany();
    expect(categories2).to.have.length(3);
    expect(categories2.filter(x => _.has(x, 'category_id'))).to.have.length(3);

    const count = await connection.getRepository(Category).count();
    const deleteResult = await connection.getRepository(Category).remove([categories.shift()]);
    expect(deleteResult).to.have.length(1);
    expect(deleteResult.filter(x => _.isUndefined(x['id']))).to.have.length(1);
    const countAfter = await connection.getRepository(Category).count();
    expect(countAfter).to.be.eq(count - 1);

    await connection.close();
  }

  @test
  async 'null hack for informix'() {
    const aiosConfig = _.clone(aiosConfigTemplate);
    (<any>aiosConfig).entities = [CarShort];
    (<any>aiosConfig).synchronize = true;

    const connection = await createConnection(<any>aiosConfig);
    expect(connection).to.not.be.null;

    const driver: AiosDriver = <AiosDriver>connection.driver;
    const runner: AiosQueryRunner = <AiosQueryRunner><unknown>connection.createQueryRunner();


    const car = new CarShort();
    car.name = 'V70';
    car.label = null;

    let cars: any[] = [car];

    cars = await connection.createEntityManager().save(cars);
    expect(cars).to.have.length(1);
    expect(cars.filter(x => _.has(x, 'id'))).to.have.length(1);

    const _cars = await connection.getRepository(CarShort).createQueryBuilder().offset(1).limit(1).getMany();
    expect(_cars).to.have.length(1);

    await connection.close();
  }

}
