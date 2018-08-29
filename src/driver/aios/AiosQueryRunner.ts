import {QueryRunner, Table, TableColumn, TableForeignKey, TableIndex} from "typeorm";
import {BaseQueryRunner} from "typeorm/query-runner/BaseQueryRunner";
import {TableCheck} from "typeorm/schema-builder/table/TableCheck";
import {TableUnique} from "typeorm/schema-builder/table/TableUnique";
import {ReadStream} from "fs";
import {Broadcaster} from "../../../node_modules/typeorm/subscriber/Broadcaster";
import {AiosDriver} from "./AiosDriver";
import {NotYetImplementedError} from "./NotYetImplementedError";


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
    throw new NotYetImplementedError();
  }

  connect(): Promise<any> {
    return this.driver.connect();
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

  createTable(table: Table, ifNotExist?: boolean, createForeignKeys?: boolean, createIndices?: boolean): Promise<void> {
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

  getDatabases(): Promise<string[]> {
    throw new NotYetImplementedError();
  }

  getSchemas(database?: string): Promise<string[]> {
    throw new NotYetImplementedError();
  }

  hasColumn(table: Table | string, columnName: string): Promise<boolean> {
    throw new NotYetImplementedError();
  }

  hasDatabase(database: string): Promise<boolean> {
    throw new NotYetImplementedError();
  }

  hasSchema(schema: string): Promise<boolean> {
    throw new NotYetImplementedError();
  }

  hasTable(table: Table | string): Promise<boolean> {
    throw new NotYetImplementedError();
  }

  protected loadTables(tablePaths: string[]): Promise<Table[]> {
    throw new NotYetImplementedError();
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
    console.log(query)
    return new Promise<any[]>(async (resolve, reject) => {
      let dataSource = await this.connect();
      // TODO format query!
      dataSource.query(query, (err: Error, res: any) => {
        if (err) {
          reject(err);
        } else {
          res = this.driver.dialect.processResultSet(res);
          console.log(res);
          resolve(res);
        }
      })
    });
  }

  release(): Promise<void> {
    return Promise.resolve();
  }

  renameColumn(table: Table | string, oldColumnOrName: TableColumn | string, newColumnOrName: TableColumn | string): Promise<void> {
    throw new NotYetImplementedError();
    ;
  }

  renameTable(oldTableOrName: Table | string, newTableName: string): Promise<void> {
    throw new NotYetImplementedError();
  }

  rollbackTransaction(): Promise<void> {
    throw new NotYetImplementedError();
  }

  startTransaction(): Promise<void> {
    throw new NotYetImplementedError();

  }

  stream(query: string, parameters?: any[], onEnd?: Function, onError?: Function): Promise<ReadStream> {
    throw new NotYetImplementedError();
  }

  updatePrimaryKeys(table: Table | string, columns: TableColumn[]): Promise<void> {
    throw new NotYetImplementedError();

  }


}
