import {QueryRunner, Table, TableColumn, TableForeignKey, TableIndex} from 'typeorm';
import {BaseQueryRunner} from 'typeorm/query-runner/BaseQueryRunner';
import {TableCheck} from 'typeorm/schema-builder/table/TableCheck';
import {TableUnique} from 'typeorm/schema-builder/table/TableUnique';
import {ReadStream} from 'fs';
import {Broadcaster} from 'typeorm/subscriber/Broadcaster';
import {AiosDriver} from './AiosDriver';
import {NotYetImplementedError} from './NotYetImplementedError';
import * as _ from 'lodash';
import {TableExclusion} from 'typeorm/schema-builder/table/TableExclusion';
import {View} from 'typeorm/schema-builder/view/View';


export class AiosQueryRunner extends BaseQueryRunner implements QueryRunner {

  distributionMode: string;

  driver: AiosDriver;


  // -------------------------------------------------------------------------
  // Constructor
  // -------------------------------------------------------------------------
  constructor(driver: AiosDriver, distributionMode: string) {
    super();

    this.distributionMode = distributionMode;
    this.driver = driver;
    this.connection = driver.connection;
    // @ts-ignore
    this.broadcaster = new Broadcaster(this);
  }


  isReadonly() {
    return _.has(this.driver.options, 'readonly') && this.driver.options.readonly;
  }

  addColumn(table: Table | string, column: TableColumn): Promise<void> {
    throw new NotYetImplementedError();
  }

  addColumns(table: Table | string, columns: TableColumn[]): Promise<void> {
    throw new NotYetImplementedError();
  }

  changeColumn(table: Table | string, oldColumn: TableColumn | string, newColumn: TableColumn): Promise<void> {
    throw new NotYetImplementedError();
  }

  changeColumns(table: Table | string, changedColumns: { oldColumn: TableColumn; newColumn: TableColumn }[]): Promise<void> {
    throw new NotYetImplementedError();
  }

  clearDatabase(database?: string): Promise<void> {
    throw new NotYetImplementedError();
  }

  clearTable(tableName: string): Promise<void> {
    throw new NotYetImplementedError();
  }

  commitTransaction(): Promise<void> {
    return Promise.resolve(); // TODO throw new NotYetImplementedError();
  }

  async connect(): Promise<any> {
    await this.driver.connect();
    return this.driver.isConnected();

  }

  createCheckConstraint(table: Table | string, checkConstraint: TableCheck): Promise<void> {
    throw new NotYetImplementedError();
  }

  createCheckConstraints(table: Table | string, checkConstraints: TableCheck[]): Promise<void> {
    throw new NotYetImplementedError();
  }

  createDatabase(database: string, ifNotExist?: boolean): Promise<void> {
    throw new NotYetImplementedError();
  }

  createForeignKey(table: Table | string, foreignKey: TableForeignKey): Promise<void> {
    throw new NotYetImplementedError();
  }

  createForeignKeys(table: Table | string, foreignKeys: TableForeignKey[]): Promise<void> {
    throw new NotYetImplementedError();
  }

  createIndex(table: Table | string, index: TableIndex): Promise<void> {
    throw new NotYetImplementedError();
  }

  createIndices(table: Table | string, indices: TableIndex[]): Promise<void> {
    throw new NotYetImplementedError();
  }

  createPrimaryKey(table: Table | string, columnNames: string[]): Promise<void> {
    throw new NotYetImplementedError();
  }

  createSchema(schemaPath: string, ifNotExist?: boolean): Promise<void> {
    throw new NotYetImplementedError();
  }

  async createTable(table: Table, ifNotExist?: boolean, createForeignKeys?: boolean, createIndices?: boolean): Promise<void> {
    throw new NotYetImplementedError();
  }

  createUniqueConstraint(table: Table | string, uniqueConstraint: TableUnique): Promise<void> {
    throw new NotYetImplementedError();
  }

  createUniqueConstraints(table: Table | string, uniqueConstraints: TableUnique[]): Promise<void> {
    throw new NotYetImplementedError();
  }

  dropCheckConstraint(table: Table | string, checkOrName: TableCheck | string): Promise<void> {
    throw new NotYetImplementedError();
  }

  dropCheckConstraints(table: Table | string, checkConstraints: TableCheck[]): Promise<void> {
    throw new NotYetImplementedError();
  }

  dropColumn(table: Table | string, column: TableColumn | string): Promise<void> {
    throw new NotYetImplementedError();
  }

  dropColumns(table: Table | string, columns: TableColumn[]): Promise<void> {
    throw new NotYetImplementedError();
  }

  dropDatabase(database: string, ifExist?: boolean): Promise<void> {
    throw new NotYetImplementedError();
  }

  dropForeignKey(table: Table | string, foreignKeyOrName: TableForeignKey | string): Promise<void> {
    throw new NotYetImplementedError();
  }

  dropForeignKeys(table: Table | string, foreignKeys: TableForeignKey[]): Promise<void> {
    throw new NotYetImplementedError();
  }

  dropIndex(table: Table | string, index: TableIndex | string): Promise<void> {
    throw new NotYetImplementedError();
  }

  dropIndices(table: Table | string, indices: TableIndex[]): Promise<void> {
    throw new NotYetImplementedError();
  }

  dropPrimaryKey(table: Table | string): Promise<void> {
    throw new NotYetImplementedError();
  }

  dropSchema(schemaPath: string, ifExist?: boolean, isCascade?: boolean): Promise<void> {
    throw new NotYetImplementedError();
  }

  dropTable(table: Table | string, ifExist?: boolean, dropForeignKeys?: boolean, dropIndices?: boolean): Promise<void> {
    throw new NotYetImplementedError();
  }

  dropUniqueConstraint(table: Table | string, uniqueOrName: TableUnique | string): Promise<void> {
    throw new NotYetImplementedError();
  }

  dropUniqueConstraints(table: Table | string, uniqueConstraints: TableUnique[]): Promise<void> {
    throw new NotYetImplementedError();
  }


  /**
   * Returns all available database names including system databases.
   */
  async getDatabases(): Promise<string[]> {
    return _.map(this.driver.catalogs, catalog => catalog.name);
  }

  /**
   * Returns all available schema names including system schemas.
   * If database parameter specified, returns schemas of that database.
   */
  getSchemas(database?: string): Promise<string[]> {
    let schemas: string[] = [];
    if (database) {
      const db = _.find(this.driver.catalogs, {name: database});
      schemas = db.schemas;
    } else {
      schemas = _.uniq(_.merge([], ..._.map(this.driver.catalogs, catalog => catalog.schemas)));
    }
    return Promise.resolve(schemas);
  }

  /**
   * Checks if database with the given name exist.
   */
  hasDatabase(database: string): Promise<boolean> {
    // TODO if connected!
    const db = _.find(this.driver.catalogs, {name: database});
    if (db) {
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  }

  /**
   * Checks if schema with the given name exist.
   */
  async hasSchema(schema: string): Promise<boolean> {
    const schemas = await this.getSchemas();
    return schemas.indexOf(schema) !== -1;
  }


  hasTable(table: Table | string): Promise<boolean> {
    throw new NotYetImplementedError();
  }

  hasColumn(table: Table | string, columnName: string): Promise<boolean> {
    throw new NotYetImplementedError();
  }

  protected loadTables(tablePaths: string[]): Promise<Table[]> {
    throw new NotYetImplementedError();
  }


  release(): Promise<void> {
    return Promise.resolve();
  }

  renameColumn(table: Table | string, oldColumnOrName: TableColumn | string, newColumnOrName: TableColumn | string): Promise<void> {
    throw new NotYetImplementedError();
  }

  renameTable(oldTableOrName: Table | string, newTableName: string): Promise<void> {
    throw new NotYetImplementedError();
  }

  rollbackTransaction(): Promise<void> {
    // TODO throw new NotYetImplementedError();
    return Promise.resolve();
  }

  startTransaction(): Promise<void> {
    // TODO throw new NotYetImplementedError();
    return Promise.resolve();
  }

  stream(query: string, parameters?: any[], onEnd?: Function, onError?: Function): Promise<ReadStream> {
    throw new NotYetImplementedError();
  }

  updatePrimaryKeys(table: Table | string, columns: TableColumn[]): Promise<void> {
    throw new NotYetImplementedError();

  }

  async query(query: string, parameters?: any[]): Promise<any> {
    if (!/select/.test(query.toLowerCase())) {
      if (/^.*(insert.into|update.)/.test(query.toLowerCase())) {
        return this.driver._update(query, parameters);
      }
      return this.driver._execute(query, parameters);
    }
    return this.driver._query(query, parameters);

  }


  /**
   * Executes sql used special for schema build.
   */
  protected async _executeQueries(upQueries: string | string[], downQueries: string | string[]): Promise<void> {
    if (typeof upQueries === 'string') {
      upQueries = [upQueries];
    }
    if (typeof downQueries === 'string') {
      downQueries = [downQueries];
    }

    /*
    this.sqlInMemory.upQueries.push(...upQueries);
    this.sqlInMemory.downQueries.push(...downQueries);

    // if sql-in-memory mode is enabled then simply store sql in memory and return
    if (this.sqlMemoryMode === true)
      return Promise.resolve() as Promise<any>;
*/
    const queries = [...upQueries];

    await this.driver._executeBatch(queries);
  }

  createExclusionConstraint(table: Table | string, exclusionConstraint: TableExclusion): Promise<void> {
    throw new NotYetImplementedError();
    return undefined;
  }

  createExclusionConstraints(table: Table | string, exclusionConstraints: TableExclusion[]): Promise<void> {
    throw new NotYetImplementedError();
  }

  dropExclusionConstraint(table: Table | string, exclusionOrName: TableExclusion | string): Promise<void> {
    throw new NotYetImplementedError();
  }

  dropExclusionConstraints(table: Table | string, exclusionConstraints: TableExclusion[]): Promise<void> {
    throw new NotYetImplementedError();
  }

  createView(view: View, oldView?: View): Promise<void> {
    throw new NotYetImplementedError();
  }

  dropView(view: View | string): Promise<void> {
    throw new NotYetImplementedError();
  }

  protected loadViews(tablePaths: string[]): Promise<View[]> {
    return Promise.resolve([]);
  }

  getCurrentDatabase(): Promise<string | undefined> {
    return Promise.resolve(undefined);
  }

  getCurrentSchema(): Promise<string | undefined> {
    return Promise.resolve(undefined);
  }

}
