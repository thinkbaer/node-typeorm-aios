import {ColumnType, Connection, Driver} from "typeorm";
import {MappedColumnTypes} from "typeorm/driver/types/MappedColumnTypes";
import {SchemaBuilder} from "typeorm/schema-builder/SchemaBuilder";
import {TableColumn} from "typeorm/schema-builder/table/TableColumn";
import {EntityMetadata} from "typeorm/metadata/EntityMetadata";
import {DataTypeDefaults} from "typeorm/driver/types/DataTypeDefaults";
import {QueryRunner} from "typeorm/query-runner/QueryRunner";
import {ObjectLiteral} from "typeorm/common/ObjectLiteral";
import {ColumnMetadata} from "typeorm/metadata/ColumnMetadata";
import {AiosConnectionOptions} from "./AiosConnectionOptions";
import {PlatformTools} from "../../../node_modules/typeorm/platform/PlatformTools";
import {DriverPackageNotInstalledError} from "../../../node_modules/typeorm/error/DriverPackageNotInstalledError";
import {AiosQueryRunner} from "./AiosQueryRunner";


export class AiosDriver implements Driver {

  // -------------------------------------------------------------------------
  // Public Properties
  // -------------------------------------------------------------------------

  /**
   * Connection used by driver.
   */
  connection: Connection;

  /**
   * Connection options.
   */
  options: AiosConnectionOptions;


  /**
   * Indicates if replication is enabled.
   */
  //isReplicated: boolean;
  get isReplicated(): boolean {
    return false;
  }

  /**
   * Indicates if tree tables are supported by this driver.
   */
  treeSupport: boolean;
  /**
   * Gets list of supported column data types by a driver.
   */
  supportedDataTypes: ColumnType[];
  /**
   * Default values of length, precision and scale depends on column data type.
   * Used in the cases when length/precision/scale is not specified by user.
   */
  dataTypeDefaults: DataTypeDefaults;
  /**
   * Gets list of spatial column data types.
   */
  spatialTypes: ColumnType[];
  /**
   * Gets list of column data types that support length by a driver.
   */
  withLengthColumnTypes: ColumnType[];
  /**
   * Gets list of column data types that support precision by a driver.
   */
  withPrecisionColumnTypes: ColumnType[];
  /**
   * Gets list of column data types that support scale by a driver.
   */
  withScaleColumnTypes: ColumnType[];
  /**
   * Orm has special columns and we need to know what database column types should be for those types.
   * Column types are driver dependant.
   */
  mappedDataTypes: MappedColumnTypes;

  AIOS: any;

  aiosServer: any;

  dataSource: any;

  connected: boolean = false;

  aiosOptions: any = {};

  queryRunner: AiosQueryRunner;


  constructor(connection: Connection) {
    this.connection = connection;
    this.options = connection.options as AiosConnectionOptions;
    this.loadDependencies();
    const AiosServer = this.AIOS;
    this.aiosServer = new AiosServer({
      host: this.options.host,
      port: this.options.port
    });
    this.aiosOptions.driver = this.options.jdbcDriverClass;
    this.aiosOptions.driverLocation = this.options.jdbcDriverLocation;
    this.aiosOptions.type = 'jdbc';

    ['user', 'url', 'password'].forEach(k => {
      this.aiosOptions[k] = this.options[k];
    })


  }

  /**
   * If driver dependency is not given explicitly, then try to load it via "require".
   */
  protected loadDependencies(): void {
    try {
      this.AIOS = PlatformTools.load("aios");

    } catch (e) {
      throw new DriverPackageNotInstalledError("Aios", "aios");
    }
  }


  /**
   * Performs connection to the database.
   * Depend on driver type it may create a connection pool.
   */
  connect(): Promise<void> {
    if (this.connected) return Promise.resolve(this.dataSource);
    return new Promise<void>((resolve, reject) => {
      try {
        this.aiosServer.dataSource(this.options.id, this.aiosOptions, (err: Error, res: any) => {
          if (err) {
            return reject(err);
          }
          this.connected = true;
          this.dataSource = res;
          resolve(this.dataSource);
        });
      } catch (e) {
        reject(e);
      }

    })
  }

  /**
   * Makes any action after connection (e.g. create extensions in Postgres driver).
   */
  afterConnect(): Promise<void> {
    return null;
  };

  /**
   * Closes connection with database and releases all resources.
   */
  disconnect(): Promise<void> {
    return null;
  };

  /**
   * Synchronizes database schema (creates tables, indices, etc).
   */
  createSchemaBuilder(): SchemaBuilder {
    return null;
  };

  /**
   * Creates a query runner used for common queries.
   */
  createQueryRunner(mode: "master" | "slave"): QueryRunner {
    if (!this.queryRunner) {
      this.queryRunner = new AiosQueryRunner(this, mode);
    }
    return this.queryRunner;
  };

  /**
   * Replaces parameters in the given sql with special escaping character
   * and an array of parameter names to be passed to a query.
   */
  escapeQueryWithParameters(sql: string, parameters: ObjectLiteral, nativeParameters: ObjectLiteral): [string, any[]] {
    return null;
  };

  /**
   * Escapes a table name, column name or an alias.
   *
   * todo: probably escape should be able to handle dots in the names and automatically escape them
   */
  escape(name: string): string {
    return null;
  };

  /**
   * Build full table name with database name, schema name and table name.
   * E.g. "myDB"."mySchema"."myTable"
   */
  buildTableName(tableName: string, schema?: string, database?: string): string {
    return null;
  };

  /**
   * Prepares given value to a value to be persisted, based on its column type and metadata.
   */
  preparePersistentValue(value: any, column: ColumnMetadata): any {
    return null;
  };

  /**
   * Prepares given value to a value to be persisted, based on its column type.
   */
  prepareHydratedValue(value: any, column: ColumnMetadata): any {
    return null;
  };

  /**
   * Transforms type of the given column to a database column type.
   */
  normalizeType(column: {
    type?: ColumnType | string;
    length?: number | string;
    precision?: number | null;
    scale?: number;
    isArray?: boolean;
  }): string {
    return null;
  };

  /**
   * Normalizes "default" value of the column.
   */
  normalizeDefault(columnMetadata: ColumnMetadata): string {
    return null;
  };

  /**
   * Normalizes "isUnique" value of the column.
   */
  normalizeIsUnique(column: ColumnMetadata): boolean {
    return null;
  };

  /**
   * Calculates column length taking into account the default length values.
   */
  getColumnLength(column: ColumnMetadata): string {
    return null;
  };

  /**
   * Normalizes "default" value of the column.
   */
  createFullType(column: TableColumn): string {
    return null;
  };

  /**
   * Obtains a new database connection to a master server.
   * Used for replication.
   * If replication is not setup then returns default connection's database connection.
   */
  obtainMasterConnection(): Promise<any> {
    return Promise.resolve();
  };

  /**
   * Obtains a new database connection to a slave server.
   * Used for replication.
   * If replication is not setup then returns master (default) connection's database connection.
   */
  obtainSlaveConnection(): Promise<any> {
    return Promise.resolve();
  };

  /**
   * Creates generated map of values generated or returned by database after INSERT query.
   */
  createGeneratedMap(metadata: EntityMetadata, insertResult: any): ObjectLiteral | undefined {
    return null;
  };

  /**
   * Differentiate columns of this table and columns from the given column metadatas columns
   * and returns only changed.
   */
  findChangedColumns(tableColumns: TableColumn[], columnMetadatas: ColumnMetadata[]): ColumnMetadata[] {
    return null;
  };

  /**
   * Returns true if driver supports RETURNING / OUTPUT statement.
   */
  isReturningSqlSupported(): boolean {
    return null;
  };

  /**
   * Returns true if driver supports uuid values generation on its own.
   */
  isUUIDGenerationSupported(): boolean {
    return null;
  };

  /**
   * Creates an escaped parameter.
   */
  createParameter(parameterName: string, index: number): string {
    return null;
  }

}
