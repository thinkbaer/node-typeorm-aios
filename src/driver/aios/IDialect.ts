import {
  ColumnType,
  EntityManager,
  ObjectLiteral,
  ObjectType,
  QueryRunner,
  SelectQueryBuilder,
  Table,
  TableColumn
} from "typeorm";
import {ColumnMetadata} from "../../../node_modules/typeorm/metadata/ColumnMetadata";
import {AiosQueryRunner} from "./AiosQueryRunner";
import {AiosDriver} from "./AiosDriver";
import {SchemaBuilder} from "../../../node_modules/typeorm/schema-builder/SchemaBuilder";


export interface IDialect {

  readonly type: string;

  withScaleColumnTypes: ColumnType[];

  withPrecisionColumnTypes: ColumnType[];

  withLengthColumnTypes: ColumnType[];

  supportedDataTypes: ColumnType[];


  normalizeType(column: {
    type?: ColumnType | string;
    length?: number | string;
    precision?: number | null;
    scale?: number;
    isArray?: boolean;
  }): string;

  processResultSet(res: any[]): any[];

  prepare(driver: AiosDriver): void;

  afterConnect(driver: AiosDriver): void;


  buildQuery(query: string, parameters?: string[]): string;

  escape(name: string): string;

  escapeQueryWithParameters(sql: string, parameters: ObjectLiteral, nativeParameters: ObjectLiteral): [string, any[]];

  prepareHydratedValue(value: any, columnMetadata: ColumnMetadata): any;

  preparePersistentValue(value: any, column: ColumnMetadata): any;

  createQueryBuilder?<Entity>(entityManager: EntityManager, entityClass?: ObjectType<Entity> | Function | string | QueryRunner, alias?: string, queryRunner?: QueryRunner): SelectQueryBuilder<Entity>;

  createQueryRunner(driver: AiosDriver, mode: "master" | "slave"): AiosQueryRunner;

  buildTableName(tableName: string, schema: string, database: string): string;

  createParameter(parameterName: string, index: number): string;

  createSchemaBuilder(driver: AiosDriver): SchemaBuilder;

  normalizeDefault(columnMetadata: ColumnMetadata): string;

  normalizeIsUnique(column: ColumnMetadata): boolean;

  getColumnLength(column: ColumnMetadata): string;

  createFullType(column: TableColumn): string;

  findChangedColumns(tableColumns: TableColumn[], columnMetadatas: ColumnMetadata[]): ColumnMetadata[];
}
