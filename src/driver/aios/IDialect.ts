import {ColumnType, EntityManager, ObjectLiteral, ObjectType, QueryRunner, SelectQueryBuilder} from "typeorm";
import {ColumnMetadata} from "../../../node_modules/typeorm/metadata/ColumnMetadata";


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

  escape(name: string): string;

  escapeQueryWithParameters(sql: string, parameters: ObjectLiteral, nativeParameters: ObjectLiteral): [string, any[]];


  prepareHydratedValue(value: any, columnMetadata: ColumnMetadata): any;

  createQueryBuilder?<Entity>(entityManager:EntityManager, entityClass?: ObjectType<Entity> | Function | string | QueryRunner, alias?: string, queryRunner?: QueryRunner): SelectQueryBuilder<Entity>;
}
