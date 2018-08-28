import {QueryRunner, Table, TableColumn, TableForeignKey, TableIndex} from "typeorm";
import {BaseQueryRunner} from "typeorm/query-runner/BaseQueryRunner";
import {TableCheck} from "typeorm/schema-builder/table/TableCheck";
import {TableUnique} from "typeorm/schema-builder/table/TableUnique";
import {ReadStream} from "fs";
import {Broadcaster} from "../../../node_modules/typeorm/subscriber/Broadcaster";
import {AiosDriver} from "./AiosDriver";


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
    this.broadcaster = new Broadcaster(this);
  }


  addColumn(table: Table | string, column: TableColumn): Promise<void> {
    return Promise.resolve();
  }

  addColumns(table: Table | string, columns: TableColumn[]): Promise<void> {
    return Promise.resolve();
  }

  changeColumn(table: Table | string, oldColumn: TableColumn | string, newColumn: TableColumn): Promise<void> {
    return Promise.resolve();
  }

  changeColumns(table: Table | string, changedColumns: { oldColumn: TableColumn; newColumn: TableColumn }[]): Promise<void> {
    return Promise.resolve();
  }

  clearDatabase(database?: string): Promise<void> {
    return Promise.resolve();
  }

  clearTable(tableName: string): Promise<void> {
    return Promise.resolve();
  }

  commitTransaction(): Promise<void> {
    return Promise.resolve();
  }

  connect(): Promise<any> {
    return this.driver.connect();
  }

  createCheckConstraint(table: Table | string, checkConstraint: TableCheck): Promise<void> {
    return Promise.resolve();
    ;
  }

  createCheckConstraints(table: Table | string, checkConstraints: TableCheck[]): Promise<void> {
    return Promise.resolve();
    ;
  }

  createDatabase(database: string, ifNotExist?: boolean): Promise<void> {
    return Promise.resolve();
    ;
  }

  createForeignKey(table: Table | string, foreignKey: TableForeignKey): Promise<void> {
    return Promise.resolve();
    ;
  }

  createForeignKeys(table: Table | string, foreignKeys: TableForeignKey[]): Promise<void> {
    return Promise.resolve();
    ;
  }

  createIndex(table: Table | string, index: TableIndex): Promise<void> {
    return Promise.resolve();
    ;
  }

  createIndices(table: Table | string, indices: TableIndex[]): Promise<void> {
    return Promise.resolve();
    ;
  }

  createPrimaryKey(table: Table | string, columnNames: string[]): Promise<void> {
    return Promise.resolve();
    ;
  }

  createSchema(schemaPath: string, ifNotExist?: boolean): Promise<void> {
    return Promise.resolve();
    ;
  }

  createTable(table: Table, ifNotExist?: boolean, createForeignKeys?: boolean, createIndices?: boolean): Promise<void> {
    return Promise.resolve();
    ;
  }

  createUniqueConstraint(table: Table | string, uniqueConstraint: TableUnique): Promise<void> {
    return Promise.resolve();
    ;
  }

  createUniqueConstraints(table: Table | string, uniqueConstraints: TableUnique[]): Promise<void> {
    return Promise.resolve();
    ;
  }

  dropCheckConstraint(table: Table | string, checkOrName: TableCheck | string): Promise<void> {
    return Promise.resolve();
    ;
  }

  dropCheckConstraints(table: Table | string, checkConstraints: TableCheck[]): Promise<void> {
    return Promise.resolve();
    ;
  }

  dropColumn(table: Table | string, column: TableColumn | string): Promise<void> {
    return Promise.resolve();
    ;
  }

  dropColumns(table: Table | string, columns: TableColumn[]): Promise<void> {
    return Promise.resolve();
    ;
  }

  dropDatabase(database: string, ifExist?: boolean): Promise<void> {
    return Promise.resolve();
    ;
  }

  dropForeignKey(table: Table | string, foreignKeyOrName: TableForeignKey | string): Promise<void> {
    return Promise.resolve();
    ;
  }

  dropForeignKeys(table: Table | string, foreignKeys: TableForeignKey[]): Promise<void> {
    return Promise.resolve();
    ;
  }

  dropIndex(table: Table | string, index: TableIndex | string): Promise<void> {
    return Promise.resolve();
    ;
  }

  dropIndices(table: Table | string, indices: TableIndex[]): Promise<void> {
    return Promise.resolve();
    ;
  }

  dropPrimaryKey(table: Table | string): Promise<void> {
    return Promise.resolve();
    ;
  }

  dropSchema(schemaPath: string, ifExist?: boolean, isCascade?: boolean): Promise<void> {
    return Promise.resolve();
    ;
  }

  dropTable(table: Table | string, ifExist?: boolean, dropForeignKeys?: boolean, dropIndices?: boolean): Promise<void> {
    return Promise.resolve();
    ;
  }

  dropUniqueConstraint(table: Table | string, uniqueOrName: TableUnique | string): Promise<void> {
    return Promise.resolve();
    ;
  }

  dropUniqueConstraints(table: Table | string, uniqueConstraints: TableUnique[]): Promise<void> {
    return Promise.resolve();
    ;
  }

  getDatabases(): Promise<string[]> {
    return Promise.resolve([]);
  }

  getSchemas(database?: string): Promise<string[]> {
    return Promise.resolve([]);
    ;
  }

  hasColumn(table: Table | string, columnName: string): Promise<boolean> {
    return Promise.resolve(false);
  }

  hasDatabase(database: string): Promise<boolean> {
    return Promise.resolve(false);
    ;
  }

  hasSchema(schema: string): Promise<boolean> {
    return Promise.resolve(false);
    ;
  }

  hasTable(table: Table | string): Promise<boolean> {
    return Promise.resolve(false);
    ;
  }

  protected loadTables(tablePaths: string[]): Promise<Table[]> {
    return Promise.resolve([]);
  }

  _executeBatch(queryies: string[]): Promise<any> {
    return new Promise<any[]>(async (resolve, reject) => {

      let dataSource = await this.connect();

      // TODO format query!
      dataSource.executeBatch(queryies, (err: Error, res: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(res);

        }
      })


    });
  }

  _execute(query: string): Promise<any> {
    return new Promise<any[]>(async (resolve, reject) => {

      let dataSource = await this.connect();

      // TODO format query!
      dataSource.execute(query, (err: Error, res: any) => {
        if (err != null) {
          resolve(res);
        } else {
          reject(err);
        }
      })


    });
  }

  query(query: string, parameters?: any[]): Promise<any> {

    return new Promise<any[]>(async (resolve, reject) => {

      let dataSource = await this.connect();

      // TODO format query!
      dataSource.query(query, (err: Error, res: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      })


    });

  }

  release(): Promise<void> {
    return Promise.resolve();
    ;
  }

  renameColumn(table: Table | string, oldColumnOrName: TableColumn | string, newColumnOrName: TableColumn | string): Promise<void> {
    return Promise.resolve();
    ;
  }

  renameTable(oldTableOrName: Table | string, newTableName: string): Promise<void> {
    return Promise.resolve();
  }

  rollbackTransaction(): Promise<void> {
    return Promise.resolve();
  }

  startTransaction(): Promise<void> {
    return Promise.resolve();
  }

  stream(query: string, parameters?: any[], onEnd?: Function, onError?: Function): Promise<ReadStream> {
    return Promise.resolve(null);
  }

  updatePrimaryKeys(table: Table | string, columns: TableColumn[]): Promise<void> {
    return Promise.resolve();
  }


}
